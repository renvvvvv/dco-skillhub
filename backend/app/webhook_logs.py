"""Webhook 发送日志服务"""

import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import Counter

from app.database import webhook_logs_db


class WebhookLog:
    """Webhook 发送日志模型"""

    def __init__(self, **kwargs):
        self.id = kwargs.get("id", str(uuid.uuid4()))
        self.type = kwargs.get("type", "")
        self.channel = kwargs.get("channel", "feishu")
        self.status = kwargs.get("status", "pending")
        self.webhook_url = kwargs.get("webhook_url", "")
        self.request_body = kwargs.get("request_body", {})
        self.response_body = kwargs.get("response_body", {})
        self.response_code = kwargs.get("response_code", 0)
        self.error_message = kwargs.get("error_message", "")
        self.duration_ms = kwargs.get("duration_ms", 0)
        self.ip = kwargs.get("ip", "")
        self.timestamp = kwargs.get("timestamp", datetime.now().isoformat())
        self.retry_count = kwargs.get("retry_count", 0)
        self.sent_at = kwargs.get("sent_at", "")
        self.completed_at = kwargs.get("completed_at", "")
        # 新增：业务数据快照和卡片模板
        self.report_data = kwargs.get("report_data", {})
        self.card_template = kwargs.get("card_template", "")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type,
            "channel": self.channel,
            "status": self.status,
            "webhook_url": self.webhook_url,
            "request_body": self.request_body,
            "response_body": self.response_body,
            "response_code": self.response_code,
            "error_message": self.error_message,
            "duration_ms": self.duration_ms,
            "ip": self.ip,
            "timestamp": self.timestamp,
            "retry_count": self.retry_count,
            "sent_at": self.sent_at,
            "completed_at": self.completed_at,
            "report_data": self.report_data,
            "card_template": self.card_template,
        }


class WebhookLogService:
    """Webhook 日志服务"""

    @staticmethod
    def record(log: WebhookLog) -> dict:
        """记录一条日志"""

        def append_log(data):
            data["logs"].append(log.to_dict())
            cutoff = (datetime.now() - timedelta(days=90)).isoformat()
            data["logs"] = [l for l in data["logs"] if l["timestamp"] >= cutoff]

        webhook_logs_db.update(append_log)
        return log.to_dict()

    @staticmethod
    def list_logs(
        type_: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 0,
        size: int = 20,
    ) -> dict:
        """分页查询日志"""
        data = webhook_logs_db.read()
        logs = data.get("logs", [])

        if type_:
            logs = [l for l in logs if l["type"] == type_]
        if status:
            logs = [l for l in logs if l["status"] == status]

        logs.sort(key=lambda x: x["timestamp"], reverse=True)

        total = len(logs)
        start = page * size
        end = start + size

        return {
            "content": logs[start:end],
            "totalElements": total,
            "totalPages": (total + size - 1) // size,
            "size": size,
            "number": page,
        }

    @staticmethod
    def get_detail(id: str) -> Optional[dict]:
        """获取单条日志详情"""
        data = webhook_logs_db.read()
        logs = data.get("logs", [])
        for log in logs:
            if log["id"] == id:
                return log
        return None

    @staticmethod
    def get_stats() -> dict:
        """获取发送统计"""
        data = webhook_logs_db.read()
        logs = data.get("logs", [])

        total = len(logs)
        success = len([l for l in logs if l["status"] == "success"])
        failed = len([l for l in logs if l["status"] == "failed"])

        type_counts = Counter(l["type"] for l in logs)

        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        week_logs = [l for l in logs if l["timestamp"] >= week_ago]

        return {
            "total": total,
            "success": success,
            "failed": failed,
            "success_rate": round(success / total * 100, 1) if total else 0,
            "by_type": dict(type_counts),
            "week_total": len(week_logs),
        }
