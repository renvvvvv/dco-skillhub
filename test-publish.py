#!/usr/bin/env python3
"""直接测试发布技能功能"""

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

async def test_publish():
    """测试发布流程"""
    zip_path = Path("/tmp/test.zip")
    
    print(f"1. Reading ZIP file: {zip_path}")
    print(f"   Size: {zip_path.stat().st_size} bytes")
    
    print("2. Extracting skill.md...")
    skill_info = extract_skill_md(zip_path)
    print(f"   Name: {skill_info['name']}")
    print(f"   Desc: {skill_info['description'][:50]}...")
    
    print("3. Generating slug...")
    slug = generate_slug(skill_info["name"])
    print(f"   Slug: {slug}")
    
    skill_id = slug
    version = "1.0.0"
    
    print("4. Creating storage directory...")
    skill_dir = STORAGE_DIR / slug / version
    skill_dir.mkdir(parents=True, exist_ok=True)
    print(f"   Dir: {skill_dir}")
    
    print("5. Copying file...")
    file_name = f"{slug}-{version}.zip"
    final_path = skill_dir / file_name
    shutil.copy(str(zip_path), str(final_path))
    print(f"   Path: {final_path}")
    
    print("6. Creating records...")
    now = datetime.now().isoformat()
    
    skill_record = {
        "id": skill_id,
        "name": skill_info["name"],
        "slug": slug,
        "description": skill_info["description"],
        "readme_content": skill_info["readme_content"],
        "author_name": "Test Author",
        "author_email": "test@test.com",
        "admin_key_hash": hash_admin_key("test-key"),
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
    
    print("7. Saving to database...")
    
    def update_skills(data):
        data["skills"].append(skill_record)
    
    def update_versions(data):
        data["versions"].append(version_record)
    
    skills_db.update(update_skills)
    versions_db.update(update_versions)
    
    print("8. Done!")
    print(f"\nSkill published successfully!")
    print(f"  ID: {skill_id}")
    print(f"  Name: {skill_info['name']}")
    print(f"  Slug: {slug}")

if __name__ == "__main__":
    asyncio.run(test_publish())
