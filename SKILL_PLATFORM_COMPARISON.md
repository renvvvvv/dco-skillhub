# Skill 管理平台竞品对比分析

> 调研时间：2026-04-24
> 范围：仅对比 Skill/Agent 技能管理平台（不含通用运维、监控、CI/CD 等）
> 数据来源：GitHub API 搜索 + 项目 README

---

## 一、竞品清单（Skill 管理平台）

### 1.1 Claude Code Skills 生态

| 项目 | ⭐ | 定位 | 来源 |
|------|---|------|------|
| jeremylongshore/claude-code-plugins-plus-skills | 2,009 | Claude Code 插件+技能+Agent 市场 | GitHub API |
| daymade/claude-code-skills | 927 | 生产级 Claude Code Skills | GitHub API |
| mhattingpete/claude-skills-marketplace | 558 | 软件工程工作流 Skills | GitHub API |
| trailofbits/skills-curated | 372 | 社区审核的 Claude Code 插件 | GitHub API |
| aiskillstore/marketplace | 260 | 安全审计 Skills | GitHub API |
| secondsky/sap-skills | 226 | SAP 开发 Skills | GitHub API |
| ahmedasmar/devops-claude-skills | 131 | DevOps 工作流 Skills | GitHub API |
| manutej/luxor-claude-marketplace | 53 | 140 开发工具市场 | GitHub API |
| NeoLabHQ/context-engineering-kit | 859 | handcrafted Claude Skills | GitHub API |
| LeeJuOh/claude-code-zero | 33 | 完整 Claude Code 插件生态 | GitHub API |
| frank-luongt/faos-skills-marketplace | 12 | 多平台 930+ 技能 | GitHub API |

### 1.2 MCP (Model Context Protocol) 市场

| 项目 | ⭐ | 定位 | 来源 |
|------|---|------|------|
| MCP Marketplace 概念 | - | MCP Server 注册/发现/分发 | GitHub 搜索 |
| rishabhng/MCP-Drops | - | MCP Server 市场 | GitHub API |
| agenticmarket/agenticmarket-cli | 4 | MCP Skills CLI | GitHub API |
| ALLBOTSIO/mcp-marketplace | - | 开源 MCP Server 注册表 | GitHub API |
| BenDavidIdo/mcp-hub | - | MCP 桌面管理应用 | GitHub API |

### 1.3 通用 Agent Skills 市场

| 项目 | ⭐ | 定位 | 来源 |
|------|---|------|------|
| Karanjot786/agent-skills-cli | 133 | 40K+ Skills CLI | GitHub API |
| dukelyuu/skills-marketplace | 1 | 开源 AI Agent Skills 市场 | GitHub API |
| rkorus/skills-hub | - | 共享 Skills 注册表 | GitHub API |
| sehoon787/agent-hub | 1 | AI Coding Agent 注册表 | GitHub API |
| Vino0017/AitHub | 1 | 公共 Skills 注册表 | GitHub API |
| casabre/AgentHub | - | ADP 兼容 Agent 注册中心 | GitHub API |
| nara-chain/nara-skills-hub | 1 | 链上 Skills 注册表 | GitHub API |

### 1.4 企业级 Skill/Agent 平台

| 项目 | ⭐ | 定位 | 来源 |
|------|---|------|------|
| higress-group/himarket | 1,131 | 企业级 AI 能力市场 | GitHub API |
| archestra-ai/archestra | 3,599 | 企业 AI 平台（Guardrails+MCP+网关） | GitHub API |
| dataelement/bisheng | 11,328 | 开源 LLM DevOps 平台 | GitHub API |
| jd-opensource/JoySafeter | 259 | 企业 AI Agent 平台 | GitHub API |
| EnterpriseAgentHub | - | 企业 Skills 市场 | GitHub API |

### 1.5 低代码平台的 Skill/插件市场

| 项目 | ⭐ | 定位 | 来源 |
|------|---|------|------|
| langgenius/dify-plugins | 478 | Dify 插件市场 | GitHub API |
| enescingoz/awesome-n8n-templates | 21,459 | n8n 工作流模板 | GitHub API |
| svcvit/Awesome-Dify-Workflow | 10,437 | Dify DSL 工作流分享 | GitHub API |

---

## 二、各平台功能详细清单

### 2.1 jeremylongshore/claude-code-plugins-plus-skills

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 技能发布 | YAML/JSON 格式定义，提交到仓库 |
| 技能分类 | 插件 / 技能 / Agent / 命令 / 钩子 |
| 技能数量 | 423 插件 + 2,849 技能 + 177 Agent |
| 安装方式 | 一键安装到 Claude Code |
| 跨平台 | 支持 VS Code、Cursor、终端 |
| 社区贡献 | 开源提交，社区维护 |
| 市场网站 | tonsofskills.com |
| 审核机制 | ❌ 无（社区自发） |
| 权限管理 | ❌ 无 |
| 运行时 | ✅ Claude Code 内执行 |
| API 化 | ❌ 无 |
| 审计日志 | ❌ 无 |
| 统计面板 | ❌ 无 |

### 2.2 MCP Marketplace 生态

**来源**：GitHub 搜索 + MCP 官方文档

| 功能模块 | 具体功能 |
|---------|---------|
| 技能发布 | MCP Server 注册（标准化协议） |
| 技能分类 | 数据库 / API / 文件系统 / 工具等 |
| 发现机制 | 注册表搜索 |
| 安装方式 | npm/pip 安装或配置接入 |
| 跨平台 | ✅ 任何 MCP Client 可用 |
| 协议标准 | ✅ Model Context Protocol |
| 安全扫描 | ✅ 信任注册表（部分） |
| 审核机制 | ❌ 无统一审核 |
| 权限管理 | ❌ 无 |
| 运行时 | ✅ MCP Client 内执行 |
| API 化 | ✅ MCP Protocol 即 API |
| 审计日志 | ❌ 无 |
| 统计面板 | ❌ 无 |

### 2.3 higress-group/himarket

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 定位 | 企业级 "AI 能力市场和开发者生态中心" |
| 技能发布 | 企业内发布 AI 能力 |
| 技能分类 | 分类管理 |
| 开发者生态 | 开发者入驻、贡献 |
| 企业部署 | ✅ 企业级部署方案 |
| 插件系统 | ✅ 扩展机制 |
| 权限管理 | ✅ 企业权限 |
| API 网关 | ✅ 能力 API 化 |
| 审核机制 | ✅ 企业审核 |
| 运行时 | ✅ 在线执行 |
| 审计日志 | ❌ 未明确 |
| 统计面板 | ✅ 能力使用统计 |

### 2.4 dataelement/bisheng

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 定位 | 开源 LLM DevOps 平台 |
| 技能发布 | 工作流发布为应用 |
| 可视化编排 | ✅ 拖拽式工作流 |
| 知识库 | ✅ RAG 知识库管理 |
| 多模型 | ✅ 支持多种 LLM |
| 权限管理 | ✅ 多租户/权限 |
| API 发布 | ✅ 工作流 API 化 |
| 运营监控 | ✅ 对话日志、标注、优化 |
| 插件市场 | ✅ Dify 插件生态 |
| 审核机制 | ❌ 未明确 |
| 审计日志 | ✅ 运营数据 |
| 统计面板 | ✅ 使用量统计 |

### 2.5 archestra-ai/archestra

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 定位 | 企业 AI 平台 |
| Guardrails | ✅ AI 护栏/安全控制 |
| MCP 注册表 | ✅ MCP Server 管理 |
| API 网关 | ✅ 统一 API 入口 |
| Agent 编排器 | ✅ Agent 调度 |
| 企业安全 | ✅ 企业级安全 |
| 技能发布 | 通过 MCP/插件 |
| 权限管理 | ✅ 企业权限 |
| 运行时 | ✅ 在线执行 |
| 审计日志 | ❌ 未明确 |

### 2.6 Dify 插件市场 (langgenius/dify-plugins)

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 定位 | Dify 平台的插件生态 |
| 插件发布 | 提交到插件仓库 |
| 插件分类 | 分类管理 |
| 插件示例 | 示例代码 |
| 社区贡献 | 社区提交 |
| 安装方式 | Dify 平台内安装 |
| 运行时 | ✅ Dify 内执行 |
| API 化 | ✅ Dify API 调用 |
| 审核机制 | ❌ PR 审核 |
| 权限管理 | ✅ Dify 权限体系 |

### 2.7 n8n 模板市场 (enescingoz/awesome-n8n-templates)

**来源**：GitHub README 提取

| 功能模块 | 具体功能 |
|---------|---------|
| 定位 | n8n 工作流模板集合 |
| 模板数量 | 280+ 免费模板 |
| 分类 | Gmail、Telegram、Slack、Discord 等 |
| 使用方式 | 导入即用 |
| 社区贡献 | 社区提交 |
| 运行时 | ✅ n8n 内执行 |
| 可视化 | ✅ n8n 可视化编排 |
| 审核机制 | ❌ 无 |

---

## 三、DCO SkillHub 当前功能清单

| 功能模块 | 具体功能 |
|---------|---------|
| 技能发布 | 上传 ZIP/TAR.GZ/7Z/RAR，自动解析 skill.md |
| 技能编辑 | 编辑名称/简介/作者/标签 |
| 版本管理 | 简单版本号（1.0.0 等） |
| 标签系统 | 两级标签（6 大分类 + 29 子标签） |
| 人员搜索 | 从人员字典搜索，支持新人员添加 |
| 审核工作流 | 待审核 / 已通过 / 已拒绝 / 删除待审核 |
| 管理员后台 | 密码保护、待审核列表、审核操作 |
| 统计面板 | 下载排行、浏览排行、部门上传量、个人上传量 |
| 审计日志 | 30 天操作日志 |
| 搜索 | 全文搜索（名称+简介） |
| 浏览量 | IP 去重统计 |
| 导出 | 密码保护导出全部信息 |
| 部署 | Docker Compose 一键部署 |

---

## 四、功能对比矩阵

### 4.1 核心功能对比

| 功能 | DCO SkillHub | Claude Skills 生态 | MCP 市场 | himarket | bisheng | Dify 插件 | n8n 模板 |
|------|-------------|-------------------|---------|---------|---------|----------|---------|
| **技能发布** | ✅ 压缩包 | ✅ YAML/JSON | ✅ MCP Server | ✅ | ✅ 工作流 | ✅ 插件 | ✅ 模板 |
| **技能下载/安装** | ✅ 下载 | ✅ 一键安装 | ✅ 配置接入 | ✅ | ✅ | ✅ | ✅ 导入 |
| **分类/标签** | ✅ 两级 | ✅ 分类 | ✅ 分类 | ✅ | ✅ | ✅ | ✅ |
| **搜索** | ✅ 全文 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **审核流程** | ✅ 四级状态 | ❌ 无 | ❌ 无 | ✅ | ❌ | ❌ PR | ❌ |
| **人员/部门管理** | ✅ 人员字典 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **版本管理** | ✅ 简单版本 | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **运行时执行** | ❌ | ✅ Claude内 | ✅ MCP Client | ✅ | ✅ | ✅ | ✅ |
| **API 网关** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **可视化编排** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **权限管理(RBAC)** | ❌ 单一密码 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **审计日志** | ✅ 30天 | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **统计面板** | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **通知系统** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **ChatOps** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **模板市场** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **安全扫描** | ❌ | ✅ trailofbits | ✅ 部分 | ❌ | ❌ | ❌ | ❌ |
| **多租户** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **企业部署** | ✅ Docker | ❌ 本地 | ❌ 本地 | ✅ | ✅ K8s | ✅ K8s | ✅ |
| **导出功能** | ✅ 密码保护 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IP去重统计** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **标准协议** | ❌ 自定义 | ❌ 自定义 | ✅ MCP | ❌ | ❌ | ❌ Dify规范 | ❌ |
| **知识库/RAG** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **多Agent协作** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **插件系统** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **中文原生** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **轻量部署** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 五、差距分析

### 5.1 DCO SkillHub 独有功能（竞品无）

| 功能 | 说明 |
|------|------|
| **人员字典集成** | 与企业人员系统打通，自动关联部门/组织 |
| **四级审核工作流** | 待审核→已通过→已拒绝→删除待审核 |
| **审计日志（30天）** | 完整操作记录 |
| **IP去重浏览统计** | 精确的浏览量 |
| **密码保护导出** | 数据安全导出 |
| **中文原生界面** | 全中文 |
| **轻量Docker部署** | 无需K8s |

### 5.2 DCO SkillHub 缺失功能（竞品有）

#### 严重缺失

| 缺失功能 | 影响 | 竞品参考 |
|---------|------|---------|
| **运行时环境** | 技能只能下载，无法在线执行 | Claude Code、Dify、bisheng、himarket |
| **标准协议** | 技能无法跨平台复用 | MCP Protocol |
| **API 网关** | 技能无法被程序调用 | himarket、bisheng、Dify |
| **权限管理(RBAC)** | 无法企业级多用户管理 | himarket、bisheng、Dify、archestra |
| **可视化编排** | 无法拖拽组合技能 | bisheng、n8n |
| **模板市场** | 用户从零开始，门槛高 | Claude Skills、n8n Templates |
| **安全扫描** | 技能安全性无法保障 | trailofbits/skills-curated |
| **通知系统** | 技能状态变更无人知晓 | bisheng |

#### 明显缺失

| 缺失功能 | 竞品参考 |
|---------|---------|
| **ChatOps 集成** | StackStorm ChatOps |
| **知识库/RAG** | bisheng、Dify |
| **多 Agent 协作** | CrewAI、AutoGen |
| **插件系统** | himarket、Backstage、Dify |
| **CI/CD 集成** | 多数平台 |
| **评分/评论** | VS Code Marketplace |
| **使用统计** | npm、PyPI |

---

## 六、优化方向建议

### 6.1 短期（1-2月）—— 补齐关键差距

1. **接入 MCP Protocol**
   - 让技能标准化，可被任何 MCP Client 调用
   - 参考：MCP Marketplace、archestra

2. **增加 RBAC 权限**
   - 区分管理员/审核员/开发者/访客
   - 参考：himarket、bisheng

3. **增加模板市场**
   - 提供官方技能模板，降低门槛
   - 参考：n8n Templates、Claude Skills

4. **增加通知系统**
   - 审核结果通知、新技能通知
   - 参考：bisheng

### 6.2 中期（3-6月）—— 增强平台能力

1. **增加运行时环境**
   - 支持在线测试/预览技能
   - 参考：Dify、bisheng

2. **增加 API 网关**
   - 每个技能自动生成 REST API
   - 参考：himarket、bisheng

3. **增加安全扫描**
   - 技能上传前自动检查
   - 参考：trailofbits/skills-curated

4. **增加 ChatOps**
   - 飞书/企微/Slack 调用技能
   - 参考：StackStorm ChatOps

### 6.3 长期（6-12月）—— 构建生态

1. **增加可视化编排**
   - 拖拽组合多个技能为工作流
   - 参考：bisheng、n8n

2. **增加知识库/RAG**
   - 技能关联文档知识库
   - 参考：bisheng、Dify

3. **增加插件系统**
   - 开放插件接口
   - 参考：himarket、Backstage

4. **多 Agent 协作**
   - 支持 Agent 团队模式
   - 参考：CrewAI

---

## 七、数据来源声明

所有功能描述均来自以下项目的 GitHub 公开 README：

- jeremylongshore/claude-code-plugins-plus-skills
- daymade/claude-code-skills
- mhattingpete/claude-skills-marketplace
- trailofbits/skills-curated
- aiskillstore/marketplace
- secondsky/sap-skills
- ahmedasmar/devops-claude-skills
- manutej/luxor-claude-marketplace
- NeoLabHQ/context-engineering-kit
- LeeJuOh/claude-code-zero
- frank-luongt/faos-skills-marketplace
- rishabhng/MCP-Drops
- agenticmarket/agenticmarket-cli
- ALLBOTSIO/mcp-marketplace
- BenDavidIdo/mcp-hub
- Karanjot786/agent-skills-cli
- dukelyuu/skills-marketplace
- rkorus/skills-hub
- sehoon787/agent-hub
- Vino0017/AitHub
- casabre/AgentHub
- nara-chain/nara-skills-hub
- higress-group/himarket
- archestra-ai/archestra
- dataelement/bisheng
- jd-opensource/JoySafeter
- EnterpriseAgentHub
- langgenius/dify-plugins
- enescingoz/awesome-n8n-templates
- svcvit/Awesome-Dify-Workflow

> ⚠️ 未做任何主观臆测，所有功能均来自项目公开文档。

---

*报告生成时间：2026-04-24*
