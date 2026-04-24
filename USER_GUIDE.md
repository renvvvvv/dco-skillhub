# SkillHub 使用指南

> 基础地址：`http://211.154.18.252:10143`

---

## 目录

- [上传技能](#1-上传技能)
- [下载技能](#2-下载技能)
- [更新技能](#3-更新技能)
- [API 接口文档](#4-api-接口文档)

---

## 1. 上传技能

### 1.1 准备技能包

技能必须以 ZIP 格式打包，包含以下文件：

```
skill-name/
├── skill.json        # 技能配置（必需）
├── manifest.yaml     # 技能元数据（可选）
├── README.md         # 使用说明（可选）
├── src/              # 源代码目录
└── ...
```

**`skill.json` 示例：**

```json
{
  "name": "智航数据查询",
  "version": "1.0.0",
  "description": "用于连接智航CMDB系统查询测点数据...",
  "entry": "main.py",
  "requirements": []
}
```

### 1.2 上传方式

#### 方式一：Web 界面上传

1. 访问 `http://211.154.18.252:10143`
2. 点击「发布技能」按钮
3. 选择 ZIP 文件并填写信息
4. 提交等待审核

#### 方式二：API 上传

```bash
curl -X POST "http://211.154.18.252:10143/api/skills" \
  -F "skillZip=@/path/to/your-skill.zip" \
  -F "authorName=张三" \
  -F "authorEmail=zhangsan@example.com" \
  -F "authorEmployeeId=10001" \
  -F "authorDepartment=技术部" \
  -F "authorOrganization=互联" \
  -F "version=1.0.0" \
  -F "tag=稳定版" \
  -F "tags=技术开发,数据分析"
```

**Python 示例：**

```python
import requests

url = "http://211.154.18.252:10143/api/skills"

with open("your-skill.zip", "rb") as f:
    files = {"skillZip": ("your-skill.zip", f, "application/zip")}
    data = {
        "authorName": "张三",
        "authorEmail": "zhangsan@example.com",
        "authorEmployeeId": "10001",
        "authorDepartment": "技术部",
        "authorOrganization": "互联",
        "version": "1.0.0",
        "tag": "稳定版",
        "tags": "技术开发,数据分析"
    }

    response = requests.post(url, files=files, data=data)
    print(response.json())
```

**参数说明：**

| 参数 | 必填 | 说明 |
|------|------|------|
| `skillZip` | 是 | 技能 ZIP 包文件 |
| `authorName` | 是 | 作者姓名 |
| `authorEmail` | 否 | 作者邮箱 |
| `authorEmployeeId` | 否 | 作者工号 |
| `authorDepartment` | 否 | 作者部门 |
| `authorOrganization` | 否 | 作者组织 |
| `version` | 否 | 版本号，默认 `1.0.0` |
| `tag` | 否 | 版本标签：`稳定版` 或 `测试版` |
| `tags` | 否 | 技能标签，逗号分隔 |

### 1.3 上传成功响应

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

## 2. 下载技能

### 2.1 Web 界面下载

1. 访问 `http://211.154.18.252:10143`
2. 浏览或搜索技能
3. 点击「下载」按钮

### 2.2 API 下载

#### 下载最新版本

```bash
curl -O "http://211.154.18.252:10143/api/skills/智航数据查询/download"
```

#### 下载指定版本

```bash
curl -O "http://211.154.18.252:10143/api/skills/智航数据查询/download?version=1.1.0"
```

**Python 示例：**

```python
import requests

# 下载最新版本
url = "http://211.154.18.252:10143/api/skills/智航数据查询/download"
response = requests.get(url)

with open("智航数据查询.zip", "wb") as f:
    f.write(response.content)

# 下载指定版本
url_with_version = "http://211.154.18.252:10143/api/skills/智航数据查询/download?version=1.1.0"
```

---

## 3. 更新技能

### 3.1 更新技能信息

更新技能的名称、描述、作者、标签等信息（不涉及文件变更）。

**API：**

```bash
curl -X PUT "http://211.154.18.252:10143/api/skills/智航数据查询" \
  -F "name=智航数据查询" \
  -F "description=更新后的描述..." \
  -F "authorName=邓昊" \
  -F "tags=技术开发,数据分析,运维支撑"
```

### 3.2 发布新版本

当技能代码有变更时，需要上传新版本。

**API：**

```bash
curl -X POST "http://211.154.18.252:10143/api/skills/智航数据查询/versions" \
  -F "skillZip=@/path/to/updated-skill.zip" \
  -F "version=1.1.0" \
  -F "tag=稳定版"
```

**Python 示例：**

```python
import requests

url = "http://211.154.18.252:10143/api/skills/智航数据查询/versions"

with open("updated-skill.zip", "rb") as f:
    files = {"skillZip": ("updated-skill.zip", f, "application/zip")}
    data = {
        "version": "1.1.0",
        "tag": "稳定版"
    }

    response = requests.post(url, files=files, data=data)
    print(response.json())
```

**成功响应：**

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

## 4. API 接口文档

> 所有 API 响应格式统一为 `{ success: boolean, data: any, message?: string }`

### 4.1 技能列表

```
GET /api/skills
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | int | 页码，默认 0 |
| `size` | int | 每页条数，默认 20 |
| `tags` | string | 多标签筛选，逗号分隔 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "智航数据查询",
        "name": "智航数据查询",
        "description": "用于连接智航CMDB系统...",
        "author_name": "邓昊",
        "tags": ["数据分析", "技术开发"],
        "download_count": 5,
        "latest_version": "1.0.0"
      }
    ],
    "totalElements": 21,
    "totalPages": 2
  }
}
```

### 4.2 技能详情

```
GET /api/skills/{slug}
```

获取单个技能的详细信息，包含版本历史。

**路径参数：**

| 参数 | 说明 |
|------|------|
| `slug` | 技能标识符（URL 编码） |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "智航数据查询",
    "name": "智航数据查询",
    "readme_content": "# 智航数据查询...",
    "versions": [
      {
        "version": "1.0.0",
        "tag": "稳定版",
        "storage_path": "storage/智航数据查询/1.0.0/...",
        "file_size": 12345
      }
    ]
  }
}
```

### 4.3 搜索技能

```
GET /api/search?q={keyword}
```

**查询参数：**

| 参数 | 必填 | 说明 |
|------|------|------|
| `q` | 是 | 搜索关键词，最少 1 个字符 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 3
  }
}
```

### 4.4 发布技能

```
POST /api/skills
```

**Content-Type：** `multipart/form-data`

### 4.5 更新技能信息

```
PUT /api/skills/{slug}
```

**Content-Type：** `multipart/form-data`

### 4.6 发布新版本

```
POST /api/skills/{slug}/versions
```

**Content-Type：** `multipart/form-data`

### 4.7 删除技能

```
DELETE /api/skills/{slug}
```

**响应示例：**

```json
{
  "success": true,
  "message": "Skill deleted"
}
```

### 4.8 下载技能

```
GET /api/skills/{slug}/download?version={version}
```

- 不传 `version` 时下载最新版本
- 返回 `application/zip` 文件流

### 4.9 导出技能列表（管理员）

```
POST /api/skills/export
```

需要管理员密码鉴权。

**请求参数：**

| 参数 | 必填 | 说明 |
|------|------|------|
| `password` | 是 | 管理员密码 |

**当前密码：** `test-key-for-dev-2026`

**cURL 示例：**

```bash
curl -X POST "http://211.154.18.252:10143/api/skills/export" \
  -F "password=test-key-for-dev-2026"
```

### 4.10 健康检查

```
GET /health
```

**响应示例：**

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## 附录：常用示例

### 批量上传技能

```python
import requests
from pathlib import Path

API_BASE = "http://211.154.18.252:10143"

def upload_all(zip_dir: Path):
    for zip_file in zip_dir.glob("*.zip"):
        with open(zip_file, "rb") as f:
            files = {"skillZip": (zip_file.name, f, "application/zip")}
            data = {"authorName": "系统管理员", "version": "1.0.0"}
            requests.post(f"{API_BASE}/skills", files=files, data=data)

upload_all(Path("/path/to/skills"))
```

### 获取所有技能摘要

```python
import requests

response = requests.get("http://211.154.18.252:10143/api/skills-summary")
for skill in response.json()["data"]:
    print(f"- {skill['name']}: {skill['description']}")
    print(f"  下载: {skill['downloadUrl']}")
```
