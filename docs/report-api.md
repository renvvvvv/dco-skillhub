# 日报/周报 API 开发文档

## 接口概览

| 接口 | 方法 | 路径 | 鉴权 |
|------|------|------|------|
| 获取日报 | GET | `/api/reports/daily` | Bearer Token |
| 获取周报 | GET | `/api/reports/weekly` | Bearer Token |
| 手动发送日报 | POST | `/api/admin/send-daily-report` | Admin Token |
| 手动发送周报 | POST | `/api/admin/send-weekly-report` | Admin Token |

---

## 1. 获取日报

### 请求

```http
GET /api/reports/daily
Authorization: Bearer test-key-for-dev-2026
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "date": "2026-05-13",
    "summary": {
      "total_skills": 61,
      "total_views": 230,
      "total_downloads": 138,
      "total_publishes": 58
    },
    "yesterday": {
      "views": 30,
      "downloads": 23,
      "publishes": 1,
      "searches": 7,
      "unique_users": 1
    },
    "this_week": {
      "skills_total": 8,
      "downloads": 42,
      "views": 79,
      "publishes": 8,
      "searches": 8,
      "unique_users": 3
    },
    "week_over_week": {
      "views": {
        "value": "+52",
        "arrow": "⬆️",
        "pct": 192.6,
        "is_up": true
      },
      "downloads": {
        "value": "+30",
        "arrow": "⬆️",
        "pct": 250.0,
        "is_up": true
      },
      "publishes": {
        "value": "+1",
        "arrow": "⬆️",
        "pct": 14.3,
        "is_up": true
      },
      "searches": {
        "value": "-54",
        "arrow": "⬇️",
        "pct": -87.1,
        "is_up": false
      }
    },
    "top_skills": [
      {
        "name": "智航测点ID查询",
        "slug": "智航测点id查询",
        "downloads": 45,
        "views": 30,
        "author": "马秋月"
      }
    ]
  }
}
```

### 字段说明

#### summary（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| `total_skills` | int | 技能总量（所有Skill数量） |
| `total_views` | int | 总访问量（所有Skill浏览量之和） |
| `total_downloads` | int | 总下载量（所有Skill下载量之和） |
| `total_publishes` | int | 总发布量（状态为approved的Skill数量） |

#### yesterday

| 字段 | 类型 | 说明 |
|------|------|------|
| `views` | int | 昨日浏览量 |
| `downloads` | int | 昨日下载量 |
| `publishes` | int | 昨日发布量 |
| `searches` | int | 昨日搜索次数 |
| `unique_users` | int | 昨日独立用户数 |

#### this_week

| 字段 | 类型 | 说明 |
|------|------|------|
| `skills_total` | int | 本周新增Skill数 |
| `downloads` | int | 本周下载量 |
| `views` | int | 本周浏览量 |
| `publishes` | int | 本周发布量 |
| `searches` | int | 本周搜索次数 |
| `unique_users` | int | 本周独立用户数 |

#### week_over_week

| 字段 | 类型 | 说明 |
|------|------|------|
| `value` | string | 环比变化值（带正负号） |
| `arrow` | string | 趋势箭头（⬆️/⬇️/➖） |
| `pct` | float | 环比百分比 |
| `is_up` | bool | 是否上升 |

---

## 2. 获取周报

### 请求

```http
GET /api/reports/weekly
Authorization: Bearer test-key-for-dev-2026
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "week_range": "2026-05-05 ~ 2026-05-11",
    "summary": {
      "total_skills": 61,
      "total_views": 230,
      "total_downloads": 138,
      "total_publishes": 58
    },
    "this_week": {
      "skills_total": 8,
      "downloads": 42,
      "views": 79,
      "publishes": 8,
      "searches": 8,
      "unique_users": 3
    },
    "last_week": {
      "skills_total": 7,
      "downloads": 12,
      "views": 27,
      "publishes": 7,
      "searches": 62,
      "unique_users": 2
    },
    "week_over_week": {
      "views": {
        "value": "+52",
        "arrow": "⬆️",
        "pct": 192.6,
        "is_up": true
      },
      "downloads": {
        "value": "+30",
        "arrow": "⬆️",
        "pct": 250.0,
        "is_up": true
      },
      "publishes": {
        "value": "+1",
        "arrow": "⬆️",
        "pct": 14.3,
        "is_up": true
      },
      "searches": {
        "value": "-54",
        "arrow": "⬇️",
        "pct": -87.1,
        "is_up": false
      }
    },
    "top_departments": [
      {
        "name": "数智中心",
        "publishes": 15,
        "downloads": 89,
        "views": 156,
        "composite_score": 66.2
      }
    ],
    "top_skills": [
      {
        "name": "马秋月",
        "publishes": 5,
        "downloads": 67,
        "views": 98,
        "department": "数智中心",
        "composite_score": 48.4
      }
    ],
    "data_quality": {
      "view_dedup_rate": 80.0,
      "download_conversion": 53.2,
      "search_valid_rate": 85.0,
      "total_views": 79,
      "unique_views": 63,
      "valid_searches": 7
    },
    "metric_standards": {
      "views": {
        "standard": "去重IP/日",
        "formula": "count(distinct ip, date)"
      },
      "downloads": {
        "standard": "每次下载计1次",
        "formula": "count(download_event)"
      },
      "publishes": {
        "standard": "审核通过技能",
        "formula": "count(status='approved')"
      },
      "searches": {
        "standard": "每次搜索计1次",
        "formula": "count(search_event)"
      },
      "users": {
        "standard": "有操作行为用户",
        "formula": "count(distinct user)"
      }
    }
  }
}
```

### 字段说明

#### summary（新增）

与日报相同，包含全量统计数据。

#### this_week / last_week

| 字段 | 类型 | 说明 |
|------|------|------|
| `skills_total` | int | 该周新增Skill数 |
| `downloads` | int | 该周下载量 |
| `views` | int | 该周浏览量 |
| `publishes` | int | 该周发布量 |
| `searches` | int | 该周搜索次数 |
| `unique_users` | int | 该周独立用户数 |

#### top_departments

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 部门名称 |
| `publishes` | int | 发布Skill数 |
| `downloads` | int | 下载量 |
| `views` | int | 浏览量 |
| `composite_score` | float | 综合评分（发布量*0.3 + 下载量*0.7） |

#### top_skills

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 作者姓名 |
| `publishes` | int | 发布Skill数 |
| `downloads` | int | 下载量 |
| `views` | int | 浏览量 |
| `department` | string | 所属部门 |
| `composite_score` | float | 综合评分 |

#### data_quality

| 字段 | 类型 | 说明 |
|------|------|------|
| `view_dedup_rate` | float | 浏览去重率(%) |
| `download_conversion` | float | 下载转化率(%) |
| `search_valid_rate` | float | 搜索有效率(%) |
| `total_views` | int | 总浏览量 |
| `unique_views` | int | 去重浏览量 |
| `valid_searches` | int | 有效搜索数 |

---

## 3. 手动发送日报

### 请求

```http
POST /api/admin/send-daily-report
Authorization: Bearer admin
```

### 响应

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "success",
    "sent_at": "2026-05-13T10:30:00",
    "message_type": "daily_report"
  }
}
```

---

## 4. 手动发送周报

### 请求

```http
POST /api/admin/send-weekly-report
Authorization: Bearer admin
```

### 响应

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "success",
    "sent_at": "2026-05-13T10:30:00",
    "message_type": "weekly_report"
  }
}
```

---

## 日志记录

所有报告生成和发送操作都会记录到新的日志库（`user_activity_logs.json`）：

### 日志类型

| activity_type | 说明 |
|--------------|------|
| `daily_report_generated` | 日报生成 |
| `weekly_report_generated` | 周报生成 |
| `daily_report_sent` | 日报发送 |
| `weekly_report_sent` | 周报发送 |

### 日志内容

```json
{
  "id": "uuid",
  "activity_type": "daily_report_generated",
  "user_id": "system",
  "skill_id": null,
  "details": {
    "report_type": "daily",
    "date": "2026-05-13",
    "summary": {
      "total_skills": 61,
      "total_views": 230,
      "total_downloads": 138,
      "total_publishes": 58
    }
  },
  "ip": null,
  "timestamp": "2026-05-13T10:30:00"
}
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权（Token无效） |
| 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "message": "生成日报失败: [错误详情]"
}
```
