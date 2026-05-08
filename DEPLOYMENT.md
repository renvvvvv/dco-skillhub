# SkillHub 部署指南

## 快速开始

```bash
# 启动服务
docker-compose up -d

# 访问
open http://localhost:8088
```

## 定时任务配置

### 方案一：Docker 部署（推荐）

Docker 部署时，定时任务已集成在后端服务中：

- **每日 00:05**: 自动聚合前一日事件数据
- **每小时 00 分**: 维护任务（清理过期文件 + 聚合今日数据）
- **启动时**: 自动补全所有缺失的历史聚合数据

无需额外配置。

### 方案二：宿主机部署

如需在宿主机上运行定时任务：

```bash
# 安装 systemd 定时器
sudo bash scripts/setup-scheduler.sh

# 查看定时器状态
systemctl list-timers skillhub-*

# 手动触发日聚合
systemctl start skillhub-daily

# 查看日志
journalctl -u skillhub-daily -f
```

### 方案三：手动执行

```bash
# 查看聚合状态
python3 scripts/aggregate.py --status

# 聚合今日数据
python3 scripts/aggregate.py --today

# 聚合指定日期
python3 scripts/aggregate.py --date 2026-05-01

# 补全所有缺失数据
python3 scripts/aggregate.py --backfill

# 清理90天前的事件文件
python3 scripts/aggregate.py --cleanup
```

## 调度器管理 API

```bash
# 查看调度器状态
GET /api/scheduler/status

# 手动触发任务
POST /api/scheduler/trigger
Content-Type: application/x-www-form-urlencoded

job_id=aggregate_yesterday
```

## 数据保留策略

| 数据类型 | 保留时间 | 清理方式 |
|---------|---------|---------|
| 事件明细 | 90天 | 每小时自动清理 |
| 日聚合指标 | 永久 | 手动清理 |
| 审计日志 | 30天 | 应用内自动清理 |
| IP访问记录 | 7天 | 应用内自动清理 |

## 故障排查

```bash
# 检查后端日志
docker-compose logs -f backend

# 检查定时任务状态
curl http://localhost:8088/api/scheduler/status

# 手动触发聚合
curl -X POST http://localhost:8088/api/stats/aggregate

# 检查事件文件
ls -la backend/data/events/

# 检查聚合数据
cat backend/data/metrics_daily.json | python3 -m json.tool
```
