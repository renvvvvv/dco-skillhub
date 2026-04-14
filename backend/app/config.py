"""应用配置"""
from pathlib import Path

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

# 应用配置
APP_NAME = "SkillHub Lite"
APP_VERSION = "1.0.0"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {".zip"}
DEFAULT_PAGE_SIZE = 20
