"""飞书通知服务"""

import time
import requests
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.config import (
    FEISHU_WEBHOOK_URL,
    FEISHU_WEBHOOK_SECRET,
    FEISHU_WEBHOOK_URL_EXTERNAL,
    FEISHU_WEBHOOK_SECRET_EXTERNAL,
    QUICK_APPROVE_TOKEN,
)
from app.timezone_utils import get_beijing_time, get_beijing_datetime
from app.webhook_logs import WebhookLog, WebhookLogService


class FeishuNotifier:
    """飞书机器人通知器 - 支持双通道"""

    def __init__(
        self,
        webhook_url: Optional[str] = None,
        secret: Optional[str] = None,
        channel: str = "internal",
    ):
        """
        初始化通知器

        Args:
            webhook_url: 自定义webhook地址
            secret: 自定义签名密钥
            channel: 通道类型 - internal 内部通道 | external 外部通道
        """
        self.channel = channel
        if webhook_url:
            self.webhook_url = webhook_url
            self.secret = secret or ""
        elif channel == "external":
            # 外部通道
            self.webhook_url = FEISHU_WEBHOOK_URL_EXTERNAL
            self.secret = FEISHU_WEBHOOK_SECRET_EXTERNAL
        else:
            # 内部通道（默认）
            self.webhook_url = FEISHU_WEBHOOK_URL
            self.secret = FEISHU_WEBHOOK_SECRET

    def _gen_sign(self, timestamp: int) -> str:
        """生成飞书签名"""
        if not self.secret:
            return ""
        string_to_sign = f"{timestamp}\n{self.secret}"
        hmac_code = hmac.new(
            string_to_sign.encode("utf-8"), digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(hmac_code).decode("utf-8")

    def _send(self, message: dict, log_type: str) -> WebhookLog:
        """发送消息并记录日志"""
        timestamp = int(time.time())

        log = WebhookLog(
            type=log_type,
            channel=self.channel,
            status="pending",
            webhook_url=self.webhook_url,
            request_body=message,
            sent_at=get_beijing_datetime(),
        )

        payload = {
            "timestamp": str(timestamp),
            "sign": self._gen_sign(timestamp),
            **message,
        }

        start_time = time.time()
        try:
            response = requests.post(
                self.webhook_url,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"},
            )
            duration_ms = int((time.time() - start_time) * 1000)

            log.response_code = response.status_code
            try:
                log.response_body = response.json()
            except:
                log.response_body = {"text": response.text}
            log.duration_ms = duration_ms
            log.completed_at = get_beijing_datetime()

            resp_data = log.response_body
            if response.status_code == 200 and resp_data.get("code") == 0:
                log.status = "success"
            else:
                log.status = "failed"
                log.error_message = resp_data.get("msg", "Unknown error")

        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.duration_ms = int((time.time() - start_time) * 1000)
            log.completed_at = get_beijing_datetime()

        WebhookLogService.record(log)
        return log

    def send_text(self, text: str, log_type: str = "manual_test") -> WebhookLog:
        """发送纯文本消息"""
        message = {"msg_type": "text", "content": {"text": text}}
        return self._send(message, log_type)

    def send_daily_report(self, report_data: dict) -> WebhookLog:
        """发送日报"""
        message = self._build_daily_card(report_data)
        return self._send(message, "daily_report")

    def send_weekly_report(self, report_data: dict) -> WebhookLog:
        """发送周报"""
        message = self._build_weekly_card(report_data)
        return self._send(message, "weekly_report")

    def send_alert(self, alert_data: dict) -> WebhookLog:
        """发送告警"""
        message = self._build_alert_card(alert_data)
        return self._send(message, "alert_pending")

    def send_publish_apply(self, skill_data: dict) -> WebhookLog:
        """发送发布申请通知（给管理员）"""
        message = self._build_publish_apply_card(skill_data)
        return self._send(message, "publish_apply")

    def send_publish_approve(
        self, skill_data: dict, admin_name: str = "管理员"
    ) -> WebhookLog:
        """发送审批通过通知（给提交人）"""
        message = self._build_publish_approve_card(skill_data, admin_name)
        return self._send(message, "publish_approve")

    def send_publish_reject(
        self, skill_data: dict, reason: str, admin_name: str = "管理员"
    ) -> WebhookLog:
        """发送审批拒绝通知（给提交人）"""
        message = self._build_publish_reject_card(skill_data, reason, admin_name)
        return self._send(message, "publish_reject")

    def send_update_apply(self, skill_data: dict, version: str) -> WebhookLog:
        """发送更新申请通知（给管理员）"""
        message = self._build_update_apply_card(skill_data, version)
        return self._send(message, "update_apply")

    def _build_daily_card(self, data: dict) -> dict:
        """构建日报卡片（优化布局）"""
        date = data.get("date", "")
        yesterday = data.get("yesterday", {})
        week = data.get("this_week", {})
        wow = data.get("week_over_week", {})

        def _format_trend(trend: dict) -> str:
            """格式化环比趋势"""
            if not trend or trend.get("is_up") is None:
                return "➖"
            pct = abs(trend.get("pct", 0))
            if trend.get("is_up"):
                return f"📈 +{pct}%"
            else:
                return f"📉 -{pct}%"

        # 构建内容元素
        elements = []

        # 昨日数据 - 使用独立的 div 组件，增加间距
        elements.append(
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**📅 昨日数据 ({date})**"},
            }
        )

        # 第一行指标
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"👁 **浏览**: {yesterday.get('views', 0)}　　　⬇ **下载**: {yesterday.get('downloads', 0)}　　　📦 **发布**: {yesterday.get('publishes', 0)}",
                },
            }
        )

        # 第二行指标
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"🔍 **搜索**: {yesterday.get('searches', 0)}　　　👤 **用户**: {yesterday.get('unique_users', 0)}",
                },
            }
        )

        elements.append({"tag": "hr"})

        # 本周累计 + 环比 - 使用独立行
        elements.append(
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": "**📆 本周累计（周一至昨日）**"},
            }
        )

        # 指标行1
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"👁 **浏览量**: {week.get('views', 0)}　　　环比: {_format_trend(wow.get('views'))}",
                },
            }
        )

        # 指标行2
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"⬇ **下载量**: {week.get('downloads', 0)}　　　环比: {_format_trend(wow.get('downloads'))}",
                },
            }
        )

        # 指标行3
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"📦 **发布量**: {week.get('publishes', 0)}　　　环比: {_format_trend(wow.get('publishes'))}",
                },
            }
        )

        # 添加热门技能排行榜
        top_skills = data.get("top_skills", [])
        if top_skills:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {"tag": "lark_md", "content": "**🏆 昨日热门技能排行榜**"},
                }
            )

            rank_emojis = ["🥇", "🥈", "🥉"]
            for i, skill in enumerate(top_skills[:5], 1):
                rank = rank_emojis[i - 1] if i <= 3 else f"**{i}.**"
                name = skill.get("name", "未知")
                slug = skill.get("slug", "")
                downloads = skill.get("downloads", 0)
                detail_url = (
                    f"http://211.154.18.252:10143/skills/{slug}" if slug else "#"
                )
                download_url = (
                    f"http://211.154.18.252:10143/api/skills/{slug}/download"
                    if slug
                    else "#"
                )

                elements.append(
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"{rank} **{name}**　　　下载: **{downloads}**　　　[查看]({detail_url}) · [下载]({download_url})",
                        },
                    }
                )

        # 添加底部操作按钮
        elements.append({"tag": "hr"})
        elements.append(
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "📊 查看完整报告"},
                        "type": "primary",
                        "url": "http://211.154.18.252:10143/stats",
                    },
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "⚙️ 管理后台"},
                        "type": "default",
                        "url": "http://211.154.18.252:10143/admin",
                    },
                ],
            }
        )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {
                        "tag": "plain_text",
                        "content": f"📊 SkillHub 日报 ({date})",
                    },
                    "template": "blue",
                },
                "elements": elements,
            },
        }

    def _build_weekly_card(self, data: dict) -> dict:
        """构建周报卡片（增强版）"""
        week_range = data.get("week_range", "")
        week = data.get("this_week", {})
        last_week = data.get("last_week", {})
        wow = data.get("week_over_week", {})

        def _format_trend(trend: dict) -> str:
            """格式化环比趋势"""
            if not trend or trend.get("is_up") is None:
                return "➖"
            arrow = trend.get("arrow", "➖")
            pct = trend.get("pct", 0)
            return f"{arrow} {pct}%"

        # 获取指标标准
        standards = data.get("metric_standards", {})
        data_quality = data.get("data_quality", {})

        # 构建指标表格（使用Markdown表格）
        metrics_table = """| 指标 | 数值 | 环比 | 统计标准 |
|------|------|------|----------|
"""
        metrics_table += f"| 👁 浏览量 | **{week.get('views', 0)}** | {_format_trend(wow.get('views'))} | {standards.get('views', {}).get('standard', '去重IP/日')} |\n"
        metrics_table += f"| ⬇ 下载量 | **{week.get('downloads', 0)}** | {_format_trend(wow.get('downloads'))} | {standards.get('downloads', {}).get('standard', '每次下载计1次')} |\n"
        metrics_table += f"| 📦 发布量 | **{week.get('publishes', 0)}** | {_format_trend(wow.get('publishes'))} | {standards.get('publishes', {}).get('standard', '审核通过技能')} |\n"
        metrics_table += f"| 🔍 搜索量 | **{week.get('searches', 0)}** | {_format_trend(wow.get('searches'))} | {standards.get('searches', {}).get('standard', '每次搜索计1次')} |\n"
        metrics_table += f"| 👤 用户 | **{week.get('unique_users', 0)}** | - | {standards.get('users', {}).get('standard', '有操作行为用户')} |"

        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📈 上周核心指标 ({week_range})**",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"💡 *指标说明：{standards.get('views', {}).get('description', '每个IP每天只计1次浏览')}*",
                },
            },
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": metrics_table,
                },
            },
        ]

        # 添加数据质量指标
        if data_quality:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {"tag": "lark_md", "content": "**📊 数据质量**"},
                }
            )
            quality_table = """| 指标 | 数值 | 说明 |
|------|------|------|
"""
            quality_table += f"| 浏览去重率 | **{data_quality.get('view_dedup_rate', 0)}%** | 有效浏览/总浏览 |\n"
            quality_table += f"| 下载转化率 | **{data_quality.get('download_conversion', 0)}%** | 下载量/浏览量 |\n"
            quality_table += f"| 搜索有效率 | **{data_quality.get('search_valid_rate', 0)}%** | 有结果搜索/总搜索 |"

            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": quality_table,
                    },
                }
            )

        # 融合排行榜（各大区 + 职能中心，排除数智中心）
        combined_rankings = data.get("combined_rankings", [])
        if combined_rankings:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": "**🏆 融合排行榜（各大区 + 职能中心）**",
                    },
                }
            )

            # 发布量排行
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": "**📦 发布量排行**",
                    },
                }
            )
            publish_sorted = sorted(
                combined_rankings, key=lambda x: x.get("publishes", 0), reverse=True
            )[:5]
            for i, item in enumerate(publish_sorted, 1):
                type_emoji = "🏢" if item.get("type") == "region" else "🏛"
                elements.append(
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i - 1]} {type_emoji} {item['name']}: **{item['publishes']}**个技能",
                        },
                    }
                )

            # 下载量排行
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": "**⬇ 下载量排行**",
                    },
                }
            )
            download_sorted = sorted(
                combined_rankings, key=lambda x: x.get("downloads", 0), reverse=True
            )[:5]
            for i, item in enumerate(download_sorted, 1):
                type_emoji = "🏢" if item.get("type") == "region" else "🏛"
                elements.append(
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i - 1]} {type_emoji} {item['name']}: **{item['downloads']}**次下载",
                        },
                    }
                )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {
                        "tag": "plain_text",
                        "content": f"📊 SkillHub 周报 ({week_range})",
                    },
                    "template": "purple",
                },
                "elements": elements,
            },
        }

    def _build_alert_card(self, data: dict) -> dict:
        """构建告警卡片"""
        alert_type = data.get("type", "")
        count = data.get("count", 0)
        skills = data.get("skills", [])

        content = (
            f"**⚠️ 待审核技能堆积告警**\n\n当前有 **{count}** 个技能待审核，请及时处理。"
        )
        if skills:
            content += "\n\n**待审核技能:**"
            for skill in skills:
                content += f"\n• {skill}"

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": "⚠️ SkillHub 告警"},
                    "template": "red",
                },
                "elements": [
                    {"tag": "div", "text": {"tag": "lark_md", "content": content}}
                ],
            },
        }

    def _build_publish_apply_card(self, skill: dict) -> dict:
        """构建发布申请卡片（给管理员）"""
        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📦 技能名称**：{skill.get('name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**👤 提交人**：{skill.get('author_name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**🏢 部门**：{skill.get('author_department', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📅 提交时间**：{skill.get('created_at', '')}",
                },
            },
        ]

        # 添加简介（如果有）
        description = skill.get("description", "")
        if description:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"**📝 技能简介**：\n{description[:100]}...",
                    },
                }
            )

        # 添加操作按钮 - 外部通道只保留下载按钮，移除查看/通过/拒绝按钮
        elements.append({"tag": "hr"})
        actions = []

        if self.channel == "external":
            # 外部通道：只保留下载按钮
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "⬇️ 下载"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/api/skills/{skill.get('slug', '')}/download",
                }
            )
        else:
            # 内部通道：保留所有操作按钮
            actions = [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "📋 查看详情"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/admin",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "✅ 通过"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/api/admin/approve-quick?slug={skill.get('slug', '')}&action=approve&token={QUICK_APPROVE_TOKEN}",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "❌ 拒绝"},
                    "type": "danger",
                    "url": f"http://211.154.18.252:10143/api/admin/approve-quick?slug={skill.get('slug', '')}&action=reject&token={QUICK_APPROVE_TOKEN}",
                },
            ]

        elements.append(
            {
                "tag": "action",
                "actions": actions,
            }
        )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": "🔔 新的技能发布申请"},
                    "template": "orange",
                },
                "elements": elements,
            },
        }

    def _build_publish_approve_card(self, skill: dict, admin_name: str) -> dict:
        """构建审批通过卡片（给提交人）"""
        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📦 技能名称**：{skill.get('name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**👤 开发者**：{skill.get('author_name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**🏢 所属部门**：{skill.get('author_department', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**👤 审批人**：{admin_name}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📅 审批时间**：{get_beijing_time().strftime('%Y-%m-%d %H:%M')}",
                },
            },
        ]

        # 添加技能描述
        description = skill.get("description", "")
        if description:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"**📝 技能描述**：\n{description[:200]}{'...' if len(description) > 200 else ''}",
                    },
                }
            )

        elements.append({"tag": "hr"})
        elements.append(
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "🎉 **技能已通过审核，已正式上线！**",
                },
            }
        )

        # 操作按钮
        elements.append(
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "⬇️ 下载"},
                        "type": "primary",
                        "url": f"http://211.154.18.252:10143/api/skills/{skill.get('slug', '')}/download",
                    },
                ]
                if self.channel == "external"
                else [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "🔗 查看技能"},
                        "type": "primary",
                        "url": f"http://211.154.18.252:10143/skills/{skill.get('slug', '')}",
                    },
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "⬇️ 下载"},
                        "type": "default",
                        "url": f"http://211.154.18.252:10143/api/skills/{skill.get('slug', '')}/download",
                    },
                ],
            }
        )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": "✅ 技能发布申请已通过"},
                    "template": "green",
                },
                "elements": elements,
            },
        }

    def _build_publish_reject_card(
        self, skill: dict, reason: str, admin_name: str
    ) -> dict:
        """构建审批拒绝卡片（给提交人）"""
        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📦 技能名称**：{skill.get('name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**👤 审批人**：{admin_name}"},
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📅 审批时间**：{get_beijing_time().strftime('%Y-%m-%d %H:%M')}",
                },
            },
        ]

        if reason:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"**📝 拒绝原因**：\n{reason}",
                    },
                }
            )

        elements.append({"tag": "hr"})
        actions = []

        if self.channel == "external":
            # 外部通道：只保留下载按钮
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "⬇️ 下载"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/api/skills/{skill.get('slug', '')}/download",
                }
            )
        else:
            # 内部通道：保留修改按钮
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "📝 修改重新提交"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/admin",
                }
            )

        elements.append(
            {
                "tag": "action",
                "actions": actions,
            }
        )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": "❌ 技能发布申请被拒绝"},
                    "template": "red",
                },
                "elements": elements,
            },
        }

    def _build_update_apply_card(self, skill: dict, version: str) -> dict:
        """构建更新申请卡片（给管理员）"""
        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📦 技能名称**：{skill.get('name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**🏷️ 新版本**：{version}"},
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**👤 提交人**：{skill.get('author_name', '')}",
                },
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📅 提交时间**：{get_beijing_time().strftime('%Y-%m-%d %H:%M')}",
                },
            },
        ]

        # 添加更新说明（如果有）
        description = skill.get("description", "")
        if description:
            elements.append({"tag": "hr"})
            elements.append(
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"**📝 更新说明**：\n{description[:100]}...",
                    },
                }
            )

        # 添加操作按钮 - 外部通道只保留下载按钮
        elements.append({"tag": "hr"})
        actions = []

        if self.channel == "external":
            # 外部通道：只保留下载按钮
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "⬇️ 下载"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/api/skills/{skill.get('slug', '')}/download",
                }
            )
        else:
            # 内部通道：保留所有操作按钮
            actions = [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "📋 查看详情"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/admin",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "✅ 通过"},
                    "type": "primary",
                    "url": f"http://211.154.18.252:10143/api/admin/approve-quick?slug={skill.get('slug', '')}&action=approve&token={QUICK_APPROVE_TOKEN}",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "❌ 拒绝"},
                    "type": "danger",
                    "url": f"http://211.154.18.252:10143/api/admin/approve-quick?slug={skill.get('slug', '')}&action=reject&token={QUICK_APPROVE_TOKEN}",
                },
            ]

        elements.append(
            {
                "tag": "action",
                "actions": actions,
            }
        )

        return {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": "🔄 新的版本更新申请"},
                    "template": "blue",
                },
                "elements": elements,
            },
        }
