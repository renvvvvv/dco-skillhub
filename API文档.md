# SkillHub Lite API 文档

> 基础地址：`http://211.154.18.252:10143`
> 所有 API 响应格式统一为 `{ success: boolean, data: any, message?: string }`

---

## 1. 技能列表

### `GET /api/skills`
获取技能列表，支持分页和标签筛选。

#### Query 参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 0 |
| size | int | 否 | 每页条数，默认 20 |
| tag | string | 否 | 旧版单标签筛选（基于版本标签） |
| tags | string | 否 | 多标签筛选，逗号分隔，如 `技术开发,数据分析` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "智航数据查询",
        "name": "智航数据查询",
        "slug": "智航数据查询",
        "description": "用于连接智航CMDB系统...",
        "author_name": "邓昊",
        "author_email": "",
        "author_employee_id": "19382",
        "author_department": "数智中心",
        "author_organization": "互联",
        "tags": ["数据分析", "技术开发"],
        "download_count": 5,
        "latest_version": "1.0.0",
        "created_at": "2026-04-17T03:36:00.893605",
        "updated_at": "2026-04-17T06:48:18.142532"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

## 2. 技能详情

### `GET /api/skills/{slug}`
获取单个技能的详细信息，包含版本历史。

#### 路径参数
| 参数 | 类型 | 说明 |
|------|------|------|
| slug | string | 技能标识符 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "智航数据查询",
    "name": "智航数据查询",
    "slug": "智航数据查询",
    "description": "...",
    "readme_content": "# 智航数据查询 Skill...",
    "author_name": "邓昊",
    "tags": ["数据分析"],
    "download_count": 5,
    "latest_version": "1.0.0",
    "created_at": "...",
    "updated_at": "...",
    "versions": [
      {
        "id": "智航数据查询-1.0.0",
        "skill_id": "智航数据查询",
        "version": "1.0.0",
        "tag": "稳定版",
        "is_latest": true,
        "storage_path": "storage/智航数据查询/1.0.0/智航数据查询-1.0.0.zip",
        "file_size": 12345,
        "file_hash": "...",
        "created_at": "..."
      }
    ]
  }
}
```

---

## 3. 搜索技能

### `GET /api/search?q={keyword}`
全文搜索技能名称、描述和作者。

#### Query 参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词，最少 1 个字符 |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 3
  }
}
```

---

## 4. 发布技能

### `POST /api/skills`
发布一个新技能，同时上传 ZIP 包。

#### Content-Type
`multipart/form-data`

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillZip | file | 是 | 技能 ZIP 包 |
| authorName | string | 是 | 作者名称 |
| authorEmail | string | 否 | 作者邮箱 |
| version | string | 否 | 版本号，默认 `1.0.0` |
| tag | string | 否 | 版本标签，`稳定版` 或 `测试版` |
| authorEmployeeId | string | 否 | 作者工号 |
| authorDepartment | string | 否 | 作者部门 |
| authorOrganization | string | 否 | 作者组织 |
| tags | string | 否 | 技能标签，逗号分隔，如 `技术开发,数据分析` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "智航数据查询",
    "name": "智航数据查询",
    "slug": "智航数据查询",
    "version": "1.0.0",
    "downloadUrl": "/api/skills/智航数据查询/download"
  }
}
```

---

## 5. 更新技能信息

### `PUT /api/skills/{slug}`
更新技能的基本信息（名称、描述、作者、标签等）。

#### Content-Type
`multipart/form-data`

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 技能名称 |
| description | string | 否 | 技能简介 |
| authorName | string | 是 | 作者名称 |
| authorEmail | string | 否 | 作者邮箱 |
| authorEmployeeId | string | 否 | 作者工号 |
| authorDepartment | string | 否 | 作者部门 |
| authorOrganization | string | 否 | 作者组织 |
| tags | string | 否 | 技能标签，逗号分隔 |

#### 响应示例
```json
{
  "success": true,
  "message": "Skill updated"
}
```

---

## 6. 发布新版本

### `POST /api/skills/{slug}/versions`
为已有技能上传新版本 ZIP 包。

#### Content-Type
`multipart/form-data`

#### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillZip | file | 是 | 新版本 ZIP 包 |
| version | string | 是 | 新版本号 |
| tag | string | 否 | 版本标签，默认 `stable` |

#### 响应示例
```json
{
  "success": true,
  "data": {
    "skillId": "智航数据查询",
    "version": "1.1.0",
    "tag": "稳定版",
    "downloadUrl": "/api/skills/智航数据查询/download?version=1.1.0"
  }
}
```

---

## 7. 删除技能

### `DELETE /api/skills/{slug}`
删除技能及其所有版本文件。

#### 响应示例
```json
{
  "success": true,
  "message": "Skill deleted"
}
```

---

## 8. 下载技能

### `GET /api/skills/{slug}/download?version={version}`
下载技能 ZIP 包。若不传 `version`，则下载最新版本。

#### 响应
返回 `application/zip` 文件流，触发浏览器下载。

---

## 9. 技能摘要列表

### `GET /api/skills-summary`
返回所有技能的精简信息（名称、简介、下载链接、开发人）。

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "name": "智航数据查询",
      "description": "用于连接智航CMDB系统查询测点数据...",
      "downloadUrl": "/api/skills/智航数据查询/download",
      "developer": "邓昊"
    }
  ]
}
```

---

## 10. 健康检查

### `GET /health`
服务健康检查。

#### 响应示例
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```
