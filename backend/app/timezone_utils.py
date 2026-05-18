"""时区工具 - 提供北京时间支持"""

from datetime import datetime, timedelta, timezone

# 北京时区 (UTC+8)
BEIJING_TZ = timezone(timedelta(hours=8))


def get_beijing_time() -> datetime:
    """获取当前北京时间"""
    return datetime.now(BEIJING_TZ)


def get_beijing_date() -> str:
    """获取当前北京日期 (YYYY-MM-DD)"""
    return datetime.now(BEIJING_TZ).strftime("%Y-%m-%d")


def get_beijing_datetime() -> str:
    """获取当前北京日期时间 (ISO格式)"""
    return datetime.now(BEIJING_TZ).isoformat()


def get_beijing_timestamp() -> str:
    """获取当前北京时间戳 (YYYY-MM-DD HH:MM:SS)"""
    return datetime.now(BEIJING_TZ).strftime("%Y-%m-%d %H:%M:%S")


def convert_to_beijing(dt: datetime) -> datetime:
    """将任意时间转换为北京时间"""
    if dt.tzinfo is None:
        # 假设是UTC时间
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(BEIJING_TZ)


def get_beijing_week_start() -> datetime:
    """获取本周一北京时间 00:00:00"""
    now = datetime.now(BEIJING_TZ)
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def get_beijing_week_end() -> datetime:
    """获取本周日北京时间 23:59:59"""
    now = datetime.now(BEIJING_TZ)
    sunday = now + timedelta(days=6 - now.weekday())
    return sunday.replace(hour=23, minute=59, second=59, microsecond=0)


def get_beijing_yesterday() -> str:
    """获取昨天北京日期"""
    return (datetime.now(BEIJING_TZ) - timedelta(days=1)).strftime("%Y-%m-%d")


def get_beijing_last_week() -> tuple:
    """获取上周起止日期 (周一到周日)"""
    today = datetime.now(BEIJING_TZ)
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)
    return (last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d"))
