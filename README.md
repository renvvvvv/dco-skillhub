# DC Skill Market

轻量级技能市场，基于 SkillHub 精简实现。

## 特性

- **单端口部署**：仅使用 80 端口
- **轻量级**：内存占用 < 200MB
- **零数据库**：使用 JSON 文件存储
- **技能管理**：发布、版本管理、搜索、下载

## 快速开始

```bash
# 启动服务
docker-compose up -d

# 访问
open http://localhost
```

## 项目结构

```
dc-skill-market/
├── backend/          # Python FastAPI 后端
├── frontend/         # React 前端
├── docker-compose.yml
└── nginx.conf
```

## 开发

### 后端开发

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/skills | 技能列表 |
| POST | /api/skills | 发布技能 |
| GET | /api/skills/{slug} | 技能详情 |
| GET | /api/skills/{slug}/download | 下载技能 |
| GET | /api/search | 搜索技能 |

## 技术栈

- **后端**: Python 3.11 + FastAPI
- **前端**: React 18 + TypeScript + Vite
- **部署**: Docker + Docker Compose
