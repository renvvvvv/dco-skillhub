# doc-skillhub 部署文档

## 项目概述

**doc-skillhub** 是一个轻量级技能市场平台，基于 [dco-skillhub](https://github.com/renvvvvv/dco-skillhub) 项目构建，支持技能的发布、版本管理、搜索和下载。

- **公网访问地址**：`http://211.154.18.252:10143/`
- **部署方式**：Docker + Docker Compose
- **端口映射**：云平台 `10143` → 服务器 `8088` → Docker nginx `80`

---

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   公网用户       │────▶│  211.154.18.252 │────▶│   服务器:8088    │
│                 │     │     :10143      │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌─────────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │   Docker Compose    │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  nginx (前端)  │  │
                    │  │  端口: 80      │  │
                    │  │  镜像: doc-    │  │
                    │  │  skillhub-nginx│  │
                    │  └───────┬───────┘  │
                    │          │           │
                    │  ┌───────▼───────┐  │
                    │  │ backend (后端) │  │
                    │  │ 端口: 8080     │  │
                    │  │ 镜像: doc-     │  │
                    │  │ skillhub-backend│ │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### 架构说明

| 层级 | 技术栈 | 职责 |
|------|--------|------|
| **前端** | React 18 + TypeScript + Vite + Nginx | 提供 Web UI，静态资源服务，API 反向代理 |
| **后端** | Python 3.11 + FastAPI + Uvicorn | 提供 REST API，技能管理，文件存储 |
| **数据存储** | JSON 文件（无数据库） | `skills.json`、`versions.json`、`search_index.json` |
| **文件存储** | 本地文件系统 + Docker Volume | 技能 ZIP 包存储在 `/app/storage` |
| **部署** | Docker Compose | 容器编排，服务隔离，持久化卷 |

---

## 核心功能

### 1. 技能管理

| 功能 | 说明 |
|------|------|
| **技能列表** | 分页展示所有已发布技能，支持按标签过滤 |
| **技能详情** | 查看技能名称、描述、作者、版本、下载次数等信息 |
| **发布技能** | 上传 ZIP 包，自动解析包内 `skill.md` 文件提取元数据 |
| **版本管理** | 支持为同一技能发布多个版本，标记最新版本 |
| **下载技能** | 按版本下载技能 ZIP 包，自动统计下载次数 |
| **删除技能** | 删除技能及其所有版本、文件和索引数据 |

### 2. 搜索功能

- **全文搜索**：支持按技能名称和描述搜索
- **中英文分词**：英文按空格/前缀匹配，中文按单字匹配
- **结果排序**：按下载次数降序排列

### 3. API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | 技能列表（支持 `page`、`size`、`tag` 参数） |
| POST | `/api/skills` | 发布新技能（`multipart/form-data`） |
| GET | `/api/skills/{slug}` | 技能详情 |
| GET | `/api/skills/{slug}/download` | 下载技能 ZIP |
| POST | `/api/skills/{slug}/versions` | 发布新版本 |
| DELETE | `/api/skills/{slug}` | 删除技能 |
| GET | `/api/search?q=xxx` | 搜索技能 |
| GET | `/health` | 健康检查 |

---

## 部署信息

### 服务器配置

- **项目目录**：`/root/doc-skillhub`
- **Docker 镜像**：
  - `doc-skillhub-nginx`（前端）
  - `doc-skillhub-backend`（后端）
- **持久化卷**：
  - `backend_data` → `/app/data`（JSON 数据库）
  - `backend_storage` → `/app/storage`（技能文件）

### 网络配置

| 层级 | 端口 | 说明 |
|------|------|------|
| 公网入口 | `10143` | 云平台端口转发映射 |
| 服务器监听 | `8088` | Docker 容器端口映射 |
| Docker 内部 | `80` / `8080` | nginx / backend 服务端口 |

### 关键修改记录

1. **PyPI 镜像**：因官方源访问超时，后端 Dockerfile 使用阿里云 PyPI 镜像安装依赖
2. **前端构建修复**：删除有问题的测试文件，调整 `tsconfig.json` 解决编译错误
3. **nginx 启动修复**：修改 `docker-entrypoint.d/30-runtime-config.sh` 兼容只读挂载卷
4. **端口调整**：从 `80` 调整为 `8088`，再通过云平台映射到公网 `10143`

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | FastAPI | >=0.104 |
| ASGI 服务器 | Uvicorn | >=0.24 |
| 数据验证 | Pydantic | >=2.5 |
| 前端框架 | React | ^19.0.0 |
| 构建工具 | Vite | ^6.1.0 |
| 路由 | TanStack Router | ^1.95.0 |
| 状态管理 | Zustand | ^5.0.11 |
| UI 组件 | Radix UI + Tailwind CSS | - |
| 国际化 | i18next + react-i18next | - |
| 容器化 | Docker + Docker Compose | - |

---

## 运维命令

```bash
# 进入项目目录
cd /root/doc-skillhub

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build
```

---

## 当前数据状态

- **技能总数**：11 个
- **数据来源**：`test-skills/` 目录下的 10 个测试技能 + 1 个已有业务技能
