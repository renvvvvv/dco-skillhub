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
        print(
            f"[scheduler] Aggregated daily metrics for {yesterday}: {result.get('summary', {}).get('total_events', 0)} events"
        )
    except Exception as e:
        print(f"[scheduler] Failed to aggregate {yesterday}: {e}")


def _aggregate_today():
    """聚合今日数据（用于实时查看）"""
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        result = aggregate_daily(today)
        print(
            f"[scheduler] Aggregated daily metrics for today ({today}): {result.get('summary', {}).get('total_events', 0)} events"
        )
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


def _backup_skills_daily():
    """每日自动备份技能数据（增强版持久化备份）

    备份内容：
    1. JSON数据文件（skills.json, versions.json等）
    2. 技能ZIP文件（storage目录）
    3. Webhook日志
    4. 用户活动日志
    5. 审计日志

    备份位置：/root/doc-skillhub/persistent-backup/
    保留策略：保留90天
    """
    import shutil
    from datetime import datetime, timedelta
    from app.config import DATA_DIR, STORAGE_DIR

    try:
        # 使用持久化备份目录
        backup_base = Path("/root/doc-skillhub/persistent-backup")
        backup_base.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_subdir = backup_base / f"daily_{timestamp}"
        backup_subdir.mkdir(exist_ok=True)

        # 1. 备份JSON数据文件
        backup_data_dir = backup_subdir / "data"
        backup_data_dir.mkdir(exist_ok=True)

        files_to_backup = [
            "skills.json",
            "versions.json",
            "audit_logs.json",
            "views.json",
            "view_records.json",
            "search_index.json",
            "metrics_daily.json",
            "user_activity_logs.json",
            "expert_reviews.json",
            "code_audit_logs.json",
            "webhook_logs.json",
            "staff.json",
            "staff_dictionary.json",
            "staff_dictionary_v2.json",
        ]

        backed_up_files = []
        for filename in files_to_backup:
            src = DATA_DIR / filename
            if src.exists():
                dst = backup_data_dir / filename
                shutil.copy2(src, dst)
                backed_up_files.append(filename)

        # 2. 备份技能ZIP文件（关键！）
        backup_storage_dir = backup_subdir / "storage"
        backup_storage_dir.mkdir(exist_ok=True)

        if STORAGE_DIR.exists():
            # 使用rsync风格备份，只复制变更的文件
            for skill_dir in STORAGE_DIR.iterdir():
                if skill_dir.is_dir():
                    dst_skill_dir = backup_storage_dir / skill_dir.name
                    if dst_skill_dir.exists():
                        shutil.rmtree(dst_skill_dir)
                    shutil.copytree(skill_dir, dst_skill_dir)

        # 3. 备份日志文件（从Docker Volume）
        backup_logs_dir = backup_subdir / "logs"
        backup_logs_dir.mkdir(exist_ok=True)

        logs_to_backup = [
            (DATA_DIR / "webhook_logs.json", backup_logs_dir / "webhook_logs.json"),
            (
                DATA_DIR / "user_activity_logs.json",
                backup_logs_dir / "user_activity_logs.json",
            ),
            (DATA_DIR / "audit_logs.json", backup_logs_dir / "audit_logs.json"),
        ]

        for src, dst in logs_to_backup:
            if src.exists():
                shutil.copy2(src, dst)

        # 4. 生成备份清单
        manifest = {
            "timestamp": timestamp,
            "backup_type": "daily_full",
            "data_files": backed_up_files,
            "storage_skills": len(list(backup_storage_dir.iterdir()))
            if backup_storage_dir.exists()
            else 0,
            "backup_path": str(backup_subdir),
        }

        manifest_path = backup_subdir / "backup.manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            import json

            json.dump(manifest, f, ensure_ascii=False, indent=2)

        # 5. 更新latest软链接
        latest_link = backup_base / "latest"
        if latest_link.exists() or latest_link.is_symlink():
            latest_link.unlink()
        latest_link.symlink_to(backup_subdir, target_is_directory=True)

        # 6. 清理旧备份（保留90天）
        cutoff_date = datetime.now() - timedelta(days=90)
        cleaned_count = 0

        for old_backup in backup_base.iterdir():
            if old_backup.is_dir() and old_backup.name.startswith("daily_"):
                try:
                    backup_date = datetime.strptime(
                        old_backup.name.replace("daily_", ""), "%Y%m%d_%H%M%S"
                    )
                    if backup_date < cutoff_date:
                        shutil.rmtree(old_backup)
                        cleaned_count += 1
                except ValueError:
                    continue

        print(f"[scheduler] Daily backup completed: {backup_subdir}")
        print(
            f"[scheduler] Backed up {len(backed_up_files)} data files, {manifest['storage_skills']} skills"
        )
        if cleaned_count > 0:
            print(f"[scheduler] Cleaned {cleaned_count} old backups")

    except Exception as e:
        print(f"[scheduler] Daily backup failed: {e}")
        import traceback

        traceback.print_exc()


def start_scheduler() -> bool:
    """启动后台定时任务调度器

    Returns:
        True if scheduler started successfully
    """
    global _scheduler

    if not HAS_APSCHEDULER:
        print(
            "[scheduler] APScheduler not available, scheduled tasks will not run automatically"
        )
        print("[scheduler] Please install: pip install apscheduler")
        return False

    if _scheduler is not None and _scheduler.running:
        print("[scheduler] Scheduler already running")
        return True

    _scheduler = BackgroundScheduler(timezone="Asia/Shanghai")

    # 1. 每日凌晨 00:05 聚合昨日数据
    _scheduler.add_job(
        _aggregate_yesterday,
        CronTrigger(hour=0, minute=5),
        id="aggregate_yesterday",
        name="Aggregate yesterday metrics",
        replace_existing=True,
    )

    # 2. 每小时维护（清理 + 聚合今日）
    _scheduler.add_job(
        _hourly_maintenance,
        CronTrigger(minute=0),  # 每小时的第0分钟
        id="hourly_maintenance",
        name="Hourly maintenance",
        replace_existing=True,
    )

    # 3. 启动时补全缺失数据
    _scheduler.add_job(
        _aggregate_all_missing,
        "date",  # 只执行一次
        id="backfill_on_start",
        name="Backfill missing metrics on startup",
        replace_existing=True,
    )

    # 4. 每日发送日报
    from app.config import ENABLE_DAILY_REPORT, DAILY_REPORT_TIME

    if ENABLE_DAILY_REPORT:
        hour, minute = map(int, DAILY_REPORT_TIME.split(":"))
        _scheduler.add_job(
            _send_daily_report,
            CronTrigger(hour=hour, minute=minute),
            id="daily_report",
            name="Send daily report to Feishu",
            replace_existing=True,
        )

    # 5. 每周五发送周报
    from app.config import ENABLE_WEEKLY_REPORT, WEEKLY_REPORT_DAY, WEEKLY_REPORT_TIME

    if ENABLE_WEEKLY_REPORT:
        hour, minute = map(int, WEEKLY_REPORT_TIME.split(":"))
        days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        _scheduler.add_job(
            _send_weekly_report,
            CronTrigger(
                day_of_week=days[WEEKLY_REPORT_DAY - 1], hour=hour, minute=minute
            ),
            id="weekly_report",
            name="Send weekly report to Feishu",
            replace_existing=True,
        )

    # 6. 每4小时检查待审核告警
    from app.config import ENABLE_PENDING_ALERT

    if ENABLE_PENDING_ALERT:
        _scheduler.add_job(
            _check_pending_alerts,
            CronTrigger(hour="*/4"),
            id="pending_alert",
            name="Check pending skills alert",
            replace_existing=True,
        )

    # 7. 每日自动备份技能数据（凌晨1点执行）
    _scheduler.add_job(
        _backup_skills_daily,
        CronTrigger(hour=1, minute=0),
        id="daily_backup",
        name="Daily backup skills data",
        replace_existing=True,
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
        return {
            "running": False,
            "available": False,
            "message": "APScheduler not installed",
        }

    if _scheduler is None:
        return {"running": False, "available": True, "message": "Scheduler not started"}

    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append(
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat()
                if job.next_run_time
                else None,
            }
        )

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


def _send_daily_report():
    """发送日报 - 只发送到内部通道"""
    from app.notifier import FeishuNotifier
    from app.report_builder import DailyReportBuilder

    builder = DailyReportBuilder()
    report_data = builder.build()

    # 内部通道
    notifier = FeishuNotifier(channel="internal")
    log = notifier.send_daily_report(report_data)
    print(
        f"[scheduler] Daily report sent to internal: {log.status} ({log.duration_ms}ms)"
    )

    # 外部通道不发日报
    print("[scheduler] Daily report skipped for external channel")


def _send_weekly_report():
    """发送周报 - 同时发送到内部和外部通道"""
    from app.notifier import FeishuNotifier
    from app.report_builder import WeeklyReportBuilder

    builder = WeeklyReportBuilder()
    report_data = builder.build()

    # 内部通道
    notifier_internal = FeishuNotifier(channel="internal")
    log_internal = notifier_internal.send_weekly_report(report_data)
    print(
        f"[scheduler] Weekly report sent to internal: {log_internal.status} ({log_internal.duration_ms}ms)"
    )

    # 外部通道
    notifier_external = FeishuNotifier(channel="external")
    log_external = notifier_external.send_weekly_report(report_data)
    print(
        f"[scheduler] Weekly report sent to external: {log_external.status} ({log_external.duration_ms}ms)"
    )


def _check_pending_alerts():
    """检查待审核告警 - 只发送到内部通道"""
    from app.notifier import FeishuNotifier
    from app.database import skills_db
    from app.config import PENDING_ALERT_THRESHOLD

    data = skills_db.read()
    pending = [s for s in data.get("skills", []) if s.get("status") == "pending"]

    if len(pending) >= PENDING_ALERT_THRESHOLD:
        alert_data = {
            "type": "pending_overflow",
            "count": len(pending),
            "skills": [s["name"] for s in pending[:5]],
        }

        # 内部通道
        notifier_internal = FeishuNotifier(channel="internal")
        log_internal = notifier_internal.send_alert(alert_data)
        print(
            f"[scheduler] Pending alert sent to internal: {log_internal.status} ({len(pending)} pending)"
        )

        # 外部通道不发告警（告警仅限内部通道）
        print(
            "[scheduler] Pending alert skipped for external channel (alerts are internal only)"
        )
