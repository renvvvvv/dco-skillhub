#!/usr/bin/env python3
"""上传测试技能到 SkillHub"""

import requests
import os
from pathlib import Path

API_BASE = "http://localhost/api"

def upload_skill(zip_path: Path, name: str):
    """上传单个技能"""
    with open(zip_path, 'rb') as f:
        files = {'skillZip': (zip_path.name, f, 'application/zip')}
        data = {
            'authorName': 'Test Author',
            'authorEmail': 'test@example.com',
            'adminKey': 'test-key-123',
            'version': '1.0.0',
            'tag': 'stable'
        }
        
        print(f"Uploading {name}...")
        try:
            response = requests.post(
                f"{API_BASE}/skills",
                files=files,
                data=data,
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Success: {result['data']['name']} (slug: {result['data']['slug']})")
                return True
            else:
                print(f"  ✗ Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False

def main():
    skills_dir = Path(__file__).parent / "test-skills"
    
    if not skills_dir.exists():
        print(f"Directory not found: {skills_dir}")
        return
    
    # 获取所有 zip 文件
    zip_files = sorted(skills_dir.glob("*.zip"))
    
    print(f"Found {len(zip_files)} skills to upload\n")
    
    success_count = 0
    for zip_file in zip_files:
        skill_name = zip_file.stem.replace('-', ' ').title()
        if upload_skill(zip_file, skill_name):
            success_count += 1
    
    print(f"\n{'='*50}")
    print(f"Uploaded: {success_count}/{len(zip_files)} skills")
    
    # 列出所有技能
    print("\nCurrent skills in SkillHub:")
    try:
        response = requests.get(f"{API_BASE}/skills", timeout=10)
        if response.status_code == 200:
            data = response.json()['data']
            for skill in data['content']:
                print(f"  - {skill['name']} (v{skill['latest_version']}, {skill['download_count']} downloads)")
    except Exception as e:
        print(f"  Error listing skills: {e}")

if __name__ == "__main__":
    main()
