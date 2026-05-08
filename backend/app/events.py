"""事件追踪服务（埋点）

记录所有用户行为事件，按日期分片存储，支持后续聚合分析。
"""
import json
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import Counter

from app.config import EVENTS_DIR, SEARCH_LOGS_FILE
from app.database import JSONDatabase


# 确保事件目录存在
EVENTS_DIR.mkdir(exist_ok=True)


def _get_today_event_file() -> Path:
    """获取今日事件文件路径"""
    today = datetime.now().strftime("%Y-%m-%d")
    return EVENTS_DIR / f"{today}.json"


def _get_event_db() -> JSONDatabase:
    """获取今日事件数据库实例"""
    file_path = _get_today_event_file()
    return JSONDatabase(file_path, {"events": []})


def track_event(
    event_type: str,
    user: str = "",
    ip: str = "",
    metadata: dict = None
) -> dict:
    """记录一个事件
    
    Args:
        event_type: 事件类型，如 skill.view, skill.download, search, page.view 等
        user: 用户标识（姓名或ID）
        ip: 用户IP
        metadata: 事件附加数据
        
    Returns:
        记录的事件对象
    """
    event = {
        "id": str(uuid.uuid4()),
        "type": event_type,
        "user": user,
        "ip": ip,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {},
    }
    
    db = _get_event_db()
    db.update(lambda data: data["events"].append(event))
    
    return event


# ========== 便捷封装函数 ==========

def track_skill_view(slug: str, skill_name: str, user: str = "", ip: str = "", source_page: str = ""):
    """记录技能浏览事件"""
    return track_event(
        "skill.view",
        user=user,
        ip=ip,
        metadata={
            "slug": slug,
            "skill_name": skill_name,
            "source_page": source_page,
        }
    )


def track_skill_download(slug: str, skill_name: str, version: str, user: str = "", ip: str = ""):
    """记录技能下载事件"""
    return track_event(
        "skill.download",
        user=user,
        ip=ip,
        metadata={
            "slug": slug,
            "skill_name": skill_name,
            "version": version,
        }
    )


def track_search(query: str, results_count: int, user: str = "", ip: str = "", clicked_slug: str = ""):
    """记录搜索事件"""
    return track_event(
        "search",
        user=user,
        ip=ip,
        metadata={
            "query": query,
            "results_count": results_count,
            "clicked_slug": clicked_slug,
            "has_results": results_count > 0,
        }
    )


def track_skill_publish(slug: str, skill_name: str, author: str, tags: list = None, file_size: int = 0):
    """记录技能发布事件"""
    return track_event(
        "skill.publish",
        user=author,
        metadata={
            "slug": slug,
            "skill_name": skill_name,
            "tags": tags or [],
            "file_size": file_size,
        }
    )


def track_tag_click(tag_name: str, source: str = "", user: str = "", ip: str = ""):
    """记录标签点击事件"""
    return track_event(
        "tag.click",
        user=user,
        ip=ip,
        metadata={
            "tag_name": tag_name,
            "source": source,
        }
    )


def track_page_view(page_name: str, user: str = "", ip: str = "", duration_ms: int = 0):
    """记录页面浏览事件"""
    return track_event(
        "page.view",
        user=user,
        ip=ip,
        metadata={
            "page_name": page_name,
            "duration_ms": duration_ms,
        }
    )


def track_admin_action(action: str, slug: str, skill_name: str, admin_user: str = "", reason: str = ""):
    """记录管理员操作事件"""
    return track_event(
        "admin.action",
        user=admin_user,
        metadata={
            "action": action,  # approve, reject, delete
            "slug": slug,
            "skill_name": skill_name,
            "reason": reason,
        }
    )


# ========== 事件查询 ==========

def get_events(
    date: str = None,
    event_type: str = None,
    user: str = None,
    limit: int = 100
) -> List[dict]:
    """查询事件
    
    Args:
        date: 日期字符串 "YYYY-MM-DD"，默认今天
        event_type: 事件类型过滤
        user: 用户过滤
        limit: 返回条数上限
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    file_path = EVENTS_DIR / f"{date}.json"
    if not file_path.exists():
        return []
    
    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
        events = data.get("events", [])
    except (json.JSONDecodeError, FileNotFoundError):
        return []
    
    # 过滤
    if event_type:
        events = [e for e in events if e["type"] == event_type]
    if user:
        events = [e for e in events if e["user"] == user]
    
    # 按时间倒序，限制条数
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events[:limit]


def get_events_range(start_date: str, end_date: str, event_type: str = None) -> List[dict]:
    """查询日期范围内的事件"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    all_events = []
    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        events = get_events(date_str, event_type=event_type, limit=10000)
        all_events.extend(events)
        current += timedelta(days=1)
    
    all_events.sort(key=lambda x: x["timestamp"], reverse=True)
    return all_events


def get_event_dates() -> List[str]:
    """获取所有有事件的日期列表"""
    dates = []
    for f in sorted(EVENTS_DIR.glob("*.json")):
        dates.append(f.stem)
    return dates


def get_realtime_events(limit: int = 20) -> List[dict]:
    """获取最近实时事件（用于活动流）"""
    # 先查今天，不足再查昨天
    events = get_events(limit=limit)
    if len(events) < limit:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        y_events = get_events(yesterday, limit=limit - len(events))
        events.extend(y_events)
    return events[:limit]
