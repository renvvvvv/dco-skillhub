"""定时任务调度器

使用 APScheduler 实现后台定时任务：
1. 每日凌晨 00:05 聚合前一日事件数据
2. 每小时清理过期的事件文件（保留90天）
3. 每小时预聚合当前小时数据（用于实时趋势）

安装依赖:
    pip install apscheduler
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

# 尝试导入 APScheduler，未安装则提供降级方案
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    HAS_APSCHEDULER = True
except ImportError:
    HAS_APSCHEDULER = False
    print("[scheduler] APScheduler not installed, using fallback mode")

from app.metrics import aggregate_daily, aggregate_all_missing
from app.config import EVENTS_DIR, METRICS_DAILY_FILE
from app.database import JSONDatabase


# 全局调度器实例
_scheduler: Optional[object] = None


def _cleanup_old_events():
    """清理90天前的事件文件"""
    cutoff = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    deleted = 0
    
    if EVENTS_DIR.exists():
        for f in EVENTS_DIR.glob("*.json"):
            if f.stem < cutoff:
                try:
                    f.unlink()
                    deleted += 1
                except OSError:
                    pass
    
    if deleted > 0:
        print(f"[scheduler] Cleaned up {deleted} old event files before {cutoff}")


def _aggregate_yesterday():
    """聚合昨日数据"""
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    try:
        result = aggregate_daily(yesterday)
        print(f"[scheduler] Aggregated daily metrics for {yesterday}: {result.get('summary', {}).get('total_events', 0)} events")
    except Exception as e:
        print(f"[scheduler] Failed to aggregate {yesterday}: {e}")


def _aggregate_today():
    """聚合今日数据（用于实时查看）"""
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        result = aggregate_daily(today)
        print(f"[scheduler] Aggregated daily metrics for today ({today}): {result.get('summary', {}).get('total_events', 0)} events")
    except Exception as e:
        print(f"[scheduler] Failed to aggregate today: {e}")


def _aggregate_all_missing():
    """补全所有缺失日期的聚合"""
    try:
        count = aggregate_all_missing()
        if count > 0:
            print(f"[scheduler] Backfilled {count} missing daily metrics")
    except Exception as e:
        print(f"[scheduler] Failed to backfill: {e}")


def _hourly_maintenance():
    """每小时维护任务"""
    print(f"[scheduler] Running hourly maintenance at {datetime.now().isoformat()}")
    _cleanup_old_events()
    _aggregate_today()


def start_scheduler() -> bool:
    """启动后台定时任务调度器
    
    Returns:
        True if scheduler started successfully
    """
    global _scheduler
    
    if not HAS_APSCHEDULER:
        print("[scheduler] APScheduler not available, scheduled tasks will not run automatically")
        print("[scheduler] Please install: pip install apscheduler")
        return False
    
    if _scheduler is not None and _scheduler.running:
        print("[scheduler] Scheduler already running")
        return True
    
    _scheduler = BackgroundScheduler(timezone='Asia/Shanghai')
    
    # 1. 每日凌晨 00:05 聚合昨日数据
    _scheduler.add_job(
        _aggregate_yesterday,
        CronTrigger(hour=0, minute=5),
        id='aggregate_yesterday',
        name='Aggregate yesterday metrics',
        replace_existing=True
    )
    
    # 2. 每小时维护（清理 + 聚合今日）
    _scheduler.add_job(
        _hourly_maintenance,
        CronTrigger(minute=0),  # 每小时的第0分钟
        id='hourly_maintenance',
        name='Hourly maintenance',
        replace_existing=True
    )
    
    # 3. 启动时补全缺失数据
    _scheduler.add_job(
        _aggregate_all_missing,
        'date',  # 只执行一次
        id='backfill_on_start',
        name='Backfill missing metrics on startup',
        replace_existing=True
    )
    
    _scheduler.start()
    print("[scheduler] Background scheduler started")
    print("[scheduler] Jobs:")
    for job in _scheduler.get_jobs():
        print(f"  - {job.name}: {job.trigger}")
    
    return True


def stop_scheduler():
    """停止调度器"""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown()
        print("[scheduler] Scheduler stopped")


def get_scheduler_status() -> dict:
    """获取调度器状态"""
    if not HAS_APSCHEDULER:
        return {"running": False, "available": False, "message": "APScheduler not installed"}
    
    if _scheduler is None:
        return {"running": False, "available": True, "message": "Scheduler not started"}
    
    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
        })
    
    return {
        "running": _scheduler.running,
        "available": True,
        "jobs": jobs,
    }


# 兼容：如果直接运行此文件，执行一次聚合
if __name__ == "__main__":
    print("[scheduler] Running in standalone mode...")
    _aggregate_all_missing()
    _aggregate_today()
    print("[scheduler] Done")
