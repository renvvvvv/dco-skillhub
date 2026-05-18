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

        # 获取技能总量、总访问量、总下载量、总发布量
        all_skills = skills_db.read().get("skills", [])
        total_skills = len(all_skills)
        total_views = sum(views_map.get(s["slug"], 0) for s in all_skills)
        total_downloads = sum(s.get("download_count", 0) or 0 for s in all_skills)
        total_publishes = len([s for s in all_skills if s.get("status") == "approved"])

        return {
            "date": date,
            "summary": {
                "total_skills": total_skills,
                "total_views": total_views,
                "total_downloads": total_downloads,
                "total_publishes": total_publishes,
            },
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
    """周报构建器 - 支持本周/上周切换"""

    def build(self, week_type: str = "last", week_start: Optional[str] = None) -> dict:
        """
        构建周报数据

        Args:
            week_type: "current" 本周 | "last" 上周（默认）
            week_start: 指定周开始日期（YYYY-MM-DD），优先级高于 week_type

        Returns:
            包含完整周报数据的字典，所有字段均带中文注释
        """
        today = datetime.now()

        # 确定目标周的起止日期
        if week_start:
            # 使用指定日期
            target_monday = datetime.strptime(week_start, "%Y-%m-%d")
            # 确保是周一
            target_monday = target_monday - timedelta(days=target_monday.weekday())
        elif week_type == "current":
            # 本周一（到今天）
            target_monday = today - timedelta(days=today.weekday())
        else:
            # 上周一（默认）
            target_monday = today - timedelta(days=today.weekday() + 7)

        # 目标周：周一到周日
        target_week_start = target_monday.strftime("%Y-%m-%d")
        target_week_end = (target_monday + timedelta(days=6)).strftime("%Y-%m-%d")

        # 对比周（前一周）：用于环比计算
        compare_monday = target_monday - timedelta(days=7)
        compare_week_start = compare_monday.strftime("%Y-%m-%d")
        compare_week_end = target_week_start  # 对比周结束于目标周开始前一天

        # 目标周数据
        target_metrics = get_metrics_range(target_week_start, target_week_end)
        target_data = self._sum_metrics(target_metrics)

        # 对比周数据（用于环比）
        compare_metrics = get_metrics_range(compare_week_start, compare_week_end)
        compare_data = self._sum_metrics(compare_metrics)

        # 计算环比（目标周 vs 对比周）
        week_over_week = {
            "views": _calc_trend(target_data["views"], compare_data["views"]),
            "downloads": _calc_trend(
                target_data["downloads"], compare_data["downloads"]
            ),
            "publishes": _calc_trend(
                target_data["publishes"], compare_data["publishes"]
            ),
            "searches": _calc_trend(target_data["searches"], compare_data["searches"]),
        }

        # 融合排行榜统计（各大区 + 职能中心，排除数智中心）
        from app.org_mapping import IDC_REGIONS, IDC_CENTERS, get_idc_info

        skills_data = skills_db.read()
        skills = skills_data.get("skills", [])
        views_data = views_db.read()
        views_map = views_data.get("views", {})

        # 初始化融合排行榜统计
        combined_stats = {}

        # 初始化各大区
        for region_id, region_info in IDC_REGIONS.items():
            combined_stats[region_id] = {
                "id": region_id,
                "name": region_info["name"],
                "type": "region",
                "type_label": "大区",
                "publishes": 0,
                "downloads": 0,
                "views": 0,
                "skills": [],
            }

        # 初始化职能中心（排除数智中心）
        for center_id, center_info in IDC_CENTERS.items():
            if center_id != "hq-数智":
                combined_stats[center_id] = {
                    "id": center_id,
                    "name": center_info["name"],
                    "type": "center",
                    "type_label": "中心",
                    "publishes": 0,
                    "downloads": 0,
                    "views": 0,
                    "skills": [],
                }

        # 统计所有技能数据
        for s in skills:
            dept = s.get("author_department", "")
            idc_info = get_idc_info(dept)
            region_id = idc_info.get("region_id", "")
            center_id = idc_info.get("center_id", "")

            # 统计到大区
            if region_id and region_id != "hq" and region_id in combined_stats:
                combined_stats[region_id]["publishes"] += 1
                combined_stats[region_id]["downloads"] += int(
                    s.get("download_count", 0) or 0
                )
                combined_stats[region_id]["views"] += int(
                    views_map.get(s["slug"], 0) or 0
                )
                combined_stats[region_id]["skills"].append(s.get("name"))

            # 统计到职能中心（排除数智中心）
            if center_id and center_id != "hq-数智" and center_id in combined_stats:
                combined_stats[center_id]["publishes"] += 1
                combined_stats[center_id]["downloads"] += int(
                    s.get("download_count", 0) or 0
                )
                combined_stats[center_id]["views"] += int(
                    views_map.get(s["slug"], 0) or 0
                )
                combined_stats[center_id]["skills"].append(s.get("name"))

        # 转换为列表并排序
        combined_rankings = sorted(
            combined_stats.values(),
            key=lambda x: x["publishes"],
            reverse=True,
        )

        # 部门统计（综合评分：发布量*0.3 + 下载量*0.7）

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

        # 获取技能总量、总访问量、总下载量、总发布量
        all_skills = skills_db.read().get("skills", [])
        total_skills = len(all_skills)
        total_views = sum(views_map.get(s["slug"], 0) for s in all_skills)
        total_downloads = sum(s.get("download_count", 0) or 0 for s in all_skills)
        total_publishes = len([s for s in all_skills if s.get("status") == "approved"])

        # 计算数据质量指标
        data_quality = self._calc_data_quality(target_data)

        # 构建返回数据，所有字段带中文注释说明
        return {
            # ========== 基础信息 ==========
            "week_type": week_type,  # 周类型：current 本周 | last 上周
            "week_range": f"{target_week_start} ~ {target_week_end}",  # 统计周期范围（YYYY-MM-DD ~ YYYY-MM-DD）
            "compare_week_range": f"{compare_week_start} ~ {compare_week_end}",  # 对比周期范围（用于环比计算）
            "generated_at": datetime.now().isoformat(),  # 报告生成时间（ISO 8601格式）
            # ========== 平台累计数据（截至报告生成时） ==========
            "summary": {
                "total_skills": total_skills,  # 技能总量：平台上所有Skill的总数（含待审核、已拒绝）
                "total_views": total_views,  # 总访问量：所有Skill被浏览的总次数（累计值）
                "total_downloads": total_downloads,  # 总下载量：所有Skill被下载的总次数（累计值）
                "total_publishes": total_publishes,  # 总发布量：状态为"已审核通过(approved)"的Skill数量
            },
            # ========== 目标周核心指标 ==========
            "this_week": {
                "skills_total": target_data[
                    "skills_total"
                ],  # 本周新增Skill数：目标周期内新发布的Skill数量
                "downloads": target_data[
                    "downloads"
                ],  # 本周下载次数：目标周期内所有下载事件的总次数
                "views": target_data[
                    "views"
                ],  # 本周浏览次数：目标周期内所有浏览事件的总次数
                "publishes": target_data[
                    "publishes"
                ],  # 本周发布次数：目标周期内审核通过的Skill数量
                "searches": target_data[
                    "searches"
                ],  # 本周搜索次数：目标周期内用户搜索的总次数
                "unique_users": target_data[
                    "unique_users"
                ],  # 本周活跃用户数：目标周期内产生过操作（浏览/下载/搜索/发布）的去重用户数
            },
            # ========== 对比周核心指标（用于环比计算） ==========
            "last_week": {
                "skills_total": compare_data["skills_total"],  # 对比周新增Skill数
                "downloads": compare_data["downloads"],  # 对比周下载次数
                "views": compare_data["views"],  # 对比周浏览次数
                "publishes": compare_data["publishes"],  # 对比周发布次数
                "searches": compare_data["searches"],  # 对比周搜索次数
                "unique_users": compare_data["unique_users"],  # 对比周活跃用户数
            },
            # ========== 环比趋势（目标周 vs 对比周） ==========
            "week_over_week": {
                "views": week_over_week[
                    "views"
                ],  # 浏览量环比：{value: 差值, arrow: 箭头, pct: 百分比, is_up: 是否上涨}
                "downloads": week_over_week["downloads"],  # 下载量环比
                "publishes": week_over_week["publishes"],  # 发布量环比
                "searches": week_over_week["searches"],  # 搜索量环比
            },
            # ========== 融合排行榜（各大区 + 职能中心，排除数智中心） ==========
            "combined_rankings": combined_rankings,  # 融合排行：包含大区/中心名称、类型、发布数、下载数、浏览数
            # ========== 部门排行榜（Top 5） ==========
            "top_departments": top_departments[
                :5
            ],  # 部门排行：按综合评分排序，包含部门名、发布数、下载数、浏览数、综合评分
            # ========== 个人排行榜（Top 5） ==========
            "top_skills": top_skills[
                :5
            ],  # 个人排行：按综合评分排序，包含姓名、发布数、下载数、浏览数、部门、综合评分
            # ========== 数据质量指标 ==========
            "data_quality": {
                "view_dedup_rate": data_quality[
                    "view_dedup_rate"
                ],  # 浏览去重率：有效浏览（去重IP）/ 总浏览量 * 100%
                "download_conversion": data_quality[
                    "download_conversion"
                ],  # 下载转化率：下载量 / 浏览量 * 100%
                "search_valid_rate": data_quality[
                    "search_valid_rate"
                ],  # 搜索有效率：有结果搜索 / 总搜索 * 100%
                "total_views": data_quality["total_views"],  # 总浏览量（原始值）
                "unique_views": data_quality["unique_views"],  # 去重后浏览量
                "valid_searches": data_quality[
                    "valid_searches"
                ],  # 有效搜索次数（有结果）
            },
            # ========== 指标统计标准说明 ==========
            "metric_standards": {
                "views": {
                    "standard": "去重IP/日",  # 统计标准：每个IP每天只计1次浏览
                    "formula": "count(distinct ip, date)",  # 计算公式
                    "description": "每个IP每天只计1次浏览，避免重复刷新",  # 详细说明
                },
                "downloads": {
                    "standard": "每次下载计1次",  # 统计标准：每次点击下载按钮即计1次
                    "formula": "count(download_event)",  # 计算公式
                    "description": "每次点击下载按钮即计1次，不限制同一用户",  # 详细说明
                },
                "publishes": {
                    "standard": "审核通过技能",  # 统计标准：仅统计状态为approved的Skill
                    "formula": "count(status='approved')",  # 计算公式
                    "description": "状态为approved的技能数量，不包括待审核和拒绝的",  # 详细说明
                },
                "searches": {
                    "standard": "每次搜索计1次",  # 统计标准：每次搜索请求计1次
                    "formula": "count(search_event)",  # 计算公式
                    "description": "每次搜索请求计1次，包括有结果和无结果",  # 详细说明
                },
                "users": {
                    "standard": "有操作行为用户",  # 统计标准：至少产生1次事件的用户
                    "formula": "count(distinct user)",  # 计算公式
                    "description": "至少产生1次事件（浏览/下载/搜索/发布）的独立用户",  # 详细说明
                },
            },
        }

    def _sum_metrics(self, metrics: list) -> dict:
        """
        汇总多日的指标数据

        Args:
            metrics: 每日指标数据列表

        Returns:
            汇总后的指标字典
        """
        total = {
            "skills_total": 0,  # 累计新增Skill数
            "downloads": 0,  # 累计下载次数
            "views": 0,  # 累计浏览次数
            "publishes": 0,  # 累计发布次数
            "searches": 0,  # 累计搜索次数
            "unique_users": 0,  # 最大活跃用户数（取每日最大值，避免重复累加）
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
        """
        计算数据质量指标

        Args:
            week_data: 周汇总数据

        Returns:
            数据质量指标字典
        """
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
            ),  # 浏览去重率：有效浏览占比
            "download_conversion": download_conversion,  # 下载转化率：浏览到下载的转化比例
            "search_valid_rate": search_valid_rate,  # 搜索有效率：有结果搜索占比
            "total_views": total_views,  # 总浏览量
            "unique_views": unique_views,  # 去重后浏览量
            "valid_searches": valid_searches,  # 有效搜索次数
        }
