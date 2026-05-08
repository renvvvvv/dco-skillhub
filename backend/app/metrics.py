"""指标聚合服务

每日凌晨自动聚合前一日的事件数据，生成预计算指标。
支持快速查询日/周/月维度的统计数据。
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import Counter, defaultdict

from app.config import METRICS_DAILY_FILE, METRICS_HOURLY_FILE
from app.database import JSONDatabase
from app.events import get_events, get_event_dates
from app.org_mapping import get_idc_info


# 数据库实例
metrics_daily_db = JSONDatabase(METRICS_DAILY_FILE, {})
metrics_hourly_db = JSONDatabase(METRICS_HOURLY_FILE, {})


def aggregate_daily(date: str = None) -> dict:
    """聚合指定日期的指标
    
    Args:
        date: 日期字符串 "YYYY-MM-DD"，默认昨天
        
    Returns:
        聚合后的指标字典
    """
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    events = get_events(date, limit=100000)
    
    if not events:
        return {}
    
    # 基础计数器
    skill_views = Counter()
    skill_downloads = Counter()
    skill_publishes = Counter()
    searches = []
    tag_clicks = Counter()
    page_views = Counter()
    region_activity = Counter()
    center_activity = Counter()
    dc_activity = Counter()
    tag_activity = Counter()
    unique_users = set()
    unique_ips = set()
    
    for event in events:
        user = event.get("user", "")
        ip = event.get("ip", "")
        meta = event.get("metadata", {})
        
        if user:
            unique_users.add(user)
        if ip:
            unique_ips.add(ip)
        
        etype = event["type"]
        
        if etype == "skill.view":
            slug = meta.get("slug", "")
            skill_views[slug] += 1
            # 区域统计
            _accumulate_region(meta, region_activity, center_activity, dc_activity)
            
        elif etype == "skill.download":
            slug = meta.get("slug", "")
            skill_downloads[slug] += 1
            _accumulate_region(meta, region_activity, center_activity, dc_activity)
            
        elif etype == "skill.publish":
            slug = meta.get("slug", "")
            skill_publishes[slug] += 1
            tags = meta.get("tags", [])
            for tag in tags:
                tag_activity[tag] += 1
            # 作者区域统计
            author = event.get("user", "")
            _accumulate_region_by_author(author, region_activity, center_activity)
            
        elif etype == "search":
            searches.append({
                "query": meta.get("query", ""),
                "has_results": meta.get("has_results", True),
                "results_count": meta.get("results_count", 0),
            })
            
        elif etype == "tag.click":
            tag_name = meta.get("tag_name", "")
            tag_clicks[tag_name] += 1
            tag_activity[tag_name] += 1
            
        elif etype == "page.view":
            page_name = meta.get("page_name", "")
            page_views[page_name] += 1
    
    # 搜索分析
    search_queries = Counter(s["query"] for s in searches)
    zero_result_searches = [s for s in searches if not s["has_results"]]
    
    # 构建结果
    result = {
        "date": date,
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_events": len(events),
            "unique_users": len(unique_users),
            "unique_ips": len(unique_ips),
        },
        "skills": {
            "views": dict(skill_views.most_common(20)),
            "downloads": dict(skill_downloads.most_common(20)),
            "publishes": dict(skill_publishes.most_common(20)),
            "total_views": sum(skill_views.values()),
            "total_downloads": sum(skill_downloads.values()),
            "total_publishes": len(skill_publishes),
        },
        "searches": {
            "total": len(searches),
            "unique_queries": len(search_queries),
            "zero_results": len(zero_result_searches),
            "zero_result_rate": round(len(zero_result_searches) / len(searches) * 100, 1) if searches else 0,
            "top_queries": [{"query": q, "count": c} for q, c in search_queries.most_common(10)],
        },
        "tags": {
            "clicks": dict(tag_clicks.most_common(20)),
            "activity": dict(tag_activity.most_common(20)),
        },
        "pages": dict(page_views.most_common(10)),
        "regions": dict(region_activity.most_common(20)),
        "centers": dict(center_activity.most_common(10)),
        "datacenters": dict(dc_activity.most_common(20)),
    }
    
    # 保存
    metrics_daily_db.update(lambda data: data.update({date: result}))
    
    return result


def _accumulate_region(meta: dict, region_counter: Counter, center_counter: Counter, dc_counter: Counter):
    """根据事件元数据累加区域统计"""
    # 尝试从技能slug反查作者信息来统计区域
    # 简化处理：如果事件中有department信息则使用
    dept = meta.get("author_department", "")
    if dept:
        idc_info = get_idc_info(dept)
        if idc_info["mapped"]:
            if idc_info["region_id"] == "hq":
                center_counter[idc_info["center_name"]] += 1
            else:
                region_counter[idc_info["region_name"]] += 1
                if idc_info["dc_short"]:
                    dc_counter[idc_info["dc_short"]] += 1


def _accumulate_region_by_author(author: str, region_counter: Counter, center_counter: Counter):
    """根据作者名累加区域统计（从staff_db查询）"""
    from app.database import staff_db
    staff_data = staff_db.read()
    staff = next(
        (s for s in staff_data.get("staff", []) if s.get("name") == author),
        None
    )
    if staff and staff.get("idc_mapped"):
        if staff.get("region_id") == "hq":
            center_counter[staff.get("center_name", "")] += 1
        else:
            region_counter[staff.get("region_name", "")] += 1


def get_daily_metrics(date: str = None) -> Optional[dict]:
    """获取指定日期的聚合指标"""
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    data = metrics_daily_db.read()
    return data.get(date)


def get_metrics_range(start_date: str, end_date: str) -> List[dict]:
    """获取日期范围内的每日指标"""
    data = metrics_daily_db.read()
    results = []
    
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        if date_str in data:
            results.append(data[date_str])
        current += timedelta(days=1)
    
    return results


def get_trend_data(start_date: str, end_date: str) -> dict:
    """获取趋势数据（用于折线图）"""
    daily_metrics = get_metrics_range(start_date, end_date)
    
    dates = []
    views = []
    downloads = []
    publishes = []
    searches = []
    unique_users = []
    
    for m in daily_metrics:
        dates.append(m["date"])
        views.append(m["skills"]["total_views"])
        downloads.append(m["skills"]["total_downloads"])
        publishes.append(m["skills"]["total_publishes"])
        searches.append(m["searches"]["total"])
        unique_users.append(m["summary"]["unique_users"])
    
    return {
        "dates": dates,
        "series": {
            "views": views,
            "downloads": downloads,
            "publishes": publishes,
            "searches": searches,
            "unique_users": unique_users,
        }
    }


def get_kpi_summary() -> dict:
    """获取KPI汇总（今日/昨日/本周/本月）"""
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # 确保今日数据已聚合
    today_metrics = get_daily_metrics(today)
    if not today_metrics:
        today_metrics = aggregate_daily(today)
    
    yesterday_metrics = get_daily_metrics(yesterday) or {}
    week_metrics = get_metrics_range(week_ago, today)
    month_metrics = get_metrics_range(month_ago, today)
    
    def _sum_key(metrics_list, path):
        """从指标列表中汇总指定路径的值"""
        total = 0
        for m in metrics_list:
            try:
                val = m
                for key in path:
                    val = val[key]
                total += val
            except (KeyError, TypeError):
                pass
        return total
    
    return {
        "today": {
            "skills_total": _sum_key([today_metrics], ["skills", "total_publishes"]),
            "downloads": _sum_key([today_metrics], ["skills", "total_downloads"]),
            "views": _sum_key([today_metrics], ["skills", "total_views"]),
            "searches": _sum_key([today_metrics], ["searches", "total"]),
            "unique_users": _sum_key([today_metrics], ["summary", "unique_users"]),
        },
        "yesterday": {
            "skills_total": _sum_key([yesterday_metrics], ["skills", "total_publishes"]),
            "downloads": _sum_key([yesterday_metrics], ["skills", "total_downloads"]),
            "views": _sum_key([yesterday_metrics], ["skills", "total_views"]),
            "searches": _sum_key([yesterday_metrics], ["searches", "total"]),
            "unique_users": _sum_key([yesterday_metrics], ["summary", "unique_users"]),
        },
        "this_week": {
            "skills_total": _sum_key(week_metrics, ["skills", "total_publishes"]),
            "downloads": _sum_key(week_metrics, ["skills", "total_downloads"]),
            "views": _sum_key(week_metrics, ["skills", "total_views"]),
            "searches": _sum_key(week_metrics, ["searches", "total"]),
            "unique_users": max([_sum_key([m], ["summary", "unique_users"]) for m in week_metrics] or [0]),
        },
        "this_month": {
            "skills_total": _sum_key(month_metrics, ["skills", "total_publishes"]),
            "downloads": _sum_key(month_metrics, ["skills", "total_downloads"]),
            "views": _sum_key(month_metrics, ["skills", "total_views"]),
            "searches": _sum_key(month_metrics, ["searches", "total"]),
            "unique_users": max([_sum_key([m], ["summary", "unique_users"]) for m in month_metrics] or [0]),
        },
    }


def aggregate_all_missing():
    """聚合所有缺失日期的数据（用于初始化）"""
    event_dates = get_event_dates()
    existing_dates = set(metrics_daily_db.read().keys())
    
    missing = [d for d in event_dates if d not in existing_dates]
    for date in missing:
        print(f"Aggregating metrics for {date}...")
        aggregate_daily(date)
    
    return len(missing)
