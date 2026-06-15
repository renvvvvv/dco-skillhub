export interface VersionLog {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: 'feature' | 'fix' | 'optimize' | 'docs';
}

export const VERSION_LOGS: VersionLog[] = [
  {
    version: 'v1.0.0',
    date: '2026-04-14',
    title: '项目初始化',
    type: 'feature',
    changes: [
      'DCO SkillHub 项目初始化',
      '基础架构搭建：FastAPI + React + Docker',
      '技能上传、下载、搜索基础功能',
      '技能版本管理系统',
    ],
  },
  {
    version: 'v1.0.1',
    date: '2026-04-15',
    title: '基础功能完善',
    type: 'feature',
    changes: [
      '完善项目基础配置',
      '优化Docker部署流程',
      '修复基础功能边界问题',
    ],
  },
  {
    version: 'v1.0.2',
    date: '2026-04-16',
    title: '代码结构优化',
    type: 'optimize',
    changes: [
      '重构后端代码结构',
      '优化前端组件组织',
      '完善错误处理机制',
    ],
  },
  {
    version: 'v1.0.3',
    date: '2026-04-17',
    title: '性能与稳定性优化',
    type: 'optimize',
    changes: [
      '优化数据库查询性能',
      '提升前端加载速度',
      '修复已知稳定性问题',
    ],
  },
  {
    version: 'v1.0.4',
    date: '2026-04-18',
    title: '接口与文档完善',
    type: 'docs',
    changes: [
      '完善API接口文档',
      '补充开发环境配置说明',
      '优化接口返回格式',
    ],
  },
  {
    version: 'v1.0.5',
    date: '2026-04-19',
    title: '部署与测试优化',
    type: 'optimize',
    changes: [
      '优化生产环境部署流程',
      '完善自动化测试覆盖',
      '修复部署脚本问题',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-04-20',
    title: '标签系统与编辑功能',
    type: 'feature',
    changes: [
      '新增多选标签系统',
      '支持技能编辑功能',
      '新增技能摘要API',
      '完善部署文档',
    ],
  },
  {
    version: 'v1.1.1',
    date: '2026-04-21',
    title: '审核流程与日志系统',
    type: 'feature',
    changes: [
      '新增管理员审核工作流',
      '新增审计日志系统',
      '技能状态管理（待审核/已通过/已拒绝）',
      '支持多格式压缩包上传',
      '新增导出API',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-04-22',
    title: '二级标签与搜索优化',
    type: 'feature',
    changes: [
      '新增两级标签筛选系统',
      '优化分类筛选逻辑',
      '支持RAR压缩包上传',
      '新增员工搜索功能',
    ],
  },
  {
    version: 'v1.2.1',
    date: '2026-04-23',
    title: '分页与搜索增强',
    type: 'feature',
    changes: [
      '新增分页功能',
      '优化标签筛选',
      '修复员工搜索可编辑字段问题',
    ],
  },
  {
    version: 'v1.2.2',
    date: '2026-04-24',
    title: '市场研究与竞品分析',
    type: 'docs',
    changes: [
      '新增市场调研报告',
      '新增竞品分析报告',
      '新增专注型技能平台竞品分析',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-04-25',
    title: '系统稳定性优化',
    type: 'optimize',
    changes: [
      '优化系统整体稳定性',
      '完善异常处理机制',
      '提升并发处理能力',
    ],
  },
  {
    version: 'v1.3.1',
    date: '2026-04-26',
    title: '用户体验优化',
    type: 'optimize',
    changes: [
      '优化页面加载速度',
      '改善用户交互体验',
      '修复界面显示问题',
    ],
  },
  {
    version: 'v1.3.2',
    date: '2026-04-27',
    title: '数据安全加固',
    type: 'optimize',
    changes: [
      '加强数据传输安全',
      '完善权限验证机制',
      '优化数据备份策略',
    ],
  },
  {
    version: 'v1.3.3',
    date: '2026-04-28',
    title: '接口性能优化',
    type: 'optimize',
    changes: [
      '优化API响应速度',
      '减少不必要的数据传输',
      '完善接口缓存机制',
    ],
  },
  {
    version: 'v1.3.4',
    date: '2026-04-29',
    title: '前端组件优化',
    type: 'optimize',
    changes: [
      '重构前端组件结构',
      '优化组件复用性',
      '提升页面渲染性能',
    ],
  },
  {
    version: 'v1.3.5',
    date: '2026-04-30',
    title: '数据库优化',
    type: 'optimize',
    changes: [
      '优化数据库索引',
      '完善数据迁移脚本',
      '提升数据查询效率',
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-05-01',
    title: '劳动节功能更新',
    type: 'feature',
    changes: [
      '新增节假日主题',
      '优化系统通知功能',
      '完善用户反馈机制',
    ],
  },
  {
    version: 'v1.4.1',
    date: '2026-05-02',
    title: '系统监控完善',
    type: 'feature',
    changes: [
      '新增系统监控面板',
      '完善日志收集机制',
      '优化告警通知功能',
    ],
  },
  {
    version: 'v1.4.2',
    date: '2026-05-03',
    title: '缓存策略优化',
    type: 'optimize',
    changes: [
      '优化Redis缓存策略',
      '完善缓存失效机制',
      '提升缓存命中率',
    ],
  },
  {
    version: 'v1.4.3',
    date: '2026-05-04',
    title: '安全漏洞修复',
    type: 'fix',
    changes: [
      '修复已知安全漏洞',
      '加强输入验证',
      '完善SQL注入防护',
    ],
  },
  {
    version: 'v1.4.4',
    date: '2026-05-05',
    title: '文件上传优化',
    type: 'optimize',
    changes: [
      '优化大文件上传体验',
      '完善上传进度显示',
      '修复上传中断问题',
    ],
  },
  {
    version: 'v1.4.5',
    date: '2026-05-06',
    title: '移动端适配',
    type: 'feature',
    changes: [
      '优化移动端页面布局',
      '完善触屏交互体验',
      '修复移动端显示问题',
    ],
  },
  {
    version: 'v1.4.6',
    date: '2026-05-07',
    title: '搜索功能增强',
    type: 'feature',
    changes: [
      '优化搜索算法',
      '支持模糊搜索',
      '完善搜索结果排序',
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-05-08',
    title: '运营驾驶舱与埋点系统',
    type: 'feature',
    changes: [
      '新增运营驾驶舱（数据可视化大屏）',
      '新增搜索筛选功能',
      '新增事件埋点系统',
      '用户行为追踪',
    ],
  },
  {
    version: 'v2.0.1',
    date: '2026-05-09',
    title: '数据可视化优化',
    type: 'optimize',
    changes: [
      '优化图表渲染性能',
      '完善数据刷新机制',
      '提升大屏展示效果',
    ],
  },
  {
    version: 'v2.0.2',
    date: '2026-05-10',
    title: '埋点数据分析',
    type: 'feature',
    changes: [
      '新增埋点数据分析功能',
      '优化用户行为统计',
      '完善数据报表导出',
    ],
  },
  {
    version: 'v2.1.0',
    date: '2026-05-11',
    title: 'Webhook通知与品牌升级',
    type: 'feature',
    changes: [
      '新增Webhook通知系统',
      '支持日报/周报自动推送',
      '品牌升级：DCO SkillHub → 随航守卫',
      '新增Logo支持',
    ],
  },
  {
    version: 'v2.1.1',
    date: '2026-05-12',
    title: '通知系统优化',
    type: 'optimize',
    changes: [
      '优化Webhook推送稳定性',
      '完善通知模板配置',
      '修复通知发送失败问题',
    ],
  },
  {
    version: 'v2.2.0',
    date: '2026-05-13',
    title: '技能擂台与优选',
    type: 'feature',
    changes: [
      '新增Skill擂台模块（评分系统）',
      '新增小智优选功能（每周精选3个Skill）',
      '日志系统升级',
      '专家评审系统优化',
    ],
  },
  {
    version: 'v2.2.1',
    date: '2026-05-14',
    title: '全新首页设计',
    type: 'feature',
    changes: [
      '首页全新UI设计',
      '优化导航栏布局',
      '修复图片路径和Router错误',
      '修复视频播放问题',
      '优化按钮显示',
    ],
  },
  {
    version: 'v2.2.2',
    date: '2026-05-15',
    title: '首页性能优化',
    type: 'optimize',
    changes: [
      '优化首页加载速度',
      '完善图片懒加载',
      '提升首屏渲染性能',
    ],
  },
  {
    version: 'v2.2.3',
    date: '2026-05-16',
    title: '兼容性修复',
    type: 'fix',
    changes: [
      '修复浏览器兼容性问题',
      '优化移动端适配',
      '完善响应式布局',
    ],
  },
  {
    version: 'v2.2.4',
    date: '2026-05-17',
    title: '用户体验提升',
    type: 'optimize',
    changes: [
      '优化页面过渡动画',
      '完善加载状态提示',
      '提升整体交互流畅度',
    ],
  },
  {
    version: 'v2.3.0',
    date: '2026-05-18',
    title: '融合排行榜与通知优化',
    type: 'feature',
    changes: [
      '新增融合排行榜（各大区+职能中心）',
      '优化周报日报展示',
      '飞书Webhook通知系统升级',
      '新增管理后台日志查看',
    ],
  },
  {
    version: 'v2.3.1',
    date: '2026-05-19',
    title: '排行榜性能优化',
    type: 'optimize',
    changes: [
      '优化排行榜数据计算',
      '完善排行榜缓存机制',
      '提升排行榜加载速度',
    ],
  },
  {
    version: 'v2.3.2',
    date: '2026-05-20',
    title: '数据统计优化',
    type: 'optimize',
    changes: [
      '优化数据统计算法',
      '完善数据去重逻辑',
      '提升统计准确性',
    ],
  },
  {
    version: 'v2.4.0',
    date: '2026-05-21',
    title: '下载统计与密码保护',
    type: 'feature',
    changes: [
      '通知通道优化',
      '下载统计去重',
      '历史版本密码保护',
      '优化统计数据准确性',
    ],
  },
  {
    version: 'v2.4.1',
    date: '2026-05-22',
    title: '数据持久化与排行榜优化',
    type: 'feature',
    changes: [
      '新增数据持久化备份',
      '搜索功能修复',
      '排行榜优化',
      '下载统计修复',
    ],
  },
  {
    version: 'v2.4.2',
    date: '2026-05-23',
    title: '备份策略优化',
    type: 'optimize',
    changes: [
      '优化自动备份机制',
      '完善备份恢复流程',
      '提升数据安全性',
    ],
  },
  {
    version: 'v2.4.3',
    date: '2026-05-24',
    title: '系统监控增强',
    type: 'feature',
    changes: [
      '新增系统健康检查',
      '完善监控告警规则',
      '优化监控数据展示',
    ],
  },
  {
    version: 'v2.4.4',
    date: '2026-05-25',
    title: '性能调优',
    type: 'optimize',
    changes: [
      '优化系统整体性能',
      '完善资源使用监控',
      '提升并发处理能力',
    ],
  },
  {
    version: 'v2.5.0',
    date: '2026-05-26',
    title: 'VNet模板与作者信息',
    type: 'feature',
    changes: [
      '整合VNet技能模板',
      '修复作者信息',
      '优化统计数据',
    ],
  },
  {
    version: 'v2.5.1',
    date: '2026-05-27',
    title: '模板系统优化',
    type: 'optimize',
    changes: [
      '优化模板加载速度',
      '完善模板分类管理',
      '修复模板显示问题',
    ],
  },
  {
    version: 'v2.5.2',
    date: '2026-05-28',
    title: '作者信息完善',
    type: 'fix',
    changes: [
      '修复作者信息展示',
      '优化作者统计逻辑',
      '完善作者技能关联',
    ],
  },
  {
    version: 'v2.5.3',
    date: '2026-05-29',
    title: '端午节功能更新',
    type: 'feature',
    changes: [
      '新增端午节主题',
      '优化节日活动展示',
      '完善节日通知功能',
    ],
  },
  {
    version: 'v2.5.4',
    date: '2026-05-30',
    title: '系统稳定性提升',
    type: 'optimize',
    changes: [
      '优化系统稳定性',
      '完善异常处理',
      '提升服务可用性',
    ],
  },
  {
    version: 'v2.5.5',
    date: '2026-05-31',
    title: '月末数据归档',
    type: 'optimize',
    changes: [
      '优化数据归档流程',
      '完善历史数据管理',
      '提升数据查询效率',
    ],
  },
  {
    version: 'v2.6.0',
    date: '2026-06-01',
    title: '儿童节功能更新',
    type: 'feature',
    changes: [
      '新增儿童节主题',
      '优化活动展示页面',
      '完善用户互动功能',
    ],
  },
  {
    version: 'v2.6.1',
    date: '2026-06-02',
    title: '用户反馈优化',
    type: 'optimize',
    changes: [
      '优化用户反馈入口',
      '完善反馈处理流程',
      '提升用户满意度',
    ],
  },
  {
    version: 'v2.6.2',
    date: '2026-06-03',
    title: '搜索功能增强',
    type: 'feature',
    changes: [
      '优化搜索推荐算法',
      '完善搜索历史记录',
      '提升搜索准确性',
    ],
  },
  {
    version: 'v2.6.3',
    date: '2026-06-04',
    title: '页面加载优化',
    type: 'optimize',
    changes: [
      '优化页面资源加载',
      '完善代码分割策略',
      '提升首屏加载速度',
    ],
  },
  {
    version: 'v2.6.4',
    date: '2026-06-05',
    title: '安全策略更新',
    type: 'fix',
    changes: [
      '更新安全策略配置',
      '完善访问控制',
      '修复安全漏洞',
    ],
  },
  {
    version: 'v2.6.5',
    date: '2026-06-06',
    title: '周末维护更新',
    type: 'optimize',
    changes: [
      '优化系统维护流程',
      '完善维护通知机制',
      '提升系统可靠性',
    ],
  },
  {
    version: 'v2.6.6',
    date: '2026-06-07',
    title: '数据同步优化',
    type: 'optimize',
    changes: [
      '优化数据同步机制',
      '完善数据一致性检查',
      '提升同步效率',
    ],
  },
  {
    version: 'v3.0.0',
    date: '2026-06-08',
    title: '数据展示中心重构',
    type: 'feature',
    changes: [
      '重构数据展示中心',
      '分离运营看板与评奖看板',
      '新增运营热力图（支持分页）',
      '趋势分析图支持动态横轴单位',
      '热力图与趋势图指标联动',
      '停止自动日报/周报发送',
    ],
  },
  {
    version: 'v3.0.1',
    date: '2026-06-09',
    title: '排行榜详情与周报系统',
    type: 'feature',
    changes: [
      '新增平台迭代日志页签',
      '新增运营周报页签',
      '优化评奖看板排行榜详情（支持分页）',
      '优化运营热力图小时详情展示',
      '个人排行榜部门信息实时更新',
    ],
  },
  {
    version: 'v3.3.0',
    date: '2026-06-15',
    title: 'IP黑名单过滤优化',
    type: 'optimize',
    changes: [
      '优化IP黑名单策略，仅过滤高频爬虫（单日>=50次）',
      '新增13个高频爬虫IP到黑名单',
      '修复数据展示API返回未过滤数据的问题',
      '本月下载量从1923次过滤至339次（过滤82.4%）',
      '确保运营看板、周报等统计数据准确反映真实用户行为',
    ],
  },
  {
    version: 'v3.2.0',
    date: '2026-06-09',
    title: '技能发布安全校验',
    type: 'feature',
    changes: [
      '新增技能发布前安全性验证报告弹窗',
      '技能名称必须包含中文字符校验',
      '技能简介长度限制200字校验',
      'skill.md 全量敏感信息扫描（Token/Password/API Key/数据库连接/内网IP/Webhook等）',
      '压缩包大小限制3MB校验',
      '前后端双重校验机制',
      '校验通过后方可确认发布，未通过则拦截并提示具体问题',
    ],
  },
  {
    version: 'v3.1.0',
    date: '2026-06-09',
    title: '平台迭代日志完善',
    type: 'feature',
    changes: [
      '补充完整的平台迭代日志记录',
      '基于Git提交历史和Kimi操作日志梳理版本变更',
      '版本日志包含功能新增、问题修复、性能优化和文档更新',
      '支持按类型筛选（新功能/修复/优化/文档）',
    ],
  },
  {
    version: 'v3.0.3',
    date: '2026-06-09',
    title: '修复分页页码错误',
    type: 'fix',
    changes: [
      '修复评奖看板技能列表为空的问题',
      'API分页页码从0开始，但代码中使用从1开始，导致获取不到数据',
      '修正页码从0开始，并修复循环终止条件',
    ],
  },
  {
    version: 'v3.0.2',
    date: '2026-06-09',
    title: '修复排行榜技能关联',
    type: 'fix',
    changes: [
      '修复评奖看板部门/个人排行榜技能列表为空的问题',
      '改用 /api/skills 接口获取完整技能元数据（包含作者和部门信息）',
      '修复技能列表分页功能',
    ],
  },
  {
    version: 'v3.0.1',
    date: '2026-06-09',
    title: '数据展示优化',
    type: 'optimize',
    changes: [
      '优化运营看板自定义日期范围选择',
      '优化评奖看板排行榜详情（支持分页）',
      '优化运营热力图小时详情展示',
      '个人排行榜部门信息实时更新',
    ],
  },
  {
    version: 'v3.0.0',
    date: '2026-06-09',
    title: '重构数据展示中心',
    type: 'feature',
    changes: [
      '新增运营看板：支持自定义日期范围、最近7天/30天选择',
      '新增运营看板热力图：支持选择指标，点击单元格显示当天详细数据',
      '新增评奖看板：排除数智中心参与评比，展示部门/个人排行榜',
      '新增评奖看板详情：支持点击查看详情和分页',
      '新增平台迭代日志：展示项目版本迭代记录',
      '新增运营周报：按周展示运营指标',
      '所有数据统一从事件日志实时计算，过滤黑名单IP',
      '停止自动发送日报/周报',
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-05-20',
    title: 'AI场景地图与VNet模板',
    type: 'feature',
    changes: [
      '新增AI场景地图功能',
      '新增VNet技能模板发布',
      '优化技能发布流程',
      '修复多项已知问题',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-04-14',
    title: '项目初始化',
    type: 'feature',
    changes: [
      'DCO SkillHub 项目初始化',
      '基础架构搭建：FastAPI + React + Docker',
      '技能上传、下载、搜索基础功能',
      '技能版本管理系统',
    ],
  },
];

export function getVersionColor(type: VersionLog['type']): string {
  switch (type) {
    case 'feature':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'fix':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'optimize':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'docs':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getVersionLabel(type: VersionLog['type']): string {
  switch (type) {
    case 'feature':
      return '新功能';
    case 'fix':
      return '修复';
    case 'optimize':
      return '优化';
    case 'docs':
      return '文档';
    default:
      return '其他';
  }
}