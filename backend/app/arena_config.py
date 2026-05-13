"""Skill擂台配置"""

# 奖励类型配置
REWARD_TYPES = {
    "basic": {
        "id": "basic",
        "name": "应用搭建奖",
        "icon": "🏷️",
        "category": "基础激励类",
        "budget": 20000,
        "period": "quarterly",
        "period_label": "季度",
        "reward_per_skill": 100,
        "max_per_person": 1000,
        "max_skills_per_person": 10,
        "criteria": [
            "通过功能验证、可落地部署",
            "实际产生效率提升效果",
            "业务功能不可仅适用个人",
        ],
        "judge": "数智中心",
        "schedule": ["4月", "7月", "11月", "次年1月"],
        "description": "季度评选搭建可落地且有效率提升的AI应用Skill",
        "status": "active",
    },
    "popular": {
        "id": "popular",
        "name": "人气之星奖",
        "icon": "⭐",
        "category": "人气评选类",
        "budget": 3400,
        "period": "half_yearly",
        "period_label": "半年度",
        "criteria": "评选周期内被使用的用户数量",
        "judge": "数智中心",
        "schedule": ["7月", "次年1月"],
        "description": "半年度评选人气AI应用Skill，根据被使用的用户数量排名",
        "ranks": [
            {"rank": 1, "reward": 500, "count": 1, "label": "第一名"},
            {"rank": 2, "reward": 300, "count": 2, "label": "第二名"},
            {"rank": 3, "reward": 200, "count": 3, "label": "第三名"},
        ],
        "status": "active",
    },
    "innovation": {
        "id": "innovation",
        "name": "卓越创新奖",
        "icon": "🏆",
        "category": "功能评选类",
        "budget": 12800,
        "period": "half_yearly",
        "period_label": "半年度",
        "criteria": "综合评估功能强大程度、提效显著性",
        "judge": "评选小组",
        "schedule": ["7月", "次年1月"],
        "description": "半年度评选功能强大、提效显著等的AI应用Skill",
        "judge_weights": {
            "数智中心": 0.5,
            "体系运营中心": 0.0,
            "IT技术中心": 0.0,
            "各区域": 0.5,
        },
        "ranks": [
            {"rank": 1, "reward": 1000, "count": 1, "label": "第一名"},
            {"rank": 2, "reward": 800, "count": 3, "label": "第二名"},
            {"rank": 3, "reward": 500, "count": 6, "label": "第三名"},
        ],
        "scoring_criteria": {
            "efficiency": {"name": "提效显著性", "weight": 40, "max_score": 40},
            "applicability": {"name": "推广应用性", "weight": 30, "max_score": 30},
            "usability": {"name": "应用便捷性", "weight": 15, "max_score": 15},
            "extensibility": {"name": "可扩展性", "weight": 15, "max_score": 15},
        },
        "status": "active",
    },
}

# 评选状态
EVALUATION_STATUS = {
    "pending": {"label": "待开始", "color": "bg-gray-100 text-gray-600"},
    "open": {"label": "申报中", "color": "bg-blue-100 text-blue-700"},
    "evaluating": {"label": "评选中", "color": "bg-amber-100 text-amber-700"},
    "reviewing": {"label": "公示中", "color": "bg-purple-100 text-purple-700"},
    "approved": {"label": "已审批", "color": "bg-green-100 text-green-700"},
    "distributed": {"label": "已发放", "color": "bg-pink-100 text-pink-700"},
}

# 申报状态
APPLICATION_STATUS = {
    "draft": {"label": "草稿", "color": "bg-gray-100 text-gray-600"},
    "submitted": {"label": "已提交", "color": "bg-blue-100 text-blue-700"},
    "qualified": {"label": "入围", "color": "bg-indigo-100 text-indigo-700"},
    "approved": {"label": "已通过", "color": "bg-green-100 text-green-700"},
    "rejected": {"label": "未通过", "color": "bg-red-100 text-red-700"},
    "withdrawn": {"label": "已撤回", "color": "bg-gray-100 text-gray-500"},
}

# 总预算
TOTAL_BUDGET = 36200

# 评选规则
RULES = {
    "duplicate": "同一AI应用Skill每年仅可申报一次，不可重复领取基础奖励",
    "cheating": "如发现刷量、抄袭等行为，取消当年评选资格",
    "ip": "插件成果归公司所有，开发者享有署名权",
    "security": "涉及公司敏感数据的插件需通过安全审核后方可参评",
    "approval_flow": "评选结果经运维负责人审批后正式生效",
    "objection": "公示期内如有异议，由体系运营中心及IT技术中心复核处理",
}
