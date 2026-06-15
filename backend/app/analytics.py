"""统一数据分析模块

所有数据统一从事件日志实时计算，确保过滤黑名单IP
"""

from datetime import datetime, timedelta
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple
from app.events import get_events_range, get_event_dates
from app.config import BLOCKED_IPS
from app.database import skills_db
from app.org_mapping import get_idc_info, IDC_CENTERS, IDC_REGIONS


def get_date_range(start_date: str, end_date: str) -> List[str]:
    """获取日期范围内的所有日期"""
    dates = []
    current = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return dates


def get_filtered_events(start_date: str, end_date: str) -> List[dict]:
    """获取指定日期范围内已过滤的事件（排除黑名单IP）"""
    events = []
    for date in get_date_range(start_date, end_date):
        day_events = get_events_range(date, date)
        for event in day_events:
            if event.get("ip", "") not in BLOCKED_IPS:
                events.append(event)
    return events


def get_analytics_overview(start_date: str, end_date: str) -> dict:
    """获取运营概览数据（已过滤黑名单IP）"""
    events = get_filtered_events(start_date, end_date)

    downloads = sum(1 for e in events if e["type"] == "skill.download")
    views = sum(1 for e in events if e["type"] == "skill.view")
    searches = sum(1 for e in events if e["type"] == "search")
    publishes = sum(1 for e in events if e["type"] == "skill.publish")
    unique_users = len(set(e.get("user", "") for e in events if e.get("user")))

    return {
        "downloads": downloads,
        "views": views,
        "searches": searches,
        "publishes": publishes,
        "unique_users": unique_users,
        "period": f"{start_date} ~ {end_date}",
    }


def get_analytics_trend(start_date: str, end_date: str, group_by: str = "day") -> dict:
    """获取趋势数据

    Args:
        start_date: 开始日期
        end_date: 结束日期
        group_by: 聚合方式 - day(按天), 4days(按4天), week(按周), month(按月)
    """
    from datetime import datetime, timedelta

    dates = get_date_range(start_date, end_date)
    total_days = len(dates)

    # 根据天数自动确定聚合方式（如果未指定）
    if group_by == "auto":
        if total_days <= 7:
            group_by = "day"
        elif total_days <= 30:
            group_by = "4days"
        elif total_days <= 120:
            group_by = "week"
        else:
            group_by = "month"

    # 按天统计基础数据
    daily_data = {}
    for date in dates:
        events = get_events_range(date, date)
        filtered = [e for e in events if e.get("ip", "") not in BLOCKED_IPS]

        daily_data[date] = {
            "downloads": sum(1 for e in filtered if e["type"] == "skill.download"),
            "views": sum(1 for e in filtered if e["type"] == "skill.view"),
            "searches": sum(1 for e in filtered if e["type"] == "search"),
            "publishes": sum(1 for e in filtered if e["type"] == "skill.publish"),
        }

    # 根据聚合方式分组
    if group_by == "day":
        # 按天 - 直接返回
        result_dates = dates
        result = {
            "dates": result_dates,
            "downloads": [daily_data[d]["downloads"] for d in result_dates],
            "views": [daily_data[d]["views"] for d in result_dates],
            "searches": [daily_data[d]["searches"] for d in result_dates],
            "publishes": [daily_data[d]["publishes"] for d in result_dates],
        }

    elif group_by == "4days":
        # 按4天一组
        result_dates = []
        result = {
            "dates": result_dates,
            "downloads": [],
            "views": [],
            "searches": [],
            "publishes": [],
        }

        for i in range(0, len(dates), 4):
            group_dates = dates[i : i + 4]
            start_d = group_dates[0]
            end_d = group_dates[-1]

            if start_d == end_d:
                label = start_d[5:]  # MM-DD
            else:
                label = f"{start_d[5:]}~{end_d[5:]}"

            result_dates.append(label)
            result["downloads"].append(
                sum(daily_data[d]["downloads"] for d in group_dates)
            )
            result["views"].append(sum(daily_data[d]["views"] for d in group_dates))
            result["searches"].append(
                sum(daily_data[d]["searches"] for d in group_dates)
            )
            result["publishes"].append(
                sum(daily_data[d]["publishes"] for d in group_dates)
            )

    elif group_by == "week":
        # 按周分组（周一开始）
        result_dates = []
        result = {
            "dates": result_dates,
            "downloads": [],
            "views": [],
            "searches": [],
            "publishes": [],
        }

        current_week = []
        current_week_label = ""

        for date in dates:
            dt = datetime.strptime(date, "%Y-%m-%d")
            week_start = dt - timedelta(days=dt.weekday())
            week_label = f"{week_start.strftime('%m-%d')}周"

            if week_label != current_week_label and current_week:
                # 保存上一周
                result_dates.append(current_week_label)
                result["downloads"].append(
                    sum(daily_data[d]["downloads"] for d in current_week)
                )
                result["views"].append(
                    sum(daily_data[d]["views"] for d in current_week)
                )
                result["searches"].append(
                    sum(daily_data[d]["searches"] for d in current_week)
                )
                result["publishes"].append(
                    sum(daily_data[d]["publishes"] for d in current_week)
                )
                current_week = []

            current_week_label = week_label
            current_week.append(date)

        # 保存最后一周
        if current_week:
            result_dates.append(current_week_label)
            result["downloads"].append(
                sum(daily_data[d]["downloads"] for d in current_week)
            )
            result["views"].append(sum(daily_data[d]["views"] for d in current_week))
            result["searches"].append(
                sum(daily_data[d]["searches"] for d in current_week)
            )
            result["publishes"].append(
                sum(daily_data[d]["publishes"] for d in current_week)
            )

    elif group_by == "month":
        # 按月分组
        result_dates = []
        result = {
            "dates": result_dates,
            "downloads": [],
            "views": [],
            "searches": [],
            "publishes": [],
        }

        current_month = []
        current_month_label = ""

        for date in dates:
            dt = datetime.strptime(date, "%Y-%m-%d")
            month_label = dt.strftime("%Y-%m")

            if month_label != current_month_label and current_month:
                # 保存上一月
                result_dates.append(current_month_label)
                result["downloads"].append(
                    sum(daily_data[d]["downloads"] for d in current_month)
                )
                result["views"].append(
                    sum(daily_data[d]["views"] for d in current_month)
                )
                result["searches"].append(
                    sum(daily_data[d]["searches"] for d in current_month)
                )
                result["publishes"].append(
                    sum(daily_data[d]["publishes"] for d in current_month)
                )
                current_month = []

            current_month_label = month_label
            current_month.append(date)

        # 保存最后一月
        if current_month:
            result_dates.append(current_month_label)
            result["downloads"].append(
                sum(daily_data[d]["downloads"] for d in current_month)
            )
            result["views"].append(sum(daily_data[d]["views"] for d in current_month))
            result["searches"].append(
                sum(daily_data[d]["searches"] for d in current_month)
            )
            result["publishes"].append(
                sum(daily_data[d]["publishes"] for d in current_month)
            )

    else:
        # 默认按天
        result_dates = dates
        result = {
            "dates": result_dates,
            "downloads": [daily_data[d]["downloads"] for d in result_dates],
            "views": [daily_data[d]["views"] for d in result_dates],
            "searches": [daily_data[d]["searches"] for d in result_dates],
            "publishes": [daily_data[d]["publishes"] for d in result_dates],
        }

    result["group_by"] = group_by
    return result


def get_skill_rankings(
    start_date: str, end_date: str, sort_by: str = "downloads", limit: int = 10
) -> List[dict]:
    """获取技能排行"""
    events = get_filtered_events(start_date, end_date)

    skill_stats = defaultdict(lambda: {"downloads": 0, "views": 0})

    for event in events:
        slug = event.get("metadata", {}).get("slug", "")
        if not slug:
            continue

        if event["type"] == "skill.download":
            skill_stats[slug]["downloads"] += 1
        elif event["type"] == "skill.view":
            skill_stats[slug]["views"] += 1

    # 获取技能信息
    skills_data = skills_db.read()
    skills_map = {s["slug"]: s for s in skills_data.get("skills", [])}

    result = []
    for slug, stats in skill_stats.items():
        skill = skills_map.get(slug, {})
        result.append(
            {
                "slug": slug,
                "name": skill.get("name", slug),
                "downloads": stats["downloads"],
                "views": stats["views"],
                "author": skill.get("author_name", ""),
                "department": skill.get("author_department", ""),
            }
        )

    result.sort(key=lambda x: x[sort_by], reverse=True)
    return result[:limit]


def get_search_analysis(start_date: str, end_date: str) -> dict:
    """获取搜索分析"""
    events = get_filtered_events(start_date, end_date)
    searches = [e for e in events if e["type"] == "search"]

    queries = Counter(s.get("metadata", {}).get("query", "") for s in searches)
    zero_result = [
        s for s in searches if not s.get("metadata", {}).get("has_results", True)
    ]

    return {
        "total_searches": len(searches),
        "unique_queries": len(queries),
        "top_queries": [{"query": q, "count": c} for q, c in queries.most_common(10)],
        "zero_result_queries": [
            {"query": q, "count": c}
            for q, c in Counter(
                s.get("metadata", {}).get("query", "") for s in zero_result
            ).most_common(10)
        ],
    }


def get_heatmap_data(
    start_date: str, end_date: str, metric: str = "downloads"
) -> List[dict]:
    """获取热力图数据

    返回每一天的数据，用于热力图展示
    """
    dates = get_date_range(start_date, end_date)

    result = []
    for date in dates:
        events = get_events_range(date, date)
        filtered = [e for e in events if e.get("ip", "") not in BLOCKED_IPS]

        if metric == "downloads":
            value = sum(1 for e in filtered if e["type"] == "skill.download")
        elif metric == "views":
            value = sum(1 for e in filtered if e["type"] == "skill.view")
        elif metric == "searches":
            value = sum(1 for e in filtered if e["type"] == "search")
        elif metric == "publishes":
            value = sum(1 for e in filtered if e["type"] == "skill.publish")
        else:
            value = 0

        result.append(
            {
                "date": date,
                "value": value,
                "weekday": datetime.strptime(date, "%Y-%m-%d").weekday(),
                "week": int(datetime.strptime(date, "%Y-%m-%d").strftime("%W")),
            }
        )

    return result


def get_day_detail(date: str, metric: str = "downloads") -> dict:
    """获取某一天的详细数据"""
    events = get_events_range(date, date)
    filtered = [e for e in events if e.get("ip", "") not in BLOCKED_IPS]

    # 按小时统计
    hourly = defaultdict(int)
    skill_stats = defaultdict(lambda: {"downloads": 0, "views": 0})
    user_stats = defaultdict(lambda: {"downloads": 0, "views": 0, "searches": 0})

    for event in filtered:
        hour = (
            event.get("timestamp", "")[:13]
            if len(event.get("timestamp", "")) >= 13
            else "00"
        )
        hour = hour.split("T")[-1][:2] if "T" in hour else hour[:2]

        if metric == "downloads" and event["type"] == "skill.download":
            hourly[hour] += 1
            slug = event.get("metadata", {}).get("slug", "")
            if slug:
                skill_stats[slug]["downloads"] += 1
            user = event.get("user", "anonymous")
            user_stats[user]["downloads"] += 1

        elif metric == "views" and event["type"] == "skill.view":
            hourly[hour] += 1
            slug = event.get("metadata", {}).get("slug", "")
            if slug:
                skill_stats[slug]["views"] += 1
            user = event.get("user", "anonymous")
            user_stats[user]["views"] += 1

        elif metric == "searches" and event["type"] == "search":
            hourly[hour] += 1
            user = event.get("user", "anonymous")
            user_stats[user]["searches"] += 1

    # 获取技能名称
    skills_data = skills_db.read()
    skills_map = {
        s["slug"]: s.get("name", s["slug"]) for s in skills_data.get("skills", [])
    }

    # 排序
    top_skills = sorted(
        [
            {"slug": k, "name": skills_map.get(k, k), **v}
            for k, v in skill_stats.items()
        ],
        key=lambda x: x.get(metric, 0),
        reverse=True,
    )[:10]

    top_users = sorted(
        [{"name": k, **v} for k, v in user_stats.items()],
        key=lambda x: x.get(metric, 0),
        reverse=True,
    )[:10]

    return {
        "date": date,
        "metric": metric,
        "total": sum(hourly.values()),
        "hourly": {f"{h:02d}:00": hourly.get(f"{h:02d}", 0) for h in range(24)},
        "top_skills": top_skills,
        "top_users": top_users,
    }


# ========== 评奖数据模块（排除数智中心）==========


def get_department_rankings(metric: str = "composite", limit: int = 10) -> List[dict]:
    """获取部门排行榜（排除数智中心）"""
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 获取所有时间的过滤后统计
    skill_downloads = Counter()
    skill_views = Counter()

    for date in get_event_dates():
        events = get_events_range(date, date)
        for event in events:
            if event.get("ip", "") in BLOCKED_IPS:
                continue
            slug = event.get("metadata", {}).get("slug", "")
            if not slug:
                continue
            if event["type"] == "skill.download":
                skill_downloads[slug] += 1
            elif event["type"] == "skill.view":
                skill_views[slug] += 1

    # 统计部门数据（排除数智中心）
    dept_stats = defaultdict(lambda: {"publishes": 0, "downloads": 0, "views": 0})

    for skill in skills:
        dept = skill.get("author_department", "未知部门")

        # 排除数智中心
        if dept == "数智中心":
            continue

        dept_stats[dept]["publishes"] += 1
        dept_stats[dept]["downloads"] += skill_downloads.get(skill["slug"], 0)
        dept_stats[dept]["views"] += skill_views.get(skill["slug"], 0)

    # 计算综合得分
    result = []
    for dept, stats in dept_stats.items():
        score = stats["publishes"] * 0.4 + stats["downloads"] * 0.6
        result.append(
            {
                "name": dept,
                "publishes": stats["publishes"],
                "downloads": stats["downloads"],
                "views": stats["views"],
                "composite_score": round(score, 2),
            }
        )

    if metric == "publishes":
        result.sort(key=lambda x: x["publishes"], reverse=True)
    elif metric == "downloads":
        result.sort(key=lambda x: x["downloads"], reverse=True)
    else:
        result.sort(key=lambda x: x["composite_score"], reverse=True)

    return result[:limit]


def get_developer_rankings(metric: str = "composite", limit: int = 10) -> List[dict]:
    """获取个人排行榜（排除数智中心人员）"""
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 获取过滤后统计
    skill_downloads = Counter()
    skill_views = Counter()

    for date in get_event_dates():
        events = get_events_range(date, date)
        for event in events:
            if event.get("ip", "") in BLOCKED_IPS:
                continue
            slug = event.get("metadata", {}).get("slug", "")
            if not slug:
                continue
            if event["type"] == "skill.download":
                skill_downloads[slug] += 1
            elif event["type"] == "skill.view":
                skill_views[slug] += 1

    # 统计个人数据（排除数智中心）
    # 以最新更新的技能为准确定部门
    author_stats = defaultdict(
        lambda: {
            "publishes": 0,
            "downloads": 0,
            "views": 0,
            "department": "",
            "last_updated": "",
        }
    )

    for skill in skills:
        dept = skill.get("author_department", "")

        # 排除数智中心
        if dept == "数智中心":
            continue

        author = skill.get("author_name", "未知")
        author_stats[author]["publishes"] += 1
        author_stats[author]["downloads"] += skill_downloads.get(skill["slug"], 0)
        author_stats[author]["views"] += skill_views.get(skill["slug"], 0)

        # 比较更新时间，以最新为准
        updated_at = skill.get("updated_at", "")
        if updated_at > author_stats[author]["last_updated"]:
            author_stats[author]["department"] = dept
            author_stats[author]["last_updated"] = updated_at

    # 计算综合得分
    result = []
    for author, stats in author_stats.items():
        score = stats["publishes"] * 0.4 + stats["downloads"] * 0.6
        result.append(
            {
                "name": author,
                "publishes": stats["publishes"],
                "downloads": stats["downloads"],
                "views": stats["views"],
                "department": stats["department"],
                "composite_score": round(score, 2),
            }
        )

    if metric == "publishes":
        result.sort(key=lambda x: x["publishes"], reverse=True)
    elif metric == "downloads":
        result.sort(key=lambda x: x["downloads"], reverse=True)
    else:
        result.sort(key=lambda x: x["composite_score"], reverse=True)

    return result[:limit]


def get_center_rankings_exclude_zhishu(metric: str = "composite") -> List[dict]:
    """获取职能中心排行榜（排除数智中心）"""
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 获取过滤后统计
    skill_downloads = Counter()
    skill_views = Counter()

    for date in get_event_dates():
        events = get_events_range(date, date)
        for event in events:
            if event.get("ip", "") in BLOCKED_IPS:
                continue
            slug = event.get("metadata", {}).get("slug", "")
            if not slug:
                continue
            if event["type"] == "skill.download":
                skill_downloads[slug] += 1
            elif event["type"] == "skill.view":
                skill_views[slug] += 1

    # 初始化职能中心（排除数智中心）
    center_stats = {}
    for center_id, center_info in IDC_CENTERS.items():
        if center_id != "hq-数智":  # 排除数智中心
            center_stats[center_id] = {
                "id": center_id,
                "name": center_info["name"],
                "publishes": 0,
                "downloads": 0,
                "views": 0,
                "skills": [],
            }

    # 统计技能数据
    for skill in skills:
        dept = skill.get("author_department", "")
        idc_info = get_idc_info(dept)
        center_id = idc_info.get("center_id", "")

        # 排除数智中心
        if center_id == "hq-数智":
            continue

        if center_id and center_id in center_stats:
            center_stats[center_id]["publishes"] += 1
            center_stats[center_id]["downloads"] += skill_downloads.get(
                skill["slug"], 0
            )
            center_stats[center_id]["views"] += skill_views.get(skill["slug"], 0)
            center_stats[center_id]["skills"].append(skill.get("name"))

    # 转换为列表并排序
    result = list(center_stats.values())
    if metric == "publishes":
        result.sort(key=lambda x: x["publishes"], reverse=True)
    elif metric == "downloads":
        result.sort(key=lambda x: x["downloads"], reverse=True)
    else:
        result.sort(
            key=lambda x: x["publishes"] * 0.4 + x["downloads"] * 0.6, reverse=True
        )

    return result


def get_region_rankings_exclude_zhishu(metric: str = "publishes") -> List[dict]:
    """获取区域排行榜（排除数智中心）"""
    skills_data = skills_db.read()
    skills = skills_data.get("skills", [])

    # 获取过滤后统计
    skill_downloads = Counter()
    skill_views = Counter()

    for date in get_event_dates():
        events = get_events_range(date, date)
        for event in events:
            if event.get("ip", "") in BLOCKED_IPS:
                continue
            slug = event.get("metadata", {}).get("slug", "")
            if not slug:
                continue
            if event["type"] == "skill.download":
                skill_downloads[slug] += 1
            elif event["type"] == "skill.view":
                skill_views[slug] += 1

    # 初始化区域
    region_stats = {}
    for region_id, region_info in IDC_REGIONS.items():
        region_stats[region_id] = {
            "id": region_id,
            "name": region_info["name"],
            "publishes": 0,
            "downloads": 0,
            "views": 0,
            "skills": [],
        }

    # 统计技能数据
    for skill in skills:
        dept = skill.get("author_department", "")
        idc_info = get_idc_info(dept)
        region_id = idc_info.get("region_id", "")

        # 排除数智中心（总部）
        if region_id == "hq":
            continue

        if region_id and region_id in region_stats:
            region_stats[region_id]["publishes"] += 1
            region_stats[region_id]["downloads"] += skill_downloads.get(
                skill["slug"], 0
            )
            region_stats[region_id]["views"] += skill_views.get(skill["slug"], 0)
            region_stats[region_id]["skills"].append(skill.get("name"))

    # 转换为列表并排序
    result = list(region_stats.values())
    if metric == "publishes":
        result.sort(key=lambda x: x["publishes"], reverse=True)
    elif metric == "downloads":
        result.sort(key=lambda x: x["downloads"], reverse=True)
    else:
        result.sort(
            key=lambda x: x["publishes"] * 0.4 + x["downloads"] * 0.6, reverse=True
        )

    return result
