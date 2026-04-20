"""FastAPI 应用入口"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import shutil
from pathlib import Path
from datetime import datetime

from app.config import STORAGE_DIR, MAX_FILE_SIZE
from app.database import skills_db, versions_db
from app.services import (
    hash_admin_key, verify_admin_key, extract_skill_md,
    generate_slug, update_search_index, search_skills,
    get_skill_versions, delete_skill
)

app = FastAPI(
    title="SkillHub Lite",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 异常处理 ============

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """捕获验证错误并返回详细信息"""
    print(f"DEBUG: Validation error: {exc.errors()}")
    print(f"DEBUG: Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation failed"}
    )

# ============ API 路由 ============

@app.get("/api/skills")
def list_skills(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    tag: str = Query(None),
    tags: str = Query(None)
):
    """获取技能列表"""
    data = skills_db.read()
    skills = data.get("skills", [])
    
    # 过滤（旧版单 tag 参数，基于版本 tag）
    if tag:
        versions_data = versions_db.read()
        latest_versions = {
            v["skill_id"] for v in versions_data.get("versions", [])
            if v.get("tag") == tag and v.get("is_latest")
        }
        skills = [s for s in skills if s["id"] in latest_versions]
    
    # 过滤（新版多 tags 参数，基于 skill.tags）
    if tags:
        filter_tags = [t.strip() for t in tags.split(",") if t.strip()]
        skills = [
            s for s in skills
            if any(t in (s.get("tags") or []) for t in filter_tags)
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
            "number": page
        }
    }


@app.get("/api/skills/{slug}")
def get_skill(slug: str):
    """获取技能详情"""
    data = skills_db.read()
    skill = next(
        (s for s in data.get("skills", []) if s["slug"] == slug),
        None
    )
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # 获取版本
    versions = get_skill_versions(skill["id"])
    
    return {
        "success": True,
        "data": {
            **skill,
            "versions": versions
        }
    }


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
    tags: str = Form("")
):
    """发布新技能"""
    """发布新技能"""
    
    # 验证文件类型
    if not skillZip.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files allowed")
    
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
        
        # 生成 slug
        slug = generate_slug(skill_info["name"])
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
            "name": skill_info["name"],
            "slug": slug,
            "description": skill_info["description"],
            "readme_content": skill_info["readme_content"],
            "author_name": authorName,
            "author_email": authorEmail,
            "author_employee_id": authorEmployeeId,
            "author_department": authorDepartment,
            "author_organization": authorOrganization,
            "tags": skill_tags,
            "admin_key_hash": "",
            "download_count": 0,
            "latest_version": version,
            "created_at": now,
            "updated_at": now
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
            "created_at": now
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
        
        return {
            "success": True,
            "data": {
                "id": skill_id,
                "name": skill_record["name"],
                "slug": slug,
                "version": version,
                "downloadUrl": f"/api/skills/{slug}/download"
            }
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
def download_skill(
    slug: str,
    version: str = Query(None)
):
    """下载技能"""
    # 查找技能
    skills_data = skills_db.read()
    skill = next(
        (s for s in skills_data.get("skills", []) if s["slug"] == slug),
        None
    )
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # 确定版本
    if not version:
        version = skill.get("latest_version", "1.0.0")
    
    # 查找版本
    versions_data = versions_db.read()
    ver = next(
        (v for v in versions_data.get("versions", [])
         if v["skill_id"] == skill["id"] and v["version"] == version),
        None
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
    
    return FileResponse(
        file_path,
        filename=f"{slug}-{version}.zip",
        media_type="application/zip"
    )


@app.post("/api/skills/{slug}/versions")
async def create_version(
    slug: str,
    skillZip: UploadFile = File(...),
    version: str = Form(...),
    tag: str = Form("stable")
):
    """发布新版本"""
    # 查找技能
    skills_data = skills_db.read()
    skill = next(
        (s for s in skills_data.get("skills", []) if s["slug"] == slug),
        None
    )
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # 检查版本是否已存在
    versions_data = versions_db.read()
    if any(v["skill_id"] == skill["id"] and v["version"] == version 
           for v in versions_data.get("versions", [])):
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
        
        # 更新之前的最新版本
        def update_latest(data):
            for v in data.get("versions", []):
                if v["skill_id"] == skill["id"] and v.get("is_latest"):
                    v["is_latest"] = False
        
        versions_db.update(update_latest)
        
        # 创建新版本记录
        now = datetime.now().isoformat()
        version_record = {
            "id": f"{skill['id']}-{version}",
            "skill_id": skill["id"],
            "version": version,
            "tag": tag,
            "is_latest": True,
            "storage_path": str(final_path.relative_to(Path.cwd())),
            "file_size": final_path.stat().st_size,
            "file_hash": hashlib.sha256(final_path.read_bytes()).hexdigest(),
            "created_at": now
        }
        
        def add_version(data):
            data["versions"].append(version_record)
        
        versions_db.update(add_version)
        
        # 更新技能的最新版本
        def update_skill(data):
            for s in data.get("skills", []):
                if s["id"] == skill["id"]:
                    s["latest_version"] = version
                    s["updated_at"] = now
                    break
        
        skills_db.update(update_skill)
        
        # 更新符号链接
        latest_link = STORAGE_DIR / slug / "latest"
        if latest_link.exists() or latest_link.is_symlink():
            latest_link.unlink()
        latest_link.symlink_to(version, target_is_directory=True)
        
        return {
            "success": True,
            "data": {
                "skillId": skill["id"],
                "version": version,
                "tag": tag,
                "downloadUrl": f"/api/skills/{slug}/download?version={version}"
            }
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
    tags: str = Form("")
):
    """更新技能信息"""
    skills_data = skills_db.read()
    skill = next(
        (s for s in skills_data.get("skills", []) if s["slug"] == slug),
        None
    )
    
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
    
    return {"success": True, "message": "Skill updated"}


@app.delete("/api/skills/{slug}")
def delete_skill_endpoint(slug: str):
    """删除技能（无限制）"""
    skills_data = skills_db.read()
    skill = next(
        (s for s in skills_data.get("skills", []) if s["slug"] == slug),
        None
    )
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if delete_skill(skill["id"]):
        return {"success": True, "message": "Skill deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete skill")


@app.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    """全文搜索"""
    results = search_skills(q)
    
    return {
        "success": True,
        "data": {
            "content": results,
            "totalElements": len(results)
        }
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
            "developer": s.get("author_name", "")
        }
        for s in skills
    ]
    
    return {
        "success": True,
        "data": results
    }


@app.get("/health")
def health():
    """健康检查"""
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
