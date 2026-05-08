"""JSON 文件数据库操作"""
import json
import os
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.config import (
    SKILLS_FILE, VERSIONS_FILE, SEARCH_INDEX_FILE, 
    VIEWS_FILE, VIEW_RECORDS_FILE, AUDIT_LOGS_FILE, STAFF_FILE,
    METRICS_DAILY_FILE, METRICS_HOURLY_FILE, SEARCH_LOGS_FILE
)


class JSONDatabase:
    """线程安全的 JSON 文件数据库"""
    
    def __init__(self, file_path: Path, default_data: dict = None):
        self.file_path = file_path
        self.default_data = default_data or {}
        self._lock = threading.Lock()
        self._ensure_exists()
    
    def _ensure_exists(self):
        """确保文件存在"""
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.file_path.write_text(
                json.dumps(self.default_data, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
    
    def read(self) -> dict:
        """读取数据"""
        try:
            with self._lock:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if not content:
                        return self.default_data.copy()
                    return json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            return self.default_data.copy()
    
    def write(self, data: dict):
        """写入数据"""
        with self._lock:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    
    def update(self, updater: callable):
        """原子更新"""
        with self._lock:
            # 直接读取，不通过 read() 方法避免重入锁
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if not content:
                        data = self.default_data.copy()
                    else:
                        data = json.loads(content)
            except (json.JSONDecodeError, FileNotFoundError):
                data = self.default_data.copy()
            
            # 更新数据
            updater(data)
            
            # 直接写入，不通过 write() 方法
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)


# 数据库实例
skills_db = JSONDatabase(SKILLS_FILE, {"skills": []})
versions_db = JSONDatabase(VERSIONS_FILE, {"versions": []})
search_db = JSONDatabase(SEARCH_INDEX_FILE, {"index": {}})
views_db = JSONDatabase(VIEWS_FILE, {"views": {}})
view_records_db = JSONDatabase(VIEW_RECORDS_FILE, {"records": {}})
audit_logs_db = JSONDatabase(AUDIT_LOGS_FILE, {"logs": []})
staff_db = JSONDatabase(STAFF_FILE, {"staff": []})

# 新增：指标数据库实例
metrics_daily_db = JSONDatabase(METRICS_DAILY_FILE, {})
metrics_hourly_db = JSONDatabase(METRICS_HOURLY_FILE, {})
search_logs_db = JSONDatabase(SEARCH_LOGS_FILE, {"searches": []})
