"""周报SVG生成器 - 解析1.svg模板

用于将周报数据填充到SVG模板，生成图片并通过Webhook发送
"""

import re
import os
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

from app.config import WEEKLY_SVG_TEMPLATE_FILE, WEEKLY_SVG_OUTPUT_DIR
from app.report_builder import WeeklyReportBuilder


class WeeklySVGGenerator:
    """周报SVG生成器"""

    def __init__(self, template_path: Optional[str] = None):
        self.template_path = (
            Path(template_path) if template_path else WEEKLY_SVG_TEMPLATE_FILE
        )
        self.output_dir = WEEKLY_SVG_OUTPUT_DIR

    def _load_template(self) -> str:
        """加载SVG模板"""
        if not self.template_path.exists():
            raise FileNotFoundError(f"SVG模板不存在: {self.template_path}")
        return self.template_path.read_text(encoding="utf-8")

    def _fill_template(self, template: str, data: dict) -> str:
        """填充模板数据

        根据1.svg模板的实际结构，替换以下动态变量：

        一、日期区域
        - {{week_range}}: 周范围，如 "2026-05-04 ~ 05-10"

        二、核心指标区（5个卡片）
        - {{views}}: 浏览量数值
        - {{views_trend}}: 浏览量环比，如 "⬇ -50.0%"
        - {{views_trend_color}}: 环比底色，如 "#fee2e2"(红)、"#dcfce7"(绿)、"#fef3c7"(黄)
        - {{views_trend_text_color}}: 环比文字色，如 "#ef4444"(红)、"#16a34a"(绿)、"#d97706"(黄)

        - {{downloads}}: 下载量数值
        - {{downloads_trend}}: 下载量环比
        - {{downloads_trend_color}}: 下载环比底色
        - {{downloads_trend_text_color}}: 下载环比文字色

        - {{publishes}}: 发布量数值
        - {{publishes_trend}}: 发布量环比
        - {{publishes_trend_color}}: 发布环比底色
        - {{publishes_trend_text_color}}: 发布环比文字色

        - {{searches}}: 搜索量数值
        - {{searches_trend}}: 搜索量环比
        - {{searches_trend_color}}: 搜索环比底色
        - {{searches_trend_text_color}}: 搜索环比文字色

        - {{users}}: 用户数数值
        - {{users_trend}}: 用户数环比
        - {{users_trend_color}}: 用户环比底色
        - {{users_trend_text_color}}: 用户环比文字色

        三、部门之星（Top3）
        - {{dept_1_name}}: 第1名部门名
        - {{dept_1_desc}}: 第1名部门描述
        - {{dept_1_skills}}: 第1名技能数
        - {{dept_1_downloads}}: 第1名下载数
        - {{dept_1_score}}: 第1名综合评分
        - {{dept_1_ring}}: 第1名圆环进度，如 "165 220"

        - {{dept_2_name}}: 第2名部门名
        - {{dept_2_desc}}: 第2名部门描述
        - {{dept_2_skills}}: 第2名技能数
        - {{dept_2_downloads}}: 第2名下载数
        - {{dept_2_score}}: 第2名综合评分
        - {{dept_2_ring}}: 第2名圆环进度

        - {{dept_3_name}}: 第3名部门名
        - {{dept_3_desc}}: 第3名部门描述
        - {{dept_3_skills}}: 第3名技能数
        - {{dept_3_downloads}}: 第3名下载数
        - {{dept_3_score}}: 第3名综合评分
        - {{dept_3_ring}}: 第3名圆环进度

        四、热门技能榜（Top3）
        - {{skill_1_icon}}: 第1名技能图标emoji
        - {{skill_1_name}}: 第1名技能名
        - {{skill_1_desc}}: 第1名技能简介
        - {{skill_1_author}}: 第1名作者
        - {{skill_1_dept}}: 第1名部门
        - {{skill_1_downloads}}: 第1名下载量
        - {{skill_1_bar}}: 第1名热度条宽度(固定60)

        - {{skill_2_icon}}: 第2名技能图标emoji
        - {{skill_2_name}}: 第2名技能名
        - {{skill_2_desc}}: 第2名技能简介
        - {{skill_2_author}}: 第2名作者
        - {{skill_2_dept}}: 第2名部门
        - {{skill_2_downloads}}: 第2名下载量
        - {{skill_2_bar}}: 第2名热度条宽度

        - {{skill_3_icon}}: 第3名技能图标emoji
        - {{skill_3_name}}: 第3名技能名
        - {{skill_3_desc}}: 第3名技能简介
        - {{skill_3_author}}: 第3名作者
        - {{skill_3_dept}}: 第3名部门
        - {{skill_3_downloads}}: 第3名下载量
        - {{skill_3_bar}}: 第3名热度条宽度
        """

        # 获取数据
        current_week = data.get("current_week", {})
        last_week = data.get("last_week", {})
        week_over_week = data.get("week_over_week", {})
        top_departments = data.get("top_departments", [])
        top_skills = data.get("top_skills", [])

        # 构建替换字典
        replacements = {}

        # 一、日期
        week_range = data.get("week_range", "")
        # 格式化日期显示，如 "2026-05-04 ~ 2026-05-10" -> "2026-05-04 ~ 05-10"
        if " ~ " in week_range:
            start, end = week_range.split(" ~ ")
            end_short = end[5:] if len(end) > 5 else end  # 去掉年份，只留 MM-DD
            replacements["week_range"] = f"{start} ~ {end_short}"
        else:
            replacements["week_range"] = week_range

        # 二、核心指标区
        metrics = [
            ("views", "浏览量", "👁"),
            ("downloads", "下载量", "⬇"),
            ("publishes", "发布量", "📦"),
            ("searches", "搜索量", "🔍"),
            ("users", "用户", "👤"),
        ]

        for key, label, icon in metrics:
            value = current_week.get(key, 0)
            replacements[key] = str(value)

            # 计算环比
            last_value = last_week.get(key, 0)
            if last_value > 0:
                change_pct = round((value - last_value) / last_value * 100, 1)
                if change_pct > 0:
                    replacements[f"{key}_trend"] = f"⬆ +{change_pct}%"
                    replacements[f"{key}_trend_color"] = "#dcfce7"  # 绿色底色
                    replacements[f"{key}_trend_text_color"] = "#16a34a"  # 绿色文字
                elif change_pct < 0:
                    replacements[f"{key}_trend"] = f"⬇ {change_pct}%"
                    replacements[f"{key}_trend_color"] = "#fee2e2"  # 红色底色
                    replacements[f"{key}_trend_text_color"] = "#ef4444"  # 红色文字
                else:
                    replacements[f"{key}_trend"] = "➖"
                    replacements[f"{key}_trend_color"] = "#fef3c7"  # 黄色底色
                    replacements[f"{key}_trend_text_color"] = "#d97706"  # 黄色文字
            else:
                replacements[f"{key}_trend"] = "-"
                replacements[f"{key}_trend_color"] = "#f1f5f9"  # 灰色底色
                replacements[f"{key}_trend_text_color"] = "#64748b"  # 灰色文字

        # 三、部门之星（Top3）
        for i, dept in enumerate(top_departments[:3], 1):
            replacements[f"dept_{i}_name"] = dept.get("name", "")
            replacements[f"dept_{i}_desc"] = dept.get(
                "description", f"{dept.get('name', '')}部门"
            )
            replacements[f"dept_{i}_skills"] = str(dept.get("publishes", 0))
            replacements[f"dept_{i}_downloads"] = str(dept.get("downloads", 0))

            score = dept.get("composite_score", 0)
            replacements[f"dept_{i}_score"] = str(score)

            # 圆环进度: stroke-dasharray="{进度} 220"
            # 进度 = (评分 / 100) * 220
            ring_progress = round(score / 100 * 220, 1)
            replacements[f"dept_{i}_ring"] = f"{ring_progress} 220"

        # 填充剩余部门占位符
        for i in range(len(top_departments) + 1, 4):
            replacements[f"dept_{i}_name"] = ""
            replacements[f"dept_{i}_desc"] = ""
            replacements[f"dept_{i}_skills"] = "0"
            replacements[f"dept_{i}_downloads"] = "0"
            replacements[f"dept_{i}_score"] = "0"
            replacements[f"dept_{i}_ring"] = "0 220"

        # 四、热门技能榜（Top3）
        # 计算最大下载量用于热度条比例
        max_downloads = 1  # 避免除0
        if top_skills:
            max_downloads = max(s.get("downloads", 0) for s in top_skills[:3]) or 1

        # 技能图标映射（可以根据技能名智能选择，这里简单轮询）
        skill_icons = ["⚡", "🔧", "📊", "🚀", "💡", "🔍", "⚙️", "📈"]

        for i, skill in enumerate(top_skills[:3], 1):
            replacements[f"skill_{i}_icon"] = skill_icons[(i - 1) % len(skill_icons)]
            replacements[f"skill_{i}_name"] = skill.get("name", "")
            replacements[f"skill_{i}_desc"] = skill.get("description", "")[
                :30
            ]  # 限制长度
            replacements[f"skill_{i}_author"] = skill.get(
                "author_name", skill.get("name", "未知")
            )
            replacements[f"skill_{i}_dept"] = skill.get("department", "")

            downloads = skill.get("downloads", 0)
            replacements[f"skill_{i}_downloads"] = str(downloads)

            # 热度条宽度 = (该技能下载量 / 第1名下载量) * 60
            if max_downloads > 0:
                bar_width = round(downloads / max_downloads * 60, 1)
                replacements[f"skill_{i}_bar"] = str(bar_width)
            else:
                replacements[f"skill_{i}_bar"] = "0"

        # 填充剩余技能占位符
        for i in range(len(top_skills) + 1, 4):
            replacements[f"skill_{i}_icon"] = ""
            replacements[f"skill_{i}_name"] = ""
            replacements[f"skill_{i}_desc"] = ""
            replacements[f"skill_{i}_author"] = ""
            replacements[f"skill_{i}_dept"] = ""
            replacements[f"skill_{i}_downloads"] = "0"
            replacements[f"skill_{i}_bar"] = "0"

        # 执行替换
        result = template
        for key, value in replacements.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))

        return result

    def generate(self, week_type: str = "current") -> dict:
        """生成周报SVG

        Args:
            week_type: "current" 本周 | "last" 上周

        Returns:
            {"svg_path": str, "png_path": str, "week_range": str}
        """
        # 1. 获取周报数据
        builder = WeeklyReportBuilder()
        report_data = builder.build(week_type=week_type)

        # 2. 加载模板
        template = self._load_template()

        # 3. 填充数据
        svg_content = self._fill_template(template, report_data)

        # 4. 保存SVG
        # 使用 this_week.week_range 作为文件名
        week_range = report_data.get("this_week", {}).get("week_range", "")
        if not week_range:
            week_range = report_data.get("week_range", "")

        # 清理文件名中的特殊字符
        safe_week_range = (
            week_range.replace(" ~ ", "_").replace("/", "-").replace(" ", "")
        )
        svg_filename = f"weekly_{safe_week_range}.svg"
        svg_path = self.output_dir / svg_filename
        svg_path.write_text(svg_content, encoding="utf-8")

        # 5. 转换为PNG
        png_filename = svg_filename.replace(".svg", ".png")
        png_path = self.output_dir / png_filename
        self._convert_to_png(svg_path, png_path)

        return {
            "svg_path": str(svg_path),
            "png_path": str(png_path),
            "week_range": week_range,
        }

    def _convert_to_png(self, svg_path: Path, png_path: Path) -> None:
        """将SVG转换为PNG

        优先使用cairosvg，其次使用inkscape
        """
        # 方法1: 使用cairosvg
        try:
            import cairosvg

            cairosvg.svg2png(url=str(svg_path), write_to=str(png_path), scale=2.0)
            return
        except ImportError:
            pass

        # 方法2: 使用inkscape
        try:
            subprocess.run(
                [
                    "inkscape",
                    str(svg_path),
                    "--export-type=png",
                    f"--export-filename={png_path}",
                    "--export-dpi=300",
                ],
                check=True,
                capture_output=True,
            )
            return
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

        # 方法3: 使用ImageMagick
        try:
            subprocess.run(
                ["convert", str(svg_path), "-density", "300", str(png_path)],
                check=True,
                capture_output=True,
            )
            return
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

        raise RuntimeError(
            "无法转换SVG到PNG，请安装以下工具之一:\n"
            "  pip install cairosvg\n"
            "  apt-get install inkscape\n"
            "  apt-get install imagemagick"
        )

    def get_latest_png(self) -> Optional[str]:
        """获取最新的周报PNG路径"""
        png_files = sorted(
            self.output_dir.glob("weekly_*.png"),
            key=lambda x: x.stat().st_mtime,
            reverse=True,
        )
        return str(png_files[0]) if png_files else None


# 便捷函数
def generate_weekly_svg(week_type: str = "current") -> dict:
    """生成周报SVG（便捷函数）"""
    generator = WeeklySVGGenerator()
    return generator.generate(week_type=week_type)


def get_weekly_png_path(week_range: str = None) -> Optional[str]:
    """获取指定周的PNG路径"""
    if week_range:
        png_path = WEEKLY_SVG_OUTPUT_DIR / f"weekly_{week_range}.png"
        return str(png_path) if png_path.exists() else None

    # 返回最新的
    generator = WeeklySVGGenerator()
    return generator.get_latest_png()
