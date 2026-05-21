"""速成地图数据库 - 场景地图和精选集管理"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.config import DATA_DIR

# 数据文件路径
SCENARIO_MAPS_FILE = DATA_DIR / "scenario_maps.json"
COLLECTIONS_FILE = DATA_DIR / "collections.json"
QUICKSTART_CONFIG_FILE = DATA_DIR / "quickstart_config.json"


class ScenarioMapsDatabase:
    """场景地图数据库"""

    def __init__(self):
        self.file_path = SCENARIO_MAPS_FILE
        self._ensure_file()

    def _ensure_file(self):
        """确保数据文件存在"""
        if not self.file_path.exists():
            self.file_path.write_text(
                json.dumps({"scenarios": []}, ensure_ascii=False, indent=2)
            )

    def _read(self) -> dict:
        """读取数据"""
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except:
            return {"scenarios": []}

    def _write(self, data: dict):
        """写入数据"""
        self.file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def get_all(self) -> List[dict]:
        """获取所有场景地图"""
        return self._read().get("scenarios", [])

    def get_by_id(self, scenario_id: str) -> Optional[dict]:
        """根据ID获取场景地图"""
        scenarios = self.get_all()
        return next((s for s in scenarios if s.get("id") == scenario_id), None)

    def create(self, data: dict) -> dict:
        """创建场景地图"""
        db = self._read()
        scenario = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "icon": data.get("icon", "🗺️"),
            "color": data.get("color", "#3B82F6"),
            "skills": data.get("skills", []),
            "workflow": data.get("workflow", []),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": data.get("created_by", "admin"),
            "is_public": data.get("is_public", True),
            "sort_order": data.get("sort_order", 0),
        }
        db["scenarios"].append(scenario)
        self._write(db)
        return scenario

    def update(self, scenario_id: str, data: dict) -> Optional[dict]:
        """更新场景地图"""
        db = self._read()
        scenarios = db.get("scenarios", [])

        for i, scenario in enumerate(scenarios):
            if scenario.get("id") == scenario_id:
                # 保留不可变字段
                immutable = {"id", "created_at", "created_by"}
                for key, value in data.items():
                    if key not in immutable:
                        scenarios[i][key] = value
                scenarios[i]["updated_at"] = datetime.now().isoformat()
                self._write(db)
                return scenarios[i]
        return None

    def delete(self, scenario_id: str) -> bool:
        """删除场景地图"""
        db = self._read()
        scenarios = db.get("scenarios", [])
        original_len = len(scenarios)
        db["scenarios"] = [s for s in scenarios if s.get("id") != scenario_id]
        if len(db["scenarios"]) < original_len:
            self._write(db)
            return True
        return False

    def update_skills(self, scenario_id: str, skills: List[dict]) -> Optional[dict]:
        """更新场景地图关联的技能"""
        return self.update(scenario_id, {"skills": skills})

    def reorder_skills(
        self, scenario_id: str, skill_orders: List[dict]
    ) -> Optional[dict]:
        """重新排序场景地图中的技能"""
        scenario = self.get_by_id(scenario_id)
        if not scenario:
            return None

        skills = scenario.get("skills", [])
        order_map = {item["skill_id"]: item["order"] for item in skill_orders}

        for skill in skills:
            if skill["skill_id"] in order_map:
                skill["config"]["order"] = order_map[skill["skill_id"]]

        # 按order排序
        skills.sort(key=lambda x: x.get("config", {}).get("order", 0))
        return self.update_skills(scenario_id, skills)


class CollectionsDatabase:
    """精选集数据库（类似QQ音乐歌单）"""

    def __init__(self):
        self.file_path = COLLECTIONS_FILE
        self._ensure_file()

    def _ensure_file(self):
        """确保数据文件存在"""
        if not self.file_path.exists():
            self.file_path.write_text(
                json.dumps({"collections": []}, ensure_ascii=False, indent=2)
            )

    def _read(self) -> dict:
        """读取数据"""
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except:
            return {"collections": []}

    def _write(self, data: dict):
        """写入数据"""
        self.file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def get_all(self) -> List[dict]:
        """获取所有精选集"""
        return self._read().get("collections", [])

    def get_by_id(self, collection_id: str) -> Optional[dict]:
        """根据ID获取精选集"""
        collections = self.get_all()
        return next((c for c in collections if c.get("id") == collection_id), None)

    def create(self, data: dict) -> dict:
        """创建精选集"""
        db = self._read()
        collection = {
            "id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "cover_image": data.get("cover_image", ""),
            "icon": data.get("icon", "⭐"),
            "color": data.get("color", "#F59E0B"),
            "skills": data.get("skills", []),
            "tags": data.get("tags", []),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": data.get("created_by", "admin"),
            "created_by_name": data.get("created_by_name", "管理员"),
            "is_public": data.get("is_public", True),
            "sort_order": data.get("sort_order", 0),
            "play_count": 0,
            "like_count": 0,
        }
        db["collections"].append(collection)
        self._write(db)
        return collection

    def update(self, collection_id: str, data: dict) -> Optional[dict]:
        """更新精选集"""
        db = self._read()
        collections = db.get("collections", [])

        for i, collection in enumerate(collections):
            if collection.get("id") == collection_id:
                immutable = {"id", "created_at", "created_by"}
                for key, value in data.items():
                    if key not in immutable:
                        collections[i][key] = value
                collections[i]["updated_at"] = datetime.now().isoformat()
                self._write(db)
                return collections[i]
        return None

    def delete(self, collection_id: str) -> bool:
        """删除精选集"""
        db = self._read()
        collections = db.get("collections", [])
        original_len = len(collections)
        db["collections"] = [c for c in collections if c.get("id") != collection_id]
        if len(db["collections"]) < original_len:
            self._write(db)
            return True
        return False

    def update_skills(self, collection_id: str, skills: List[dict]) -> Optional[dict]:
        """更新精选集关联的技能"""
        return self.update(collection_id, {"skills": skills})

    def increment_play_count(self, collection_id: str) -> Optional[dict]:
        """增加播放/使用次数"""
        collection = self.get_by_id(collection_id)
        if collection:
            current = collection.get("play_count", 0)
            return self.update(collection_id, {"play_count": current + 1})
        return None


class QuickstartConfigDatabase:
    """速成地图配置数据库"""

    def __init__(self):
        self.file_path = QUICKSTART_CONFIG_FILE
        self._ensure_file()

    def _ensure_file(self):
        """确保数据文件存在"""
        if not self.file_path.exists():
            default_config = {
                "usage_map": {
                    "roles": [
                        {
                            "id": "user",
                            "name": "使用者",
                            "icon": "👤",
                            "description": "快速上手使用现有Skill，提升工作效率",
                            "steps": [
                                {
                                    "order": 1,
                                    "title": "浏览Skill库",
                                    "description": "在浏览页查看所有可用Skill，通过标签筛选快速定位所需技能",
                                    "icon": "🔍",
                                },
                                {
                                    "order": 2,
                                    "title": "阅读文档",
                                    "description": "查看Skill的README和使用说明，了解功能特性和使用方法",
                                    "icon": "📖",
                                },
                                {
                                    "order": 3,
                                    "title": "下载使用",
                                    "description": "下载Skill包并按说明配置，快速集成到工作流中",
                                    "icon": "⬇️",
                                },
                                {
                                    "order": 4,
                                    "title": "反馈评价",
                                    "description": "使用后在Skill擂台评价，帮助其他用户选择优质Skill",
                                    "icon": "💬",
                                },
                            ],
                        },
                        {
                            "id": "developer",
                            "name": "开发者",
                            "icon": "👨‍💻",
                            "description": "开发并发布自己的Skill，分享技术能力",
                            "steps": [
                                {
                                    "order": 1,
                                    "title": "阅读开发规范",
                                    "description": "了解Skill开发标准和最佳实践，确保代码质量",
                                    "icon": "📋",
                                },
                                {
                                    "order": 2,
                                    "title": "下载模板",
                                    "description": "使用官方模板快速开始，减少重复配置工作",
                                    "icon": "📦",
                                },
                                {
                                    "order": 3,
                                    "title": "开发Skill",
                                    "description": "按照规范开发自己的Skill，实现核心功能逻辑",
                                    "icon": "⚙️",
                                },
                                {
                                    "order": 4,
                                    "title": "代码检查",
                                    "description": "使用代码质量检查工具，确保符合团队标准",
                                    "icon": "🔍",
                                },
                                {
                                    "order": 5,
                                    "title": "提交发布",
                                    "description": "填写信息并提交审核，等待管理员审批上线",
                                    "icon": "🚀",
                                },
                            ],
                        },
                        {
                            "id": "manager",
                            "name": "管理者",
                            "icon": "👔",
                            "description": "管理和运营Skill平台，保障生态健康发展",
                            "steps": [
                                {
                                    "order": 1,
                                    "title": "审核发布",
                                    "description": "审核开发者提交的Skill，确保质量和安全性",
                                    "icon": "✅",
                                },
                                {
                                    "order": 2,
                                    "title": "数据统计",
                                    "description": "查看平台使用数据和趋势，了解Skill生态状况",
                                    "icon": "📊",
                                },
                                {
                                    "order": 3,
                                    "title": "精选推荐",
                                    "description": "设置每周精选和场景地图，推广优质Skill",
                                    "icon": "⭐",
                                },
                                {
                                    "order": 4,
                                    "title": "用户反馈",
                                    "description": "处理用户评价和建议，持续优化平台体验",
                                    "icon": "💭",
                                },
                            ],
                        },
                    ],
                    "resources": [
                        {
                            "id": "video-tutorial",
                            "title": "视频教程",
                            "type": "video",
                            "url": "#",
                            "icon": "🎥",
                            "description": "5分钟快速上手SkillHub，从零基础到熟练操作",
                        },
                        {
                            "id": "quick-guide",
                            "title": "快速入门指南",
                            "type": "document",
                            "url": "#",
                            "icon": "📄",
                            "description": "图文并茂的使用手册，覆盖常见操作场景",
                        },
                        {
                            "id": "demo-project",
                            "title": "Demo项目",
                            "type": "demo",
                            "url": "#",
                            "icon": "🎯",
                            "description": "完整的示例Skill项目，参考最佳实践",
                        },
                        {
                            "id": "faq",
                            "title": "常见问题",
                            "type": "document",
                            "url": "#",
                            "icon": "❓",
                            "description": "新手最常问的问题解答，快速解决疑惑",
                        },
                    ],
                },
                "standards": {
                    "documents": [
                        {
                            "id": "dev-spec",
                            "title": "Skill开发规范",
                            "version": "v2.0",
                            "type": "specification",
                            "icon": "📋",
                            "description": "详细的Skill开发标准和规范要求，确保所有Skill质量一致",
                            "sections": [
                                {
                                    "title": "目录结构规范",
                                    "content": "标准Skill包必须包含：README.md（项目说明）、skill.json（元数据配置）、src/（源代码目录）、tests/（测试用例目录）、docs/（文档目录）。根目录下禁止存放源代码文件，所有代码必须组织在src目录下。",
                                },
                                {
                                    "title": "命名规范",
                                    "content": "Skill名称使用小写字母+连字符格式，如 fault-diagnosis-expert。变量命名采用snake_case，常量使用UPPER_CASE。类名使用PascalCase。避免使用拼音和无意义的缩写。",
                                },
                                {
                                    "title": "文档要求",
                                    "content": "README必须包含：功能描述、安装说明、使用示例、API文档、作者信息、更新日志。使用Markdown格式，代码示例必须可运行。API文档需说明每个参数的必填性、类型和默认值。",
                                },
                                {
                                    "title": "代码质量标准",
                                    "content": "代码必须通过pylint/flake8检查，评分不低于8.5分。单元测试覆盖率不低于80%。禁止硬编码敏感信息。异常处理必须完善，禁止裸except。日志使用标准logging模块，分级记录。",
                                },
                                {
                                    "title": "安全规范",
                                    "content": "禁止在代码中存储密码、Token等敏感信息，使用环境变量或配置文件。输入数据必须校验，防止注入攻击。文件操作使用绝对路径，避免路径遍历。网络请求设置超时，防止阻塞。",
                                },
                                {
                                    "title": "版本管理",
                                    "content": "采用语义化版本控制（SemVer），格式为MAJOR.MINOR.PATCH。重大更新升级MAJOR，功能新增升级MINOR，Bug修复升级PATCH。版本号必须在skill.json中声明，与Git标签保持一致。",
                                },
                            ],
                        },
                        {
                            "id": "template-guide",
                            "title": "模板使用指南",
                            "version": "v2.0",
                            "type": "guide",
                            "icon": "📐",
                            "description": "如何使用官方模板快速创建符合规范的Skill项目",
                            "download_url": "#",
                            "file_name": "skill-template-v2.zip",
                        },
                        {
                            "id": "checklist",
                            "title": "发布检查清单",
                            "version": "v2.0",
                            "type": "checklist",
                            "icon": "✅",
                            "description": "发布前必须完成的检查项，确保Skill质量达标",
                            "items": [
                                {
                                    "id": "c1",
                                    "text": "README.md 完整且清晰，包含所有必需章节",
                                    "required": True,
                                },
                                {
                                    "id": "c2",
                                    "text": "代码通过pylint/flake8质量检查（评分≥8.5）",
                                    "required": True,
                                },
                                {
                                    "id": "c3",
                                    "text": "包含skill.json配置文件且格式正确",
                                    "required": True,
                                },
                                {
                                    "id": "c4",
                                    "text": "单元测试覆盖率≥80%，所有测试通过",
                                    "required": True,
                                },
                                {
                                    "id": "c5",
                                    "text": "版本号符合SemVer规范（如v1.2.3）",
                                    "required": True,
                                },
                                {
                                    "id": "c6",
                                    "text": "作者信息完整（姓名、部门、联系方式）",
                                    "required": True,
                                },
                                {
                                    "id": "c7",
                                    "text": "标签分类正确，至少选择一个主标签",
                                    "required": True,
                                },
                                {
                                    "id": "c8",
                                    "text": "包含可运行的使用示例代码",
                                    "required": True,
                                },
                                {
                                    "id": "c9",
                                    "text": "无敏感信息硬编码（密码、Token等）",
                                    "required": True,
                                },
                                {
                                    "id": "c10",
                                    "text": "代码注释率≥20%，关键逻辑有说明",
                                    "required": False,
                                },
                                {
                                    "id": "c11",
                                    "text": "包含CHANGELOG.md更新日志",
                                    "required": False,
                                },
                                {
                                    "id": "c12",
                                    "text": "性能测试通过，响应时间<1s",
                                    "required": False,
                                },
                            ],
                        },
                        {
                            "id": "api-design",
                            "title": "API设计规范",
                            "version": "v1.0",
                            "type": "specification",
                            "icon": "🔌",
                            "description": "Skill对外提供API的设计标准和最佳实践",
                            "sections": [
                                {
                                    "title": "接口命名",
                                    "content": "API端点使用RESTful风格，动词+名词结构。如POST /api/analyze 用于分析，GET /api/status 用于查询状态。避免使用动词作为URL路径，如/getData应改为GET /data。",
                                },
                                {
                                    "title": "参数规范",
                                    "content": "请求参数使用JSON格式，字段名使用snake_case。必填参数在文档中标注required。日期时间使用ISO 8601格式（2024-01-01T00:00:00Z）。枚举值使用字符串而非数字。",
                                },
                                {
                                    "title": "响应格式",
                                    "content": "统一响应格式：{success: bool, data: any, message: string, error_code: string}。成功时success为true，data包含返回数据。失败时success为false，message描述错误原因。HTTP状态码与业务状态分离。",
                                },
                                {
                                    "title": "错误处理",
                                    "content": "错误码采用分层设计：1xxx系统错误、2xxx参数错误、3xxx业务错误、4xxx权限错误。错误信息必须具体，避免'系统错误'等模糊描述。记录错误日志，包含请求ID便于追踪。",
                                },
                            ],
                        },
                        {
                            "id": "testing-guide",
                            "title": "测试规范指南",
                            "version": "v1.0",
                            "type": "guide",
                            "icon": "🧪",
                            "description": "Skill测试策略和用例编写规范",
                            "download_url": "#",
                            "file_name": "testing-guide-v1.zip",
                        },
                    ],
                    "templates": [
                        {
                            "id": "basic-template",
                            "name": "基础模板",
                            "description": "最简Skill结构，适合快速原型开发，包含基础目录和配置文件",
                            "icon": "📦",
                            "download_url": "#",
                        },
                        {
                            "id": "advanced-template",
                            "name": "高级模板",
                            "description": "包含完整功能：日志、配置、错误处理、单元测试，适合生产环境",
                            "icon": "🎁",
                            "download_url": "#",
                        },
                        {
                            "id": "mcp-template",
                            "name": "MCP协议模板",
                            "description": "符合MCP协议的Skill模板，支持模型上下文协议",
                            "icon": "🔌",
                            "download_url": "#",
                        },
                        {
                            "id": "agent-template",
                            "name": "Agent开发模板",
                            "description": "智能体开发专用模板，包含记忆、工具调用、多轮对话支持",
                            "icon": "🤖",
                            "download_url": "#",
                        },
                        {
                            "id": "webhook-template",
                            "name": "Webhook模板",
                            "description": "Webhook回调处理模板，支持飞书/钉钉/企业微信通知",
                            "icon": "🔗",
                            "download_url": "#",
                        },
                    ],
                },
            }
            self.file_path.write_text(
                json.dumps(default_config, ensure_ascii=False, indent=2)
            )

    def _read(self) -> dict:
        """读取数据"""
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except:
            return {}

    def _write(self, data: dict):
        """写入数据"""
        self.file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def get_config(self) -> dict:
        """获取速成地图配置"""
        return self._read()

    def update_config(self, section: str, data: dict) -> dict:
        """更新配置"""
        config = self._read()
        if section not in config:
            config[section] = {}
        config[section] = {**config[section], **data}
        config["updated_at"] = datetime.now().isoformat()
        self._write(config)
        return config


# 数据库实例
scenario_maps_db = ScenarioMapsDatabase()
collections_db = CollectionsDatabase()
quickstart_config_db = QuickstartConfigDatabase()
