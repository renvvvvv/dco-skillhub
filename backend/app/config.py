"""应用配置"""

from pathlib import Path
import os

# 路径配置
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
STORAGE_DIR = BASE_DIR / "storage"

# 确保目录存在
DATA_DIR.mkdir(exist_ok=True)
STORAGE_DIR.mkdir(exist_ok=True)

# 文件路径
SKILLS_FILE = DATA_DIR / "skills.json"
VERSIONS_FILE = DATA_DIR / "versions.json"
SEARCH_INDEX_FILE = DATA_DIR / "search_index.json"
VIEWS_FILE = DATA_DIR / "views.json"
VIEW_RECORDS_FILE = DATA_DIR / "view_records.json"
AUDIT_LOGS_FILE = DATA_DIR / "audit_logs.json"
STAFF_FILE = DATA_DIR / "staff.json"

# 事件与指标数据路径
EVENTS_DIR = DATA_DIR / "events"
METRICS_DAILY_FILE = DATA_DIR / "metrics_daily.json"
METRICS_HOURLY_FILE = DATA_DIR / "metrics_hourly.json"
SEARCH_LOGS_FILE = DATA_DIR / "search_logs.json"

# Webhook 日志
WEBHOOK_LOGS_FILE = DATA_DIR / "webhook_logs.json"

# 飞书配置
FEISHU_WEBHOOK_URL = os.getenv(
    "FEISHU_WEBHOOK_URL",
    "https://open.feishu.cn/open-apis/bot/v2/hook/27c9ad3d-cf09-48f9-af93-fdd599240d60",
)
FEISHU_WEBHOOK_SECRET = os.getenv("FEISHU_WEBHOOK_SECRET", "")

# 通知开关
ENABLE_DAILY_REPORT = os.getenv("ENABLE_DAILY_REPORT", "true").lower() == "true"
ENABLE_WEEKLY_REPORT = os.getenv("ENABLE_WEEKLY_REPORT", "true").lower() == "true"
ENABLE_PENDING_ALERT = os.getenv("ENABLE_PENDING_ALERT", "true").lower() == "true"

# 技能申请通知开关
ENABLE_PUBLISH_APPLY_NOTIFY = (
    os.getenv("ENABLE_PUBLISH_APPLY_NOTIFY", "true").lower() == "true"
)
ENABLE_APPROVE_NOTIFY = os.getenv("ENABLE_APPROVE_NOTIFY", "true").lower() == "true"
ENABLE_REJECT_NOTIFY = os.getenv("ENABLE_REJECT_NOTIFY", "true").lower() == "true"
ENABLE_UPDATE_APPLY_NOTIFY = (
    os.getenv("ENABLE_UPDATE_APPLY_NOTIFY", "true").lower() == "true"
)

# 通知时间
DAILY_REPORT_TIME = os.getenv("DAILY_REPORT_TIME", "18:00")
WEEKLY_REPORT_DAY = int(os.getenv("WEEKLY_REPORT_DAY", "5"))  # 周五
WEEKLY_REPORT_TIME = os.getenv("WEEKLY_REPORT_TIME", "18:00")

# 告警阈值
PENDING_ALERT_THRESHOLD = int(os.getenv("PENDING_ALERT_THRESHOLD", "5"))

# 快速审批Token（用于飞书卡片链接）
QUICK_APPROVE_TOKEN = os.getenv("QUICK_APPROVE_TOKEN", "skillhub-quick-approve-2026")

# 飞书事件订阅配置（用于接收@消息）
FEISHU_VERIFY_TOKEN = os.getenv("FEISHU_VERIFY_TOKEN", "")
FEISHU_ENCRYPT_KEY = os.getenv("FEISHU_ENCRYPT_KEY", "")

# 指标统计标准定义
METRIC_STANDARDS = {
    "views": {
        "name": "浏览量",
        "icon": "👁",
        "standard": "去重IP/日",
        "description": "每个IP每天只计1次浏览，避免重复刷新",
        "formula": "count(distinct ip, date)",
    },
    "downloads": {
        "name": "下载量",
        "icon": "⬇",
        "standard": "每次下载计1次",
        "description": "每次点击下载按钮即计1次，不限制同一用户",
        "formula": "count(download_event)",
    },
    "publishes": {
        "name": "发布量",
        "icon": "📦",
        "standard": "审核通过技能",
        "description": "状态为approved的技能数量，不包括待审核和拒绝的",
        "formula": "count(status='approved')",
    },
    "searches": {
        "name": "搜索量",
        "icon": "🔍",
        "standard": "每次搜索计1次",
        "description": "每次搜索请求计1次，包括有结果和无结果",
        "formula": "count(search_event)",
    },
    "users": {
        "name": "活跃用户",
        "icon": "👤",
        "standard": "有操作行为用户",
        "description": "至少产生1次事件（浏览/下载/搜索/发布）的独立用户",
        "formula": "count(distinct user)",
    },
}

# 应用配置
APP_NAME = "随航守卫"
APP_VERSION = "1.0.0"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {".zip"}
DEFAULT_PAGE_SIZE = 20
