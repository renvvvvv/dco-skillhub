"""IDC 标准组织架构映射配置

来源: portal/backend/submit-portal/marketplace.db → org_structure 表
生成时间: 2026-05-06

说明: 本文件为项目组织架构的静态导出，用于 SkillHub 人员数据标准化。
"""

# ========== IDC 区域配置 (Level 2) ==========
IDC_REGIONS = {
    "hb1": {"name": "华北一区", "type": "region", "sort_order": 1},
    "xs": {"name": "香山", "type": "region", "sort_order": 3},
    "hb2": {"name": "华北二区", "type": "region", "sort_order": 4},
    "hb3": {"name": "华北三区", "type": "region", "sort_order": 5},
    "hd1": {"name": "华东一区", "type": "region", "sort_order": 6},
    "hd2": {"name": "华东二区", "type": "region", "sort_order": 7},
    "hn": {"name": "华南区", "type": "region", "sort_order": 8},
    "hg": {"name": "杭钢", "type": "region", "sort_order": 9},
    "qt": {"name": "其他区域", "type": "region", "sort_order": 10},
}

# ========== IDC 职能中心配置 (Level 2) ==========
IDC_CENTERS = {
    "hq-组织": {"name": "组织中心", "type": "center", "sort_order": 2},
    "hq-体系": {"name": "体系中心", "type": "center", "sort_order": 3},
    "hq-技术": {"name": "技术中心", "type": "center", "sort_order": 4},
    "hq-数智": {"name": "数智中心", "type": "center", "sort_order": 5},
    "hq-自驾": {"name": "自驾中心", "type": "center", "sort_order": 6},
    "hq-IT": {"name": "IT中心", "type": "center", "sort_order": 7},
}

# ========== IDC 数据中心配置 (Level 3) ==========
IDC_DATACENTERS = {
    # 华北一区 (hb1) - 11个
    "hb1-hb1": {"name": "HB1（北京B28数据中心）", "region_id": "hb1", "short": "HB1"},
    "hb1-hb5": {"name": "HB5（北京M3数据中心）", "region_id": "hb1", "short": "HB5"},
    "hb1-hbdw1": {"name": "HBDW1（北京M5数据中心）", "region_id": "hb1", "short": "HBDW1"},
    "hb1-hb4": {"name": "HB4（北京M6V数据中心）", "region_id": "hb1", "short": "HB4"},
    "hb1-hb3": {"name": "HB3（北京M6数据中心）", "region_id": "hb1", "short": "HB3"},
    "hb1-hbdw2": {"name": "HBDW2（北京海淀联通五棵松数据中心）", "region_id": "hb1", "short": "HBDW2"},
    "hb1-hb6": {"name": "HB6（北京顺义腾仁数据中心）", "region_id": "hb1", "short": "HB6"},
    "hb1-hb25": {"name": "HB25（河北怀来基地数据中心）", "region_id": "hb1", "short": "HB25"},
    "hb1-hbdw3": {"name": "HBDW3（泰康保险数据中心）", "region_id": "hb1", "short": "HBDW3"},
    "hb1-hb22": {"name": "HB22（陕西西安凤竹数据中心）", "region_id": "hb1", "short": "HB22"},
    "hb1-hb7": {"name": "HB7（陕西西安经开数据中心）", "region_id": "hb1", "short": "HB7"},
    # 华北二区 (hb2) - 7个
    "hb2-hb15": {"name": "HB15（三河铭泰数据中心）", "region_id": "hb2", "short": "HB15"},
    "hb2-hb21": {"name": "HB21（北京东部数据中心）", "region_id": "hb2", "short": "HB21"},
    "hb2-hb11": {"name": "HB11（北京亦庄博兴数据中心）", "region_id": "hb2", "short": "HB11"},
    "hb2-hb10": {"name": "HB10（北京亦庄同济中路数据中心）", "region_id": "hb2", "short": "HB10"},
    "hb2-hb12": {"name": "HB12（北京大兴星光影视城数据中心）", "region_id": "hb2", "short": "HB12"},
    "hb2-hb13": {"name": "HB13（北京通州马驹桥数据中心）", "region_id": "hb2", "short": "HB13"},
    "hb2-hbdw4": {"name": "HBDW4（河北廊坊高新互联数据中心）", "region_id": "hb2", "short": "HBDW4"},
    # 华北三区 (hb3) - 6个
    "hb3-hbdw5": {"name": "HBDW5（乌兰1号基地数据中心）", "region_id": "hb3", "short": "HBDW5"},
    "hb3-hbdw6": {"name": "HBDW6（乌兰2号基地数据中心）", "region_id": "hb3", "short": "HBDW6"},
    "hb3-hb19": {"name": "HB19（乌兰3号基地数据中心）", "region_id": "hb3", "short": "HB19"},
    "hb3-hb20": {"name": "HB20（乌兰4号基地数据中心）", "region_id": "hb3", "short": "HB20"},
    "hb3-hbdw7": {"name": "HBDW7（乌兰5号基地数据中心）", "region_id": "hb3", "short": "HBDW7"},
    "hb3-hb24": {"name": "HB24（乌兰6号基地数据中心）", "region_id": "hb3", "short": "HB24"},
    # 华东一区 (hd1) - 11个
    "hd1-hd4": {"name": "HD4（上海外高桥数据中心）", "region_id": "hd1", "short": "HD4"},
    "hd1-hd3": {"name": "HD3（上海松江数据中心）", "region_id": "hd1", "short": "HD3"},
    "hd1-hddw1": {"name": "HDDW1（上海磐石智算数据中心）", "region_id": "hd1", "short": "HDDW1"},
    "hd1-hd1": {"name": "HD1（上海纪蕴数据中心）", "region_id": "hd1", "short": "HD1"},
    "hd1-hd6": {"name": "HD6（上海荷丹数据中心）", "region_id": "hd1", "short": "HD6"},
    "hd1-hd5": {"name": "HD5（上海金港数据中心）", "region_id": "hd1", "short": "HD5"},
    "hd1-hd9": {"name": "HD9（安徽宿州高新区数据中心）", "region_id": "hd1", "short": "HD9"},
    "hd1-hd8": {"name": "HD8（江苏南通保税区数据中心）", "region_id": "hd1", "short": "HD8"},
    "hd1-hd15": {"name": "HD15（江苏昆山数据中心）", "region_id": "hd1", "short": "HD15"},
    "hd1-hd11": {"name": "HD11（浙江杭州下沙数据中心）", "region_id": "hd1", "short": "HD11"},
    "hd1-hd13": {"name": "HD13（浙江杭州央广云数据中心）", "region_id": "hd1", "short": "HD13"},
    # 华东二区 (hd2) - 1个
    "hd2-hd7": {"name": "HD7（江苏太仓基地数据中心）", "region_id": "hd2", "short": "HD7"},
    # 华南区 (hn) - 12个
    "hn-hn6": {"name": "HN6（四川广元电信数据中心）", "region_id": "hn", "short": "HN6"},
    "hn-hn8": {"name": "HN8（四川成都双流算力平台数据中心）", "region_id": "hn", "short": "HN8"},
    "hn-hndw5": {"name": "HNDW5（四川成都天府联通数据中心）", "region_id": "hn", "short": "HNDW5"},
    "hn-hn5": {"name": "HN5（四川成都棕树数据中心）", "region_id": "hn", "short": "HN5"},
    "hn-hn4": {"name": "HN4（广东佛山智慧城市数据中心）", "region_id": "hn", "short": "HN4"},
    "hn-hndw3": {"name": "HNDW3（广东广州亚太信息引擎数据中心）", "region_id": "hn", "short": "HNDW3"},
    "hn-hndw1": {"name": "HNDW1（广东广州化龙数据中心）", "region_id": "hn", "short": "HNDW1"},
    "hn-hn3": {"name": "HN3（广东广州科学城连云数据中心）", "region_id": "hn", "short": "HN3"},
    "hn-hndw4": {"name": "HNDW4（广东深圳盐田明珠数据中心）", "region_id": "hn", "short": "HNDW4"},
    "hn-hndw2": {"name": "HNDW2（广东深圳盐田武浩数据中心）", "region_id": "hn", "short": "HNDW2"},
    "hn-hn1": {"name": "HN1（广东深圳花园城数据中心）", "region_id": "hn", "short": "HN1"},
    "hn-hn2": {"name": "HN2（广东深圳软件基地数据中心）", "region_id": "hn", "short": "HN2"},
    # 杭钢 (hg) - 1个
    "hg-hgdw1": {"name": "HGDW1（浙江杭州杭钢云计算数据中心）", "region_id": "hg", "short": "HGDW1"},
    # 香山 (xs) - 1个
    "xs-xs1": {"name": "XS1（北京香山数据中心）", "region_id": "xs", "short": "XS1"},
    # 其他区域 (qt) - 常用映射
    "qt-qt23": {"name": "QT23（北京朝阳酒仙桥百度M1数据中心）", "region_id": "qt", "short": "QT23"},
    "qt-qt01": {"name": "QT01（河北廊坊云基地数据中心）", "region_id": "qt", "short": "QT01"},
    "qt-qt11": {"name": "QT11（上海静安数据中心）", "region_id": "qt", "short": "QT11"},
    "qt-qt27-17": {"name": "QT27（江苏苏州国科数据中心）", "region_id": "qt", "short": "QT27"},
    "qt-hb201": {"name": "HB201（乌兰基地）", "region_id": "qt", "short": "HB201"},
    "qt-hb2": {"name": "HB2（河北廊坊固安数据中心）", "region_id": "qt", "short": "HB2"},
}

# ========== 原始部门名 → IDC 标准映射 ==========
# 格式: 原始部门名 -> (region_id, dc_id/center_id, short_name)
DEPT_TO_IDC = {
    # ===== 华北一区 =====
    "B28": ("hb1", "hb1-hb1", "HB1"),
    "M3": ("hb1", "hb1-hb5", "HB5"),
    "M5": ("hb1", "hb1-hbdw1", "HBDW1"),
    "M6V&M5二三期": ("hb1", "hb1-hb4", "HB4"),
    "M6": ("hb1", "hb1-hb3", "HB3"),
    "北京腾仁": ("hb1", "hb1-hb6", "HB6"),
    "北京腾仁四期": ("hb1", "hb1-hb6", "HB6"),
    "河北怀来": ("hb1", "hb1-hb25", "HB25"),
    "河北怀来二号": ("hb1", "hb1-hb25", "HB25"),
    "泰康": ("hb1", "hb1-hbdw3", "HBDW3"),
    "西安凤竹": ("hb1", "hb1-hb22", "HB22"),
    "西安": ("hb1", "hb1-hb7", "HB7"),
    "百度M1": ("qt", "qt-qt23", "QT23"),
    "酒仙桥": ("qt", "qt-qt23", "QT23"),
    # ===== 华北二区 =====
    "三河铭泰": ("hb2", "hb2-hb15", "HB15"),
    "三河铭泰二期": ("hb2", "hb2-hb15", "HB15"),
    "三河铭泰三期": ("hb2", "hb2-hb15", "HB15"),
    "NV东部数据中心": ("hb2", "hb2-hb21", "HB21"),
    "亦庄博兴": ("hb2", "hb2-hb11", "HB11"),
    "亦庄同济": ("hb2", "hb2-hb10", "HB10"),
    "大兴星光": ("hb2", "hb2-hb12", "HB12"),
    "通州一号": ("hb2", "hb2-hb13", "HB13"),
    "通州马驹桥": ("hb2", "hb2-hb13", "HB13"),
    "廊坊安次": ("hb2", "hb2-hbdw4", "HBDW4"),
    "廊坊安次二期": ("hb2", "hb2-hbdw4", "HBDW4"),
    "河北固安": ("qt", "qt-hb2", "HB2"),
    # ===== 华北三区 =====
    "乌兰1号": ("hb3", "hb3-hbdw5", "HBDW5"),
    "乌兰2号": ("hb3", "hb3-hbdw6", "HBDW6"),
    "乌兰3号": ("hb3", "hb3-hb19", "HB19"),
    "乌兰3号二期": ("hb3", "hb3-hb19", "HB19"),
    "乌兰4号": ("hb3", "hb3-hb20", "HB20"),
    "乌兰4号二期": ("hb3", "hb3-hb20", "HB20"),
    "乌兰5号（银保信）": ("hb3", "hb3-hbdw7", "HBDW7"),
    "乌兰基地一期": ("hb3", "hb3-hbdw5", "HBDW5"),
    "乌兰基地二期": ("hb3", "hb3-hbdw6", "HBDW6"),
    "乌兰基地二期(IT)": ("hb3", "hb3-hbdw6", "HBDW6"),
    "乌兰察布": ("hb3", "hb3-hbdw5", "HBDW5"),
    "乌兰基地": ("qt", "qt-hb201", "HB201"),
    # ===== 华东一区 =====
    "上海外高桥": ("hd1", "hd1-hd4", "HD4"),
    "上海松江": ("hd1", "hd1-hd3", "HD3"),
    "上海磐石智算": ("hd1", "hd1-hddw1", "HDDW1"),
    "上海纪蕴&市北": ("hd1", "hd1-hd1", "HD1"),
    "上海纪蕴": ("hd1", "hd1-hd1", "HD1"),
    "上海荷丹": ("hd1", "hd1-hd6", "HD6"),
    "上海金港": ("hd1", "hd1-hd5", "HD5"),
    "宿州": ("hd1", "hd1-hd9", "HD9"),
    "江苏南通": ("hd1", "hd1-hd8", "HD8"),
    "江苏昆山": ("hd1", "hd1-hd15", "HD15"),
    "杭州下沙": ("hd1", "hd1-hd11", "HD11"),
    "杭州央广云": ("hd1", "hd1-hd13", "HD13"),
    "上海临港": ("qt", "qt-qt11", "QT11"),
    "苏州国科": ("qt", "qt-qt27-17", "QT27"),
    # ===== 华东二区 =====
    "江苏太仓一期": ("hd2", "hd2-hd7", "HD7"),
    "江苏太仓二期": ("hd2", "hd2-hd7", "HD7"),
    "江苏太仓三期": ("hd2", "hd2-hd7", "HD7"),
    "江苏太仓四期": ("hd2", "hd2-hd7", "HD7"),
    "江苏太仓交付部": ("hd2", "hd2-hd7", "HD7"),
    # ===== 华南区 =====
    "四川广元": ("hn", "hn-hn6", "HN6"),
    "成都双流": ("hn", "hn-hn8", "HN8"),
    "成都天府云": ("hn", "hn-hndw5", "HNDW5"),
    "成都棕树": ("hn", "hn-hn5", "HN5"),
    "广东佛山": ("hn", "hn-hn4", "HN4"),
    "广州亚太": ("hn", "hn-hndw3", "HNDW3"),
    "广州化龙": ("hn", "hn-hndw1", "HNDW1"),
    "广州科学城一期": ("hn", "hn-hn3", "HN3"),
    "广州科学城二期": ("hn", "hn-hn3", "HN3"),
    "广州视源": ("hn", "hn-hn3", "HN3"),
    "深圳明珠": ("hn", "hn-hndw4", "HNDW4"),
    "深圳武浩": ("hn", "hn-hndw2", "HNDW2"),
    "深圳花园城": ("hn", "hn-hn1", "HN1"),
    "深圳软件园": ("hn", "hn-hn2", "HN2"),
    "深圳睿智云": ("hn", "hn-hn2", "HN2"),
    # ===== 杭钢 =====
    "杭钢": ("hg", "hg-hgdw1", "HGDW1"),
    # ===== 香山 =====
    "香山": ("xs", "xs-xs1", "XS1"),
    # ===== 其他区域 =====
    "ZJ": ("qt", "qt-qt01", "QT01"),
    "A1": ("qt", "qt-qt01", "QT01"),
    "AL": ("qt", "qt-qt01", "QT01"),
    "HF": ("qt", "qt-qt01", "QT01"),
    "中化雄安": ("qt", "qt-qt01", "QT01"),
    # ===== 职能中心 =====
    "运维部": ("hq", "hq-技术", "技术中心"),
    "设施技术中心": ("hq", "hq-技术", "技术中心"),
    "平台开发部": ("hq", "hq-数智", "数智中心"),
    "测试服务部": ("hq", "hq-体系", "体系中心"),
    "数智中心": ("hq", "hq-数智", "数智中心"),
    "产品及销售部": ("hq", "hq-组织", "组织中心"),
    "平台研发部": ("hq", "hq-数智", "数智中心"),
    "体系运营中心": ("hq", "hq-体系", "体系中心"),
    "IT技术中心": ("hq", "hq-IT", "IT中心"),
    "自动驾驶中心": ("hq", "hq-自驾", "自驾中心"),
    "研发部": ("hq", "hq-技术", "技术中心"),
    "组织培训中心": ("hq", "hq-组织", "组织中心"),
    "综合管理部": ("hq", "hq-组织", "组织中心"),
    "前端组": ("hq", "hq-技术", "技术中心"),
    "AI智能化&运维组": ("hq", "hq-技术", "技术中心"),
    "研发组": ("hq", "hq-技术", "技术中心"),
    "AI节能平台组": ("hq", "hq-技术", "技术中心"),
    "运营支撑部": ("hq", "hq-体系", "体系中心"),
    "运营管理部": ("hq", "hq-组织", "组织中心"),
    "开发测试": ("hq", "hq-体系", "体系中心"),
    "IT中心": ("hq", "hq-IT", "IT中心"),
    "动环研发组": ("hq", "hq-技术", "技术中心"),
    "测试组": ("hq", "hq-体系", "体系中心"),
    "数智化平台组": ("hq", "hq-数智", "数智中心"),
    "人力资源部": ("hq", "hq-组织", "组织中心"),
    "交付实施组": ("hq", "hq-体系", "体系中心"),
    # ===== 区域分部（归入对应区域）=====
    "华东一部": ("hd1", "hd1-hd8", "HD8"),
    "华东二部": ("hd1", "hd1-hd8", "HD8"),
    "华北一部": ("hb1", "hb1-hb1", "HB1"),
    "华北二部": ("hb1", "hb1-hb1", "HB1"),
    "华南分部": ("hn", "hn-hn1", "HN1"),
}

# ========== 辅助函数 ==========

def get_idc_info(dept_name: str) -> dict:
    """根据原始部门名获取 IDC 标准信息
    
    Returns:
        {
            "region_id": "",
            "region_name": "",
            "dc_id": "",
            "dc_name": "",
            "dc_short": "",
            "center_id": "",
            "center_name": "",
            "level": 2|3,
            "mapped": True|False,
        }
    """
    mapping = DEPT_TO_IDC.get(dept_name)
    if not mapping:
        return {
            "region_id": "",
            "region_name": "",
            "dc_id": "",
            "dc_name": "",
            "dc_short": "",
            "center_id": "",
            "center_name": "",
            "level": 3,
            "mapped": False,
        }
    
    region_id, node_id, short_name = mapping
    
    if region_id == "hq":
        # 职能中心
        center_info = IDC_CENTERS.get(node_id, {})
        return {
            "region_id": "hq",
            "region_name": "职能中心",
            "dc_id": "",
            "dc_name": "",
            "dc_short": "",
            "center_id": node_id,
            "center_name": center_info.get("name", short_name),
            "level": 2,
            "mapped": True,
        }
    else:
        # 数据中心
        region_info = IDC_REGIONS.get(region_id, {})
        dc_info = IDC_DATACENTERS.get(node_id, {})
        return {
            "region_id": region_id,
            "region_name": region_info.get("name", ""),
            "dc_id": node_id,
            "dc_name": dc_info.get("name", ""),
            "dc_short": dc_info.get("short", short_name),
            "center_id": "",
            "center_name": "",
            "level": 3,
            "mapped": True,
        }


def enrich_staff_record(staff: dict) -> dict:
    """为单条人员记录补充 IDC 标准字段"""
    dept_name = staff.get("department", "")
    idc_info = get_idc_info(dept_name)
    
    # 保留原有字段，添加新字段
    staff["region_id"] = idc_info["region_id"]
    staff["region_name"] = idc_info["region_name"]
    staff["dc_id"] = idc_info["dc_id"]
    staff["dc_name"] = idc_info["dc_name"]
    staff["dc_short"] = idc_info["dc_short"]
    staff["center_id"] = idc_info["center_id"]
    staff["center_name"] = idc_info["center_name"]
    staff["level"] = idc_info["level"]
    staff["idc_mapped"] = idc_info["mapped"]
    
    return staff


def get_all_regions() -> list:
    """获取所有区域列表（含排序）"""
    regions = []
    for rid, info in sorted(IDC_REGIONS.items(), key=lambda x: x[1]["sort_order"]):
        regions.append({"id": rid, "name": info["name"], "type": "region"})
    for cid, info in sorted(IDC_CENTERS.items(), key=lambda x: x[1]["sort_order"]):
        regions.append({"id": cid, "name": info["name"], "type": "center"})
    return regions


def get_dcs_by_region(region_id: str) -> list:
    """获取指定区域下的所有数据中心"""
    dcs = []
    for did, info in IDC_DATACENTERS.items():
        if info.get("region_id") == region_id:
            dcs.append({
                "id": did,
                "name": info["name"],
                "short": info["short"],
                "region_id": region_id,
            })
    return sorted(dcs, key=lambda x: x["id"])


# 后端 main.py 中排行榜补全用的常量（替换原有 ALL_L1_DEPTS）
ALL_L1_REGIONS = [
    {"id": "hq", "name": "职能中心"},
    {"id": "hb1", "name": "华北一区"},
    {"id": "xs", "name": "香山"},
    {"id": "hb2", "name": "华北二区"},
    {"id": "hb3", "name": "华北三区"},
    {"id": "hd1", "name": "华东一区"},
    {"id": "hd2", "name": "华东二区"},
    {"id": "hn", "name": "华南区"},
    {"id": "hg", "name": "杭钢"},
    {"id": "qt", "name": "其他区域"},
]
