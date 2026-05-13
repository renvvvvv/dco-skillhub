"""Skill评分和埋点数据存储 - 新版（支持三个奖项）"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from collections import defaultdict

from app.config import DATA_DIR

# 数据文件路径
METRICS_EVENTS_FILE = DATA_DIR / "metrics_events.json"
SKILL_METRICS_FILE = DATA_DIR / "skill_metrics.json"
SKILL_RATINGS_FILE = DATA_DIR / "skill_ratings.json"


class MetricsDatabase:
    """埋点和评分数据库"""

    def __init__(self):
        self.events_file = METRICS_EVENTS_FILE
        self.metrics_file = SKILL_METRICS_FILE
        self.ratings_file = SKILL_RATINGS_FILE
        self._ensure_files()

    def _ensure_files(self):
        """确保数据文件存在"""
        for file_path in [self.events_file, self.metrics_file, self.ratings_file]:
            if not file_path.exists():
                file_path.write_text(json.dumps({"data": {}}, ensure_ascii=False))

    def _read(self, file_path: Path) -> dict:
        """读取数据"""
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except:
            return {"data": {}}

    def _write(self, file_path: Path, data: dict):
        """写入数据"""
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ========== 事件追踪 ==========

    def track_event(
        self,
        event_type: str,
        skill_id: str = None,
        user_id: str = None,
        data: dict = None,
        ip: str = None,
    ) -> dict:
        """记录事件"""
        db = self._read(self.events_file)
        events = db.get("data", [])

        event = {
            "id": str(uuid.uuid4()),
            "event": event_type,
            "skill_id": skill_id,
            "user_id": user_id or ip,
            "data": data or {},
            "ip": ip,
            "timestamp": datetime.now().isoformat(),
        }
        events.append(event)

        # 只保留最近90天的事件
        cutoff = (datetime.now() - timedelta(days=90)).isoformat()
        events = [e for e in events if e["timestamp"] > cutoff]

        db["data"] = events
        self._write(self.events_file, db)

        # 更新Skill指标
        if skill_id:
            self._update_skill_metrics(skill_id, event_type, data)

        return event

    def _update_skill_metrics(self, skill_id: str, event_type: str, data: dict = None):
        """更新Skill指标"""
        db = self._read(self.metrics_file)
        metrics = db.get("data", {})

        if skill_id not in metrics:
            metrics[skill_id] = {
                "total_views": 0,
                "total_downloads": 0,
                "total_opens": 0,
                "total_uses": 0,
                "total_use_duration": 0,
                "total_favorites": 0,
                "total_shares": 0,
                "total_comments": 0,
                "total_ratings": 0,
                "rating_sum": 0,
                "avg_rating": 0,
                "search_clicks": 0,
                "recommend_shows": 0,
                "recommend_clicks": 0,
                "daily_downloads": {},
                "daily_uses": {},
                "daily_durations": {},
                "last_updated": datetime.now().isoformat(),
            }

        today = datetime.now().strftime("%Y-%m-%d")
        m = metrics[skill_id]

        if event_type == "skill.view":
            m["total_views"] += 1
        elif event_type == "skill.download":
            m["total_downloads"] += 1
            m["daily_downloads"][today] = m["daily_downloads"].get(today, 0) + 1
        elif event_type == "skill.open":
            m["total_opens"] += 1
        elif event_type == "skill.use":
            m["total_uses"] += 1
            m["daily_uses"][today] = m["daily_uses"].get(today, 0) + 1
            if data and "duration" in data:
                duration = data["duration"]
                m["total_use_duration"] += duration
                m["daily_durations"][today] = (
                    m["daily_durations"].get(today, 0) + duration
                )
        elif event_type == "skill.favorite":
            m["total_favorites"] += 1
        elif event_type == "skill.share":
            m["total_shares"] += 1
        elif event_type == "skill.comment":
            m["total_comments"] += 1
        elif event_type == "skill.rate":
            if data and "rating" in data:
                m["total_ratings"] += 1
                m["rating_sum"] += data["rating"]
                m["avg_rating"] = round(m["rating_sum"] / m["total_ratings"], 1)
        elif event_type == "skill.search_click":
            m["search_clicks"] += 1
        elif event_type == "skill.recommend_show":
            m["recommend_shows"] += 1
        elif event_type == "skill.recommend_click":
            m["recommend_clicks"] += 1

        m["last_updated"] = datetime.now().isoformat()
        db["data"] = metrics
        self._write(self.metrics_file, db)

    # ========== 评分系统 ==========

    def add_rating(
        self, skill_id: str, user_id: str, rating: int, comment: str = None
    ) -> dict:
        """添加评分"""
        db = self._read(self.ratings_file)
        ratings = db.get("data", {})

        if skill_id not in ratings:
            ratings[skill_id] = []

        # 检查是否已评分
        existing = [r for r in ratings[skill_id] if r["user_id"] == user_id]
        if existing:
            existing[0]["rating"] = rating
            existing[0]["comment"] = comment
            existing[0]["updated_at"] = datetime.now().isoformat()
        else:
            ratings[skill_id].append(
                {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "rating": rating,
                    "comment": comment,
                    "created_at": datetime.now().isoformat(),
                }
            )

        # 更新平均分
        self._update_avg_rating(skill_id, ratings[skill_id])

        db["data"] = ratings
        self._write(self.ratings_file, db)

        return {"success": True}

    def _update_avg_rating(self, skill_id: str, ratings: list):
        """更新平均分"""
        if not ratings:
            return

        avg = sum(r["rating"] for r in ratings) / len(ratings)

        db = self._read(self.metrics_file)
        metrics = db.get("data", {})

        if skill_id not in metrics:
            metrics[skill_id] = {}

        metrics[skill_id]["avg_rating"] = round(avg, 1)
        metrics[skill_id]["rating_count"] = len(ratings)
        metrics[skill_id]["last_updated"] = datetime.now().isoformat()

        db["data"] = metrics
        self._write(self.metrics_file, db)

    # ========== 查询接口 ==========

    def get_skill_stats(self, skill_id: str) -> dict:
        """获取Skill统计数据"""
        db = self._read(self.metrics_file)
        metrics = db.get("data", {})

        if skill_id not in metrics:
            return {
                "total_views": 0,
                "total_downloads": 0,
                "total_opens": 0,
                "total_uses": 0,
                "total_use_duration": 0,
                "total_favorites": 0,
                "total_shares": 0,
                "total_comments": 0,
                "total_ratings": 0,
                "avg_rating": 0,
                "search_clicks": 0,
                "recommend_shows": 0,
                "recommend_clicks": 0,
            }

        return metrics[skill_id]

    def get_skill_events(
        self, skill_id: str, event_type: str = None, days: int = 30
    ) -> list:
        """获取Skill事件列表"""
        db = self._read(self.events_file)
        events = db.get("data", [])

        cutoff = (datetime.now() - timedelta(days=days)).isoformat()

        filtered = [
            e for e in events if e["skill_id"] == skill_id and e["timestamp"] > cutoff
        ]

        if event_type:
            filtered = [e for e in filtered if e["event"] == event_type]

        return filtered

    def get_top_skills(self, metric: str = "total_downloads", limit: int = 10) -> list:
        """获取排行榜"""
        db = self._read(self.metrics_file)
        metrics = db.get("data", {})

        sorted_skills = sorted(
            metrics.items(), key=lambda x: x[1].get(metric, 0), reverse=True
        )

        return [
            {"skill_id": skill_id, **stats} for skill_id, stats in sorted_skills[:limit]
        ]

    # ========== 三个奖项的评分计算 ==========

    def calculate_quality_score(self, skill_id: str, skill_data: dict = None) -> dict:
        """计算应用质量奖评分"""
        stats = self.get_skill_stats(skill_id)

        # 质量水平 (40分)
        readme_length = len(skill_data.get("readme_content", "")) if skill_data else 0
        readme_score = min(readme_length / 200, 15)

        tag_count = len(skill_data.get("tags", [])) if skill_data else 0
        tag_score = min(tag_count * 2, 10)

        version_count = len(skill_data.get("versions", [])) if skill_data else 0
        version_score = min(version_count * 5, 10)

        # 代码规范分（简化版，假设有代码规范检测）
        code_score = 5  # 默认满分，实际应该通过代码检测

        quality_score = readme_score + tag_score + version_score + code_score

        # 使用价值 (30分)
        usage_score = min(stats.get("total_downloads", 0) * 1.5, 30)

        # 创新程度 (20分)
        complex_tags = ["Agent开发", "MCP开发", "自动化开发"]
        tags = skill_data.get("tags", []) if skill_data else []
        matched_tags = [tag for tag in tags if any(ct in tag for ct in complex_tags)]
        innovation_score = min(len(matched_tags) * 5, 20)

        # 维护活跃度 (10分)
        maintenance_score = 0
        if skill_data:
            update_days = (
                datetime.now()
                - datetime.fromisoformat(
                    skill_data.get("updated_at", datetime.now().isoformat())
                )
            ).days
            maintenance_score = max(0, 10 - update_days / 15)

        total_score = quality_score + usage_score + innovation_score + maintenance_score

        return {
            "total_score": round(total_score, 1),
            "quality_score": round(quality_score, 1),
            "usage_score": round(usage_score, 1),
            "innovation_score": round(innovation_score, 1),
            "maintenance_score": round(maintenance_score, 1),
            "details": {
                "readme": {
                    "length": readme_length,
                    "score": round(readme_score, 1),
                    "max": 15,
                },
                "tags": {
                    "count": tag_count,
                    "score": round(tag_score, 1),
                    "max": 10,
                    "matched": matched_tags,
                },
                "versions": {
                    "count": version_count,
                    "score": round(version_score, 1),
                    "max": 10,
                },
                "code": {"score": code_score, "max": 5},
            },
            "stats": stats,
        }

    def calculate_popularity_score(
        self, skill_id: str, skill_data: dict = None
    ) -> dict:
        """计算用户喜爱奖评分（人气指数）"""
        stats = self.get_skill_stats(skill_id)

        # 使用深度 (40%)
        download_score = stats.get("total_downloads", 0) * 2
        use_score = stats.get("total_uses", 0) * 5
        duration_score = stats.get("total_use_duration", 0) * 0.5
        usage_depth = min(download_score + use_score + duration_score, 400)

        # 互动热度 (35%)
        favorite_score = stats.get("total_favorites", 0) * 10
        rating_score = stats.get("total_ratings", 0) * 20
        comment_score = stats.get("total_comments", 0) * 5
        interaction_heat = min(favorite_score + rating_score + comment_score, 350)

        # 传播广度 (25%)
        share_score = stats.get("total_shares", 0) * 15
        search_score = stats.get("search_clicks", 0) * 3
        recommend_score = stats.get("recommend_shows", 0) * 0.1
        spread_breadth = min(share_score + search_score + recommend_score, 250)

        # 人气指数 (0-1000)
        popularity_index = usage_depth + interaction_heat + spread_breadth

        return {
            "popularity_index": round(popularity_index, 1),
            "usage_depth": round(usage_depth, 1),
            "interaction_heat": round(interaction_heat, 1),
            "spread_breadth": round(spread_breadth, 1),
            "details": {
                "downloads": {
                    "count": stats.get("total_downloads", 0),
                    "score": download_score,
                },
                "uses": {"count": stats.get("total_uses", 0), "score": use_score},
                "duration": {
                    "total": stats.get("total_use_duration", 0),
                    "score": duration_score,
                },
                "favorites": {
                    "count": stats.get("total_favorites", 0),
                    "score": favorite_score,
                },
                "ratings": {
                    "count": stats.get("total_ratings", 0),
                    "score": rating_score,
                },
                "comments": {
                    "count": stats.get("total_comments", 0),
                    "score": comment_score,
                },
                "shares": {"count": stats.get("total_shares", 0), "score": share_score},
                "search_clicks": {
                    "count": stats.get("search_clicks", 0),
                    "score": search_score,
                },
                "recommend_shows": {
                    "count": stats.get("recommend_shows", 0),
                    "score": recommend_score,
                },
            },
            "stats": stats,
        }

    def calculate_innovation_score(
        self, skill_id: str, skill_data: dict = None
    ) -> dict:
        """计算卓越创新奖评分"""
        stats = self.get_skill_stats(skill_id)

        # 使用价值 (35%)
        usage_score = min(stats.get("total_downloads", 0) * 2, 35)

        # 质量水平 (25%)
        quality_score = 0
        if skill_data:
            readme_score = min(len(skill_data.get("readme_content", "")) / 100, 10)
            tag_score = min(len(skill_data.get("tags", [])) * 2, 10)
            version_score = min(len(skill_data.get("versions", [])) * 5, 5)
            quality_score = readme_score + tag_score + version_score

        # 创新程度 (20%)
        innovation_score = 0
        if skill_data:
            complex_tags = ["Agent开发", "MCP开发", "自动化开发"]
            tags = skill_data.get("tags", [])
            innovation_score = sum(
                5 for tag in tags if any(ct in tag for ct in complex_tags)
            )
            innovation_score = min(innovation_score, 20)

        # 推广效果 (15%)
        promotion_score = min(
            stats.get("search_clicks", 0) * 0.5
            + stats.get("total_favorites", 0) * 2
            + stats.get("total_shares", 0) * 3,
            15,
        )

        # 维护活跃度 (5%)
        maintenance_score = 0
        if skill_data:
            update_days = (
                datetime.now()
                - datetime.fromisoformat(
                    skill_data.get("updated_at", datetime.now().isoformat())
                )
            ).days
            maintenance_score = max(0, 5 - update_days / 30)

        total_score = (
            usage_score
            + quality_score
            + innovation_score
            + promotion_score
            + maintenance_score
        )

        return {
            "total_score": round(total_score, 1),
            "usage_score": round(usage_score, 1),
            "quality_score": round(quality_score, 1),
            "innovation_score": round(innovation_score, 1),
            "promotion_score": round(promotion_score, 1),
            "maintenance_score": round(maintenance_score, 1),
            "stats": stats,
        }

    def get_arena_candidates(self, skills: list) -> dict:
        """获取Skill擂台候选人（三个奖项）"""
        candidates = {
            "quality": [],  # 应用质量奖
            "popularity": [],  # 用户喜爱奖
            "innovation": [],  # 卓越创新奖
        }

        approved_skills = [s for s in skills if s.get("status") == "approved"]

        # 应用质量奖：按质量评分排名
        quality_scores = []
        for skill in approved_skills:
            score_data = self.calculate_quality_score(skill["slug"], skill)
            quality_scores.append(
                {
                    "skill": skill,
                    "score": score_data,
                }
            )

        quality_candidates = sorted(
            quality_scores, key=lambda x: x["score"]["total_score"], reverse=True
        )[:10]

        for rank, item in enumerate(quality_candidates, 1):
            skill = item["skill"]
            score = item["score"]
            candidates["quality"].append(
                {
                    "rank": rank,
                    "skill_name": skill.get("name", ""),
                    "skill_slug": skill.get("slug", ""),
                    "author": skill.get("author_name", ""),
                    "department": skill.get("author_department", ""),
                    "organization": skill.get("author_organization", ""),
                    "total_score": score["total_score"],
                    "quality_score": score["quality_score"],
                    "usage_score": score["usage_score"],
                    "innovation_score": score["innovation_score"],
                    "maintenance_score": score["maintenance_score"],
                    "level": self._get_score_level(score["total_score"]),
                }
            )

        # 用户喜爱奖：按人气指数排名
        popularity_scores = []
        for skill in approved_skills:
            score_data = self.calculate_popularity_score(skill["slug"], skill)
            popularity_scores.append(
                {
                    "skill": skill,
                    "score": score_data,
                }
            )

        popularity_candidates = sorted(
            popularity_scores,
            key=lambda x: x["score"]["popularity_index"],
            reverse=True,
        )[:10]

        for rank, item in enumerate(popularity_candidates, 1):
            skill = item["skill"]
            score = item["score"]
            candidates["popularity"].append(
                {
                    "rank": rank,
                    "skill_name": skill.get("name", ""),
                    "skill_slug": skill.get("slug", ""),
                    "author": skill.get("author_name", ""),
                    "department": skill.get("author_department", ""),
                    "organization": skill.get("author_organization", ""),
                    "popularity_index": score["popularity_index"],
                    "usage_depth": score["usage_depth"],
                    "interaction_heat": score["interaction_heat"],
                    "spread_breadth": score["spread_breadth"],
                }
            )

        # 卓越创新奖：按综合评分排名
        innovation_scores = []
        for skill in approved_skills:
            score_data = self.calculate_innovation_score(skill["slug"], skill)
            innovation_scores.append(
                {
                    "skill": skill,
                    "score": score_data,
                }
            )

        innovation_candidates = sorted(
            innovation_scores, key=lambda x: x["score"]["total_score"], reverse=True
        )[:10]

        for rank, item in enumerate(innovation_candidates, 1):
            skill = item["skill"]
            score = item["score"]
            candidates["innovation"].append(
                {
                    "rank": rank,
                    "skill_name": skill.get("name", ""),
                    "skill_slug": skill.get("slug", ""),
                    "author": skill.get("author_name", ""),
                    "department": skill.get("author_department", ""),
                    "organization": skill.get("author_organization", ""),
                    "total_score": score["total_score"],
                    "usage_score": score["usage_score"],
                    "quality_score": score["quality_score"],
                    "innovation_score": score["innovation_score"],
                    "promotion_score": score["promotion_score"],
                    "maintenance_score": score["maintenance_score"],
                }
            )

        return candidates

    def _get_score_level(self, total_score: float) -> str:
        """获取评分等级"""
        if total_score >= 90:
            return "S"
        elif total_score >= 75:
            return "A"
        elif total_score >= 60:
            return "B"
        elif total_score >= 45:
            return "C"
        else:
            return "D"


# 全局实例
metrics_db = MetricsDatabase()
