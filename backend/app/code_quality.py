"""自动化代码质量检测"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime


class CodeQualityChecker:
    """代码质量检测器"""

    def __init__(self):
        self.issues = []
        self.score = 100

    def check_all(self, code_content: str, file_type: str = "python") -> dict:
        """执行所有检测"""
        self.issues = []
        self.score = 100

        if file_type == "python":
            self._check_python_code(code_content)
        elif file_type in ["js", "javascript", "ts", "typescript"]:
            self._check_javascript_code(code_content)
        elif file_type in ["md", "markdown"]:
            self._check_documentation(code_content)
        else:
            self._check_generic_code(code_content)

        # 计算最终分数
        self.score = max(0, 100 - len(self.issues) * 2)

        return {
            "score": self.score,
            "grade": self._get_grade(self.score),
            "issues": self.issues,
            "summary": {
                "total_issues": len(self.issues),
                "critical": len(
                    [i for i in self.issues if i["severity"] == "critical"]
                ),
                "warning": len([i for i in self.issues if i["severity"] == "warning"]),
                "info": len([i for i in self.issues if i["severity"] == "info"]),
            },
        }

    def _check_python_code(self, code: str):
        """检查Python代码"""
        lines = code.split("\n")

        # 检查代码长度
        if len(lines) > 500:
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "complexity",
                    "message": f"代码文件过长 ({len(lines)} 行)，建议拆分为多个模块",
                    "line": 1,
                }
            )

        # 检查函数长度
        in_function = False
        function_lines = 0
        function_start = 0
        for i, line in enumerate(lines):
            if re.match(r"^\s*def\s+\w+", line):
                if in_function and function_lines > 50:
                    self.issues.append(
                        {
                            "severity": "warning",
                            "category": "complexity",
                            "message": f"函数过长 ({function_lines} 行)，建议重构",
                            "line": function_start,
                        }
                    )
                in_function = True
                function_lines = 0
                function_start = i + 1
            elif in_function:
                if (
                    line.strip()
                    and not line.startswith(" ")
                    and not line.startswith("\t")
                ):
                    if function_lines > 50:
                        self.issues.append(
                            {
                                "severity": "warning",
                                "category": "complexity",
                                "message": f"函数过长 ({function_lines} 行)，建议重构",
                                "line": function_start,
                            }
                        )
                    in_function = False
                else:
                    function_lines += 1

        # 检查是否有文档字符串
        if not re.search(r'""".*?"""', code, re.DOTALL) and not re.search(r"'''.*?'''"):
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "documentation",
                    "message": "缺少模块级文档字符串",
                    "line": 1,
                }
            )

        # 检查是否有类型注解
        if not re.search(r":\s*\w+\s*[=\)]", code):
            self.issues.append(
                {
                    "severity": "info",
                    "category": "typing",
                    "message": "建议使用类型注解提高代码可读性",
                    "line": 1,
                }
            )

        # 检查异常处理
        if "try:" in code and "except" not in code:
            self.issues.append(
                {
                    "severity": "critical",
                    "category": "error_handling",
                    "message": "发现try块但没有对应的except处理",
                    "line": 1,
                }
            )

        # 检查硬编码密码/密钥
        password_patterns = [
            r'password\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'api_key\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']',
        ]
        for pattern in password_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                self.issues.append(
                    {
                        "severity": "critical",
                        "category": "security",
                        "message": "发现可能的硬编码敏感信息，请使用环境变量或配置文件",
                        "line": 1,
                    }
                )

        # 检查SQL注入风险
        if re.search(r'execute\s*\(\s*["\'].*%s', code):
            self.issues.append(
                {
                    "severity": "critical",
                    "category": "security",
                    "message": "发现可能的SQL注入风险，请使用参数化查询",
                    "line": 1,
                }
            )

        # 检查代码注释率
        comment_lines = len([l for l in lines if l.strip().startswith("#")])
        if len(lines) > 0 and comment_lines / len(lines) < 0.1:
            self.issues.append(
                {
                    "severity": "info",
                    "category": "documentation",
                    "message": "代码注释率较低，建议添加更多注释",
                    "line": 1,
                }
            )

    def _check_javascript_code(self, code: str):
        """检查JavaScript/TypeScript代码"""
        lines = code.split("\n")

        # 检查console.log
        if "console.log" in code:
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "best_practice",
                    "message": "代码中包含console.log，生产环境建议移除",
                    "line": 1,
                }
            )

        # 检查var使用
        if re.search(r"\bvar\s+", code):
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "best_practice",
                    "message": "建议使用let或const替代var",
                    "line": 1,
                }
            )

        # 检查==使用
        if re.search(r"\b==\b(?!\=)", code):
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "best_practice",
                    "message": "建议使用===替代==进行严格相等比较",
                    "line": 1,
                }
            )

        # 检查未处理的Promise
        if "new Promise" in code and ".catch" not in code:
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "error_handling",
                    "message": "Promise缺少.catch处理",
                    "line": 1,
                }
            )

    def _check_documentation(self, content: str):
        """检查文档质量"""
        lines = content.split("\n")

        # 检查文档长度
        if len(lines) < 10:
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "documentation",
                    "message": "文档内容较少，建议补充更多说明",
                    "line": 1,
                }
            )

        # 检查是否有标题
        if not re.search(r"^#\s+", content, re.MULTILINE):
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "documentation",
                    "message": "文档缺少标题",
                    "line": 1,
                }
            )

        # 检查是否有代码示例
        if "```" not in content:
            self.issues.append(
                {
                    "severity": "info",
                    "category": "documentation",
                    "message": "建议添加代码示例",
                    "line": 1,
                }
            )

    def _check_generic_code(self, code: str):
        """通用代码检查"""
        lines = code.split("\n")

        # 检查文件大小
        if len(code) > 100000:
            self.issues.append(
                {
                    "severity": "warning",
                    "category": "complexity",
                    "message": "文件过大，建议拆分",
                    "line": 1,
                }
            )

        # 检查空行比例
        empty_lines = len([l for l in lines if not l.strip()])
        if len(lines) > 0 and empty_lines / len(lines) > 0.3:
            self.issues.append(
                {
                    "severity": "info",
                    "category": "style",
                    "message": "空行比例过高",
                    "line": 1,
                }
            )

    def _get_grade(self, score: int) -> str:
        """获取等级"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"


def analyze_skill_package(skill_path: Path) -> dict:
    """分析Skill包的质量"""
    checker = CodeQualityChecker()
    results = {
        "overall_score": 0,
        "overall_grade": "N/A",
        "files": [],
        "summary": {
            "total_files": 0,
            "total_issues": 0,
            "critical_issues": 0,
            "warning_issues": 0,
            "info_issues": 0,
        },
    }

    if not skill_path.exists():
        return results

    total_score = 0
    file_count = 0

    # 遍历所有文件
    for file_path in skill_path.rglob("*"):
        if file_path.is_file():
            try:
                content = file_path.read_text(encoding="utf-8")
                relative_path = str(file_path.relative_to(skill_path))

                # 确定文件类型
                suffix = file_path.suffix.lower()
                if suffix == ".py":
                    file_type = "python"
                elif suffix in [".js", ".jsx"]:
                    file_type = "javascript"
                elif suffix in [".ts", ".tsx"]:
                    file_type = "typescript"
                elif suffix in [".md", ".markdown"]:
                    file_type = "markdown"
                else:
                    file_type = "generic"

                file_result = checker.check_all(content, file_type)
                file_result["file_path"] = relative_path

                results["files"].append(file_result)
                total_score += file_result["score"]
                file_count += 1

                # 更新汇总
                results["summary"]["total_issues"] += file_result["summary"][
                    "total_issues"
                ]
                results["summary"]["critical_issues"] += file_result["summary"][
                    "critical"
                ]
                results["summary"]["warning_issues"] += file_result["summary"][
                    "warning"
                ]
                results["summary"]["info_issues"] += file_result["summary"]["info"]

            except Exception as e:
                results["files"].append(
                    {
                        "file_path": relative_path,
                        "score": 0,
                        "grade": "Error",
                        "issues": [
                            {
                                "severity": "critical",
                                "category": "error",
                                "message": f"无法读取文件: {str(e)}",
                                "line": 1,
                            }
                        ],
                        "summary": {
                            "total_issues": 1,
                            "critical": 1,
                            "warning": 0,
                            "info": 0,
                        },
                    }
                )

    results["summary"]["total_files"] = file_count

    if file_count > 0:
        results["overall_score"] = round(total_score / file_count, 1)
        results["overall_grade"] = checker._get_grade(int(results["overall_score"]))

    return results


# 全局实例
code_checker = CodeQualityChecker()
