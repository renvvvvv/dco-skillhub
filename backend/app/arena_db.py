"""Skill擂台数据存储"""

import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from app.config import DATA_DIR

# 数据文件路径
ARENA_EVALUATIONS_FILE = DATA_DIR / "arena_evaluations.json"
ARENA_APPLICATIONS_FILE = DATA_DIR / "arena_applications.json"
ARENA_SCORES_FILE = DATA_DIR / "arena_scores.json"


class ArenaDatabase:
    """Skill擂台数据库"""

    def __init__(self):
        self.evaluations_file = ARENA_EVALUATIONS_FILE
        self.applications_file = ARENA_APPLICATIONS_FILE
        self.scores_file = ARENA_SCORES_FILE
        self._ensure_files()

    def _ensure_files(self):
        """确保数据文件存在"""
        for file_path in [
            self.evaluations_file,
            self.applications_file,
            self.scores_file,
        ]:
            if not file_path.exists():
                file_path.write_text(json.dumps({"data": []}, ensure_ascii=False))

    def _read(self, file_path: Path) -> dict:
        """读取数据"""
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except:
            return {"data": []}

    def _write(self, file_path: Path, data: dict):
        """写入数据"""
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ========== 评选管理 ==========

    def create_evaluation(self, evaluation: dict) -> dict:
        """创建评选"""
        data = self._read(self.evaluations_file)
        evaluation["id"] = (
            f"eva-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
        )
        evaluation["created_at"] = datetime.now().isoformat()
        evaluation["updated_at"] = datetime.now().isoformat()
        data["data"].append(evaluation)
        self._write(self.evaluations_file, data)
        return evaluation

    def get_evaluations(
        self, status: Optional[str] = None, type_: Optional[str] = None
    ) -> List[dict]:
        """获取评选列表"""
        data = self._read(self.evaluations_file)
        evaluations = data.get("data", [])

        if status:
            evaluations = [e for e in evaluations if e.get("status") == status]
        if type_:
            evaluations = [e for e in evaluations if e.get("type") == type_]

        # 按创建时间倒序
        evaluations.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return evaluations

    def get_evaluation(self, evaluation_id: str) -> Optional[dict]:
        """获取单个评选"""
        data = self._read(self.evaluations_file)
        for e in data.get("data", []):
            if e.get("id") == evaluation_id:
                return e
        return None

    def update_evaluation(self, evaluation_id: str, updates: dict) -> Optional[dict]:
        """更新评选"""
        data = self._read(self.evaluations_file)
        for i, e in enumerate(data.get("data", [])):
            if e.get("id") == evaluation_id:
                data["data"][i].update(updates)
                data["data"][i]["updated_at"] = datetime.now().isoformat()
                self._write(self.evaluations_file, data)
                return data["data"][i]
        return None

    # ========== 申报管理 ==========

    def create_application(self, application: dict) -> dict:
        """创建申报"""
        data = self._read(self.applications_file)
        application["id"] = (
            f"app-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
        )
        application["created_at"] = datetime.now().isoformat()
        application["updated_at"] = datetime.now().isoformat()
        data["data"].append(application)
        self._write(self.applications_file, data)
        return application

    def get_applications(
        self,
        evaluation_id: Optional[str] = None,
        user: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[dict]:
        """获取申报列表"""
        data = self._read(self.applications_file)
        applications = data.get("data", [])

        if evaluation_id:
            applications = [
                a for a in applications if a.get("evaluation_id") == evaluation_id
            ]
        if user:
            applications = [a for a in applications if a.get("author") == user]
        if status:
            applications = [a for a in applications if a.get("status") == status]

        applications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return applications

    def get_application(self, application_id: str) -> Optional[dict]:
        """获取单个申报"""
        data = self._read(self.applications_file)
        for a in data.get("data", []):
            if a.get("id") == application_id:
                return a
        return None

    def update_application(self, application_id: str, updates: dict) -> Optional[dict]:
        """更新申报"""
        data = self._read(self.applications_file)
        for i, a in enumerate(data.get("data", [])):
            if a.get("id") == application_id:
                data["data"][i].update(updates)
                data["data"][i]["updated_at"] = datetime.now().isoformat()
                self._write(self.applications_file, data)
                return data["data"][i]
        return None

    # ========== 评分管理 ==========

    def create_score(self, score: dict) -> dict:
        """创建评分"""
        data = self._read(self.scores_file)
        score["id"] = (
            f"score-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
        )
        score["created_at"] = datetime.now().isoformat()
        data["data"].append(score)
        self._write(self.scores_file, data)
        return score

    def get_scores(
        self, evaluation_id: Optional[str] = None, skill_id: Optional[str] = None
    ) -> List[dict]:
        """获取评分列表"""
        data = self._read(self.scores_file)
        scores = data.get("data", [])

        if evaluation_id:
            scores = [s for s in scores if s.get("evaluation_id") == evaluation_id]
        if skill_id:
            scores = [s for s in scores if s.get("skill_id") == skill_id]

        scores.sort(key=lambda x: x.get("total_score", 0), reverse=True)
        return scores

    # ========== 统计 ==========

    def get_statistics(self) -> dict:
        """获取统计数据"""
        evaluations = self.get_evaluations()
        applications = self.get_applications()

        total_budget = sum(e.get("budget", 0) for e in evaluations)
        total_rewarded = sum(e.get("total_rewarded", 0) for e in evaluations)
        total_applications = len(applications)
        total_approved = len([a for a in applications if a.get("status") == "approved"])
        unique_authors = len(set(a.get("author") for a in applications))

        return {
            "total_budget": total_budget,
            "total_rewarded": total_rewarded,
            "remaining_budget": total_budget - total_rewarded,
            "total_applications": total_applications,
            "total_approved": total_approved,
            "unique_authors": unique_authors,
            "active_evaluations": len(
                [
                    e
                    for e in evaluations
                    if e.get("status") in ["open", "evaluating", "reviewing"]
                ]
            ),
            "completed_evaluations": len(
                [
                    e
                    for e in evaluations
                    if e.get("status") in ["approved", "distributed"]
                ]
            ),
        }


# 全局实例
arena_db = ArenaDatabase()
