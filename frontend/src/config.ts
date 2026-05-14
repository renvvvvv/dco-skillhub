// ============================================================
// Site Configuration
// ============================================================

export interface SiteConfig {
  language: string;
  brandName: string;
}

export const siteConfig: SiteConfig = {
  language: "zh-CN",
  brandName: "随航守卫",
};

// ============================================================
// Navigation
// ============================================================

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  links: NavLink[];
  ctaText: string;
}

export const navigationConfig: NavigationConfig = {
  links: [
    { label: "开始", href: "#hero" },
    { label: "能力矩阵", href: "#curriculum" },
    { label: "复利效应", href: "#cinematic" },
    { label: "智能体", href: "#alumni" },
  ],
  ctaText: "立即进入",
};

// ============================================================
// Hero
// ============================================================

export interface HeroConfig {
  title: string;
  subtitleLine1: string;
  subtitleLine2: string;
  ctaText: string;
}

export const heroConfig: HeroConfig = {
  title: "随航守卫",
  subtitleLine1:
    "汇聚全事业部智慧，构建运维智能体生态。从知识沉淀到能力复利，让每一位运维工程师都能站在巨人的肩膀上。",
  subtitleLine2: "智能运维复利增长新引擎",
  ctaText: "进入 随航守卫",
};

// ============================================================
// Capabilities (Curriculum section)
// ============================================================

export interface CapabilityItem {
  title: string;
  slug: string;
  description: string;
  image: string;
}

export interface CapabilitiesConfig {
  sectionLabel: string;
  items: CapabilityItem[];
}

export const capabilitiesConfig: CapabilitiesConfig = {
  sectionLabel: "AI Agents Ecosystem",
  items: [
    {
      title: "故障诊断专家",
      slug: "fault-diagnosis",
      description:
        "快速定位系统故障根因，提供修复建议和应急预案，支持多维度日志分析。覆盖日志分析、根因定位、应急处理等核心运维场景，让每个故障都能被精准诊断。",
      image: "images/capability-1.jpg",
    },
    {
      title: "容量规划师",
      slug: "capacity-planning",
      description:
        "基于历史数据和业务趋势，智能预测资源需求，优化成本结构。支持趋势预测、成本优化、资源调度，让资源分配从经验驱动变为数据驱动。",
      image: "images/capability-2.jpg",
    },
    {
      title: "安全审计官",
      slug: "security-audit",
      description:
        "自动化安全检查，识别配置漏洞，提供合规建议和修复方案。覆盖漏洞扫描、合规检查、风险评估，构建纵深防御的安全体系。",
      image: "images/capability-3.jpg",
    },
    {
      title: "自动化工程师",
      slug: "automation-engineer",
      description:
        "生成运维脚本和自动化流程，支持Ansible、Shell、Python等多语言。覆盖脚本生成、CI/CD、流水线，让重复性运维工作全部自动化。",
      image: "images/capability-4.jpg",
    },
  ],
};

// ============================================================
// Capability Detail (sub-pages)
// ============================================================

export interface CapabilityDetailData {
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export interface CapabilityDetailConfig {
  sectionLabel: string;
  backLinkText: string;
  prevLabel: string;
  nextLabel: string;
  notFoundText: string;
  capabilities: Record<string, CapabilityDetailData>;
}

export const capabilityDetailConfig: CapabilityDetailConfig = {
  sectionLabel: "智能体详情",
  backLinkText: "返回首页",
  prevLabel: "上一个",
  nextLabel: "下一个",
  notFoundText: "未找到该智能体",
  capabilities: {
    "fault-diagnosis": {
      title: "故障诊断专家",
      subtitle: "快速定位系统故障根因，多维日志分析",
      paragraphs: [
        "故障诊断专家智能体是运维团队的核心武器。它基于多年积累的故障案例库，结合实时日志分析能力，能够在分钟级别定位系统异常的根本原因。无论是应用层错误、中间件故障还是基础设施问题，都能精准定位并给出修复方案。",
        "该智能体覆盖日志分析、根因定位、应急处理三大核心场景。通过自然语言交互，运维工程师可以直接描述故障现象，智能体会自动关联历史相似案例，提供分级修复建议，并生成标准化的应急处理文档。",
        "每一次故障诊断都是知识沉淀。智能体会自动归档新的故障案例和解决方案，不断丰富知识库，形成运维知识资产的复利增长。",
      ],
    },
    "capacity-planning": {
      title: "容量规划师",
      subtitle: "基于历史数据智能预测资源需求",
      paragraphs: [
        "容量规划师智能体通过分析历史资源使用数据和业务增长趋势，为运维团队提供精准的资源需求预测。它能够识别业务高峰期和低谷期，帮助团队在成本和性能之间找到最优平衡点。",
        "支持趋势预测、成本优化、资源调度三大场景。智能体能够自动生成容量规划报告，识别资源浪费点，推荐最优的扩容或缩容方案，帮助企业在保障服务质量的同时最大化资源利用率。",
        "通过持续学习业务模式和资源使用规律，容量规划师的预测准确度不断提升，成为运维团队不可或缺的决策助手。",
      ],
    },
    "security-audit": {
      title: "安全审计官",
      subtitle: "自动化安全检查，识别配置漏洞",
      paragraphs: [
        "安全审计官智能体构建了全方位的安全检查体系。它能够自动扫描系统配置，识别潜在的安全漏洞和合规风险，并提供详细的修复方案和优先级排序。",
        "覆盖漏洞扫描、合规检查、风险评估三大场景。智能体持续跟进最新的安全威胁情报，将安全最佳实践内化为自动化检查规则，帮助企业构建主动防御的安全体系。",
        "安全是持续的过程而非一次性的检查。安全审计官会定期执行安全检查，跟踪修复进度，确保企业的安全防护始终处于最佳状态。",
      ],
    },
    "automation-engineer": {
      title: "自动化工程师",
      subtitle: "生成运维脚本，支持多语言自动化",
      paragraphs: [
        "自动化工程师智能体是运维效率提升的倍增器。它能够根据运维需求自动生成高质量的脚本和自动化流程，支持Ansible、Shell、Python等多种脚本语言，覆盖从日常巡检到复杂变更的全场景。",
        "覆盖脚本生成、CI/CD、流水线三大场景。通过标准化的自动化模板和最佳实践，智能体帮助团队将重复性运维工作全面自动化，让工程师有更多时间投入到创新和价值创造中。",
        "每一次自动化都是效率的提升。自动化工程师会持续优化脚本质量，积累自动化模板库，让自动化能力在团队中不断复用和传承。",
      ],
    },
  },
};

// ============================================================
// Architecture (CinematicVision section)
// ============================================================

export interface ArchitectureConfig {
  sectionLabel: string;
  videoPath: string;
  title: string;
  description: string;
}

export const architectureConfig: ArchitectureConfig = {
  sectionLabel: "Compound Effect",
  videoPath: "/videos/cinematic-vision.mp4",
  title: "智能体复利效应：每一次使用都在积累，每一个智能体都在进化",
  description:
    "运维技术结晶，高复用价值。专家经验数字化沉淀，新手也能获得资深工程师的指导。基于使用反馈和数据积累，智能体越用越聪明。多智能体协作，复杂问题一站式解决，知识资产持续增值。",
};

// ============================================================
// Research (AlumniArchives section)
// ============================================================

export interface ResearchProject {
  title: string;
  year: string;
  discipline: string;
  image: string;
}

export interface ResearchConfig {
  sectionLabel: string;
  projects: ResearchProject[];
}

export const researchConfig: ResearchConfig = {
  sectionLabel: "运维智能体矩阵",
  projects: [
    {
      title: "故障诊断专家",
      year: "2026",
      discipline: "日志分析 · 根因定位 · 应急处理",
      image: "images/research-1.jpg",
    },
    {
      title: "容量规划师",
      year: "2026",
      discipline: "趋势预测 · 成本优化 · 资源调度",
      image: "images/research-2.jpg",
    },
    {
      title: "安全审计官",
      year: "2026",
      discipline: "漏洞扫描 · 合规检查 · 风险评估",
      image: "images/research-3.jpg",
    },
    {
      title: "自动化工程师",
      year: "2026",
      discipline: "脚本生成 · CI/CD · 流水线",
      image: "images/research-4.jpg",
    },
    {
      title: "告警治理专家",
      year: "2026",
      discipline: "告警降噪 · 关联分析 · 智能分级",
      image: "images/capability-1.jpg",
    },
    {
      title: "知识库管家",
      year: "2026",
      discipline: "知识检索 · SOP · 案例库",
      image: "images/capability-2.jpg",
    },
    {
      title: "容器编排助手",
      year: "2026",
      discipline: "K8s诊断 · 资源优化 · 调度分析",
      image: "images/capability-3.jpg",
    },
    {
      title: "数据库专家",
      year: "2026",
      discipline: "SQL优化 · 性能调优 · 容灾方案",
      image: "images/capability-4.jpg",
    },
    {
      title: "备份容灾专家",
      year: "2026",
      discipline: "数据备份 · 灾备演练 · RTO/RPO",
      image: "images/research-5.jpg",
    },
  ],
};

// ============================================================
// Footer
// ============================================================

export interface FooterLinkColumn {
  title: string;
  links: string[];
}

export interface FooterBottomLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  heading: string;
  columns: FooterLinkColumn[];
  copyright: string;
  bottomLinks: FooterBottomLink[];
}

export const footerConfig: FooterConfig = {
  heading: "开启你的智能运维之旅",
  columns: [
    {
      title: "产品",
      links: ["智能体矩阵", "技能擂台", "能力复用", "知识沉淀"],
    },
    {
      title: "团队",
      links: ["运维事业部", "数智中心", "关于我们", "联系我们"],
    },
  ],
  copyright: "\u00A9 2026 随航守卫. Powered by 数智中心",
  bottomLinks: [
    { label: "隐私政策", href: "#" },
    { label: "使用条款", href: "#" },
  ],
};
