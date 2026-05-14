#!/usr/bin/env python3
"""
日志迁移脚本：将旧版 audit_logs.json 迁移到新版 user_activity_logs.json

旧日志格式：
{
  "logs": [
    {
      "id": "uuid",
      "type": "view|download|publish|approve|delete|...",
      "skill_slug": "xxx",
      "skill_name": "xxx",
      "ip": "xxx",
      "user": "xxx",
      "timestamp": "2026-04-20T12:57:30.399069",
      "detail": "xxx"
    }
  ]
}

新日志格式：
{
  "data": [
    {
      "id": "uuid",
      "activity_type": "skill_view|skill_download|skill_publish|...",
      "user_id": "xxx",
      "skill_id": "xxx",
      "details": {...},
      "ip": "xxx",
      "timestamp": "2026-04-20T12:57:30.399069"
    }
  ]
}
"""

import json
import uuid
from pathlib import Path
from datetime import datetime

# 文件路径
DATA_DIR = Path("/app/data")
OLD_LOGS_FILE = DATA_DIR / "audit_logs.json"
NEW_LOGS_FILE = DATA_DIR / "user_activity_logs.json"

# 类型映射：旧类型 -> 新类型
TYPE_MAPPING = {
    "view": "skill_view",
    "download": "skill_download",
    "publish": "skill_publish",
    "approve": "skill_approve",
    "reject": "skill_reject",
    "delete": "skill_delete",
    "delete_pending": "skill_delete_pending",
    "search": "skill_search",
    "update": "skill_update",
}


def migrate_logs():
    """迁移日志"""
    # 读取旧日志
    try:
        with open(OLD_LOGS_FILE, "r", encoding="utf-8") as f:
            old_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"无法读取旧日志文件: {e}")
        return

    old_logs = old_data.get("logs", [])
    print(f"找到 {len(old_logs)} 条旧日志")

    # 读取新日志（如果存在）
    new_logs = []
    if NEW_LOGS_FILE.exists():
        try:
            with open(NEW_LOGS_FILE, "r", encoding="utf-8") as f:
                new_data = json.load(f)
                new_logs = new_data.get("data", [])
            print(f"新日志文件已存在，包含 {len(new_logs)} 条记录")
        except (json.JSONDecodeError, KeyError):
            new_logs = []

    # 转换旧日志
    migrated_count = 0
    skipped_count = 0

    for old_log in old_logs:
        old_type = old_log.get("type", "")

        # 映射类型
        new_type = TYPE_MAPPING.get(old_type)
        if not new_type:
            print(f"跳过未知类型: {old_type}")
            skipped_count += 1
            continue

        # 构建新日志格式
        new_log = {
            "id": old_log.get("id") or str(uuid.uuid4()),
            "activity_type": new_type,
            "user_id": old_log.get("user", ""),
            "skill_id": old_log.get("skill_slug", ""),
            "details": {
                "skill_name": old_log.get("skill_name", ""),
                "detail": old_log.get("detail", ""),
                "original_type": old_type,
            },
            "ip": old_log.get("ip", ""),
            "timestamp": old_log.get("timestamp", datetime.now().isoformat()),
        }

        new_logs.append(new_log)
        migrated_count += 1

    # 保存新日志
    new_data = {"data": new_logs}
    with open(NEW_LOGS_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"\n迁移完成:")
    print(f"  - 成功迁移: {migrated_count} 条")
    print(f"  - 跳过: {skipped_count} 条")
    print(f"  - 新日志总数: {len(new_logs)} 条")
    print(f"  - 输出文件: {NEW_LOGS_FILE}")


if __name__ == "__main__":
    migrate_logs()
