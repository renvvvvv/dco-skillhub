"""
Skill 脱敏检查模块
用于检查 skill.md 中的敏感信息
"""

import re
from typing import List, Dict

# 脱敏规则配置（与前端保持一致）
SENSITIVE_RULES = [
    # 认证凭证（高风险）
    {"pattern": r'token\s*[=:]\s*["\'][^"\']+["\']', "name": "Token", "level": "high"},
    {
        "pattern": r'password\s*[=:]\s*["\'][^"\']+["\']',
        "name": "Password",
        "level": "high",
    },
    {
        "pattern": r'api_key\s*[=:]\s*["\'][^"\']+["\']',
        "name": "API Key",
        "level": "high",
    },
    {
        "pattern": r'secret\s*[=:]\s*["\'][^"\']+["\']',
        "name": "Secret",
        "level": "high",
    },
    {"pattern": r"Bearer\s+[a-zA-Z0-9\-_]+", "name": "Bearer Token", "level": "high"},
    {
        "pattern": r'authorization\s*[=:]\s*["\'][^"\']+["\']',
        "name": "Authorization",
        "level": "high",
    },
    # 应用凭证（中风险）
    {
        "pattern": r'app_id\s*[=:]\s*["\'][^"\']+["\']',
        "name": "App ID",
        "level": "medium",
    },
    {
        "pattern": r'client_secret\s*[=:]\s*["\'][^"\']+["\']',
        "name": "Client Secret",
        "level": "high",
    },
    {"pattern": r'auth\s*[=:]\s*["\'][^"\']+["\']', "name": "Auth", "level": "medium"},
    # 数据库连接（高风险）
    {"pattern": r"jdbc:\w+://[^;\s]+", "name": "JDBC Connection", "level": "high"},
    {"pattern": r"mongodb://[^/\s]+", "name": "MongoDB Connection", "level": "high"},
    {"pattern": r"redis://[^/\s]+", "name": "Redis Connection", "level": "high"},
    {"pattern": r"mysql://[^/\s]+", "name": "MySQL Connection", "level": "high"},
    {
        "pattern": r"postgresql://[^/\s]+",
        "name": "PostgreSQL Connection",
        "level": "high",
    },
    # 内网IP（中风险）
    {
        "pattern": r"(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)",
        "name": "Internal IP",
        "level": "medium",
    },
    # Webhook（高风险）
    {
        "pattern": r'https://(open\.feishu|oapi\.dingtalk|qyapi\.weixin)\.cn/[^"\s]+',
        "name": "Webhook URL",
        "level": "high",
    },
    # 云服务密钥（高风险）
    {
        "pattern": r"(AKID|AKSecret|LTAI)[a-zA-Z0-9\-_]+",
        "name": "Cloud Access Key",
        "level": "high",
    },
    {
        "pattern": r"(AWS|阿里云|腾讯云|华为云)\s*(密钥|key|secret)",
        "name": "Cloud Secret",
        "level": "high",
    },
]

# 白名单：允许出现在代码示例中的模式
WHITELIST_PATTERNS = [
    re.compile(r"example[_-]?(password|token|key|secret)", re.IGNORECASE),
    re.compile(r"demo[_-]?(password|token|key|secret)", re.IGNORECASE),
    re.compile(r"test[_-]?(password|token|key|secret)", re.IGNORECASE),
    re.compile(r"your[_-]?(password|token|key|secret)", re.IGNORECASE),
    re.compile(r"placeholder", re.IGNORECASE),
    re.compile(r"xxx+"),  # 如 "token=xxx"
    re.compile(r"\*\*\*+"),  # 已脱敏的 ***
]


def is_whitelisted(content: str) -> bool:
    """检查是否在白名单中"""
    return any(pattern.search(content) for pattern in WHITELIST_PATTERNS)


def contains_chinese(text: str) -> bool:
    """检查文本是否包含中文字符"""
    return bool(re.search(r"[\u4e00-\u9fa5]", text))


def check_skill_md_sensitive(content: str) -> List[Dict]:
    """
    检查 skill.md 内容中的敏感信息

    Args:
        content: skill.md 文件内容

    Returns:
        敏感信息列表，每项包含：line, type, level, content
    """
    issues = []
    lines = content.split("\n")

    for line_no, line in enumerate(lines, 1):
        for rule in SENSITIVE_RULES:
            if re.search(rule["pattern"], line, re.IGNORECASE):
                # 检查是否在白名单中
                if is_whitelisted(line):
                    continue

                issues.append(
                    {
                        "line": line_no,
                        "type": rule["name"],
                        "level": rule["level"],
                        "content": line.strip()[:100],
                    }
                )

    return issues


def validate_skill_metadata(name: str, description: str) -> List[str]:
    """
    验证 skill 元数据

    Args:
        name: 技能名称
        description: 技能简介

    Returns:
        错误信息列表
    """
    errors = []

    # 检查名称是否为中文
    if not contains_chinese(name):
        errors.append(f"技能名称「{name or '空'}」必须包含中文字符")

    # 检查简介长度（200字限制）
    if len(description) > 200:
        errors.append(f"技能简介长度 {len(description)} 字，超过 200 字限制")

    return errors


def format_validation_errors(errors: List[Dict]) -> str:
    """
    格式化校验错误为字符串

    Args:
        errors: 错误列表

    Returns:
        格式化后的错误信息
    """
    if not errors:
        return ""

    lines = ["发布检查未通过，发现以下问题："]

    for error in errors:
        level_str = (
            "【高风险】"
            if error.get("level") == "high"
            else "【中风险】"
            if error.get("level") == "medium"
            else ""
        )
        line_str = f"  - {level_str} {error['type']}"

        if "line" in error:
            line_str += f" (第{error['line']}行)"

        if "content" in error:
            line_str += f": {error['content']}"
        elif "message" in error:
            line_str += f": {error['message']}"

        lines.append(line_str)

    return "\n".join(lines)
