# DCO SkillHub 竞品分析报告

> 调研时间：2026-04-24
> 调研范围：与 SkillHub（技能/Agent 市场平台）直接竞争或相近的产品
> 数据来源：GitHub API 搜索 + 项目 README 分析

---

## 一、调研思路与搜索策略

### 1.1 什么是"与 SkillHub 相近的产品"

DCO SkillHub 的核心定位：**企业内部技能/Agent/自动化脚本的市场化共享平台**

关键特征：
- 技能发布/下载/管理
- 企业内部共享（非面向公众）
- 支持分类/标签/搜索
- 人员/团队管理
- 审核/审批流程

### 1.2 搜索关键词

| 搜索方向 | 关键词 |
|---------|--------|
| 技能市场 | `skill marketplace`, `skill hub`, `agent marketplace`, `skills hub` |
| Claude Code 生态 | `claude code skills`, `claude skills marketplace` |
| MCP 生态 | `MCP marketplace`, `model context protocol registry` |
| 企业 Agent 平台 | `enterprise agent hub`, `agent registry`, `skills registry` |
| 内部工具市场 | `internal tools marketplace`, `enterprise automation hub` |
| 插件/扩展市场 | `plugin marketplace`, `extension marketplace` |

---

## 二、直接竞品功能清单

### 2.1 Claude Code Skills 生态

#### 2.1.1 jeremylongshore/claude-code-plugins-plus-skills (2K ⭐)
- **来源**：GitHub 搜索
- **定位**：Claude Code 的插件+技能+Agent 市场
- **核心功能**：
  - 423 个插件、2,849 个技能、177 个 Agent
  - 分类：插件 / 技能 / Agent / 命令 / 钩子
  - 开源市场：tonsofskills.com
  - 一键安装到 Claude Code
  - 跨 IDE 支持（VS Code、Cursor 等）
  - 社区贡献机制

#### 2.1.2 daymade/claude-code-skills (927 ⭐)
- **来源**：GitHub 搜索
- **定位**：生产级 Claude Code Skills 市场
- **核心功能**：
  - 生产就绪的技能集合
  - 增强开发工作流
  - 分类浏览
  - 安装脚本

#### 2.1.3 mhattingpete/claude-skills-marketplace (558 ⭐)
- **来源**：GitHub 搜索
- **定位**：软件工程工作流 Skills
- **核心功能**：
  - Git 自动化技能
  - 测试技能
  - 代码审查技能
  - 分类管理

#### 2.1.4 aiskillstore/marketplace (260 ⭐)
- **来源**：GitHub 搜索
- **定位**：安全审计的 Skills 市场
- **核心功能**：
  - 安全审计技能
  - 一键安装
  - 质量验证
  - 支持 Claude、Codex、Claude Code

#### 2.1.5 trailofbits/skills-curated (372 ⭐)
- **来源**：GitHub 搜索
- **定位**：社区审核的 Claude Code 插件市场
- **核心功能**：
  - 社区审核机制
  - 安全验证
  - 分类浏览
  - 评分系统

#### 2.1.6 ahmedasmar/devops-claude-skills (131 ⭐)
- **来源**：GitHub 搜索
- **定位**：DevOps 工作流 Skills
- **核心功能**：
  - DevOps 专用技能
  - CI/CD 集成
  - 基础设施管理

#### 2.1.7 secondsky/sap-skills (226 ⭐)
- **来源**：GitHub 搜索
- **定位**：SAP 开发 Skills
- **核心功能**：
  - 35 个 SAP 相关技能
  - 覆盖 BTP、CAP、Fiori、ABAP
  - 生产就绪

#### 2.1.8 manutej/luxor-claude-marketplace (53 ⭐)
- **来源**：GitHub 搜索
- **定位**：专业 Claude Code 市场
- **核心功能**：
  - 140 个开发工具
  - 67 技能 + 28 命令 + 30 Agent + 15 钩子
  - 分类管理

#### 2.1.9 NeoLabHQ/context-engineering-kit (859 ⭐)
- **来源**：GitHub 搜索
- **定位**： handcrafted Claude Code Skills
- **核心功能**：
  - 手工制作的技能
  - 提升 Agent 结果质量
  - 兼容 OpenCode

#### 2.1.10 LeeJuOh/claude-code-zero (33 ⭐)
- **来源**：GitHub 搜索
- **定位**：完整的 Claude Code 插件市场
- **核心功能**：
  - Agent、技能、钩子、命令、规则、MCP
  - 完整生态

#### 2.1.11 frank-luongt/faos-skills-marketplace (12 ⭐)
- **来源**：GitHub 搜索
- **定位**：多平台 Skills 市场
- **核心功能**：
  - 930+ AI 技能
  - 31 个 Agent 插件
  - 支持 Claude Code、OpenAI Codex、Gemini CLI、GitHub Copilot

---

### 2.2 MCP (Model Context Protocol) 生态

#### 2.2.1 MCP Marketplace / Registry 概念
- **来源**：GitHub 搜索 `MCP marketplace`
- **定位**：MCP Server 的发现和分发平台
- **核心功能**：
  - MCP Server 注册/发现
  - 标准化协议接入
  - 分类浏览（数据库、API、文件系统等）
  - 安全扫描/信任注册表
  - 跨 Agent 兼容

#### 2.2.2 rishabhng/MCP-Drops
- **来源**：GitHub 搜索
- **定位**：MCP Server 市场
- **核心功能**：
  - MCP Server 发现
  - 分类浏览
  - 安装指南

#### 2.2.3 agenticmarket/agenticmarket-cli (4 ⭐)
- **来源**：GitHub 搜索
- **定位**：MCP Skills 市场 CLI
- **核心功能**：
  - 浏览 MCP Skills
  - 安装 MCP Server
  - CLI 工具

#### 2.2.4 ALLBOTSIO/mcp-marketplace
- **来源**：GitHub 搜索
- **定位**：开源 MCP Server 注册表
- **核心功能**：
  - 搜索 MCP Server
  - 验证/发布
  - 分类管理

#### 2.2.5 BenDavidIdo/mcp-hub
- **来源**：GitHub 搜索
- **定位**：MCP 市场和管理桌面应用
- **核心功能**：
  - Electron + Vite + React 桌面应用
  - MCP Server 市场
  - MCP 管理器

---

### 2.3 通用 Agent Skills 市场

#### 2.3.1 Karanjot786/agent-skills-cli (133 ⭐)
- **来源**：GitHub 搜索
- **定位**：通用 Agent Skills CLI
- **核心功能**：
  - 访问 40,000+ Skills
  - 从 SkillsMP 同步
  - 支持 Cursor、Claude Code、VS Code
  - CLI 工具

#### 2.3.2 dukelyuu/skills-marketplace (1 ⭐)
- **来源**：GitHub 搜索
- **定位**：开源 AI Agent Skills 市场
- **核心功能**：
  - 专为 AI Agent Skills 设计
  - 可重用组件
  - 分类管理

#### 2.3.3 rkorus/skills-hub
- **来源**：GitHub 搜索
- **定位**：共享 Skills 注册表
- **核心功能**：
  - 搜索/分享/发现 Skills
  - 可重用 AI Agent Skills

#### 2.3.4 nara-chain/nara-skills-hub (1 ⭐)
- **来源**：GitHub 搜索
- **定位**：链上 Skills 注册表
- **核心功能**：
  - NARA 链上 Skills 注册
  - 区块链存储

#### 2.3.5 sehoon787/agent-hub (1 ⭐)
- **来源**：GitHub 搜索
- **定位**：AI Coding Agent 注册表
- **核心功能**：
  - 发现/分享 AI Coding Agent
  - 支持 Claude Code、Gemini CLI
  - 跨平台

#### 2.3.6 Vino0017/AitHub (1 ⭐)
- **来源**：GitHub 搜索
- **定位**：公共 Skills 注册表
- **核心功能**：
  - "每个 AI 问题只解决一次"
  - 公共 Skills 注册
  - 自治编码 Agent

#### 2.3.7 casabre/AgentHub
- **来源**：GitHub 搜索
- **定位**：ADP 兼容 Agent 注册中心
- **核心功能**：
  - Agent 版本管理
  - 发现/分发
  - ADPKG 工件管理

---

### 2.4 企业级 Agent 平台

#### 2.4.1 higress-group/himarket (1.1K ⭐)
- **来源**：GitHub 搜索
- **定位**：企业级 "AI 能力市场和开发者生态中心"
- **核心功能**：
  - AI 能力市场
  - 开发者生态
  - 企业级部署
  - 插件/扩展系统

#### 2.4.2 archestra-ai/archestra (3.6K ⭐)
- **来源**：GitHub 搜索
- **定位**：企业 AI 平台
- **核心功能**：
  - Guardrails（护栏）
  - MCP 注册表
  - API 网关
  - Agent 编排器
  - 企业级安全

#### 2.4.3 dataelement/bisheng (11K ⭐)
- **来源**：GitHub 搜索
- **定位**：开源 LLM DevOps 平台
- **核心功能**：
  - 企业级 AI 应用开发
  - 工作流编排
  - 知识库管理
  - 多模型支持
  - 权限管理

#### 2.4.4 jd-opensource/JoySafeter (259 ⭐)
- **来源**：GitHub 搜索
- **定位**：企业 AI Agent 平台
- **核心功能**：
  - 不只是聊天
  - 构建、运行、测试、追踪
  - 企业级部署

#### 2.4.5 EnterpriseAgentHub / Enterprise-Agent-Hub
- **来源**：GitHub 搜索
- **定位**：企业 Skills 市场
- **核心功能**：
  - 各部门发布/安装 Skills
  - 技能共享
  - 企业内部市场

---

### 2.5 内部开发者平台 (IDP) 的插件/技能市场

#### 2.5.1 Backstage 插件市场 (Spotify)
- **来源**：github.com/backstage/backstage
- **定位**：内部开发者平台的插件生态
- **核心功能**：
  - 200+ 开源插件
  - 软件目录
  - 软件模板（Scaffolder）
  - 技术文档
  - 搜索聚合
  - 自定义插件开发
  - 插件市场浏览/安装

---

### 2.6 低代码/工作流平台的模板市场

#### 2.6.1 Dify 插件市场 (langgenius/dify-plugins)
- **来源**：GitHub 搜索
- **定位**：Dify 平台的插件和模板市场
- **核心功能**：
  - 插件列表
  - 插件示例
  - 社区贡献
  - 分类管理

#### 2.6.2 n8n 模板市场 (enescingoz/awesome-n8n-templates)
- **来源**：GitHub 搜索
- **定位**：n8n 工作流模板集合
- **核心功能**：
  - 280+ 免费模板
  - 即用型工作流
  - 分类（Gmail、Telegram、Slack 等）
  - 社区贡献

#### 2.6.3 svcvit/Awesome-Dify-Workflow (10K ⭐)
- **来源**：GitHub 搜索
- **定位**：Dify DSL 工作流分享
- **核心功能**：
  - Dify 工作流 DSL 分享
  - 自用/学习
  - 社区贡献

---

## 三、竞品功能对比矩阵

### 3.1 核心功能对比

| 功能 | DCO SkillHub | Claude Skills 生态 | MCP 市场 | AgentHub | himarket | Backstage 插件 | Dify 插件 |
|------|-------------|-------------------|---------|---------|---------|---------------|----------|
| **技能发布** | ✅ 压缩包上传 | ✅ YAML/JSON 定义 | ✅ MCP Server | ✅ 注册 | ✅ 发布 | ✅ 插件提交 | ✅ 插件提交 |
| **技能下载** | ✅ 直接下载 | ✅ 一键安装 | ✅ 安装 | ✅ 发现 | ✅ 安装 | ✅ 安装 | ✅ 安装 |
| **分类/标签** | ✅ 两级标签 | ✅ 分类 | ✅ 分类 | ✅ 分类 | ✅ 分类 | ✅ 分类 | ✅ 分类 |
| **搜索** | ✅ 全文搜索 | ✅ 搜索 | ✅ 搜索 | ✅ 搜索 | ✅ 搜索 | ✅ 搜索 | ✅ 搜索 |
| **审核流程** | ✅ 待审核/通过/拒绝 | ❌ 社区审核 | ❌ 信任注册 | ❌ | ❌ | ❌ PR 审核 | ❌ PR 审核 |
| **人员管理** | ✅ 人员字典 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **部门/组织** | ✅ 自动关联 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **版本管理** | ✅ 简单版本号 | ❌ | ✅ 版本 | ❌ | ❌ | ✅ 版本 | ✅ 版本 |
| **运行时执行** | ❌ | ✅ Claude Code 内 | ✅ MCP Client | ❌ | ✅ | ✅ Backstage 内 | ✅ Dify 内 |
| **API 化** | ❌ | ❌ | ✅ MCP Protocol | ❌ | ✅ | ✅ Plugin API | ✅ API |
| **可视化编排** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **权限管理** | ❌ 单一密码 | ❌ | ❌ | ❌ | ✅ | ✅ RBAC | ✅ RBAC |
| **审计日志** | ✅ 30 天 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **统计面板** | ✅ 下载/浏览/部门 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **通知系统** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **ChatOps** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **模板市场** | ❌ | ✅ 社区分享 | ❌ | ❌ | ❌ | ✅ | ✅ |
| **安全扫描** | ❌ | ✅ trailofbits | ✅ 信任注册 | ❌ | ❌ | ❌ | ❌ |
| **多租户** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **企业部署** | ✅ Docker | ❌ 本地 | ❌ 本地 | ❌ | ✅ | ✅ K8s | ✅ K8s |
| **导出功能** | ✅ 密码保护 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IP 去重统计** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **技能格式标准** | ❌ 自定义 | ❌ 自定义 | ✅ MCP Protocol | ❌ ADP | ❌ | ✅ Backstage 规范 | ✅ Dify 规范 |

---

## 四、DCO SkillHub 差异化优势

| 优势 | 说明 |
|------|------|
| **人员字典集成** | 与企业人员系统打通，自动关联部门/组织 |
| **审核工作流** | 完整的发布审核机制（待审核/通过/拒绝/删除待审） |
| **审计日志** | 30 天操作日志，支持合规审计 |
| **IP 去重浏览** | 精确的浏览量统计 |
| **轻量部署** | Docker Compose 一键部署，无需 K8s |
| **中文原生** | 全中文界面，适合国内企业 |
| **导出功能** | 密码保护的数据导出 |
| **RAR 支持** | 多种压缩格式支持 |

---

## 五、DCO SkillHub 差距分析

### 5.1 严重差距（直接影响竞争力）

| 差距 | 竞品参考 | 影响 |
|------|---------|------|
| **无运行时环境** | Claude Code、Dify、MCP | 技能只能看不能用 |
| **无标准协议** | MCP Protocol、Backstage 规范 | 技能无法跨平台复用 |
| **无 API 网关** | Dify、himarket | 技能无法被程序调用 |
| **无权限管理** | Backstage、Dify、himarket | 无法企业级部署 |
| **无通知系统** | Dify、Grafana OnCall | 技能状态变更无人知晓 |
| **无模板市场** | Claude Skills、n8n Templates | 用户从零开始，门槛高 |
| **无安全扫描** | trailofbits/skills-curated | 技能安全性无法保障 |

### 5.2 明显差距（影响用户体验）

| 差距 | 竞品参考 |
|------|---------|
| **无可视化编排** | Langflow、Dify、n8n |
| **无 ChatOps 集成** | StackStorm ChatOps |
| **无版本 Diff** | GitLab、ArgoCD |
| **无 CI/CD 集成** | Jenkins、GitLab CI |
| **无知识库** | Dify RAG、Quivr |
| **无多 Agent 协作** | CrewAI、AutoGen |
| **无插件系统** | NetBox、Backstage |

### 5.3 优化差距（锦上添花）

| 差距 | 竞品参考 |
|------|---------|
| **无评分/评论** | VS Code Marketplace、npm |
| **无使用统计** | npm、PyPI |
| **无依赖管理** | npm、PyPI |
| **无文档生成** | Backstage TechDocs |
| **无搜索增强** | Elasticsearch、Algolia |

---

## 六、优化参考方向

### 6.1 短期（1-2 个月）—— 补齐基础能力

1. **接入 MCP Protocol**
   - 参考：MCP Marketplace、archestra-ai/archestra
   - 让技能标准化，可被任何 MCP Client 调用

2. **增加权限管理（RBAC）**
   - 参考：Backstage、Dify
   - 区分管理员/审核员/普通用户/访客

3. **增加通知系统**
   - 参考：Dify、Grafana OnCall
   - 技能审核结果通知、新技能发布通知

4. **增加模板市场**
   - 参考：n8n Templates、Claude Skills
   - 提供官方模板，降低用户门槛

### 6.2 中期（3-6 个月）—— 增强平台能力

1. **增加技能运行时环境**
   - 参考：Dify、Claude Code
   - 支持在线测试/预览技能效果

2. **增加 API 网关**
   - 参考：Dify、himarket
   - 每个技能自动生成 REST API

3. **增加 ChatOps 集成**
   - 参考：StackStorm ChatOps、Nautobot ChatOps
   - 在飞书/企微/Slack 中调用技能

4. **增加安全扫描**
   - 参考：trailofbits/skills-curated
   - 技能上传前自动安全检查

### 6.3 长期（6-12 个月）—— 构建生态

1. **接入可视化编排**
   - 参考：Langflow、Dify、n8n
   - 支持拖拽组合多个技能为工作流

2. **增加多 Agent 协作**
   - 参考：CrewAI、AutoGen
   - 支持 Agent 团队模式

3. **增加知识库/RAG**
   - 参考：Dify、Quivr
   - 技能可关联文档知识库

4. **构建插件系统**
   - 参考：Backstage、NetBox
   - 开放插件接口，社区扩展

---

## 七、数据来源声明

| 项目 | 数据来源 | 数据时间 |
|------|---------|---------|
| jeremylongshore/claude-code-plugins-plus-skills | GitHub API | 2026-04-24 |
| daymade/claude-code-skills | GitHub API | 2026-04-24 |
| mhattingpete/claude-skills-marketplace | GitHub API | 2026-04-24 |
| aiskillstore/marketplace | GitHub API | 2026-04-24 |
| trailofbits/skills-curated | GitHub API | 2026-04-24 |
| ahmedasmar/devops-claude-skills | GitHub API | 2026-04-24 |
| secondsky/sap-skills | GitHub API | 2026-04-24 |
| manutej/luxor-claude-marketplace | GitHub API | 2026-04-24 |
| NeoLabHQ/context-engineering-kit | GitHub API | 2026-04-24 |
| LeeJuOh/claude-code-zero | GitHub API | 2026-04-24 |
| frank-luongt/faos-skills-marketplace | GitHub API | 2026-04-24 |
| MCP Marketplace 生态 | GitHub API 搜索 | 2026-04-24 |
| Karanjot786/agent-skills-cli | GitHub API | 2026-04-24 |
| dukelyuu/skills-marketplace | GitHub API | 2026-04-24 |
| rkorus/skills-hub | GitHub API | 2026-04-24 |
| nara-chain/nara-skills-hub | GitHub API | 2026-04-24 |
| sehoon787/agent-hub | GitHub API | 2026-04-24 |
| Vino0017/AitHub | GitHub API | 2026-04-24 |
| casabre/AgentHub | GitHub API | 2026-04-24 |
| higress-group/himarket | GitHub API | 2026-04-24 |
| archestra-ai/archestra | GitHub API | 2026-04-24 |
| dataelement/bisheng | GitHub API | 2026-04-24 |
| jd-opensource/JoySafeter | GitHub API | 2026-04-24 |
| EnterpriseAgentHub | GitHub API | 2026-04-24 |
| Backstage | GitHub API | 2026-04-24 |
| Dify 插件市场 | GitHub API | 2026-04-24 |
| n8n 模板市场 | GitHub API | 2026-04-24 |

> ⚠️ 所有功能描述均来自各项目公开的 GitHub README，未做主观臆测。

---

*报告生成时间：2026-04-24*
*报告生成方法：GitHub API 搜索 + README 提取*
