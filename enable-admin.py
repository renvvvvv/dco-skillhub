#!/usr/bin/env python3
"""
启用 SkillHub 管理员密钥
用法: python enable-admin.py --key vnet.com
"""

import sys
import argparse
import hashlib
from pathlib import Path

# 添加后端路径
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from app.database import skills_db
from app.services import hash_admin_key


def update_admin_key(skill_id: str, new_key: str):
    """更新技能的管理员密钥"""
    new_hash = hash_admin_key(new_key)
    
    def updater(data):
        for skill in data.get("skills", []):
            if skill["id"] == skill_id:
                old_hash = skill.get("admin_key_hash", "N/A")
                skill["admin_key_hash"] = new_hash
                print(f"[OK] 技能 '{skill.get('name', skill_id)}' 的管理员密钥已更新")
                print(f"  旧哈希: {old_hash[:16]}...")
                print(f"  新哈希: {new_hash[:16]}...")
                return True
        return False
    
    result = skills_db.update(updater)
    return result


def update_all_skills(new_key: str):
    """更新所有技能的管理员密钥"""
    data = skills_db.read()
    skills = data.get("skills", [])
    
    if not skills:
        print("[!] 没有找到任何技能")
        return
    
    print(f"\n正在更新 {len(skills)} 个技能的管理员密钥...\n")
    
    updated = 0
    for skill in skills:
        skill_id = skill.get("id")
        if skill_id:
            if update_admin_key(skill_id, new_key):
                updated += 1
    
    print(f"\n[OK] 完成！共更新 {updated} 个技能")
    print(f"[OK] 新的管理员密钥: {new_key}")


def main():
    parser = argparse.ArgumentParser(description='启用 SkillHub 管理员密钥')
    parser.add_argument('--key', default='vnet.com', help='管理员密钥 (默认: vnet.com)')
    parser.add_argument('--skill-id', help='指定技能ID (不指定则更新所有)')
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("SkillHub Admin Key Configuration")
    print("=" * 50)
    
    if args.skill_id:
        print(f"\n更新技能: {args.skill_id}")
        update_admin_key(args.skill_id, args.key)
    else:
        update_all_skills(args.key)
    
    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
