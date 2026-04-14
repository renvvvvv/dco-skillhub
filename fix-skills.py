#!/usr/bin/env python3
"""修复技能包结构 - 确保 skill.md 在 ZIP 根目录"""

import zipfile
import os
from pathlib import Path

def fix_skill_zip(zip_path: Path):
    """修复单个技能包"""
    print(f"Fixing {zip_path.name}...")
    
    # 读取原 ZIP
    with zipfile.ZipFile(zip_path, 'r') as zf:
        # 查找 skill.md
        skill_md_files = [f for f in zf.namelist() if f.lower().endswith('skill.md')]
        if not skill_md_files:
            print(f"  Warning: No skill.md found in {zip_path.name}")
            return
        
        original_path = skill_md_files[0]
        print(f"  Found skill.md at: {original_path}")
        
        # 读取内容
        content = zf.read(original_path)
        
        # 创建新的 ZIP
        new_zip_path = zip_path.with_suffix('.zip.new')
        with zipfile.ZipFile(new_zip_path, 'w', zipfile.ZIP_DEFLATED) as new_zf:
            # 添加 skill.md 到根目录
            new_zf.writestr('skill.md', content)
            print(f"  Added skill.md to root")
            
            # 复制其他文件保持相对路径
            for f in zf.namelist():
                if f != original_path and not f.endswith('/'):
                    new_zf.writestr(f, zf.read(f))
    
    # 替换原文件
    zip_path.unlink()
    new_zip_path.rename(zip_path)
    print(f"  [OK] Fixed!")

def main():
    skills_dir = Path(__file__).parent / "test-skills"
    
    if not skills_dir.exists():
        print(f"Directory not found: {skills_dir}")
        return
    
    zip_files = list(skills_dir.glob("*.zip"))
    print(f"Found {len(zip_files)} skills to fix\n")
    
    for zip_file in zip_files:
        fix_skill_zip(zip_file)
    
    print("\nAll skills fixed!")

if __name__ == "__main__":
    main()
