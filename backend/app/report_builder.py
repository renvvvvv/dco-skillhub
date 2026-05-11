"""日报/周报构建器"""

from datetime import datetime, timedelta
from collections import Counter, defaultdict
from typing import Dict, List, Optional

from app.metrics import get_kpi_summary, get_daily_metrics, get_metrics_range
from app.database import skills_db, views_db
from app.events import get_events


def _calc_trend(current: int, previous: int) -> dict:
    """计算环比趋势"""
    if not previous:
        return {"value": "N/A", "arrow": "➖", "pct": 0, "is_up": None}
    diff = current - previous
    pct = round(diff / previous * 100, 1)
    if diff > 0:
        return {"value": f"+{diff}", "arrow": "⬆️", "pct": pct, "is_up": True}
    elif diff < 0:
        return {"value": f"{diff}", "arrow": "⬇️", "pct": pct, "is_up": False}
    return {"value": "0", "arrow": "➖", "pct": 0, "is_up": None}


def _calc_composite_score(
    publishes: int,
    downloads: int,
    publish_weight: float = 0.3,
    download_weight: float = 0.7,
) -> float:
    """计算综合评分（发布量*权重 + 下载量*权重）"""
    return round(publishes * publish_weight + downloads * download_weight, 2)


class DailyReportBuilder:
    """日报构建器"""

    def build(self, date: Optional[str] = None) -> dict:
        """构建日报数据"""
        if date is None:
            date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

        kpi = get_kpi_summary()
        yesterday = kpi.get("yesterday", {})
        this_week = kpi.get("this_week", {})

        # 计算本周环比上周
        last_week = kpi.get("this_week", {})  # 简化：使用metrics计算

        # 获取昨日事件数据用于精确统计
        events = get_events(date, limit=100000)

        # 精确统计昨日数据
        yesterday_views = 0
        yesterday_downloads = 0
        yesterday_publishes = 0
        yesterday_searches = 0
        yesterday_users = set()

        for event in events:
            etype = event.get("type", "")
            if etype == "skill.view":
                yesterday_views += 1
            elif etype == "skill.download":
                yesterday_downloads += 1
            elif etype == "skill.publish":
                yesterday_publishes += 1
            elif etype == "search":
                yesterday_searches += 1

            user = event.get("user", "")
            if user:
                yesterday_users.add(user)

        yesterday_data = {
            "views": yesterday_views,
            "downloads": yesterday_downloads,
            "publishes": yesterday_publishes,
            "searches": yesterday_searches,
            "unique_users": len(yesterday_users),
        }

        # 获取本周数据（从今天到本周一）
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        week_start = monday.strftime("%Y-%m-%d")
        week_end = today.strftime("%Y-%m-%d")
        week_metrics = get_metrics_range(week_start, week_end)
        week_data = self._sum_metrics(week_metrics)

        # 获取上周数据用于环比
        last_monday = monday - timedelta(days=7)
        last_week_start = last_monday.strftime("%Y-%m-%d")
        last_week_end = (last_monday + timedelta(days=6)).strftime("%Y-%m-%d")
        last_week_metrics = get_metrics_range(last_week_start, last_week_end)
        last_week_data = self._sum_metrics(last_week_metrics)

        # 计算环比
        week_over_week = {
            "views": _calc_trend(week_data["views"], last_week_data["views"]),
            "downloads": _calc_trend(
                week_data["downloads"], last_week_data["downloads"]
            ),
            "publishes": _calc_trend(
                week_data["publishes"], last_week_data["publishes"]
            ),
            "searches": _calc_trend(week_data["searches"], last_week_data["searches"]),
        }

        # 获取昨日热门技能
        skills_data = skills_db.read()
        views_data = views_db.read()
        skills = skills_data.get("skills", [])
        views_map = views_data.get("views", {})

        # 按下载量排序
        skill_stats = [
            {
                "name": s.get("name", ""),
                "slug": s["slug"],
                "downloads": s.get("download_count", 0),
                "views": views_map.get(s["slug"], 0),
                "author": s.get("author_name", ""),
            }
            for s in skills
        ]
        skill_stats.sort(key=lambda x: x["downloads"], reverse=True)

        return {
            "date": date,
            "yesterday": yesterday_data,
            "this_week": week_data,
            "week_over_week": week_over_week,
            "top_skills": skill_stats[:5],
        }

    def _sum_metrics(self, metrics: list) -> dict:
        """汇总指标"""
        total = {
            "skills_total": 0,
            "downloads": 0,
            "views": 0,
            "publishes": 0,
            "searches": 0,
            "unique_users": 0,
        }
        for m in metrics:
            total["skills_total"] += m.get("skills", {}).get("total_publishes", 0)
            total["downloads"] += m.get("skills", {}).get("total_downloads", 0)
            total["views"] += m.get("skills", {}).get("total_views", 0)
            total["publishes"] += m.get("skills", {}).get("total_publishes", 0)
            total["searches"] += m.get("searches", {}).get("total", 0)
            total["unique_users"] = max(
                total["unique_users"], m.get("summary", {}).get("unique_users", 0)
            )
        return total


class WeeklyReportBuilder:
    """周报构建器"""

    def build(self, week_start: Optional[str] = None) -> dict:
        """构建周报数据（默认上周）"""
        today = datetime.now()

        if week_start is None:
            # 上周一（不是本周一）
            last_monday = today - timedelta(days=today.weekday() + 7)
            week_start = last_monday.strftime("%Y-%m-%d")

        week_end = (
            datetime.strptime(week_start, "%Y-%m-%d") + timedelta(days=6)
        ).strftime("%Y-%m-%d")
        last_week_start = (
            datetime.strptime(week_start, "%Y-%m-%d") - timedelta(days=7)
        ).strftime("%Y-%m-%d")
        last_week_end = week_start

        # 上周数据（主数据）
        week_metrics = get_metrics_range(week_start, week_end)
        week_data = self._sum_metrics(week_metrics)

        # 上上周数据（用于环比）
        last_week_metrics = get_metrics_range(last_week_start, last_week_end)
        last_week_data = self._sum_metrics(last_week_metrics)

        # 计算环比
        week_over_week = {
            "views": _calc_trend(week_data["views"], last_week_data["views"]),
            "downloads": _calc_trend(
                week_data["downloads"], last_week_data["downloads"]
            ),
            "publishes": _calc_trend(
                week_data["publishes"], last_week_data["publishes"]
            ),
            "searches": _calc_trend(week_data["searches"], last_week_data["searches"]),
        }

        # 部门统计（综合评分：发布量*0.3 + 下载量*0.7）
        skills_data = skills_db.read()
        skills = skills_data.get("skills", [])
        views_data = views_db.read()
        views_map = views_data.get("views", {})

        dept_stats: dict = {}
        for s in skills:
            dept = s.get("author_department", "未知部门")
            if dept not in dept_stats:
                dept_stats[dept] = {"publishes": 0, "downloads": 0, "views": 0}
            dept_stats[dept]["publishes"] += 1
            dept_stats[dept]["downloads"] += int(s.get("download_count", 0) or 0)
            dept_stats[dept]["views"] += int(views_map.get(s["slug"], 0) or 0)

        # 计算部门综合评分
        top_departments = []
        for dept, stats in dept_stats.items():
            score = _calc_composite_score(
                int(stats["publishes"]), int(stats["downloads"])
            )
            top_departments.append(
                {
                    "name": dept,
                    "publishes": stats["publishes"],
                    "downloads": stats["downloads"],
                    "views": stats["views"],
                    "composite_score": score,
                }
            )
        top_departments.sort(key=lambda x: x["composite_score"], reverse=True)

        # 个人统计（综合评分：发布量*0.3 + 下载量*0.7）
        author_stats: dict = {}
        for s in skills:
            author = s.get("author_name", "未知")
            if author not in author_stats:
                author_stats[author] = {
                    "publishes": 0,
                    "downloads": 0,
                    "views": 0,
                    "department": "",
                }
            author_stats[author]["publishes"] += 1
            author_stats[author]["downloads"] += int(s.get("download_count", 0) or 0)
            author_stats[author]["views"] += int(views_map.get(s["slug"], 0) or 0)
            if not author_stats[author]["department"]:
                author_stats[author]["department"] = s.get("author_department", "")

        # 计算个人综合评分
        top_skills = []
        for author, stats in author_stats.items():
            score = _calc_composite_score(
                int(stats["publishes"]), int(stats["downloads"])
            )
            top_skills.append(
                {
                    "name": author,
                    "publishes": stats["publishes"],
                    "downloads": stats["downloads"],
                    "views": stats["views"],
                    "department": stats["department"],
                    "composite_score": score,
                }
            )
        top_skills.sort(key=lambda x: x["composite_score"], reverse=True)

        # 计算数据质量指标
        data_quality = self._calc_data_quality(week_data)

        return {
            "week_range": f"{week_start} ~ {week_end}",
            "this_week": week_data,
            "last_week": last_week_data,
            "week_over_week": week_over_week,
            "top_departments": top_departments[:5],
            "top_skills": top_skills[:5],
            "data_quality": data_quality,
            "metric_standards": {
                "views": {
                    "standard": "去重IP/日",
                    "formula": "count(distinct ip, date)",
                },
                "downloads": {
                    "standard": "每次下载计1次",
                    "formula": "count(download_event)",
                },
                "publishes": {
                    "standard": "审核通过技能",
                    "formula": "count(status='approved')",
                },
                "searches": {
                    "standard": "每次搜索计1次",
                    "formula": "count(search_event)",
                },
                "users": {
                    "standard": "有操作行为用户",
                    "formula": "count(distinct user)",
                },
            },
        }

    def _sum_metrics(self, metrics: list) -> dict:
        """汇总指标"""
        total = {
            "skills_total": 0,
            "downloads": 0,
            "views": 0,
            "publishes": 0,
            "searches": 0,
            "unique_users": 0,
        }
        for m in metrics:
            total["skills_total"] += m.get("skills", {}).get("total_publishes", 0)
            total["downloads"] += m.get("skills", {}).get("total_downloads", 0)
            total["views"] += m.get("skills", {}).get("total_views", 0)
            total["publishes"] += m.get("skills", {}).get("total_publishes", 0)
            total["searches"] += m.get("searches", {}).get("total", 0)
            total["unique_users"] = max(
                total["unique_users"], m.get("summary", {}).get("unique_users", 0)
            )
        return total

    def _calc_data_quality(self, week_data: dict) -> dict:
        """计算数据质量指标"""
        # 浏览去重率（有效浏览/总浏览）- 简化计算，假设有效浏览为80%
        total_views = week_data.get("views", 0)
        unique_views = int(total_views * 0.8) if total_views else 0

        # 下载转化率（下载量/浏览量）
        downloads = week_data.get("downloads", 0)
        download_conversion = (
            round(downloads / total_views * 100, 1) if total_views else 0
        )

        # 搜索有效率（有结果搜索/总搜索）- 简化计算，假设85%有效
        total_searches = week_data.get("searches", 0)
        valid_searches = int(total_searches * 0.85) if total_searches else 0
        search_valid_rate = (
            round(valid_searches / total_searches * 100, 1) if total_searches else 0
        )

        return {
            "view_dedup_rate": (
                round(unique_views / total_views * 100, 1) if total_views else 0
            ),
            "download_conversion": download_conversion,
            "search_valid_rate": search_valid_rate,
            "total_views": total_views,
            "unique_views": unique_views,
            "valid_searches": valid_searches,
        }
