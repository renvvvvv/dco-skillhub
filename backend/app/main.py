"""FastAPI 应用入口"""

from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import shutil
import uuid
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import Counter

from app.config import STORAGE_DIR, MAX_FILE_SIZE, QUICK_APPROVE_TOKEN, BLOCKED_IPS
from app.sensitive_check import (
    check_skill_md_sensitive,
    validate_skill_metadata,
    contains_chinese,
)
from app.timezone_utils import get_beijing_time, get_beijing_date, get_beijing_datetime
from app.database import (
    skills_db,
    versions_db,
    views_db,
    view_records_db,
    audit_logs_db,
    staff_db,
    metrics_daily_db,
    webhook_logs_db,
)
from app.services import (
    hash_admin_key,
    verify_admin_key,
    extract_skill_md,
    generate_slug,
    update_search_index,
    search_skills,
    get_skill_versions,
    delete_skill,
)
from app.org_mapping import (
    enrich_staff_record,
    get_all_regions,
    get_dcs_by_region,
    ALL_L1_REGIONS,
    IDC_REGIONS,
    IDC_CENTERS,
)
from app.events import (
    track_skill_view,
    track_skill_download,
    track_search,
    track_skill_publish,
    track_tag_click,
    track_page_view,
    track_admin_action,
    get_realtime_events,
    get_events_range,
)
from app.webhook_logs import WebhookLog, WebhookLogService
from app.notifier import FeishuNotifier
from app.report_builder import DailyReportBuilder, WeeklyReportBuilder, _calc_trend
from app.events import get_events_range, get_event_dates
from app.metrics import (
    get_kpi_summary,
    get_trend_data,
    get_daily_metrics,
    get_metrics_range,
    aggregate_daily,
    aggregate_all_missing,
)
from app.expert_db import expert_db
from app.code_quality import analyze_skill_package, code_checker
from app.weekly_picks_db import weekly_picks_db
from app.quickstart_db import (
    scenario_maps_db,
    collections_db,
    quickstart_config_db,
)

app = FastAPI(
    title="随航守卫", version="1.0.0", docs_url="/api/docs", redoc_url="/api/redoc"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


ADMIN_PASSWORD_HASH = hashlib.sha256("test-key-for-dev-2026".encode()).hexdigest()


def _ensure_staff_initialized():
    """首次启动时，如果 staff.json 为空，从 staff_dictionary.json 导入初始数据"""
    data = staff_db.read()
    if data.get("staff"):
        return
    # 容器内路径：/app/data/staff_dictionary.json（通过 volume 挂载）
    dict_path = Path("/app/data/staff_dictionary.json")
    if not dict_path.exists():
        # 本地开发路径
        dict_path = (
            Path(__file__).parent.parent.parent
            / "frontend"
            / "public"
            / "staff_dictionary.json"
        )
    if dict_path.exists():
        try:
            with open(dict_path, "r", encoding="utf-8") as f:
                initial_staff = json.loads(f.read())
            if isinstance(initial_staff, list):
                # 为导入的数据自动补充 IDC 字段
                enriched_staff = []
                for person in initial_staff:
                    person = enrich_staff_record(person)
                    person["status"] = person.get("status", "active")
                    person["created_at"] = person.get(
                        "created_at", get_beijing_datetime()
                    )
                    person["updated_at"] = person.get(
                        "updated_at", get_beijing_datetime()
                    )
                    enriched_staff.append(person)
                staff_db.write({"staff": enriched_staff})
        except Exception:
            pass


_ensure_staff_initialized()


def _upsert_staff(name: str, employee_id: str, department: str, organization: str):
    """新增或更新人员字典（含 IDC 标准化字段）"""
    if not name.strip():
        return

    def updater(data):
        staff_list = data.get("staff", [])
        # 按 employee_id 或 name 匹配
        existing = None
        match_confidence = 0
        for s in staff_list:
            if employee_id and (
                s.get("employee_id") == employee_id
                or s.get("new_employee_id") == employee_id
            ):
                existing = s
                match_confidence = 100
                break
            if s.get("name") == name.strip() and match_confidence < 50:
                existing = s
                match_confidence = 50

        if existing and match_confidence >= 50:
            # 更新现有记录
            if employee_id:
                if not existing.get("employee_id"):
                    existing["employee_id"] = employee_id
                elif not existing.get("new_employee_id"):
                    existing["new_employee_id"] = employee_id
            if department:
                existing["department"] = department
                # 部门变更时，重新计算 IDC 字段
                existing.update(enrich_staff_record({"department": department}))
            if organization:
                existing["organization"] = organization
            existing["updated_at"] = get_beijing_datetime()
        else:
            # 创建新记录（自动补充 IDC 字段）
            new_staff = {
                "name": name.strip(),
                "employee_id": employee_id or "",
                "new_employee_id": "",
                "department": department or "",
                "organization": organization or "",
                "status": "active",
                "created_at": get_beijing_datetime(),
                "updated_at": get_beijing_datetime(),
            }
            # 补充 IDC 标准字段
            new_staff.update(enrich_staff_record({"department": department}))
            staff_list.append(new_staff)

        data["staff"] = staff_list

    staff_db.update(updater)


def _record_backup_log(slug: str, version: str, path: str, size: int):
    """记录备份日志

    Args:
        slug: 技能slug
        version: 版本号
        path: 备份路径
        size: 文件大小
    """
    try:
        log_file = Path("/app/data/backup/backup.log")
        log_file.parent.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] BACKUP slug={slug} version={version} path={path} size={size}\n"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"[Backup] Failed to record backup log: {e}")


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    return xff.split(",")[0].strip() if xff else request.client.host


def add_audit_log(
    type_: str,
    skill_slug: str,
    skill_name: str,
    user: str,
    detail: str,
    request: Request = None,
    extra: dict = None,
):
    """添加审计日志

    Args:
        type_: 日志类型
        skill_slug: 技能slug
        skill_name: 技能名称
        user: 操作用户
        detail: 详情描述
        request: HTTP请求对象（用于获取IP）
        extra: 额外字段（如开发者、部门、描述等）
    """
    ip = get_client_ip(request) if request else ""
    log = {
        "id": str(uuid.uuid4()),
        "type": type_,
        "skill_slug": skill_slug,
        "skill_name": skill_name,
        "ip": ip,
        "user": user,
        "timestamp": get_beijing_datetime(),
        "detail": detail,
    }

    # 合并额外字段
    if extra and isinstance(extra, dict):
        log.update(extra)

    def append_log(data):
        data["logs"].append(log)
        # 清理30天前的日志
        cutoff = (get_beijing_time() - timedelta(days=30)).isoformat()
        data["logs"] = [l for l in data["logs"] if l["timestamp"] >= cutoff]

    audit_logs_db.update(append_log)


# ============ 异常处理 ============


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """捕获验证错误并返回详细信息"""
    print(f"DEBUG: Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation failed"},
    )


# ============ API 路由 ============


def _get_filtered_stats():
    """从事件日志获取过滤后的下载量和浏览量统计"""
    skill_downloads = Counter()
    skill_views = Counter()

    event_dates = get_event_dates()
    for date in event_dates:
        events = get_events_range(date, date)
        for event in events:
            ip = event.get("ip", "")
            if ip in BLOCKED_IPS:
                continue
            etype = event.get("type")
            slug = event.get("metadata", {}).get("slug", "")
            if not slug:
                continue
            if etype == "skill.download":
                skill_downloads[slug] += 1
            elif etype == "skill.view":
                skill_views[slug] += 1

    return skill_downloads, skill_views


@app.get("/api/skills")
def list_skills(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    tag: str = Query(None),
    tags: str = Query(None),
):
    """获取技能列表（使用过滤后的下载量和浏览量）"""
    data = skills_db.read()
    skills = data.get("skills", [])

    # 向后兼容：无status字段的skill默认为approved
    for s in skills:
        if "status" not in s:
            s["status"] = "approved"

    # 市场列表只显示已审核通过的技能
    skills = [s for s in skills if s.get("status") == "approved"]

    # 过滤（旧版单 tag 参数，基于版本 tag）
    if tag:
        versions_data = versions_db.read()
        latest_versions = {
            v["skill_id"]
            for v in versions_data.get("versions", [])
            if v.get("tag") == tag and v.get("is_latest")
        }
        skills = [s for s in skills if s["id"] in latest_versions]

    # 过滤（新版多 tags 参数，基于 skill.tags）
    if tags:
        filter_tags = [t.strip() for t in tags.split(",") if t.strip()]
        skills = [
            s for s in skills if any(t in (s.get("tags") or []) for t in filter_tags)
        ]

    # 获取过滤后的统计数据
    skill_downloads, skill_views = _get_filtered_stats()

    # 更新技能数据中的下载量和浏览量
    for s in skills:
        slug = s.get("slug", "")
        s["download_count"] = skill_downloads.get(slug, 0)
        s["view_count"] = skill_views.get(slug, 0)

    # 排序（按创建时间倒序）
    skills.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # 分页
    total = len(skills)
    start = page * size
    end = start + size
    page_data = skills[start:end]

    return {
        "success": True,
        "data": {
            "content": page_data,
            "totalElements": total,
            "totalPages": (total + size - 1) // size,
            "size": size,
            "number": page,
        },
    }


@app.get("/api/skills/{slug}")
def get_skill(slug: str):
    """获取技能详情（使用过滤后的下载量和浏览量）"""
    data = skills_db.read()
    skill = next((s for s in data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 向后兼容
    if "status" not in skill:
        skill["status"] = "approved"

    # 获取过滤后的统计数据
    skill_downloads, skill_views = _get_filtered_stats()
    skill["download_count"] = skill_downloads.get(slug, 0)
    skill["view_count"] = skill_views.get(slug, 0)

    # 获取版本
    versions = get_skill_versions(skill["id"])

    return {"success": True, "data": {**skill, "versions": versions}}


ALLOWED_ARCHIVE_EXTS = (".zip", ".gz", ".bz2", ".xz", ".tar", ".7z", ".rar")


@app.post("/api/skills/parse")
async def parse_skill_zip(skillZip: UploadFile = File(...)):
    """解析压缩包，返回 skill.md 中的名称和简介"""
    if not any(skillZip.filename.lower().endswith(ext) for ext in ALLOWED_ARCHIVE_EXTS):
        raise HTTPException(status_code=400, detail="仅支持 zip/tar.gz/7z 格式")

    temp_path = STORAGE_DIR / f"temp_{skillZip.filename}"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(skillZip.file, f)

        skill_info = extract_skill_md(temp_path)
        return {
            "success": True,
            "data": {
                "name": skill_info["name"],
                "description": skill_info["description"],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/api/skills")
async def create_skill(
    skillZip: UploadFile = File(...),
    authorName: str = Form(...),
    authorEmail: str = Form(""),
    version: str = Form("1.0.0"),
    tag: str = Form("stable"),
    authorEmployeeId: str = Form(""),
    authorDepartment: str = Form(""),
    authorOrganization: str = Form(""),
    tags: str = Form(""),
    skillName: str = Form(""),
    skillDescription: str = Form(""),
    request: Request = None,
):
    """发布新技能"""

    # 验证文件类型
    if not any(skillZip.filename.lower().endswith(ext) for ext in ALLOWED_ARCHIVE_EXTS):
        raise HTTPException(status_code=400, detail="仅支持 zip/tar.gz/7z 格式")

    # 保存临时文件
    temp_path = STORAGE_DIR / f"temp_{skillZip.filename}"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(skillZip.file, f)

        # 检查文件大小（3MB限制）
        file_size = temp_path.stat().st_size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "FILE_TOO_LARGE",
                    "message": f"文件大小 {file_size / 1024 / 1024:.2f}MB，超过 3MB 限制",
                    "max_size": "3MB",
                },
            )

        # 解析 skill.md
        skill_info = extract_skill_md(temp_path)

        # 优先使用用户修改后的值
        final_name = skillName.strip() or skill_info["name"]
        final_description = skillDescription.strip() or skill_info["description"]
        final_readme = skill_info["readme_content"]

        # 验证技能元数据（中文名称、简介长度）
        metadata_errors = validate_skill_metadata(final_name, final_description)
        if metadata_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "VALIDATION_FAILED",
                    "message": "技能信息校验失败",
                    "errors": [
                        {"type": "metadata", "message": err} for err in metadata_errors
                    ],
                },
            )

        # 全量脱敏检查
        sensitive_issues = check_skill_md_sensitive(skill_info["readme_content"])
        if sensitive_issues:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "SENSITIVE_CONTENT_DETECTED",
                    "message": "发现敏感信息，请脱敏后重新提交",
                    "errors": sensitive_issues,
                },
            )

        # 生成 slug
        slug = generate_slug(final_name)
        skill_id = slug

        # 检查是否已存在
        skills_data = skills_db.read()
        if any(s["slug"] == slug for s in skills_data.get("skills", [])):
            raise HTTPException(status_code=409, detail="Skill already exists")

        # 创建存储目录
        skill_dir = STORAGE_DIR / slug / version
        skill_dir.mkdir(parents=True, exist_ok=True)

        # 移动文件
        file_name = f"{slug}-{version}.zip"
        final_path = skill_dir / file_name
        shutil.move(str(temp_path), str(final_path))

        # 创建符号链接
        latest_link = STORAGE_DIR / slug / "latest"
        if latest_link.exists() or latest_link.is_symlink():
            latest_link.unlink()
        latest_link.symlink_to(version, target_is_directory=True)

        # 创建记录
        now = get_beijing_datetime()
        # 解析 tags
        skill_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

        skill_record = {
            "id": skill_id,
            "name": final_name,
            "slug": slug,
            "description": final_description,
            "readme_content": final_readme,
            "author_name": authorName,
            "author_email": authorEmail,
            "author_employee_id": authorEmployeeId,
            "author_department": authorDepartment,
            "author_organization": authorOrganization,
            "tags": skill_tags,
            "status": "pending",
            "admin_key_hash": "",
            "download_count": 0,
            "latest_version": version,
            "created_at": now,
            "updated_at": now,
        }

        version_record = {
            "id": f"{skill_id}-{version}",
            "skill_id": skill_id,
            "version": version,
            "tag": tag,
            "is_latest": True,
            "storage_path": str(final_path.relative_to(Path.cwd())),
            "file_size": final_path.stat().st_size,
            "file_hash": hashlib.sha256(final_path.read_bytes()).hexdigest(),
            "created_at": now,
        }

        # 保存
        def update_skills(data):
            data["skills"].append(skill_record)

        def update_versions(data):
            data["versions"].append(version_record)

        skills_db.update(update_skills)
        versions_db.update(update_versions)

        # 更新搜索索引
        update_search_index(skill_record)

        # 自动同步人员字典
        _upsert_staff(
            authorName, authorEmployeeId, authorDepartment, authorOrganization
        )

        # 记录审计日志
        add_audit_log(
            "publish", slug, skill_info["name"], authorName, "发布新技能", request
        )

        # 记录埋点事件
        track_skill_publish(
            slug=slug,
            skill_name=skill_record["name"],
            author=authorName,
            tags=skill_tags,
            file_size=final_path.stat().st_size,
        )

        # 发送发布申请通知（给管理员）- 只发送到内部通道
        try:
            notifier = FeishuNotifier(channel="internal")
            notifier.send_publish_apply(skill_record)
        except Exception as e:
            print(f"[publish] Failed to send notification: {e}")

        return {
            "success": True,
            "data": {
                "id": skill_id,
                "name": skill_record["name"],
                "slug": slug,
                "version": version,
                "downloadUrl": f"/api/skills/{slug}/download",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # 清理临时文件
        if temp_path.exists():
            temp_path.unlink()


@app.get("/api/skills/{slug}/download")
def download_skill(slug: str, version: str = Query(None), request: Request = None):
    """下载技能"""
    # 查找技能
    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 确定版本
    if not version:
        version = skill.get("latest_version", "1.0.0")

    # 查找版本
    versions_data = versions_db.read()
    ver = next(
        (
            v
            for v in versions_data.get("versions", [])
            if v["skill_id"] == skill["id"] and v["version"] == version
        ),
        None,
    )

    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")

    file_path = Path(ver["storage_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # 判断是否为历史版本（非最新版本）
    latest_version = skill.get("latest_version", "")
    is_history_version = version != latest_version

    # 如果是历史版本，需要密码验证
    if is_history_version:
        # 从请求头或查询参数获取密码
        password = request.headers.get("X-History-Password", "") if request else ""
        if not password:
            # 尝试从查询参数获取
            from fastapi import Query

            password = (
                request.query_params.get("password", "")
                if request and hasattr(request, "query_params")
                else ""
            )

        from app.config import HISTORY_VERSION_PASSWORD

        if password != HISTORY_VERSION_PASSWORD:
            raise HTTPException(
                status_code=403,
                detail="历史版本下载需要密码验证",
                headers={"X-History-Version": "true"},
            )

    # 获取客户端IP
    client_ip = get_client_ip(request)

    # 更新下载计数（每次下载都计数，不检测重复）
    def increment_download(data):
        for s in data.get("skills", []):
            if s["id"] == skill["id"]:
                s["download_count"] = s.get("download_count", 0) + 1
                s["updated_at"] = get_beijing_datetime()
                break

    skills_db.update(increment_download)

    # 记录审计日志（每次下载都记录）
    add_audit_log("download", slug, skill["name"], "", f"下载版本 {version}", request)

    # 记录埋点事件（每次下载都记录，用于分析）
    track_skill_download(
        slug=slug, skill_name=skill["name"], version=version, ip=client_ip
    )

    return FileResponse(
        file_path, filename=f"{slug}-{version}.zip", media_type="application/zip"
    )


@app.post("/api/skills/{slug}/versions")
async def create_version(
    slug: str,
    skillZip: UploadFile = File(...),
    version: str = Form(...),
    tag: str = Form("stable"),
    request: Request = None,
):
    """发布新版本（待审核）"""
    # 查找技能
    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 检查版本是否已存在
    versions_data = versions_db.read()
    if any(
        v["skill_id"] == skill["id"] and v["version"] == version
        for v in versions_data.get("versions", [])
    ):
        raise HTTPException(status_code=409, detail="Version already exists")

    # 保存文件
    temp_path = STORAGE_DIR / f"temp_{skillZip.filename}"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(skillZip.file, f)

        # 创建目录
        skill_dir = STORAGE_DIR / slug / version
        skill_dir.mkdir(parents=True, exist_ok=True)

        file_name = f"{slug}-{version}.zip"
        final_path = skill_dir / file_name
        shutil.move(str(temp_path), str(final_path))

        # 创建新版本记录（is_latest = False，待审核）
        now = get_beijing_datetime()
        version_record = {
            "id": f"{skill['id']}-{version}",
            "skill_id": skill["id"],
            "version": version,
            "tag": tag,
            "is_latest": False,
            "storage_path": str(final_path.relative_to(Path.cwd())),
            "file_size": final_path.stat().st_size,
            "file_hash": hashlib.sha256(final_path.read_bytes()).hexdigest(),
            "created_at": now,
        }

        def add_version(data):
            data["versions"].append(version_record)

        versions_db.update(add_version)

        # 实时备份到持久化目录（三重备份策略）
        try:
            # 使用容器内的 /app/data/backup/ 目录（在Docker volume中，可持久化）
            backup_base_dir = Path("/app/data/backup")
            backup_base_dir.mkdir(parents=True, exist_ok=True)

            # 1. 备份到持久化目录（主要备份）
            persistent_dir = backup_base_dir / "skills" / slug / version
            persistent_dir.mkdir(parents=True, exist_ok=True)
            persistent_path = persistent_dir / file_name
            shutil.copy2(str(final_path), str(persistent_path))

            # 2. 备份到archive目录（版本归档）
            archive_dir = backup_base_dir / "archive" / datetime.now().strftime("%Y%m")
            archive_dir.mkdir(parents=True, exist_ok=True)
            archive_path = (
                archive_dir
                / f"{slug}_{version}_{datetime.now().strftime('%d%H%M%S')}.zip"
            )
            shutil.copy2(str(final_path), str(archive_path))

            # 3. 记录备份日志
            _record_backup_log(
                slug, version, str(persistent_path), final_path.stat().st_size
            )

            print(f"[Backup] Skill {slug} v{version} backed up to persistent storage")
        except Exception as backup_err:
            print(f"[Backup] Failed to backup {slug} v{version}: {backup_err}")

        # 更新技能状态为 pending
        def update_skill_status(data):
            for s in data.get("skills", []):
                if s["id"] == skill["id"]:
                    s["status"] = "pending"
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill_status)

        # 自动执行代码审计
        try:
            from app.code_quality import run_auto_audit

            audit_results = run_auto_audit(final_path, slug, expert_db)
            print(
                f"[Auto Audit] Skill {slug} v{version}: score={audit_results.get('overall_score')}, grade={audit_results.get('overall_grade')}"
            )
        except Exception as audit_err:
            print(f"[Auto Audit] Failed for {slug}: {audit_err}")
            audit_results = None

        # 记录日志
        add_audit_log(
            "update",
            slug,
            skill["name"],
            skill.get("author_name", ""),
            f"提交新版本 {version} 待审核",
            request,
        )

        return {
            "success": True,
            "data": {
                "skillId": skill["id"],
                "version": version,
                "tag": tag,
                "downloadUrl": f"/api/skills/{slug}/download?version={version}",
                "message": "新版本已提交，等待审核",
                "audit": {
                    "score": audit_results.get("overall_score")
                    if audit_results
                    else None,
                    "grade": audit_results.get("overall_grade")
                    if audit_results
                    else None,
                    "issues": audit_results.get("summary", {}).get("total_issues")
                    if audit_results
                    else None,
                }
                if audit_results
                else None,
            },
        }

    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/skills/{slug}")
async def update_skill(
    slug: str,
    name: str = Form(...),
    description: str = Form(""),
    authorName: str = Form(...),
    authorEmail: str = Form(""),
    authorEmployeeId: str = Form(""),
    authorDepartment: str = Form(""),
    authorOrganization: str = Form(""),
    tags: str = Form(""),
):
    """更新技能信息"""
    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    skill_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    now = get_beijing_datetime()

    def update_data(data):
        for s in data.get("skills", []):
            if s["slug"] == slug:
                s["name"] = name
                s["description"] = description
                s["author_name"] = authorName
                s["author_email"] = authorEmail
                s["author_employee_id"] = authorEmployeeId
                s["author_department"] = authorDepartment
                s["author_organization"] = authorOrganization
                s["tags"] = skill_tags
                s["updated_at"] = now
                break

    skills_db.update(update_data)
    update_search_index(skill)

    # 自动同步人员字典
    _upsert_staff(authorName, authorEmployeeId, authorDepartment, authorOrganization)

    return {"success": True, "message": "Skill updated"}


@app.delete("/api/skills/{slug}")
def delete_skill_endpoint(slug: str, request: Request = None):
    """删除技能（提交删除申请，待管理员审批）"""
    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 将技能状态改为 delete_pending（删除待审核）
    now = get_beijing_datetime()

    def mark_delete_pending(data):
        for s in data.get("skills", []):
            if s["slug"] == slug:
                s["status"] = "delete_pending"
                s["updated_at"] = now
                break

    skills_db.update(mark_delete_pending)

    # 记录日志
    add_audit_log(
        "delete_pending",
        slug,
        skill["name"],
        skill.get("author_name", ""),
        "提交删除申请，等待管理员审批",
        request,
    )

    return {"success": True, "message": "删除申请已提交，等待管理员审批"}


@app.get("/api/search")
def search(
    q: str = Query("", min_length=0),
    author: str = Query(None),
    department: str = Query(None),
    tag: str = Query(None),
    request: Request = None,
):
    """全文搜索（支持按作者、部门、标签筛选）

    Query参数:
        q: 搜索关键词（匹配名称、描述、作者、部门）
        author: 按作者名筛选
        department: 按部门筛选
        tag: 按标签筛选
    """
    results = search_skills(
        query=q, filter_author=author, filter_department=department, filter_tag=tag
    )

    # 记录搜索埋点（异步，不阻塞返回）
    try:
        track_search(
            query=f"{q} (author={author}, dept={department}, tag={tag})",
            results_count=len(results),
            ip=get_client_ip(request) if request else "",
        )
    except Exception:
        pass

    return {
        "success": True,
        "data": {"content": results, "totalElements": len(results)},
    }


@app.get("/api/skills-summary")
def skills_summary():
    """返回所有技能的摘要信息（名称、简介、下载链接、开发人）"""
    data = skills_db.read()
    skills = data.get("skills", [])

    results = [
        {
            "name": s.get("name", ""),
            "description": s.get("description", ""),
            "downloadUrl": f"/api/skills/{s['slug']}/download",
            "developer": s.get("author_name", ""),
        }
        for s in skills
    ]

    return {"success": True, "data": results}


@app.post("/api/skills/export")
def export_skills(password: str = Form(...)):
    """导出所有技能详细信息，包含人员、工号、部门、下载链接"""
    # 简单鉴权：验证管理员密码
    if (
        not password
        or hashlib.sha256(password.encode()).hexdigest() != ADMIN_PASSWORD_HASH
    ):
        raise HTTPException(status_code=401, detail="密码错误")

    data = skills_db.read()
    skills = data.get("skills", [])

    results = [
        {
            "name": s.get("name", ""),
            "slug": s["slug"],
            "description": s.get("description", ""),
            "author_name": s.get("author_name", ""),
            "author_employee_id": s.get("author_employee_id", ""),
            "author_department": s.get("author_department", ""),
            "author_organization": s.get("author_organization", ""),
            "downloadUrl": f"/api/skills/{s['slug']}/download",
            "latest_version": s.get("latest_version", ""),
            "download_count": s.get("download_count", 0),
            "tags": s.get("tags", []),
            "status": s.get("status", "approved"),
            "created_at": s.get("created_at", ""),
        }
        for s in skills
    ]

    return {"success": True, "data": results, "total": len(results)}


@app.post("/api/skills/{slug}/view")
def record_view(slug: str, request: Request):
    """记录技能浏览量，每个IP每天只计一次"""
    ip = get_client_ip(request)
    today = get_beijing_date()

    # 读取IP记录
    vr_data = view_records_db.read()
    records = vr_data.get("records", {})
    today_records = records.get(today, {})
    skill_ips = today_records.get(slug, [])

    # 已记录则直接返回
    if ip in skill_ips:
        return {"success": True, "recorded": False}

    # 记录IP
    skill_ips.append(ip)
    today_records[slug] = skill_ips
    records[today] = today_records

    # 清理7天前记录
    cutoff = (get_beijing_time() - timedelta(days=7)).strftime("%Y-%m-%d")
    for old_date in list(records.keys()):
        if old_date < cutoff:
            del records[old_date]

    view_records_db.write({"records": records})

    # 增加浏览计数
    def increment(data):
        data["views"][slug] = data["views"].get(slug, 0) + 1

    views_db.update(increment)

    # 记录审计日志
    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)
    if skill:
        add_audit_log("view", slug, skill["name"], "", "浏览技能详情", request)

        # 记录埋点事件
        track_skill_view(slug=slug, skill_name=skill["name"], ip=ip)

    return {"success": True, "recorded": True}


@app.get("/api/stats")
def get_stats():
    """返回统计数据（下载量、浏览量、部门上传量、个人上传量）

    下载量和浏览量从事件日志实时统计，确保数据准确性
    """
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 从事件日志统计下载和浏览数据（只读，不修改日志）
    from app.events import get_events_range

    # 获取所有事件日志中的下载和浏览数据
    skill_downloads = Counter()
    skill_views = Counter()

    # 读取所有日期的事件
    from app.events import get_event_dates

    event_dates = get_event_dates()

    for date in event_dates:
        events = get_events_range(date, date)
        for event in events:
            # 跳过黑名单IP的事件
            if event.get("ip", "") in BLOCKED_IPS:
                continue
            if event.get("type") == "skill.download":
                slug = event.get("metadata", {}).get("slug", "")
                if slug:
                    skill_downloads[slug] += 1
            elif event.get("type") == "skill.view":
                slug = event.get("metadata", {}).get("slug", "")
                if slug:
                    skill_views[slug] += 1

    # 技能下载/浏览排行（使用日志数据，已过滤黑名单IP）
    skill_stats = [
        {
            "name": s.get("name", ""),
            "slug": s["slug"],
            "downloads": skill_downloads.get(s["slug"], 0),
            "views": skill_views.get(s["slug"], 0),
        }
        for s in skills
    ]
    skill_stats.sort(key=lambda x: x["downloads"], reverse=True)

    # 部门上传量（按 IDC 区域聚合）
    region_counts = Counter()
    dc_counts = Counter()
    center_counts = Counter()
    unmapped_dept_counts = Counter()

    for s in skills:
        dept = s.get("author_department", "未知部门")
        # 尝试从 staff_db 中查找该人员的 IDC 信息
        staff_data = staff_db.read()
        staff_info = next(
            (
                st
                for st in staff_data.get("staff", [])
                if st.get("name") == s.get("author_name") and st.get("idc_mapped")
            ),
            None,
        )

        if staff_info:
            if staff_info.get("region_id") == "hq" and staff_info.get("center_name"):
                center_counts[staff_info["center_name"]] += 1
            elif staff_info.get("region_name"):
                region_counts[staff_info["region_name"]] += 1
                if staff_info.get("dc_short"):
                    dc_counts[staff_info["dc_short"]] += 1
            else:
                unmapped_dept_counts[dept] += 1
        else:
            #  fallback：直接映射
            from app.org_mapping import get_idc_info

            idc_info = get_idc_info(dept)
            if idc_info["mapped"]:
                if idc_info["region_id"] == "hq":
                    center_counts[idc_info["center_name"]] += 1
                else:
                    region_counts[idc_info["region_name"]] += 1
            else:
                unmapped_dept_counts[dept] += 1

    # 构建区域统计（包含所有区域，无数据补0）
    region_stats = []
    for r in ALL_L1_REGIONS:
        region_stats.append(
            {"id": r["id"], "name": r["name"], "count": region_counts.get(r["name"], 0)}
        )
    region_stats.sort(key=lambda x: -x["count"])

    # 数据中心统计
    dc_stats = [
        {"name": name, "count": count} for name, count in dc_counts.most_common()
    ]

    # 职能中心统计
    center_stats = [
        {"name": name, "count": count} for name, count in center_counts.most_common()
    ]

    # 个人上传量
    dev_counts = Counter(s.get("author_name", "未知") for s in skills)
    developer_stats = [
        {"name": name, "count": count} for name, count in dev_counts.most_common()
    ]

    return {
        "success": True,
        "data": {
            "skills": skill_stats,
            "regions": region_stats,
            "datacenters": dc_stats,
            "centers": center_stats,
            "unmapped_departments": [
                {"name": name, "count": count}
                for name, count in unmapped_dept_counts.most_common()
            ],
            "departments": [
                {"name": name, "count": count}
                for name, count in Counter(
                    s.get("author_department", "未知部门") for s in skills
                ).most_common()
            ],
            "developers": developer_stats,
        },
    }


# ============ 新统计 API（运营驾驶舱）============


@app.get("/api/stats/kpi")
def get_kpi():
    """获取KPI汇总卡片数据（今日/昨日/本周/本月/总计）

    直接从原始事件日志计算，确保数据准确性
    """
    try:
        from app.events import get_events_range, get_event_dates
        from collections import Counter

        today = get_beijing_date()
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        # 获取所有事件日期
        event_dates = get_event_dates()

        # 初始化统计
        def calc_stats(start_date, end_date):
            """计算指定日期范围的统计"""
            events = []
            for date_str in event_dates:
                if start_date <= date_str <= end_date:
                    events.extend(get_events_range(date_str, date_str))

            downloads = 0
            views = 0
            publishes = 0
            searches = 0
            unique_users = set()
            unique_ips = set()

            for event in events:
                user = event.get("user", "")
                ip = event.get("ip", "")

                # 跳过黑名单IP的事件
                if ip in BLOCKED_IPS:
                    continue

                etype = event.get("type")

                if user:
                    unique_users.add(user)
                if ip:
                    unique_ips.add(ip)

                if etype == "skill.download":
                    downloads += 1
                elif etype == "skill.view":
                    views += 1
                elif etype == "skill.publish":
                    publishes += 1
                elif etype == "search":
                    searches += 1

            return {
                "skills_total": publishes,
                "downloads": downloads,
                "views": views,
                "searches": searches,
                "unique_users": len(unique_users),
            }

        # 计算各时间段
        today_stats = calc_stats(today, today)
        yesterday_stats = calc_stats(yesterday, yesterday)
        week_stats = calc_stats(week_ago, today)
        month_stats = calc_stats(month_ago, today)

        # 计算总计（所有时间）
        if event_dates:
            total_stats = calc_stats(min(event_dates), max(event_dates))
            # 总计中的技能总数使用系统中当前的有效技能数（而不是发布事件数）
            skills_data = skills_db.read()
            total_stats["skills_total"] = len(skills_data.get("skills", []))
        else:
            total_stats = {
                "skills_total": 0,
                "downloads": 0,
                "views": 0,
                "searches": 0,
                "unique_users": 0,
            }

        kpi = {
            "today": today_stats,
            "yesterday": yesterday_stats,
            "this_week": week_stats,
            "this_month": month_stats,
            "total": total_stats,
        }

        return {"success": True, "data": kpi}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.get("/api/stats/trend")
def get_trend(
    start: str = Query(None), end: str = Query(None), days: int = Query(30, ge=1, le=90)
):
    """获取趋势数据（折线图）

    Query参数:
        start: 开始日期 YYYY-MM-DD
        end: 结束日期 YYYY-MM-DD
        days: 最近N天（默认30，当start/end未指定时使用）
    """
    try:
        if start and end:
            trend = get_trend_data(start, end)
        else:
            end_date = get_beijing_time()
            start_date = end_date - timedelta(days=days)
            trend = get_trend_data(
                start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")
            )
        return {"success": True, "data": trend}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.get("/api/stats/realtime")
def get_realtime(limit: int = Query(20, ge=1, le=100)):
    """获取实时活动流"""
    events = get_realtime_events(limit)

    # 格式化事件为前端友好的格式（过滤黑名单IP）
    formatted = []
    for e in events:
        # 跳过黑名单IP的事件
        if e.get("ip", "") in BLOCKED_IPS:
            continue

        meta = e.get("metadata", {})
        event_type = e["type"]

        # 生成描述文本
        desc = ""
        if event_type == "skill.view":
            desc = f"浏览了 {meta.get('skill_name', meta.get('slug', ''))}"
        elif event_type == "skill.download":
            desc = f"下载了 {meta.get('skill_name', meta.get('slug', ''))}"
        elif event_type == "skill.publish":
            desc = f"发布了 {meta.get('skill_name', meta.get('slug', ''))}"
        elif event_type == "search":
            desc = f"搜索: {meta.get('query', '')}"
        elif event_type == "tag.click":
            desc = f"点击标签: {meta.get('tag_name', '')}"
        elif event_type == "admin.action":
            desc = f"管理员{meta.get('action', '')}: {meta.get('skill_name', '')}"

        formatted.append(
            {
                "id": e["id"],
                "type": event_type,
                "user": e.get("user", ""),
                "description": desc,
                "timestamp": e["timestamp"],
                "metadata": meta,
            }
        )

    return {"success": True, "data": formatted}


@app.get("/api/stats/search-analysis")
def get_search_analysis(days: int = Query(7, ge=1, le=30)):
    """获取搜索分析数据"""
    end_date = get_beijing_time()
    start_date = end_date - timedelta(days=days)

    events = get_events_range(
        start_date.strftime("%Y-%m-%d"),
        end_date.strftime("%Y-%m-%d"),
        event_type="search",
    )

    queries = Counter()
    zero_result_queries = Counter()
    total = len(events)
    zero_total = 0

    for e in events:
        # 跳过黑名单IP的搜索事件
        if e.get("ip", "") in BLOCKED_IPS:
            continue
        meta = e.get("metadata", {})
        q = meta.get("query", "")
        queries[q] += 1
        if not meta.get("has_results", True):
            zero_result_queries[q] += 1
            zero_total += 1

    return {
        "success": True,
        "data": {
            "period_days": days,
            "total_searches": total,
            "zero_result_count": zero_total,
            "zero_result_rate": round(zero_total / total * 100, 1) if total else 0,
            "top_queries": [
                {"query": q, "count": c} for q, c in queries.most_common(20)
            ],
            "zero_result_queries": [
                {"query": q, "count": c} for q, c in zero_result_queries.most_common(10)
            ],
        },
    }


@app.post("/api/stats/aggregate")
def trigger_aggregate(date: str = Form(None)):
    """手动触发指标聚合（管理用途）"""
    result = aggregate_daily(date)
    return {"success": True, "data": result}


# ============ 管理后台 API ============


@app.post("/api/admin/login")
def admin_login(password: str = Form(...)):
    """管理员登录验证"""
    if hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH:
        return {"success": True, "token": "admin"}
    raise HTTPException(status_code=401, detail="密码错误")


def verify_admin_token(request: Request):
    """验证管理员token"""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != "admin":
        raise HTTPException(status_code=401, detail="未授权")


@app.get("/api/admin/pending")
def get_pending(request: Request):
    """获取待审核列表"""
    verify_admin_token(request)

    skills_data = skills_db.read()
    versions_data = versions_db.read()
    skills = skills_data.get("skills", [])
    versions = versions_data.get("versions", [])

    # 待审核的技能（status = pending 或 delete_pending）
    pending_skills = []
    for s in skills:
        if s.get("status") in ("pending", "delete_pending"):
            skill_data = dict(s)
            # 获取最新的代码审计结果
            try:
                audit_logs = expert_db.get_code_audit_logs(skill_id=s["slug"], limit=1)
                if audit_logs:
                    latest_audit = audit_logs[0]
                    skill_data["auto_score"] = latest_audit.get("score")
                    skill_data["auto_grade"] = latest_audit.get("results", {}).get(
                        "overall_grade"
                    )
                    skill_data["audit_issues"] = (
                        latest_audit.get("results", {})
                        .get("summary", {})
                        .get("total_issues", 0)
                    )
            except Exception:
                pass
            pending_skills.append(skill_data)

    # 待审核的版本（is_latest = False 且 skill 状态为 pending）
    pending_versions = []
    for v in versions:
        if not v.get("is_latest"):
            skill = next((s for s in skills if s["id"] == v["skill_id"]), None)
            if skill and skill.get("status") == "pending":
                version_data = {
                    **v,
                    "skill_name": skill["name"],
                    "skill_slug": skill["slug"],
                }
                # 获取该版本的代码审计结果
                try:
                    audit_logs = expert_db.get_code_audit_logs(
                        skill_id=skill["slug"], limit=1
                    )
                    if audit_logs:
                        latest_audit = audit_logs[0]
                        version_data["auto_score"] = latest_audit.get("score")
                        version_data["auto_grade"] = latest_audit.get(
                            "results", {}
                        ).get("overall_grade")
                        version_data["audit_issues"] = (
                            latest_audit.get("results", {})
                            .get("summary", {})
                            .get("total_issues", 0)
                        )
                except Exception:
                    pass
                pending_versions.append(version_data)

    return {
        "success": True,
        "data": {"skills": pending_skills, "versions": pending_versions},
    }


@app.post("/api/admin/approve")
def approve_skill(
    request: Request,
    slug: str = Form(...),
    action: str = Form(...),  # approve | reject
    reason: str = Form(""),
):
    """审核通过/拒绝"""
    verify_admin_token(request)

    if action not in ("approve", "reject", "delete"):
        raise HTTPException(
            status_code=400, detail="action必须是approve、reject或delete"
        )

    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    now = get_beijing_datetime()

    if action == "approve":
        # 查找该技能待审核的最新版本
        versions_data = versions_db.read()
        pending_ver = None
        for v in versions_data.get("versions", []):
            if v["skill_id"] == skill["id"] and not v.get("is_latest"):
                pending_ver = v
                break

        # 更新版本状态
        def update_versions(data):
            for v in data.get("versions", []):
                if v["skill_id"] == skill["id"]:
                    if pending_ver and v["id"] == pending_ver["id"]:
                        v["is_latest"] = True
                    elif v.get("is_latest"):
                        v["is_latest"] = False

        versions_db.update(update_versions)

        # 更新技能状态
        def update_skill(data):
            for s in data.get("skills", []):
                if s["slug"] == slug:
                    s["status"] = "approved"
                    if pending_ver:
                        s["latest_version"] = pending_ver["version"]
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill)

        # 更新符号链接
        if pending_ver:
            latest_link = STORAGE_DIR / slug / "latest"
            if latest_link.exists() or latest_link.is_symlink():
                latest_link.unlink()
            latest_link.symlink_to(pending_ver["version"], target_is_directory=True)

        # 记录日志（包含完整信息）
        add_audit_log(
            "approve",
            slug,
            skill["name"],
            "管理员",
            "审核通过",
            extra={
                "developer": skill.get("author_name", ""),
                "department": skill.get("author_department", ""),
                "description": skill.get("description", "")[:100],
                "version": pending_ver["version"] if pending_ver else None,
            },
        )

        # 发送审批通过通知（给提交人）- 同时发送到内部和外部通道
        try:
            notifier_internal = FeishuNotifier(channel="internal")
            notifier_internal.send_publish_approve(skill, "管理员")
            notifier_external = FeishuNotifier(channel="external")
            notifier_external.send_publish_approve(skill, "管理员")
        except Exception as e:
            print(f"[approve] Failed to send notification: {e}")

        return {"success": True, "message": "审核通过"}

    elif action == "reject":
        # 更新技能状态为 rejected
        def update_skill(data):
            for s in data.get("skills", []):
                if s["slug"] == slug:
                    s["status"] = "rejected"
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill)

        # 记录日志
        add_audit_log("reject", slug, skill["name"], "管理员", f"审核拒绝: {reason}")

        # 发送审批拒绝通知（给提交人）- 只发送到内部通道
        try:
            notifier = FeishuNotifier(channel="internal")
            notifier.send_publish_reject(skill, reason, "管理员")
        except Exception:
            pass

        return {"success": True, "message": "已拒绝"}

    else:  # delete - 执行真正的删除
        # 调用服务层删除
        if delete_skill(skill["id"]):
            # 记录日志
            add_audit_log(
                "delete", slug, skill["name"], "管理员", f"删除技能: {reason}"
            )
            return {"success": True, "message": "技能已删除"}
        else:
            raise HTTPException(status_code=500, detail="删除失败")


@app.get("/api/admin/logs")
def get_logs(
    request: Request,
    type: str = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
):
    """获取审计日志"""
    verify_admin_token(request)

    data = audit_logs_db.read()
    logs = data.get("logs", [])

    # 按类型筛选
    if type:
        logs = [l for l in logs if l["type"] == type]

    # 按时间倒序
    logs.sort(key=lambda x: x["timestamp"], reverse=True)

    # 分页
    total = len(logs)
    start = page * size
    end = start + size
    page_data = logs[start:end]

    return {
        "success": True,
        "data": {
            "content": page_data,
            "totalElements": total,
            "totalPages": (total + size - 1) // size,
            "size": size,
            "number": page,
        },
    }


@app.get("/api/staff")
def list_staff():
    """获取全部人员列表（兼容旧格式 + 自动补全 IDC 字段）"""
    data = staff_db.read()
    staff_list = data.get("staff", [])

    # 自动为旧数据补全 IDC 字段
    enriched = []
    for s in staff_list:
        if "region_id" not in s:
            s = enrich_staff_record(s)
        enriched.append(s)

    return {"success": True, "data": enriched}


@app.get("/api/staff/by-region")
def list_staff_by_region(region_id: str = Query(...)):
    """按区域查询人员"""
    data = staff_db.read()
    staff = [
        s
        for s in data.get("staff", [])
        if s.get("region_id") == region_id
        or s.get("center_id", "").startswith(region_id)
    ]
    return {"success": True, "data": staff, "total": len(staff)}


@app.get("/api/staff/by-dc")
def list_staff_by_dc(dc_id: str = Query(...)):
    """按数据中心查询人员"""
    data = staff_db.read()
    staff = [s for s in data.get("staff", []) if s.get("dc_id") == dc_id]
    return {"success": True, "data": staff, "total": len(staff)}


@app.get("/api/org-structure")
def get_org_structure():
    """获取 IDC 标准组织架构"""
    regions = []
    for rid, info in sorted(IDC_REGIONS.items(), key=lambda x: x[1]["sort_order"]):
        regions.append(
            {
                "id": rid,
                "name": info["name"],
                "type": "region",
                "sort_order": info["sort_order"],
                "dcs": get_dcs_by_region(rid),
            }
        )

    centers = []
    for cid, info in sorted(IDC_CENTERS.items(), key=lambda x: x[1]["sort_order"]):
        centers.append(
            {
                "id": cid,
                "name": info["name"],
                "type": "center",
                "sort_order": info["sort_order"],
            }
        )

    return {
        "success": True,
        "data": {"regions": regions, "centers": centers, "all": ALL_L1_REGIONS},
    }


@app.post("/api/staff")
def add_staff(
    name: str = Form(...),
    employee_id: str = Form(""),
    department: str = Form(""),
    organization: str = Form(""),
):
    """新增或更新人员"""
    _upsert_staff(name, employee_id, department, organization)
    return {"success": True, "message": "人员已保存"}


@app.get("/health")
def health():
    """健康检查"""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/api/scheduler/status")
def scheduler_status():
    """获取定时任务调度器状态"""
    from app.scheduler import get_scheduler_status

    return {"success": True, "data": get_scheduler_status()}


@app.post("/api/scheduler/trigger")
def trigger_scheduler_job(job_id: str = Form(...)):
    """手动触发定时任务（管理用途）"""
    from app.scheduler import _scheduler

    if _scheduler is None:
        return {"success": False, "message": "Scheduler not running"}

    job = _scheduler.get_job(job_id)
    if job is None:
        return {"success": False, "message": f"Job {job_id} not found"}

    job.modify(next_run_time=get_beijing_time())
    return {"success": True, "message": f"Job {job_id} triggered"}


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化调度器"""
    from app.scheduler import start_scheduler

    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理调度器"""
    from app.scheduler import stop_scheduler

    stop_scheduler()


# ============ Webhook 日志管理 API ============


@app.get("/api/admin/webhook-logs")
def get_webhook_logs(
    request: Request,
    type: str = Query(None, description="日志类型"),
    status: str = Query(None, description="状态"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
):
    """获取 Webhook 发送日志列表"""
    verify_admin_token(request)
    result = WebhookLogService.list_logs(
        type_=type, status=status, page=page, size=size
    )
    return {"success": True, "data": result}


@app.get("/api/admin/webhook-logs/{id}")
def get_webhook_log_detail(id: str, request: Request):
    """获取单条 Webhook 日志详情"""
    verify_admin_token(request)
    log = WebhookLogService.get_detail(id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    return {"success": True, "data": log}


@app.get("/api/admin/webhook-logs/stats")
def get_webhook_logs_stats(request: Request):
    """获取 Webhook 发送统计"""
    verify_admin_token(request)
    stats = WebhookLogService.get_stats()
    return {"success": True, "data": stats}


@app.post("/api/admin/webhook-logs/test")
def test_webhook(
    request: Request,
    channel: str = Query("internal", description="通道: internal 内部 | external 外部"),
):
    """手动测试 Webhook 发送 - 支持双通道"""
    verify_admin_token(request)
    notifier = FeishuNotifier(channel=channel)
    log = notifier.send_text(f"🧪 测试消息 ({channel}通道)", "manual_test")
    return {"success": log.status == "success", "data": log.to_dict()}


@app.post("/api/admin/webhook-logs/{id}/retry")
def retry_webhook_log(
    id: str,
    request: Request,
    channel: str = Query(
        None, description="指定通道: internal | external，不指定则使用原通道"
    ),
):
    """重试发送 Webhook（支持选择通道）"""
    verify_admin_token(request)
    log = WebhookLogService.get_detail(id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")

    # 确定目标通道
    target_channel = channel or log.get("channel", "internal")
    notifier = FeishuNotifier(channel=target_channel)

    try:
        # 重新构建消息
        message = log.get("request_body", {})
        if message:
            # 创建新的日志记录
            new_log = notifier._send(message, log.get("type", "retry"))
            return {
                "success": new_log.status == "success",
                "data": {
                    "original_id": id,
                    "new_log": new_log.to_dict(),
                    "channel": target_channel,
                },
            }
        else:
            # 如果没有请求体，发送简单文本
            new_log = notifier.send_text("🧪 重试发送（原始请求体丢失）", "retry")
            return {
                "success": new_log.status == "success",
                "data": {
                    "original_id": id,
                    "new_log": new_log.to_dict(),
                    "channel": target_channel,
                },
            }
    except Exception as e:
        return {"success": False, "message": f"重试失败: {str(e)}"}


# 手动发送日报
@app.post("/api/admin/send-daily-report")
def send_daily_report_manual(request: Request):
    """手动发送日报 - 只发送到内部通道"""
    verify_admin_token(request)
    try:
        from app.report_builder import DailyReportBuilder
        from app.notifier import FeishuNotifier

        builder = DailyReportBuilder()
        report_data = builder.build()

        # 内部通道
        notifier_internal = FeishuNotifier(channel="internal")
        log_internal = notifier_internal.send_daily_report(report_data)

        # 记录到新的日志库
        expert_db.log_user_activity(
            activity_type="daily_report_sent",
            user_id="admin",
            details={
                "report_type": "daily",
                "date": report_data.get("date"),
                "summary": report_data.get("summary", {}),
                "send_status": log_internal.status,
            },
        )

        return {
            "success": log_internal.status == "success",
            "data": log_internal.to_dict(),
        }
    except Exception as e:
        return {"success": False, "message": f"发送失败: {str(e)}"}


# 手动发送周报
@app.post("/api/admin/send-weekly-report")
def send_weekly_report_manual(request: Request):
    """手动发送周报 - 同时发送到内部和外部通道"""
    verify_admin_token(request)
    try:
        from app.report_builder import WeeklyReportBuilder
        from app.notifier import FeishuNotifier

        builder = WeeklyReportBuilder()
        report_data = builder.build()

        # 内部通道
        notifier_internal = FeishuNotifier(channel="internal")
        log_internal = notifier_internal.send_weekly_report(report_data)

        # 外部通道
        notifier_external = FeishuNotifier(channel="external")
        log_external = notifier_external.send_weekly_report(report_data)

        # 记录到新的日志库
        expert_db.log_user_activity(
            activity_type="weekly_report_sent",
            user_id="admin",
            details={
                "report_type": "weekly",
                "week_range": report_data.get("week_range"),
                "summary": report_data.get("summary", {}),
                "internal_status": log_internal.status,
                "external_status": log_external.status,
            },
        )

        return {
            "success": log_internal.status == "success"
            and log_external.status == "success",
            "data": {
                "internal": log_internal.to_dict(),
                "external": log_external.to_dict(),
            },
        }
    except Exception as e:
        return {"success": False, "message": f"发送失败: {str(e)}"}


# ============ 实时报告 API ============


REPORT_API_KEY = "test-key-for-dev-2026"


def verify_report_token(request: Request):
    """验证报告接口的 Bearer Token"""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer ") or auth[7:] != REPORT_API_KEY:
        raise HTTPException(status_code=401, detail="未授权")


@app.get("/api/reports/daily")
def get_daily_report(request: Request):
    """获取实时日报内容（需要 Bearer Token 鉴权）"""
    verify_report_token(request)
    try:
        from app.report_builder import DailyReportBuilder

        builder = DailyReportBuilder()
        report_data = builder.build()

        # 记录到新的日志库
        expert_db.log_user_activity(
            activity_type="daily_report_generated",
            user_id="system",
            details={
                "report_type": "daily",
                "date": report_data.get("date"),
                "summary": report_data.get("summary", {}),
            },
        )

        return {"success": True, "data": report_data}
    except Exception as e:
        return {"success": False, "message": f"生成日报失败: {str(e)}"}


@app.get("/api/reports/weekly")
def get_weekly_report(request: Request):
    """
    获取周报内容（需要 Bearer Token 鉴权）
    同时返回本周和上周的数据，无需传参

    返回字段说明:
    - current_week: 本周数据（周一到今天）
    - last_week: 上周数据（周一到周日）
    - week_over_week: 本周 vs 上周环比趋势
    - summary: 平台累计数据（技能总量/总访问量/总下载量/总发布量）
    - top_departments: 部门排行榜Top5
    - top_skills: 个人排行榜Top5
    - data_quality: 数据质量指标（去重率/转化率/有效率）
    - metric_standards: 指标统计标准说明
    """
    verify_report_token(request)
    try:
        from app.report_builder import WeeklyReportBuilder

        builder = WeeklyReportBuilder()

        # 同时生成本周和上周数据
        current_week_data = builder.build(week_type="current")
        last_week_data = builder.build(week_type="last")

        # 计算环比（本周 vs 上周）
        week_over_week = {
            "views": _calc_trend(
                current_week_data["this_week"]["views"],
                last_week_data["this_week"]["views"],
            ),
            "downloads": _calc_trend(
                current_week_data["this_week"]["downloads"],
                last_week_data["this_week"]["downloads"],
            ),
            "publishes": _calc_trend(
                current_week_data["this_week"]["publishes"],
                last_week_data["this_week"]["publishes"],
            ),
            "searches": _calc_trend(
                current_week_data["this_week"]["searches"],
                last_week_data["this_week"]["searches"],
            ),
        }

        # 合并数据
        report_data = {
            # 本周数据
            "current_week": {
                "week_range": current_week_data["week_range"],  # 本周统计周期范围
                "skills_total": current_week_data["this_week"][
                    "skills_total"
                ],  # 本周新增Skill数
                "downloads": current_week_data["this_week"][
                    "downloads"
                ],  # 本周下载次数
                "views": current_week_data["this_week"]["views"],  # 本周浏览次数
                "publishes": current_week_data["this_week"][
                    "publishes"
                ],  # 本周发布次数
                "searches": current_week_data["this_week"]["searches"],  # 本周搜索次数
                "unique_users": current_week_data["this_week"][
                    "unique_users"
                ],  # 本周活跃用户数
            },
            # 上周数据
            "last_week": {
                "week_range": last_week_data["week_range"],  # 上周统计周期范围
                "skills_total": last_week_data["this_week"][
                    "skills_total"
                ],  # 上周新增Skill数
                "downloads": last_week_data["this_week"]["downloads"],  # 上周下载次数
                "views": last_week_data["this_week"]["views"],  # 上周浏览次数
                "publishes": last_week_data["this_week"]["publishes"],  # 上周发布次数
                "searches": last_week_data["this_week"]["searches"],  # 上周搜索次数
                "unique_users": last_week_data["this_week"][
                    "unique_users"
                ],  # 上周活跃用户数
            },
            # 环比趋势
            "week_over_week": week_over_week,  # 本周 vs 上周环比趋势
            # 平台累计数据
            "summary": current_week_data[
                "summary"
            ],  # 平台累计数据（技能总量/总访问量/总下载量/总发布量）
            # 融合排行榜（各大区 + 职能中心，排除数智中心）
            "combined_rankings": current_week_data.get(
                "combined_rankings", []
            ),  # 融合排行榜
            # 排行榜（使用本周数据）
            "top_departments": current_week_data["top_departments"],  # 部门排行榜Top5
            "top_skills": current_week_data["top_skills"],  # 个人排行榜Top5
            # 数据质量
            "data_quality": current_week_data[
                "data_quality"
            ],  # 数据质量指标（去重率/转化率/有效率）
            # 指标标准
            "metric_standards": current_week_data[
                "metric_standards"
            ],  # 指标统计标准说明
            # 生成时间
            "generated_at": current_week_data[
                "generated_at"
            ],  # 报告生成时间（ISO 8601格式）
        }

        # 记录到新的日志库
        expert_db.log_user_activity(
            activity_type="weekly_report_generated",
            user_id="system",
            details={
                "report_type": "weekly",
                "current_week_range": current_week_data.get("week_range"),
                "last_week_range": last_week_data.get("week_range"),
                "summary": report_data.get("summary", {}),
            },
        )

        return {"success": True, "data": report_data}
    except Exception as e:
        return {"success": False, "message": f"生成周报失败: {str(e)}"}


@app.get("/api/admin/approve-quick")
def quick_approve(
    request: Request,
    slug: str = Query(..., description="技能slug"),
    action: str = Query(..., description="操作: approve | reject"),
    reason: str = Query("", description="拒绝原因"),
    token: str = Query("", description="快速审批token"),
):
    """快速审批接口（支持从飞书卡片点击）"""
    # 支持通过token鉴权（用于飞书卡片链接）
    auth = request.headers.get("authorization", "")
    if not (auth.startswith("Bearer ") and auth[7:] == "admin"):
        # 如果没有Bearer token，检查URL中的token
        if token != QUICK_APPROVE_TOKEN:
            raise HTTPException(status_code=401, detail="未授权")

    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action必须是approve或reject")

    skills_data = skills_db.read()
    skill = next((s for s in skills_data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    now = get_beijing_datetime()

    if action == "approve":
        # 查找该技能待审核的最新版本
        versions_data = versions_db.read()
        pending_ver = None
        for v in versions_data.get("versions", []):
            if v["skill_id"] == skill["id"] and not v.get("is_latest"):
                pending_ver = v
                break

        # 更新版本状态
        def update_versions(data):
            for v in data.get("versions", []):
                if v["skill_id"] == skill["id"]:
                    if pending_ver and v["id"] == pending_ver["id"]:
                        v["is_latest"] = True
                    elif v.get("is_latest"):
                        v["is_latest"] = False

        versions_db.update(update_versions)

        # 更新技能状态
        def update_skill(data):
            for s in data.get("skills", []):
                if s["slug"] == slug:
                    s["status"] = "approved"
                    if pending_ver:
                        s["latest_version"] = pending_ver["version"]
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill)

        # 更新符号链接
        if pending_ver:
            latest_link = STORAGE_DIR / slug / "latest"
            if latest_link.exists() or latest_link.is_symlink():
                latest_link.unlink()
            latest_link.symlink_to(pending_ver["version"], target_is_directory=True)

        # 记录日志（包含完整信息）
        add_audit_log(
            "approve",
            slug,
            skill["name"],
            "管理员",
            "快速审核通过",
            extra={
                "developer": skill.get("author_name", ""),
                "department": skill.get("author_department", ""),
                "description": skill.get("description", "")[:100],
                "version": pending_ver["version"] if pending_ver else None,
            },
        )

        # 发送审批通过通知（给提交人）- 同时发送到内部和外部通道
        try:
            notifier_internal = FeishuNotifier(channel="internal")
            notifier_internal.send_publish_approve(skill, "管理员")
            notifier_external = FeishuNotifier(channel="external")
            notifier_external.send_publish_approve(skill, "管理员")
        except Exception as e:
            print(f"[quick approve] Failed to send notification: {e}")

        # 返回HTML页面，自动关闭或刷新
        from fastapi.responses import HTMLResponse

        html_content = (
            """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>审核通过</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .success { color: #10b981; font-size: 48px; margin-bottom: 16px; }
                h1 { color: #1f2937; margin: 0 0 8px 0; }
                p { color: #6b7280; margin: 0; }
                .close-btn { margin-top: 20px; padding: 10px 24px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
                .close-btn:hover { background: #059669; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">✅</div>
                <h1>审核通过</h1>
                <p>技能 """
            + skill.get("name", "")
            + """ 已通过审核</p>
                <button class="close-btn" onclick="window.close()">关闭窗口</button>
            </div>
            <script>
                // 尝试通知 opener 窗口刷新
                if (window.opener) {
                    window.opener.location.reload();
                }
                // 3秒后自动关闭
                setTimeout(function() {
                    window.close();
                }, 3000);
            </script>
        </body>
        </html>
        """
        )
        return HTMLResponse(content=html_content)

    else:  # reject
        # 更新技能状态为 rejected
        def update_skill(data):
            for s in data.get("skills", []):
                if s["slug"] == slug:
                    s["status"] = "rejected"
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill)

        # 记录日志
        add_audit_log(
            "reject", slug, skill["name"], "管理员", f"快速审核拒绝: {reason}"
        )

        # 发送审批拒绝通知（给提交人）- 只发送到内部通道
        try:
            notifier = FeishuNotifier(channel="internal")
            notifier.send_publish_reject(skill, reason, "管理员")
        except Exception as e:
            print(f"[quick reject] Failed to send notification: {e}")

        # 返回HTML页面，自动关闭或刷新
        from fastapi.responses import HTMLResponse

        html_content = (
            """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>审核拒绝</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .reject { color: #ef4444; font-size: 48px; margin-bottom: 16px; }
                h1 { color: #1f2937; margin: 0 0 8px 0; }
                p { color: #6b7280; margin: 0; }
                .close-btn { margin-top: 20px; padding: 10px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
                .close-btn:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="reject">❌</div>
                <h1>审核已拒绝</h1>
                <p>技能 """
            + skill.get("name", "")
            + """ 已被拒绝</p>
                <button class="close-btn" onclick="window.close()">关闭窗口</button>
            </div>
            <script>
                // 尝试通知 opener 窗口刷新
                if (window.opener) {
                    window.opener.location.reload();
                }
                // 3秒后自动关闭
                setTimeout(function() {
                    window.close();
                }, 3000);
            </script>
        </body>
        </html>
        """
        )
        return HTMLResponse(content=html_content)


# ============ 指标标准 API ============


@app.get("/api/reports/metrics-standards")
def get_metrics_standards():
    """获取所有指标的统计标准"""
    from app.config import METRIC_STANDARDS

    return {"success": True, "data": METRIC_STANDARDS}


# ============ 飞书机器人回调接口 ============


@app.post("/api/feishu/callback")
async def feishu_callback(request: Request):
    """飞书机器人事件回调（支持@消息）"""
    import json
    from app.config import FEISHU_VERIFY_TOKEN

    body = await request.json()
    print(f"[Feishu Callback] Received: {json.dumps(body, ensure_ascii=False)[:500]}")

    # URL验证（首次配置回调时）
    if body.get("type") == "url_verification":
        print("[Feishu Callback] URL verification")
        return {"challenge": body.get("challenge")}

    # 验证token
    if FEISHU_VERIFY_TOKEN and body.get("token") != FEISHU_VERIFY_TOKEN:
        print(f"[Feishu Callback] Invalid token: {body.get('token')}")
        raise HTTPException(status_code=401, detail="Invalid token")

    # 处理消息事件
    if body.get("type") == "event_callback":
        event = body.get("event", {})
        print(f"[Feishu Callback] Event type: {event.get('msg_type')}")

        # 只处理文本消息
        if event.get("msg_type") == "text":
            content = json.loads(event.get("content", "{}"))
            text = content.get("text", "").strip()
            print(f"[Feishu Callback] Text: {text}")

            # 处理 /skill 命令
            if "/skill" in text:
                print("[Feishu Callback] Handling /skill command")
                return await handle_skill_command(event)

    return {"success": True}


async def handle_skill_command(event: dict):
    """处理 /skill 命令，返回所有技能列表"""
    import requests
    from app.config import FEISHU_WEBHOOK_URL

    # 获取所有技能
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 构建 Markdown 内容
    md_content = "**📚 SkillHub 技能列表**\\n\\n"
    md_content += f"共 {len(skills)} 个技能\\n\\n"

    for i, skill in enumerate(skills[:30], 1):  # 最多显示30个
        name = skill.get("name", "未命名")
        desc = skill.get("description", "暂无简介")[:60]
        slug = skill.get("slug", "")
        author = skill.get("author_name", "未知")
        dept = skill.get("author_department", "")
        downloads = skill.get("download_count", 0)

        md_content += f"**{i}. {name}**\\n"
        md_content += f"📝 {desc}...\\n"
        md_content += f"👤 {author} | 🏢 {dept} | ⬇ {downloads}次下载\\n"
        md_content += f"[⬇️ 下载](http://211.154.18.252:10143/api/skills/{slug}/download) | [🔗 详情](http://211.154.18.252:10143/skills/{slug})\\n\\n"

    # 构建交互卡片
    card = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": "📚 SkillHub 技能列表"},
                "template": "blue",
            },
            "elements": [
                {"tag": "div", "text": {"tag": "lark_md", "content": md_content}}
            ],
        },
    }

    # 使用webhook发送回复
    try:
        requests.post(
            FEISHU_WEBHOOK_URL,
            json=card,
            timeout=10,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        print(f"发送技能列表失败: {e}")

    return {"success": True}


# ============ Skill擂台 API ============


from app.arena_config import (
    REWARD_TYPES,
    EVALUATION_STATUS,
    APPLICATION_STATUS,
    TOTAL_BUDGET,
)
from app.arena_db import arena_db


@app.get("/api/arena/config")
def get_arena_config():
    """获取Skill擂台配置"""
    return {
        "success": True,
        "data": {
            "reward_types": REWARD_TYPES,
            "total_budget": TOTAL_BUDGET,
            "status_config": EVALUATION_STATUS,
            "application_status": APPLICATION_STATUS,
        },
    }


@app.get("/api/arena/evaluations")
def get_arena_evaluations(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    """获取评选列表"""
    evaluations = arena_db.get_evaluations(status=status, type_=type)
    return {"success": True, "data": evaluations}


@app.get("/api/arena/evaluations/{evaluation_id}")
def get_arena_evaluation(evaluation_id: str):
    """获取评选详情"""
    evaluation = arena_db.get_evaluation(evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="评选不存在")

    # 获取该评选的申报
    applications = arena_db.get_applications(evaluation_id=evaluation_id)

    return {
        "success": True,
        "data": {
            **evaluation,
            "applications": applications,
            "application_count": len(applications),
        },
    }


@app.get("/api/arena/statistics")
def get_arena_statistics():
    """获取统计数据"""
    stats = arena_db.get_statistics()
    return {"success": True, "data": stats}


@app.get("/api/arena/leaderboard")
def get_arena_leaderboard(
    evaluation_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    """获取排行榜"""
    if evaluation_id:
        evaluation = arena_db.get_evaluation(evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="评选不存在")
        applications = arena_db.get_applications(
            evaluation_id=evaluation_id, status="approved"
        )
    else:
        # 获取所有已通过的申报
        applications = []
        for eval_ in arena_db.get_evaluations():
            apps = arena_db.get_applications(
                evaluation_id=eval_["id"], status="approved"
            )
            applications.extend(apps)

    # 按奖励金额排序
    applications.sort(key=lambda x: x.get("reward", 0), reverse=True)

    return {
        "success": True,
        "data": {
            "ranking": applications[:50],
            "total": len(applications),
        },
    }


@app.get("/api/arena/my-applications")
def get_my_applications(request: Request):
    """获取我的申报"""
    # 简化：使用IP作为用户标识
    user = get_client_ip(request)
    applications = arena_db.get_applications(user=user)
    return {"success": True, "data": applications}


@app.post("/api/arena/apply")
def apply_for_arena(
    request: Request,
    skill_id: str = Form(...),
    evaluation_id: str = Form(...),
    description: str = Form(""),
):
    """申报技能参评"""
    user = get_client_ip(request)

    # 检查评选是否存在
    evaluation = arena_db.get_evaluation(evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="评选不存在")

    # 检查评选状态
    if evaluation.get("status") != "open":
        raise HTTPException(status_code=400, detail="该评选未开放申报")

    # 检查技能是否存在
    skills_data = skills_db.read()
    skill = next(
        (s for s in skills_data.get("skills", []) if s["id"] == skill_id), None
    )
    if not skill:
        raise HTTPException(status_code=404, detail="技能不存在")

    # 检查是否已申报
    existing = arena_db.get_applications(evaluation_id=evaluation_id)
    if any(a.get("skill_id") == skill_id for a in existing):
        raise HTTPException(status_code=409, detail="该技能已申报")

    # 创建申报
    application = arena_db.create_application(
        {
            "skill_id": skill_id,
            "skill_name": skill.get("name", ""),
            "evaluation_id": evaluation_id,
            "evaluation_type": evaluation.get("type", ""),
            "author": user,
            "author_name": skill.get("author_name", ""),
            "department": skill.get("author_department", ""),
            "description": description,
            "status": "submitted",
            "reward": None,
            "submitted_at": get_beijing_datetime(),
        }
    )

    return {"success": True, "data": application}


# 管理员接口


@app.post("/api/admin/arena/evaluations")
def create_arena_evaluation(
    request: Request,
    type: str = Form(...),
    period: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
):
    """创建评选（管理员）"""
    verify_admin_token(request)

    reward_type = REWARD_TYPES.get(type)
    if not reward_type:
        raise HTTPException(status_code=400, detail="无效的奖励类型")

    evaluation = arena_db.create_evaluation(
        {
            "type": type,
            "name": reward_type["name"],
            "period": period,
            "start_date": start_date,
            "end_date": end_date,
            "budget": reward_type["budget"],
            "status": "open",
            "total_rewarded": 0,
            "total_applications": 0,
            "total_approved": 0,
        }
    )

    return {"success": True, "data": evaluation}


@app.post("/api/admin/arena/applications/{application_id}/approve")
def approve_arena_application(
    request: Request,
    application_id: str,
    reward: int = Form(...),
    remarks: str = Form(""),
):
    """审批申报（管理员）"""
    verify_admin_token(request)

    application = arena_db.get_application(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="申报不存在")

    # 更新申报
    arena_db.update_application(
        application_id,
        {
            "status": "approved",
            "reward": reward,
            "remarks": remarks,
            "approved_at": get_beijing_datetime(),
        },
    )

    # 更新评选统计
    evaluation = arena_db.get_evaluation(application["evaluation_id"])
    if evaluation:
        arena_db.update_evaluation(
            application["evaluation_id"],
            {
                "total_rewarded": evaluation.get("total_rewarded", 0) + reward,
                "total_approved": evaluation.get("total_approved", 0) + 1,
            },
        )

    return {"success": True, "message": "审批通过"}


@app.post("/api/admin/arena/applications/{application_id}/reject")
def reject_arena_application(
    request: Request,
    application_id: str,
    reason: str = Form(...),
):
    """拒绝申报（管理员）"""
    verify_admin_token(request)

    application = arena_db.get_application(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="申报不存在")

    arena_db.update_application(
        application_id,
        {
            "status": "rejected",
            "remarks": reason,
            "rejected_at": get_beijing_datetime(),
        },
    )

    return {"success": True, "message": "已拒绝"}


# ============ 埋点和评分 API ============

from app.metrics_db import metrics_db


@app.post("/api/track")
async def track_event(request: Request):
    """接收前端埋点数据"""
    try:
        data = await request.json()
        event_type = data.get("event")
        skill_id = data.get("skill_id")
        user_id = data.get("user_id")
        event_data = data.get("data", {})

        # 获取IP
        ip = request.client.host
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()

        event = metrics_db.track_event(
            event_type=event_type,
            skill_id=skill_id,
            user_id=user_id,
            data=event_data,
            ip=ip,
        )

        return {"success": True, "data": event}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _get_skill_by_slug(slug: str) -> dict:
    """根据slug获取Skill"""
    data = skills_db.read()
    skills = data.get("skills", [])
    for skill in skills:
        if skill.get("slug") == slug:
            return skill
    return None


@app.get("/api/skills/{slug}/score-detail")
def get_skill_score_detail(
    slug: str,
    award: str = Query(
        "innovation", description="奖项类型: quality, popularity, innovation"
    ),
):
    """获取Skill评分明细"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    stats = metrics_db.get_skill_stats(slug)

    if award == "quality":
        score = metrics_db.calculate_quality_score(slug, skill)
    elif award == "popularity":
        score = metrics_db.calculate_popularity_score(slug, skill)
    else:
        score = metrics_db.calculate_innovation_score(slug, skill)

    # 详细计算过程
    readme_length = len(skill.get("readme_content", ""))
    tag_count = len(skill.get("tags", []))
    version_count = len(skill.get("versions", []))

    # 创新度标签匹配
    complex_tags = ["Agent开发", "MCP开发", "自动化开发"]
    tags = skill.get("tags", [])
    matched_complex_tags = [
        tag for tag in tags if any(ct in tag for ct in complex_tags)
    ]

    # 维护活跃度计算
    from datetime import datetime

    update_days = (
        get_beijing_time()
        - datetime.fromisoformat(skill.get("updated_at", get_beijing_datetime()))
    ).days

    detail = {
        "skill_name": skill.get("name"),
        "author": skill.get("author_name"),
        "department": skill.get("author_department"),
        "total_score": score["total_score"],
        "score_level": _get_score_level(score["total_score"]),
        "dimensions": {
            "usage": {
                "name": "使用价值",
                "weight": "35%",
                "score": score["usage_score"],
                "max_score": 35,
                "details": {
                    "total_downloads": stats.get("total_downloads", 0),
                    "download_score": f"{stats.get('total_downloads', 0)} × 2 = {min(stats.get('total_downloads', 0) * 2, 35)}分",
                    "formula": "min(下载量 × 2, 35)",
                },
            },
            "quality": {
                "name": "质量水平",
                "weight": "25%",
                "score": score["quality_score"],
                "max_score": 25,
                "details": {
                    "readme": {
                        "length": readme_length,
                        "score": f"min({readme_length}/100, 10) = {min(readme_length / 100, 10)}分",
                    },
                    "tags": {
                        "count": tag_count,
                        "score": f"min({tag_count} × 2, 10) = {min(tag_count * 2, 10)}分",
                        "tags_list": tags,
                    },
                    "versions": {
                        "count": version_count,
                        "score": f"min({version_count} × 5, 5) = {min(version_count * 5, 5)}分",
                    },
                    "formula": "README得分 + 标签得分 + 版本得分",
                },
            },
            "innovation": {
                "name": "创新程度",
                "weight": "20%",
                "score": score["innovation_score"],
                "max_score": 20,
                "details": {
                    "complex_tags": complex_tags,
                    "matched_tags": matched_complex_tags,
                    "score": f"{len(matched_complex_tags)} × 5 = {min(len(matched_complex_tags) * 5, 20)}分",
                    "formula": "min(复杂标签数 × 5, 20)",
                },
            },
            "promotion": {
                "name": "推广效果",
                "weight": "15%",
                "score": score["promotion_score"],
                "max_score": 15,
                "details": {
                    "search_appearances": stats.get("search_appearances", 0),
                    "favorites": stats.get("total_favorites", 0),
                    "shares": stats.get("total_shares", 0),
                    "score": f"{stats.get('search_appearances', 0)}×0.5 + {stats.get('total_favorites', 0)}×2 + {stats.get('total_shares', 0)}×3 = {score['promotion_score']}分",
                    "formula": "min(搜索×0.5 + 收藏×2 + 分享×3, 15)",
                },
            },
            "maintenance": {
                "name": "维护活跃度",
                "weight": "5%",
                "score": score["maintenance_score"],
                "max_score": 5,
                "details": {
                    "update_days": update_days,
                    "score": f"max(0, 5 - {update_days}/30) = {score['maintenance_score']}分",
                    "formula": "max(0, 5 - 更新天数/30)",
                },
            },
        },
        "raw_stats": stats,
    }

    return {"success": True, "data": detail}


def _get_score_level(total_score: float) -> dict:
    """获取评分等级"""
    if total_score >= 90:
        return {
            "level": "S",
            "name": "卓越",
            "description": "功能强大，广受欢迎，持续维护",
        }
    elif total_score >= 75:
        return {"level": "A", "name": "优秀", "description": "质量较高，有一定使用量"}
    elif total_score >= 60:
        return {"level": "B", "name": "良好", "description": "基本合格，需要更多推广"}
    elif total_score >= 40:
        return {"level": "C", "name": "一般", "description": "功能简单，使用较少"}
    else:
        return {"level": "D", "name": "待改进", "description": "需要完善文档和功能"}


@app.get("/api/skills/{slug}/stats")
def get_skill_stats(slug: str):
    """获取Skill的详细统计数据"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    stats = metrics_db.get_skill_stats(slug)

    return {
        "success": True,
        "data": {
            **stats,
            "skill_name": skill.get("name"),
            "author": skill.get("author_name"),
        },
    }


@app.post("/api/skills/{slug}/rate")
async def rate_skill(slug: str, request: Request):
    """给Skill评分"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    data = await request.json()
    rating = data.get("rating")
    comment = data.get("comment")
    user_id = data.get("user_id", "anonymous")

    if not rating or not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="评分必须在1-5之间")

    result = metrics_db.add_rating(slug, user_id, rating, comment)

    return {"success": True, "data": result}


@app.get("/api/arena/candidates")
def get_arena_candidates():
    """获取Skill擂台候选人（实时计算）"""
    # 获取所有已审核的Skill
    data = skills_db.read()
    skills = data.get("skills", [])
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    candidates = metrics_db.get_arena_candidates(approved_skills)

    return {
        "success": True,
        "data": candidates,
    }


@app.get("/api/arena/rankings")
def get_arena_rankings(
    type: str = Query("all", description="排名类型: all, basic, popular, innovation"),
    limit: int = Query(10, description="返回数量"),
):
    """获取排行榜"""
    data = skills_db.read()
    skills = data.get("skills", [])
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    if type == "popular":
        rankings = metrics_db.get_top_skills("total_downloads", limit)
    elif type == "basic":
        # 按作者统计
        author_stats = {}
        for skill in approved_skills:
            key = f"{skill.get('author_name', '')}-{skill.get('author_department', '')}"
            if key not in author_stats:
                author_stats[key] = {
                    "author": skill.get("author_name"),
                    "department": skill.get("author_department"),
                    "organization": skill.get("author_organization"),
                    "count": 0,
                    "skills": [],
                }
            author_stats[key]["count"] += 1
            author_stats[key]["skills"].append(skill.get("name"))

        rankings = sorted(
            author_stats.values(),
            key=lambda x: x["count"],
            reverse=True,
        )[:limit]
    elif type == "innovation":
        scored_skills = []
        for skill in approved_skills:
            score = metrics_db.calculate_innovation_score(skill.get("slug"), skill)
            scored_skills.append(
                {
                    "skill_name": skill.get("name"),
                    "author": skill.get("author_name"),
                    "department": skill.get("author_department"),
                    "organization": skill.get("author_organization"),
                    **score,
                }
            )

        rankings = sorted(
            scored_skills,
            key=lambda x: x["total_score"],
            reverse=True,
        )[:limit]
    else:
        rankings = metrics_db.get_top_skills("total_downloads", limit)

    return {
        "success": True,
        "data": rankings,
    }


@app.get("/api/rankings/regions")
def get_region_rankings(
    metric: str = Query(
        "publishes", description="统计指标: publishes 发布量 | downloads 下载量"
    ),
    limit: int = Query(10, description="返回数量"),
):
    """
    获取各大区排行榜（排除数智中心）

    统计范围：华北一区、华北二区、华北三区、华东一区、华东二区、华南区、杭钢、香山、其他区域
    排除：数智中心及所有职能中心
    """
    from app.org_mapping import IDC_REGIONS, get_idc_info

    data = skills_db.read()
    skills = data.get("skills", [])
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    # 获取过滤后的统计数据
    skill_downloads, _ = _get_filtered_stats()

    # 初始化各大区统计
    region_stats = {}
    for region_id, region_info in IDC_REGIONS.items():
        region_stats[region_id] = {
            "region_id": region_id,
            "region_name": region_info["name"],
            "publishes": 0,
            "downloads": 0,
            "skills": [],
        }

    # 统计各区域的发布量和下载量
    for skill in approved_skills:
        dept = skill.get("author_department", "")
        idc_info = get_idc_info(dept)
        region_id = idc_info.get("region_id", "")

        # 只统计大区（排除职能中心hq）
        if region_id and region_id != "hq" and region_id in region_stats:
            region_stats[region_id]["publishes"] += 1
            region_stats[region_id]["downloads"] += int(
                skill_downloads.get(skill.get("slug", ""), 0)
            )
            region_stats[region_id]["skills"].append(skill.get("name"))

    # 根据指标排序
    rankings = sorted(
        region_stats.values(),
        key=lambda x: x.get(metric, 0),
        reverse=True,
    )[:limit]

    return {
        "success": True,
        "data": {
            "metric": metric,
            "metric_label": "发布量" if metric == "publishes" else "下载量",
            "rankings": rankings,
        },
    }


@app.get("/api/rankings/centers")
def get_center_rankings(
    metric: str = Query(
        "publishes", description="统计指标: publishes 发布量 | downloads 下载量"
    ),
    limit: int = Query(10, description="返回数量"),
):
    """
    获取职能中心排行榜（排除数智中心）

    统计范围：组织中心、体系中心、技术中心、自驾中心、IT中心
    排除：数智中心
    """
    from app.org_mapping import IDC_CENTERS, get_idc_info

    data = skills_db.read()
    skills = data.get("skills", [])
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    # 获取过滤后的统计数据
    skill_downloads, _ = _get_filtered_stats()

    # 初始化各职能中心统计（排除数智中心）
    center_stats = {}
    for center_id, center_info in IDC_CENTERS.items():
        if center_id != "hq-数智":  # 排除数智中心
            center_stats[center_id] = {
                "center_id": center_id,
                "center_name": center_info["name"],
                "publishes": 0,
                "downloads": 0,
                "skills": [],
            }

    # 统计各职能中心的发布量和下载量
    for skill in approved_skills:
        dept = skill.get("author_department", "")
        idc_info = get_idc_info(dept)
        center_id = idc_info.get("center_id", "")

        # 只统计职能中心（排除数智中心）
        if center_id and center_id != "hq-数智" and center_id in center_stats:
            center_stats[center_id]["publishes"] += 1
            center_stats[center_id]["downloads"] += int(
                skill_downloads.get(skill.get("slug", ""), 0)
            )
            center_stats[center_id]["skills"].append(skill.get("name"))

    # 根据指标排序
    rankings = sorted(
        center_stats.values(),
        key=lambda x: x.get(metric, 0),
        reverse=True,
    )[:limit]

    return {
        "success": True,
        "data": {
            "metric": metric,
            "metric_label": "发布量" if metric == "publishes" else "下载量",
            "rankings": rankings,
        },
    }


@app.get("/api/rankings/combined")
def get_combined_rankings(
    metric: str = Query(
        "publishes", description="统计指标: publishes 发布量 | downloads 下载量"
    ),
    limit: int = Query(20, description="返回数量"),
):
    """
    获取融合排行榜（各大区 + 职能中心，排除数智中心）

    将各大区和职能中心合并到一个排行榜中，统一排序展示
    """
    from app.org_mapping import IDC_REGIONS, IDC_CENTERS, get_idc_info

    data = skills_db.read()
    skills = data.get("skills", [])
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    # 获取过滤后的统计数据
    skill_downloads, _ = _get_filtered_stats()

    # 初始化统计
    combined_stats = {}

    # 初始化各大区
    for region_id, region_info in IDC_REGIONS.items():
        combined_stats[region_id] = {
            "id": region_id,
            "name": region_info["name"],
            "type": "region",
            "type_label": "大区",
            "publishes": 0,
            "downloads": 0,
            "skills": [],
        }

    # 初始化职能中心（排除数智中心）
    for center_id, center_info in IDC_CENTERS.items():
        if center_id != "hq-数智":
            combined_stats[center_id] = {
                "id": center_id,
                "name": center_info["name"],
                "type": "center",
                "type_label": "中心",
                "publishes": 0,
                "downloads": 0,
                "skills": [],
            }

    # 统计所有技能的发布量和下载量
    for skill in approved_skills:
        dept = skill.get("author_department", "")
        idc_info = get_idc_info(dept)
        region_id = idc_info.get("region_id", "")
        center_id = idc_info.get("center_id", "")

        # 统计到大区
        if region_id and region_id != "hq" and region_id in combined_stats:
            combined_stats[region_id]["publishes"] += 1
            combined_stats[region_id]["downloads"] += int(
                skill_downloads.get(skill.get("slug", ""), 0)
            )
            combined_stats[region_id]["skills"].append(skill.get("name"))

        # 统计到职能中心（排除数智中心）
        if center_id and center_id != "hq-数智" and center_id in combined_stats:
            combined_stats[center_id]["publishes"] += 1
            combined_stats[center_id]["downloads"] += int(
                skill_downloads.get(skill.get("slug", ""), 0)
            )
            combined_stats[center_id]["skills"].append(skill.get("name"))

    # 计算综合得分：发布*0.4 + 下载*0.6
    for item in combined_stats.values():
        item["score"] = round(item["publishes"] * 0.4 + item["downloads"] * 0.6, 2)

    # 根据综合得分排序
    rankings = sorted(
        combined_stats.values(),
        key=lambda x: x["score"],
        reverse=True,
    )[:limit]

    return {
        "success": True,
        "data": {
            "metric": "composite",
            "metric_label": "综合得分(发布×0.4+下载×0.6)",
            "rankings": rankings,
        },
    }


# ========== 专家评审 API ==========


@app.post("/api/skills/{slug}/expert-review")
async def add_expert_review(slug: str, request: Request):
    """添加专家评审"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    data = await request.json()
    expert_id = data.get("expert_id", "anonymous")
    expert_name = data.get("expert_name", "匿名专家")
    dimensions = data.get("dimensions", {})
    overall_comment = data.get("overall_comment")
    is_recommended = data.get("is_recommended")

    if not dimensions:
        raise HTTPException(status_code=400, detail="评分维度不能为空")

    review = expert_db.add_expert_review(
        skill_id=slug,
        expert_id=expert_id,
        expert_name=expert_name,
        dimensions=dimensions,
        overall_comment=overall_comment,
        is_recommended=is_recommended,
    )

    return {"success": True, "data": review}


@app.get("/api/skills/{slug}/expert-reviews")
def get_skill_expert_reviews(slug: str):
    """获取Skill的专家评审列表"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    reviews = expert_db.get_skill_reviews(slug)

    return {"success": True, "data": reviews}


@app.get("/api/admin/expert-reviews")
def get_all_expert_reviews(limit: int = Query(100, description="返回数量")):
    """获取所有专家评审（管理员）"""
    reviews = expert_db.get_all_reviews(limit)

    return {"success": True, "data": reviews}


@app.get("/api/admin/expert-stats")
def get_expert_statistics():
    """获取专家统计信息"""
    stats = expert_db.get_expert_stats()

    return {"success": True, "data": stats}


# ========== 用户活动日志 API ==========


@app.post("/api/log/activity")
async def log_activity(request: Request):
    """记录用户活动"""
    data = await request.json()
    activity_type = data.get("activity_type")
    user_id = data.get("user_id", "anonymous")
    skill_id = data.get("skill_id")
    details = data.get("details", {})
    ip = request.client.host if request.client else None

    if not activity_type:
        raise HTTPException(status_code=400, detail="活动类型不能为空")

    log = expert_db.log_user_activity(
        activity_type=activity_type,
        user_id=user_id,
        skill_id=skill_id,
        details=details,
        ip=ip or "unknown",
    )

    return {"success": True, "data": log}


@app.get("/api/admin/activity-logs")
def get_activity_logs(
    user_id: str = Query(None, description="用户ID"),
    skill_id: str = Query(None, description="Skill ID"),
    activity_type: str = Query(None, description="活动类型"),
    days: int = Query(30, description="查询天数"),
    limit: int = Query(100, description="返回数量"),
):
    """获取用户活动日志（管理员）"""
    logs = expert_db.get_user_activity_logs(
        user_id=user_id,
        skill_id=skill_id,
        activity_type=activity_type,
        days=days,
        limit=limit,
    )

    return {"success": True, "data": logs}


@app.get("/api/admin/activity-summary")
def get_activity_summary(days: int = Query(7, description="统计天数")):
    """获取活动汇总统计"""
    summary = expert_db.get_activity_summary(days)

    return {"success": True, "data": summary}


# ========== 代码检测 API ==========


@app.post("/api/skills/{slug}/code-audit")
async def audit_skill_code(slug: str):
    """对Skill进行代码质量检测"""
    skill = _get_skill_by_slug(slug)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill不存在")

    # 获取Skill的存储路径
    versions_data = versions_db.read()
    versions = versions_data.get("versions", [])
    skill_versions = [v for v in versions if v.get("skill_id") == skill.get("id")]

    if not skill_versions:
        raise HTTPException(status_code=404, detail="Skill版本不存在")

    latest_version = max(skill_versions, key=lambda x: x.get("created_at", ""))
    storage_path = latest_version.get("storage_path")

    if not storage_path:
        raise HTTPException(status_code=404, detail="Skill文件不存在")

    skill_path = STORAGE_DIR / storage_path

    if not skill_path.exists():
        raise HTTPException(status_code=404, detail="Skill文件不存在")

    # 执行代码检测
    audit_results = analyze_skill_package(skill_path)

    # 记录审计日志
    expert_db.log_code_audit(
        skill_id=slug,
        audit_type="automated",
        results=audit_results,
        score=audit_results.get("overall_score") or 0.0,
    )

    return {"success": True, "data": audit_results}


@app.get("/api/skills/{slug}/code-audit-logs")
def get_skill_audit_logs(slug: str, limit: int = Query(10, description="返回数量")):
    """获取Skill的代码审计日志"""
    logs = expert_db.get_code_audit_logs(skill_id=slug, limit=limit)

    return {"success": True, "data": logs}


@app.get("/api/admin/code-audit-logs")
def get_all_audit_logs(limit: int = Query(100, description="返回数量")):
    """获取所有代码审计日志（管理员）"""
    logs = expert_db.get_code_audit_logs(limit=limit)

    return {"success": True, "data": logs}


@app.post("/api/admin/run-batch-audit")
def run_batch_audit(request: Request):
    """对所有已发布技能执行批量代码审计"""
    verify_admin_token(request)

    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 只处理已发布的技能
    approved_skills = [s for s in skills if s.get("status") == "approved"]

    results = {"total": len(approved_skills), "success": 0, "failed": 0, "details": []}

    for skill in approved_skills:
        slug = skill.get("slug")
        name = skill.get("name")

        try:
            # 获取Skill的存储路径
            versions_data = versions_db.read()
            versions = versions_data.get("versions", [])
            skill_versions = [
                v for v in versions if v.get("skill_id") == skill.get("id")
            ]

            if not skill_versions:
                results["failed"] += 1
                results["details"].append(
                    {
                        "slug": slug,
                        "name": name,
                        "status": "failed",
                        "reason": "无版本记录",
                    }
                )
                continue

            latest_version = max(skill_versions, key=lambda x: x.get("created_at", ""))
            storage_path = latest_version.get("storage_path")

            if not storage_path:
                results["failed"] += 1
                results["details"].append(
                    {
                        "slug": slug,
                        "name": name,
                        "status": "failed",
                        "reason": "无存储路径",
                    }
                )
                continue

            skill_path = STORAGE_DIR / storage_path

            if not skill_path.exists():
                results["failed"] += 1
                results["details"].append(
                    {
                        "slug": slug,
                        "name": name,
                        "status": "failed",
                        "reason": "文件不存在",
                    }
                )
                continue

            # 执行代码检测
            audit_results = analyze_skill_package(skill_path)

            # 记录审计日志
            expert_db.log_code_audit(
                skill_id=slug,
                audit_type="automated_batch",
                results=audit_results,
                score=audit_results.get("overall_score") or 0.0,
            )

            results["success"] += 1
            results["details"].append(
                {
                    "slug": slug,
                    "name": name,
                    "status": "success",
                    "score": audit_results.get("overall_score"),
                    "grade": audit_results.get("overall_grade"),
                    "issues": audit_results.get("summary", {}).get("total_issues", 0),
                }
            )

        except Exception as e:
            results["failed"] += 1
            results["details"].append(
                {"slug": slug, "name": name, "status": "failed", "reason": str(e)}
            )

    return {
        "success": True,
        "data": results,
        "message": f"批量审计完成: {results['success']}/{results['total']} 成功, {results['failed']} 失败",
    }


# ========== 小智优选 API ==========


@app.get("/api/arena/weekly-picks")
def get_weekly_picks():
    """获取本周精选Skill"""
    current = weekly_picks_db.get_current_week_picks()

    if not current:
        return {
            "success": True,
            "data": None,
            "message": "本周暂无精选",
        }

    # 获取Skill详细信息
    data = skills_db.read()
    skills = data.get("skills", [])

    enriched_picks = []
    for pick in current.get("picks", []):
        skill = next(
            (s for s in skills if s.get("slug") == pick.get("skill_slug")), None
        )
        if skill:
            # 获取统计数据
            stats = metrics_db.get_skill_stats(pick.get("skill_slug"))
            # 获取版本信息以读取目录结构
            versions_data = versions_db.read()
            versions = versions_data.get("versions", [])
            skill_versions = [
                v for v in versions if v.get("skill_id") == skill.get("id")
            ]

            directory_structure = []
            if skill_versions:
                latest_version = max(
                    skill_versions, key=lambda x: x.get("created_at", "")
                )
                storage_path = latest_version.get("storage_path")
                if storage_path:
                    skill_path = STORAGE_DIR / storage_path
                    if skill_path.exists():
                        try:
                            import zipfile

                            with zipfile.ZipFile(skill_path, "r") as zf:
                                directory_structure = [
                                    name
                                    for name in zf.namelist()
                                    if not name.endswith("/")
                                ]
                        except Exception:
                            pass

            enriched_picks.append(
                {
                    "skill_slug": pick.get("skill_slug"),
                    "skill_name": skill.get("name"),
                    "author": skill.get("author_name"),
                    "department": skill.get("author_department"),
                    "reason": pick.get("reason"),
                    "description": skill.get("description", ""),
                    "readme": skill.get("readme", ""),
                    "downloads": stats.get("total_downloads", 0),
                    "rating": stats.get("avg_rating", 0),
                    "rating_count": stats.get("total_ratings", 0),
                    "directory_structure": directory_structure[:20],  # 限制返回数量
                }
            )

    return {
        "success": True,
        "data": {
            **current,
            "picks": enriched_picks,
        },
    }


@app.post("/api/admin/weekly-picks")
async def set_weekly_picks(request: Request):
    """设置本周精选（管理员）"""
    data = await request.json()
    picks = data.get("picks", [])
    admin_id = data.get("admin_id", "admin")
    admin_name = data.get("admin_name", "管理员")

    if len(picks) != 3:
        raise HTTPException(status_code=400, detail="必须选择3个Skill")

    # 验证所有Skill存在
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    for pick in picks:
        skill = next(
            (s for s in skills if s.get("slug") == pick.get("skill_slug")), None
        )
        if not skill:
            raise HTTPException(
                status_code=404, detail=f"Skill {pick.get('skill_slug')} 不存在"
            )

    result = weekly_picks_db.set_weekly_picks(
        picks=picks,
        admin_id=admin_id,
        admin_name=admin_name,
    )

    return {
        "success": True,
        "data": result,
    }


@app.get("/api/admin/weekly-picks/history")
def get_weekly_picks_history(limit: int = Query(10, description="返回数量")):
    """获取历史精选记录"""
    history = weekly_picks_db.get_history(limit)

    # 获取Skill详细信息
    data = skills_db.read()
    skills = data.get("skills", [])

    enriched_history = []
    for week in history:
        enriched_picks = []
        for pick in week.get("picks", []):
            skill = next(
                (s for s in skills if s.get("slug") == pick.get("skill_slug")), None
            )
            if skill:
                enriched_picks.append(
                    {
                        "skill_slug": pick.get("skill_slug"),
                        "skill_name": skill.get("name"),
                        "author": skill.get("author_name"),
                        "department": skill.get("author_department"),
                        "reason": pick.get("reason"),
                    }
                )

        enriched_history.append(
            {
                **week,
                "picks": enriched_picks,
            }
        )

    return {
        "success": True,
        "data": enriched_history,
    }


@app.put("/api/admin/weekly-picks/{week_id}")
async def update_weekly_picks(week_id: str, request: Request):
    """更新指定周的精选（支持历史记录编辑）"""
    data = await request.json()
    picks = data.get("picks", [])
    admin_id = data.get("admin_id", "admin")
    admin_name = data.get("admin_name", "管理员")

    if len(picks) != 3:
        raise HTTPException(status_code=400, detail="必须选择3个Skill")

    # 验证所有Skill存在
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    for pick in picks:
        skill = next(
            (s for s in skills if s.get("slug") == pick.get("skill_slug")), None
        )
        if not skill:
            raise HTTPException(
                status_code=404, detail=f"Skill {pick.get('skill_slug')} 不存在"
            )

    try:
        result = weekly_picks_db.update_weekly_picks(
            week_id=week_id,
            picks=picks,
            admin_id=admin_id,
            admin_name=admin_name,
        )

        return {
            "success": True,
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/admin/weekly-picks/{week_id}")
def get_weekly_pick_by_id(week_id: str):
    """获取指定周的精选详情（用于编辑）"""
    week = weekly_picks_db.get_week_by_id(week_id)

    if not week:
        raise HTTPException(status_code=404, detail="周记录不存在")

    # 获取Skill详细信息
    data = skills_db.read()
    skills = data.get("skills", [])

    enriched_picks = []
    for pick in week.get("picks", []):
        skill = next(
            (s for s in skills if s.get("slug") == pick.get("skill_slug")), None
        )
        if skill:
            enriched_picks.append(
                {
                    "skill_slug": pick.get("skill_slug"),
                    "skill_name": skill.get("name"),
                    "reason": pick.get("reason"),
                }
            )

    return {
        "success": True,
        "data": {
            **week,
            "picks": enriched_picks,
        },
    }


# ==================== 速成地图 API ====================


@app.get("/api/quickstart/config")
def get_quickstart_config():
    """获取速成地图配置（使用地图 + 标准文档）"""
    config = quickstart_config_db.get_config()
    return {"success": True, "data": config}


@app.get("/api/quickstart/usage-map")
def get_usage_map():
    """获取速成 Skills 使用地图"""
    config = quickstart_config_db.get_config()
    return {"success": True, "data": config.get("usage_map", {})}


@app.get("/api/quickstart/standards")
def get_standards():
    """获取上传 Skills 标准文档"""
    config = quickstart_config_db.get_config()
    return {"success": True, "data": config.get("standards", {})}


# ---- 场景地图 API ----


@app.get("/api/scenarios")
def get_scenarios():
    """获取所有场景地图"""
    scenarios = scenario_maps_db.get_all()
    return {"success": True, "data": scenarios}


@app.get("/api/scenarios/{scenario_id}")
def get_scenario_detail(scenario_id: str):
    """获取场景地图详情"""
    scenario = scenario_maps_db.get_by_id(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景地图不存在")
    return {"success": True, "data": scenario}


@app.post("/api/scenarios")
async def create_scenario(request: Request):
    """创建场景地图"""
    data = await request.json()
    scenario = scenario_maps_db.create(data)
    return {"success": True, "data": scenario}


@app.put("/api/scenarios/{scenario_id}")
async def update_scenario(scenario_id: str, request: Request):
    """更新场景地图"""
    data = await request.json()
    scenario = scenario_maps_db.update(scenario_id, data)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景地图不存在")
    return {"success": True, "data": scenario}


@app.delete("/api/scenarios/{scenario_id}")
def delete_scenario(scenario_id: str):
    """删除场景地图"""
    if scenario_maps_db.delete(scenario_id):
        return {"success": True, "message": "删除成功"}
    raise HTTPException(status_code=404, detail="场景地图不存在")


@app.post("/api/scenarios/{scenario_id}/skills")
async def update_scenario_skills(scenario_id: str, request: Request):
    """更新场景地图关联的技能（支持多选）"""
    data = await request.json()
    skills = data.get("skills", [])

    scenario = scenario_maps_db.update_skills(scenario_id, skills)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景地图不存在")
    return {"success": True, "data": scenario}


@app.put("/api/scenarios/{scenario_id}/skills/reorder")
async def reorder_scenario_skills(scenario_id: str, request: Request):
    """重新排序场景地图中的技能"""
    data = await request.json()
    skill_orders = data.get("skill_orders", [])

    scenario = scenario_maps_db.reorder_skills(scenario_id, skill_orders)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景地图不存在")
    return {"success": True, "data": scenario}


# ---- 精选集 API ----


@app.get("/api/collections")
def get_collections():
    """获取所有精选集"""
    collections = collections_db.get_all()
    return {"success": True, "data": collections}


@app.get("/api/collections/{collection_id}")
def get_collection_detail(collection_id: str):
    """获取精选集详情"""
    collection = collections_db.get_by_id(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="精选集不存在")
    return {"success": True, "data": collection}


@app.post("/api/collections")
async def create_collection(request: Request):
    """创建精选集"""
    data = await request.json()
    collection = collections_db.create(data)
    return {"success": True, "data": collection}


@app.put("/api/collections/{collection_id}")
async def update_collection(collection_id: str, request: Request):
    """更新精选集"""
    data = await request.json()
    collection = collections_db.update(collection_id, data)
    if not collection:
        raise HTTPException(status_code=404, detail="精选集不存在")
    return {"success": True, "data": collection}


@app.delete("/api/collections/{collection_id}")
def delete_collection(collection_id: str):
    """删除精选集"""
    if collections_db.delete(collection_id):
        return {"success": True, "message": "删除成功"}
    raise HTTPException(status_code=404, detail="精选集不存在")


@app.post("/api/collections/{collection_id}/skills")
async def update_collection_skills(collection_id: str, request: Request):
    """更新精选集关联的技能（支持多选）"""
    data = await request.json()
    skills = data.get("skills", [])

    collection = collections_db.update_skills(collection_id, skills)
    if not collection:
        raise HTTPException(status_code=404, detail="精选集不存在")
    return {"success": True, "data": collection}


@app.post("/api/collections/{collection_id}/play")
def increment_collection_play(collection_id: str):
    """增加精选集使用次数"""
    collection = collections_db.increment_play_count(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="精选集不存在")
    return {"success": True, "data": collection}


# ---- 技能关联查询 API ----


@app.get("/api/skills/with-associations")
def get_skills_with_associations():
    """获取所有技能及其关联信息"""
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    scenarios = scenario_maps_db.get_all()
    collections = collections_db.get_all()

    # 为每个技能添加关联信息
    result = []
    for skill in skills:
        skill_id = skill.get("id")
        skill_slug = skill.get("slug")

        # 查找关联的场景地图
        related_scenarios = []
        for scenario in scenarios:
            for s in scenario.get("skills", []):
                if s.get("skill_id") == skill_id or s.get("skill_slug") == skill_slug:
                    related_scenarios.append(
                        {
                            "scenario_id": scenario["id"],
                            "scenario_name": scenario["name"],
                            "config": s.get("config", {}),
                        }
                    )

        # 查找关联的精选集
        related_collections = []
        for collection in collections:
            for s in collection.get("skills", []):
                if s.get("skill_id") == skill_id or s.get("skill_slug") == skill_slug:
                    related_collections.append(
                        {
                            "collection_id": collection["id"],
                            "collection_name": collection["name"],
                            "config": s.get("config", {}),
                        }
                    )

        result.append(
            {
                **skill,
                "related_scenarios": related_scenarios,
                "related_collections": related_collections,
            }
        )

    return {"success": True, "data": result}


# ========== 运营数据分析 API ==========


@app.get("/api/analytics/overview")
def get_analytics_overview_api(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
):
    """获取运营概览数据（已过滤黑名单IP）"""
    from app.analytics import get_analytics_overview

    return {"success": True, "data": get_analytics_overview(start_date, end_date)}


@app.get("/api/analytics/trend")
def get_analytics_trend_api(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
):
    """获取趋势数据"""
    from app.analytics import get_analytics_trend

    return {"success": True, "data": get_analytics_trend(start_date, end_date)}


@app.get("/api/analytics/skills")
def get_analytics_skills_api(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
    sort_by: str = Query("downloads", description="排序字段: downloads|views"),
    limit: int = Query(10, description="返回数量"),
):
    """获取技能排行"""
    from app.analytics import get_skill_rankings

    return {
        "success": True,
        "data": get_skill_rankings(start_date, end_date, sort_by, limit),
    }


@app.get("/api/analytics/search")
def get_analytics_search_api(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
):
    """获取搜索分析"""
    from app.analytics import get_search_analysis

    return {"success": True, "data": get_search_analysis(start_date, end_date)}


@app.get("/api/analytics/heatmap")
def get_analytics_heatmap_api(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
    metric: str = Query(
        "downloads", description="指标: downloads|views|searches|publishes"
    ),
):
    """获取热力图数据"""
    from app.analytics import get_heatmap_data

    return {"success": True, "data": get_heatmap_data(start_date, end_date, metric)}


@app.get("/api/analytics/day-detail")
def get_analytics_day_detail_api(
    date: str = Query(..., description="日期 YYYY-MM-DD"),
    metric: str = Query("downloads", description="指标: downloads|views|searches"),
):
    """获取某一天详细数据"""
    from app.analytics import get_day_detail

    return {"success": True, "data": get_day_detail(date, metric)}


# ========== 评奖数据 API（排除数智中心）==========


@app.get("/api/rankings/departments")
def get_department_rankings_api(
    metric: str = Query(
        "composite", description="排序指标: publishes|downloads|composite"
    ),
    limit: int = Query(10, description="返回数量"),
):
    """获取部门排行榜（排除数智中心）"""
    from app.analytics import get_department_rankings

    return {"success": True, "data": get_department_rankings(metric, limit)}


@app.get("/api/rankings/developers")
def get_developer_rankings_api(
    metric: str = Query(
        "composite", description="排序指标: publishes|downloads|composite"
    ),
    limit: int = Query(10, description="返回数量"),
):
    """获取个人排行榜（排除数智中心人员）"""
    from app.analytics import get_developer_rankings

    return {"success": True, "data": get_developer_rankings(metric, limit)}


@app.get("/api/rankings/centers")
def get_center_rankings_api(
    metric: str = Query(
        "composite", description="排序指标: publishes|downloads|composite"
    ),
):
    """获取职能中心排行榜（排除数智中心）"""
    from app.analytics import get_center_rankings_exclude_zhishu

    return {"success": True, "data": get_center_rankings_exclude_zhishu(metric)}


@app.get("/api/rankings/regions")
def get_region_rankings_api(
    metric: str = Query(
        "publishes", description="排序指标: publishes|downloads|composite"
    ),
):
    """获取区域排行榜（排除数智中心）"""
    from app.analytics import get_region_rankings_exclude_zhishu

    return {"success": True, "data": get_region_rankings_exclude_zhishu(metric)}


@app.get("/api/changelog")
def get_changelog():
    """获取平台迭代日志（预定义版本记录）"""
    versions = [
        {
            "version": "v1.5.0",
            "date": "2026-06-08",
            "description": "数据展示中心重构",
            "isLatest": True,
            "changes": [
                "重构运营数据看板，支持自定义时间范围",
                "新增评奖看板，排除数智中心参与评比",
                "新增运营热力图，支持按天查看数据",
                "新增平台迭代日志页面",
                "新增运营周报历史页面",
                "优化趋势分析图表为平滑曲线",
            ],
        },
        {
            "version": "v1.4.0",
            "date": "2026-05-20",
            "description": "排行榜与通知优化",
            "isLatest": False,
            "changes": [
                "新增融合排行榜（各大区+职能中心）",
                "优化周报日报展示",
                "飞书Webhook通知系统",
                "管理后台日志查看",
            ],
        },
        {
            "version": "v1.3.0",
            "date": "2026-05-01",
            "description": "首页与交互优化",
            "isLatest": False,
            "changes": [
                "全新首页设计",
                "小智优选功能",
                "Skill擂台模块",
                "专家评审系统优化",
            ],
        },
        {
            "version": "v1.2.0",
            "date": "2026-04-25",
            "description": "运营与筛选功能",
            "isLatest": False,
            "changes": [
                "运营驾驶舱",
                "搜索筛选功能",
                "事件埋点系统",
                "两级标签系统",
            ],
        },
        {
            "version": "v1.1.0",
            "date": "2026-04-18",
            "description": "管理后台功能",
            "isLatest": False,
            "changes": [
                "管理员审核工作流",
                "审计日志",
                "技能状态管理",
                "多格式归档支持",
            ],
        },
        {
            "version": "v1.0.0",
            "date": "2026-04-14",
            "description": "项目初始化",
            "isLatest": False,
            "changes": [
                "DCO SkillHub 项目初始化",
                "基础技能管理功能",
                "文件上传下载",
            ],
        },
    ]

    return {"success": True, "data": versions}


@app.get("/api/analytics/weekly-report")
def get_analytics_weekly_report():
    """获取运营周报历史数据"""
    from app.analytics import get_analytics_overview
    from datetime import datetime, timedelta

    try:
        # 从项目开始日期（2026-04-14）到现在，按周生成报告
        start_date = datetime(2026, 4, 14)
        end_date = datetime.now()

        weekly_reports = []
        current_week_start = start_date
        week_num = 1

        while current_week_start < end_date:
            current_week_end = current_week_start + timedelta(days=6)
            if current_week_end > end_date:
                current_week_end = end_date

            week_start_str = current_week_start.strftime("%Y-%m-%d")
            week_end_str = current_week_end.strftime("%Y-%m-%d")

            try:
                overview = get_analytics_overview(week_start_str, week_end_str)
                weekly_reports.append(
                    {
                        "week_range": f"第{week_num}周",
                        "date_range": f"{week_start_str} ~ {week_end_str}",
                        "downloads": overview.get("downloads", 0),
                        "views": overview.get("views", 0),
                        "searches": overview.get("searches", 0),
                        "publishes": overview.get("publishes", 0),
                        "unique_users": overview.get("unique_users", 0),
                    }
                )
            except:
                pass

            current_week_start = current_week_end + timedelta(days=1)
            week_num += 1

        # 倒序排列，最新的在前面
        weekly_reports.reverse()

        return {"success": True, "data": weekly_reports}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
