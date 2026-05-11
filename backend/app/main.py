"""FastAPI 应用入口"""

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
from datetime import datetime, timedelta
from collections import Counter

from app.config import STORAGE_DIR, MAX_FILE_SIZE, QUICK_APPROVE_TOKEN
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
from app.report_builder import DailyReportBuilder, WeeklyReportBuilder
from app.metrics import (
    get_kpi_summary,
    get_trend_data,
    get_daily_metrics,
    get_metrics_range,
    aggregate_daily,
    aggregate_all_missing,
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
                        "created_at", datetime.now().isoformat()
                    )
                    person["updated_at"] = person.get(
                        "updated_at", datetime.now().isoformat()
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
            existing["updated_at"] = datetime.now().isoformat()
        else:
            # 创建新记录（自动补充 IDC 字段）
            new_staff = {
                "name": name.strip(),
                "employee_id": employee_id or "",
                "new_employee_id": "",
                "department": department or "",
                "organization": organization or "",
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            # 补充 IDC 标准字段
            new_staff.update(enrich_staff_record({"department": department}))
            staff_list.append(new_staff)

        data["staff"] = staff_list

    staff_db.update(updater)


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
):
    """添加审计日志"""
    ip = get_client_ip(request) if request else ""
    log = {
        "id": str(uuid.uuid4()),
        "type": type_,
        "skill_slug": skill_slug,
        "skill_name": skill_name,
        "ip": ip,
        "user": user,
        "timestamp": datetime.now().isoformat(),
        "detail": detail,
    }

    def append_log(data):
        data["logs"].append(log)
        # 清理30天前的日志
        cutoff = (datetime.now() - timedelta(days=30)).isoformat()
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


@app.get("/api/skills")
def list_skills(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    tag: str = Query(None),
    tags: str = Query(None),
):
    """获取技能列表"""
    data = skills_db.read()
    skills = data.get("skills", [])

    # 向后兼容：无status字段的skill默认为approved
    for s in skills:
        if "status" not in s:
            s["status"] = "approved"

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
    """获取技能详情"""
    data = skills_db.read()
    skill = next((s for s in data.get("skills", []) if s["slug"] == slug), None)

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 向后兼容
    if "status" not in skill:
        skill["status"] = "approved"

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

        # 检查文件大小
        if temp_path.stat().st_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")

        # 解析 skill.md
        skill_info = extract_skill_md(temp_path)

        # 优先使用用户修改后的值
        final_name = skillName.strip() or skill_info["name"]
        final_description = skillDescription.strip() or skill_info["description"]
        final_readme = skill_info["readme_content"]

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
        now = datetime.now().isoformat()
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

        # 发送发布申请通知（给管理员）
        try:
            notifier = FeishuNotifier()
            notifier.send_publish_apply(skill_record)
        except Exception:
            pass

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

    # 更新下载计数
    def increment_download(data):
        for s in data.get("skills", []):
            if s["id"] == skill["id"]:
                s["download_count"] = s.get("download_count", 0) + 1
                s["updated_at"] = datetime.now().isoformat()
                break

    skills_db.update(increment_download)

    # 记录审计日志
    add_audit_log("download", slug, skill["name"], "", f"下载版本 {version}", request)

    # 记录埋点事件
    track_skill_download(
        slug=slug, skill_name=skill["name"], version=version, ip=get_client_ip(request)
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
        now = datetime.now().isoformat()
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

        # 更新技能状态为 pending
        def update_skill_status(data):
            for s in data.get("skills", []):
                if s["id"] == skill["id"]:
                    s["status"] = "pending"
                    s["updated_at"] = now
                    break

        skills_db.update(update_skill_status)

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
    now = datetime.now().isoformat()

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
    now = datetime.now().isoformat()

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
    today = datetime.now().strftime("%Y-%m-%d")

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
    cutoff = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
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
    """返回统计数据（下载量、浏览量、部门上传量、个人上传量）"""
    skills_data = skills_db.read()
    views_data = views_db.read()
    skills = skills_data.get("skills", [])
    views_map = views_data.get("views", {})

    # 技能下载/浏览排行
    skill_stats = [
        {
            "name": s.get("name", ""),
            "slug": s["slug"],
            "downloads": s.get("download_count", 0),
            "views": views_map.get(s["slug"], 0),
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
    """获取KPI汇总卡片数据（今日/昨日/本周/本月）"""
    try:
        # 确保今日数据已聚合
        today = datetime.now().strftime("%Y-%m-%d")
        if not get_daily_metrics(today):
            aggregate_daily(today)

        kpi = get_kpi_summary()
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
            end_date = datetime.now()
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

    # 格式化事件为前端友好的格式
    formatted = []
    for e in events:
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
    end_date = datetime.now()
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
    pending_skills = [
        s for s in skills if s.get("status") in ("pending", "delete_pending")
    ]

    # 待审核的版本（is_latest = False 且 skill 状态为 pending）
    pending_versions = []
    for v in versions:
        if not v.get("is_latest"):
            skill = next((s for s in skills if s["id"] == v["skill_id"]), None)
            if skill and skill.get("status") == "pending":
                pending_versions.append(
                    {**v, "skill_name": skill["name"], "skill_slug": skill["slug"]}
                )

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

    now = datetime.now().isoformat()

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

        # 记录日志
        add_audit_log(
            "approve",
            slug,
            skill["name"],
            "管理员",
            f"审核通过" + (f"，版本 {pending_ver['version']}" if pending_ver else ""),
        )

        # 发送审批通过通知（给提交人）
        try:
            notifier = FeishuNotifier()
            notifier.send_publish_approve(skill, "管理员")
        except Exception:
            pass

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

        # 发送审批拒绝通知（给提交人）
        try:
            notifier = FeishuNotifier()
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

    job.modify(next_run_time=datetime.now())
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
def test_webhook(request: Request):
    """手动测试 Webhook 发送"""
    verify_admin_token(request)
    notifier = FeishuNotifier()
    log = notifier.send_text("🧪 测试消息", "manual_test")
    return {"success": log.status == "success", "data": log.to_dict()}


@app.post("/api/admin/webhook-logs/{id}/retry")
def retry_webhook_log(id: str, request: Request):
    """重试发送失败的 Webhook"""
    verify_admin_token(request)
    log = WebhookLogService.get_detail(id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    if log["status"] != "failed":
        return {"success": False, "message": "只有失败的日志可以重试"}
    # 重试：使用原始日志的请求体重新发送
    notifier = FeishuNotifier()
    try:
        # 重新构建消息
        message = log.get("request_body", {})
        if message:
            # 创建新的日志记录
            new_log = notifier._send(message, log.get("type", "retry"))
            return {
                "success": new_log.status == "success",
                "data": {"original_id": id, "new_log": new_log.to_dict()},
            }
        else:
            # 如果没有请求体，发送简单文本
            new_log = notifier.send_text("🧪 重试发送（原始请求体丢失）", "retry")
            return {
                "success": new_log.status == "success",
                "data": {"original_id": id, "new_log": new_log.to_dict()},
            }
    except Exception as e:
        return {"success": False, "message": f"重试失败: {str(e)}"}


# 手动发送日报
@app.post("/api/admin/send-daily-report")
def send_daily_report_manual(request: Request):
    """手动发送日报"""
    verify_admin_token(request)
    try:
        from app.report_builder import DailyReportBuilder
        from app.notifier import FeishuNotifier

        builder = DailyReportBuilder()
        report_data = builder.build()

        notifier = FeishuNotifier()
        log = notifier.send_daily_report(report_data)

        return {"success": log.status == "success", "data": log.to_dict()}
    except Exception as e:
        return {"success": False, "message": f"发送失败: {str(e)}"}


# 手动发送周报
@app.post("/api/admin/send-weekly-report")
def send_weekly_report_manual(request: Request):
    """手动发送周报"""
    verify_admin_token(request)
    try:
        from app.report_builder import WeeklyReportBuilder
        from app.notifier import FeishuNotifier

        builder = WeeklyReportBuilder()
        report_data = builder.build()

        notifier = FeishuNotifier()
        log = notifier.send_weekly_report(report_data)

        return {"success": log.status == "success", "data": log.to_dict()}
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
        builder = DailyReportBuilder()
        report_data = builder.build()
        return {"success": True, "data": report_data}
    except Exception as e:
        return {"success": False, "message": f"生成日报失败: {str(e)}"}


@app.get("/api/reports/weekly")
def get_weekly_report(request: Request):
    """获取实时周报内容（需要 Bearer Token 鉴权）"""
    verify_report_token(request)
    try:
        builder = WeeklyReportBuilder()
        report_data = builder.build()
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

    now = datetime.now().isoformat()

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

        # 记录日志
        add_audit_log(
            "approve",
            slug,
            skill["name"],
            "管理员",
            f"快速审核通过"
            + (f"，版本 {pending_ver['version']}" if pending_ver else ""),
        )

        # 发送审批通过通知（给提交人）
        try:
            notifier = FeishuNotifier()
            notifier.send_publish_approve(skill, "管理员")
        except Exception:
            pass

        return {"success": True, "message": "审核通过"}

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

        # 发送审批拒绝通知（给提交人）
        try:
            notifier = FeishuNotifier()
            notifier.send_publish_reject(skill, reason, "管理员")
        except Exception:
            pass

        return {"success": True, "message": "已拒绝"}


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
