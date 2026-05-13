"""专家评审和日志系统"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.config import DATA_DIR

# 数据文件路径
EXPERT_REVIEWS_FILE = DATA_DIR / "expert_reviews.json"
EXPERT_LOGS_FILE = DATA_DIR / "expert_logs.json"
USER_ACTIVITY_LOGS_FILE = DATA_DIR / "user_activity_logs.json"
CODE_AUDIT_LOGS_FILE = DATA_DIR / "code_audit_logs.json"


class ExpertReviewDatabase:
    """专家评审数据库"""

    def __init__(self):
        self.reviews_file = EXPERT_REVIEWS_FILE
        self.logs_file = EXPERT_LOGS_FILE
        self.activity_logs_file = USER_ACTIVITY_LOGS_FILE
        self.code_audit_file = CODE_AUDIT_LOGS_FILE
        self._ensure_files()

    def _ensure_files(self):
        """确保数据文件存在"""
        for file_path in [
            self.reviews_file,
            self.logs_file,
            self.activity_logs_file,
            self.code_audit_file,
        ]:
            if not file_path.exists():
                file_path.write_text(json.dumps({"data": []}, ensure_ascii=False))

    def _read(self, file_path: Path) -> dict:
        """读取数据"""
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except:
            return {"data": []}

    def _write(self, file_path: Path, data: dict):
        """写入数据"""
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ========== 专家评审 ==========

    def add_expert_review(
        self,
        skill_id: str,
        expert_id: str,
        expert_name: str,
        dimensions: dict,
        overall_comment: str = None,
        is_recommended: bool = None,
    ) -> dict:
        """
        添加专家评审

        dimensions: {
            "code_quality": {"score": 85, "comment": "代码规范良好"},
            "documentation": {"score": 90, "comment": "文档完整"},
            "functionality": {"score": 88, "comment": "功能完善"},
            "innovation": {"score": 75, "comment": "有一定创新"},
            "maintainability": {"score": 80, "comment": "易于维护"}
        }
        """
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])

        review = {
            "id": str(uuid.uuid4()),
            "skill_id": skill_id,
            "expert_id": expert_id,
            "expert_name": expert_name,
            "dimensions": dimensions,
            "overall_comment": overall_comment,
            "is_recommended": is_recommended,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        reviews.append(review)
        db["data"] = reviews
        self._write(self.reviews_file, db)

        # 记录日志
        self._log_expert_action(
            "review_added",
            expert_id,
            expert_name,
            skill_id,
            f"专家 {expert_name} 对 Skill {skill_id} 进行了评审",
            {"dimensions": dimensions, "is_recommended": is_recommended},
        )

        return review

    def get_skill_reviews(self, skill_id: str) -> list:
        """获取Skill的所有专家评审"""
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])
        return [r for r in reviews if r["skill_id"] == skill_id]

    def get_expert_reviews(self, expert_id: str) -> list:
        """获取专家的所有评审记录"""
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])
        return [r for r in reviews if r["expert_id"] == expert_id]

    def get_all_reviews(self, limit: int = 100) -> list:
        """获取所有评审记录"""
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])
        return sorted(reviews, key=lambda x: x["created_at"], reverse=True)[:limit]

    def delete_review(self, review_id: str, expert_id: str = None) -> bool:
        """删除评审记录"""
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])

        for i, review in enumerate(reviews):
            if review["id"] == review_id:
                if expert_id and review["expert_id"] != expert_id:
                    return False
                reviews.pop(i)
                db["data"] = reviews
                self._write(self.reviews_file, db)

                self._log_expert_action(
                    "review_deleted",
                    expert_id or "system",
                    "system",
                    review["skill_id"],
                    f"评审 {review_id} 被删除",
                    {},
                )
                return True

        return False

    # ========== 用户活动日志 ==========

    def log_user_activity(
        self,
        activity_type: str,
        user_id: str,
        skill_id: str = None,
        details: dict = None,
        ip: str = None,
    ) -> dict:
        """记录用户活动日志"""
        db = self._read(self.activity_logs_file)
        logs = db.get("data", [])

        log = {
            "id": str(uuid.uuid4()),
            "activity_type": activity_type,
            "user_id": user_id,
            "skill_id": skill_id,
            "details": details or {},
            "ip": ip,
            "timestamp": datetime.now().isoformat(),
        }

        logs.append(log)

        # 只保留最近90天的日志
        cutoff = (datetime.now() - timedelta(days=90)).isoformat()
        logs = [l for l in logs if l["timestamp"] > cutoff]

        db["data"] = logs
        self._write(self.activity_logs_file, db)

        return log

    def get_user_activity_logs(
        self,
        user_id: str = None,
        skill_id: str = None,
        activity_type: str = None,
        days: int = 30,
        limit: int = 100,
    ) -> list:
        """获取用户活动日志"""
        db = self._read(self.activity_logs_file)
        logs = db.get("data", [])

        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        filtered = [l for l in logs if l["timestamp"] > cutoff]

        if user_id:
            filtered = [l for l in filtered if l["user_id"] == user_id]
        if skill_id:
            filtered = [l for l in filtered if l["skill_id"] == skill_id]
        if activity_type:
            filtered = [l for l in filtered if l["activity_type"] == activity_type]

        return sorted(filtered, key=lambda x: x["timestamp"], reverse=True)[:limit]

    def get_activity_summary(self, days: int = 7) -> dict:
        """获取活动汇总统计"""
        db = self._read(self.activity_logs_file)
        logs = db.get("data", [])

        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        recent_logs = [l for l in logs if l["timestamp"] > cutoff]

        # 按类型统计
        type_counts = {}
        for log in recent_logs:
            activity_type = log["activity_type"]
            type_counts[activity_type] = type_counts.get(activity_type, 0) + 1

        # 按Skill统计
        skill_counts = {}
        for log in recent_logs:
            if log["skill_id"]:
                skill_counts[log["skill_id"]] = skill_counts.get(log["skill_id"], 0) + 1

        # 按用户统计
        user_counts = {}
        for log in recent_logs:
            user_counts[log["user_id"]] = user_counts.get(log["user_id"], 0) + 1

        return {
            "total_activities": len(recent_logs),
            "type_distribution": type_counts,
            "top_skills": sorted(
                skill_counts.items(), key=lambda x: x[1], reverse=True
            )[:10],
            "top_users": sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[
                :10
            ],
            "daily_stats": self._get_daily_stats(recent_logs),
        }

    def _get_daily_stats(self, logs: list) -> list:
        """获取每日统计"""
        daily = {}
        for log in logs:
            date = log["timestamp"][:10]
            if date not in daily:
                daily[date] = {"date": date, "count": 0, "types": {}}
            daily[date]["count"] += 1
            activity_type = log["activity_type"]
            daily[date]["types"][activity_type] = (
                daily[date]["types"].get(activity_type, 0) + 1
            )

        return sorted(daily.values(), key=lambda x: x["date"])

    # ========== 代码审计日志 ==========

    def log_code_audit(
        self,
        skill_id: str,
        audit_type: str,
        results: dict,
        score: float = None,
    ) -> dict:
        """记录代码审计日志"""
        db = self._read(self.code_audit_file)
        logs = db.get("data", [])

        log = {
            "id": str(uuid.uuid4()),
            "skill_id": skill_id,
            "audit_type": audit_type,
            "results": results,
            "score": score,
            "timestamp": datetime.now().isoformat(),
        }

        logs.append(log)

        # 只保留最近30天的审计日志
        cutoff = (datetime.now() - timedelta(days=30)).isoformat()
        logs = [l for l in logs if l["timestamp"] > cutoff]

        db["data"] = logs
        self._write(self.code_audit_file, db)

        return log

    def get_code_audit_logs(self, skill_id: str = None, limit: int = 100) -> list:
        """获取代码审计日志"""
        db = self._read(self.code_audit_file)
        logs = db.get("data", [])

        if skill_id:
            logs = [l for l in logs if l["skill_id"] == skill_id]

        return sorted(logs, key=lambda x: x["timestamp"], reverse=True)[:limit]

    # ========== 专家操作日志 ==========

    def _log_expert_action(
        self,
        action: str,
        expert_id: str,
        expert_name: str,
        skill_id: str,
        description: str,
        details: dict = None,
    ):
        """记录专家操作日志"""
        db = self._read(self.logs_file)
        logs = db.get("data", [])

        log = {
            "id": str(uuid.uuid4()),
            "action": action,
            "expert_id": expert_id,
            "expert_name": expert_name,
            "skill_id": skill_id,
            "description": description,
            "details": details or {},
            "timestamp": datetime.now().isoformat(),
        }

        logs.append(log)
        db["data"] = logs
        self._write(self.logs_file, db)

    def get_expert_logs(
        self,
        expert_id: str = None,
        skill_id: str = None,
        action: str = None,
        limit: int = 100,
    ) -> list:
        """获取专家操作日志"""
        db = self._read(self.logs_file)
        logs = db.get("data", [])

        if expert_id:
            logs = [l for l in logs if l["expert_id"] == expert_id]
        if skill_id:
            logs = [l for l in logs if l["skill_id"] == skill_id]
        if action:
            logs = [l for l in logs if l["action"] == action]

        return sorted(logs, key=lambda x: x["timestamp"], reverse=True)[:limit]

    def get_expert_stats(self) -> dict:
        """获取专家统计信息"""
        db = self._read(self.reviews_file)
        reviews = db.get("data", [])

        expert_stats = {}
        for review in reviews:
            expert_id = review["expert_id"]
            if expert_id not in expert_stats:
                expert_stats[expert_id] = {
                    "expert_id": expert_id,
                    "expert_name": review["expert_name"],
                    "total_reviews": 0,
                    "avg_scores": {},
                    "recommendation_rate": 0,
                }

            expert_stats[expert_id]["total_reviews"] += 1

            # 计算各维度平均分
            for dim_name, dim_data in review.get("dimensions", {}).items():
                if dim_name not in expert_stats[expert_id]["avg_scores"]:
                    expert_stats[expert_id]["avg_scores"][dim_name] = []
                expert_stats[expert_id]["avg_scores"][dim_name].append(
                    dim_data.get("score", 0)
                )

        # 计算最终平均分
        for expert_id in expert_stats:
            for dim_name in expert_stats[expert_id]["avg_scores"]:
                scores = expert_stats[expert_id]["avg_scores"][dim_name]
                expert_stats[expert_id]["avg_scores"][dim_name] = round(
                    sum(scores) / len(scores), 1
                )

        return {
            "experts": list(expert_stats.values()),
            "total_reviews": len(reviews),
        }


# 全局实例
expert_db = ExpertReviewDatabase()
