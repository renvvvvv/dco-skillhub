"""小智优选 - 每周精选Skill管理"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.config import DATA_DIR

# 数据文件路径
WEEKLY_PICKS_FILE = DATA_DIR / "weekly_picks.json"


class WeeklyPicksDatabase:
    """每周精选数据库"""

    def __init__(self):
        self.picks_file = WEEKLY_PICKS_FILE
        self._ensure_files()

    def _ensure_files(self):
        """确保数据文件存在"""
        if not self.picks_file.exists():
            self.picks_file.write_text(
                json.dumps({"current_week": None, "history": []}, ensure_ascii=False)
            )

    def _read(self) -> dict:
        """读取数据"""
        try:
            return json.loads(self.picks_file.read_text(encoding="utf-8"))
        except:
            return {"current_week": None, "history": []}

    def _write(self, data: dict):
        """写入数据"""
        self.picks_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def get_current_week_picks(self) -> Optional[dict]:
        """获取本周精选"""
        db = self._read()
        current = db.get("current_week")

        if not current:
            return None

        # 检查是否过期（超过7天）
        week_start = datetime.fromisoformat(current.get("week_start", "2000-01-01"))
        if datetime.now() - week_start > timedelta(days=7):
            # 自动归档到历史
            self._archive_current_week()
            return None

        return current

    def set_weekly_picks(
        self,
        picks: List[dict],
        admin_id: str = "admin",
        admin_name: str = "管理员",
    ) -> dict:
        """
        设置本周精选

        picks: [
            {"skill_slug": "xxx", "reason": "评选理由"},
            {"skill_slug": "xxx", "reason": "评选理由"},
            {"skill_slug": "xxx", "reason": "评选理由"}
        ]
        """
        if len(picks) != 3:
            raise ValueError("必须选择3个Skill")

        db = self._read()

        # 如果有当前周，先归档
        if db.get("current_week"):
            self._archive_current_week()

        week_start = datetime.now()
        week_end = week_start + timedelta(days=7)

        current_week = {
            "id": str(uuid.uuid4()),
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "week_number": week_start.isocalendar()[1],
            "year": week_start.year,
            "picks": picks,
            "selected_by": admin_id,
            "selected_by_name": admin_name,
            "selected_at": datetime.now().isoformat(),
        }

        db["current_week"] = current_week
        self._write(db)

        return current_week

    def _archive_current_week(self):
        """将当前周归档到历史"""
        db = self._read()
        current = db.get("current_week")

        if current:
            if "history" not in db:
                db["history"] = []
            db["history"].append(current)
            db["current_week"] = None
            self._write(db)

    def get_history(self, limit: int = 10) -> List[dict]:
        """获取历史精选记录"""
        db = self._read()
        history = db.get("history", [])

        # 按时间倒序
        history.sort(key=lambda x: x.get("week_start", ""), reverse=True)
        return history[:limit]

    def get_all_picks(self) -> dict:
        """获取所有数据（当前周+历史）"""
        db = self._read()
        return {
            "current_week": db.get("current_week"),
            "history": db.get("history", []),
        }


# 全局实例
weekly_picks_db = WeeklyPicksDatabase()
