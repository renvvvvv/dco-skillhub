#!/usr/bin/env python3
"""上传所有测试技能"""

import sys
sys.path.insert(0, '/app')

import asyncio
from pathlib import Path
import shutil
import hashlib
from datetime import datetime

from app.database import skills_db, versions_db
from app.services import extract_skill_md, hash_admin_key, generate_slug
from app.config import STORAGE_DIR

async def publish_skill(zip_path: Path, name: str):
    """发布单个技能"""
    print(f"Publishing {name}...")
    
    skill_info = extract_skill_md(zip_path)
    slug = generate_slug(skill_info["name"])
    skill_id = slug
    version = "1.0.0"
    
    # 检查是否已存在
    data = skills_db.read()
    if any(s["slug"] == slug for s in data.get("skills", [])):
        print(f"  Already exists, skipping")
        return
    
    # 创建目录
    skill_dir = STORAGE_DIR / slug / version
    skill_dir.mkdir(parents=True, exist_ok=True)
    
    # 复制文件
    file_name = f"{slug}-{version}.zip"
    final_path = skill_dir / file_name
    shutil.copy(str(zip_path), str(final_path))
    
    # 创建记录
    now = datetime.now().isoformat()
    
    skill_record = {
        "id": skill_id,
        "name": skill_info["name"],
        "slug": slug,
        "description": skill_info["description"],
        "readme_content": skill_info["readme_content"],
        "author_name": "Test Author",
        "author_email": "test@example.com",
        "admin_key_hash": hash_admin_key("test-key-123"),
        "download_count": 0,
        "latest_version": version,
        "created_at": now,
        "updated_at": now
    }
    
    version_record = {
        "id": f"{skill_id}-{version}",
        "skill_id": skill_id,
        "version": version,
        "tag": "stable",
        "is_latest": True,
        "storage_path": str(final_path.relative_to(Path.cwd())),
        "file_size": final_path.stat().st_size,
        "file_hash": hashlib.sha256(final_path.read_bytes()).hexdigest(),
        "created_at": now
    }
    
    def update_skills(data):
        data["skills"].append(skill_record)
    
    def update_versions(data):
        data["versions"].append(version_record)
    
    skills_db.update(update_skills)
    versions_db.update(update_versions)
    
    print(f"  [OK] Published: {skill_info['name']}")

async def main():
    skills_dir = Path("/tmp/test-skills")
    
    zip_files = sorted(skills_dir.glob("*.zip"))
    print(f"Found {len(zip_files)} skills to upload\n")
    
    for zip_file in zip_files:
        name = zip_file.stem.replace('-', ' ').title()
        await publish_skill(zip_file, name)
    
    print(f"\n{'='*50}")
    print("All skills uploaded!")
    
    # 列出所有技能
    print("\nCurrent skills in SkillHub:")
    data = skills_db.read()
    for skill in data.get("skills", []):
        print(f"  - {skill['name']} (v{skill['latest_version']}, {skill['download_count']} downloads)")

if __name__ == "__main__":
    asyncio.run(main())
