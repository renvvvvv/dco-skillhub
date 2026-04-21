# 导出技能列表接口文档

## 接口信息

| 项目 | 内容 |
|------|------|
| **接口名称** | 导出所有技能详细信息 |
| **请求方法** | `POST` |
| **请求路径** | `/api/skills/export` |
| **Content-Type** | `multipart/form-data` |
| **接口说明** | 导出库中所有技能的完整信息，包含人员、工号、部门、下载链接等，需要管理员密码鉴权 |

---

## 请求参数

### 表单参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `password` | string | **是** | 管理员密码 |

---

## 请求示例

### cURL

```bash
curl -X POST "http://211.154.18.252:10143/api/skills/export" \
  -F "password=test-key-for-dev-2026"
```

### Python (requests)

```python
import requests

url = "http://211.154.18.252:10143/api/skills/export"

data = {
    "password": "test-key-for-dev-2026"
}

response = requests.post(url, data=data)
print(response.json())
```

### JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append("password", "test-key-for-dev-2026");

fetch("http://211.154.18.252:10143/api/skills/export", {
  method: "POST",
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 响应结果

### 成功响应 (200 OK)

**请求体：**
```http
POST /api/skills/export HTTP/1.1
Host: 211.154.18.252:10143
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="password"

test-key-for-dev-2026
------WebKitFormBoundary--
```

**响应体：**
```json
{
  "success": true,
  "data": [
    {
      "name": "智航数据查询",
      "slug": "智航数据查询",
      "description": "用于连接智航CMDB系统查询测点数据、设备实例、历史数据等。支持内网和外网两种访问方式，提供8个核心API接口的调用封装。",
      "author_name": "邓昊",
      "author_employee_id": "19382",
      "author_department": "数智中心",
      "author_organization": "互联",
      "downloadUrl": "/api/skills/智航数据查询/download",
      "latest_version": "1.0.0",
      "download_count": 0,
      "tags": ["技术开发", "数据分析", "运维支撑"],
      "status": "approved",
      "created_at": "2026-04-21T01:58:44.710250"
    }
  ],
  "total": 21
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 请求是否成功 |
| `data` | array | 技能列表 |
| `data[].name` | string | 技能名称 |
| `data[].slug` | string | 技能标识符 |
| `data[].description` | string | 技能简介 |
| `data[].author_name` | string | 作者姓名 |
| `data[].author_employee_id` | string | 作者工号 |
| `data[].author_department` | string | 作者部门 |
| `data[].author_organization` | string | 作者组织 |
| `data[].downloadUrl` | string | 下载链接 |
| `data[].latest_version` | string | 最新版本号 |
| `data[].download_count` | int | 下载次数 |
| `data[].tags` | array | 技能标签 |
| `data[].status` | string | 状态：approved/pending/rejected |
| `data[].created_at` | string | 创建时间 |
| `total` | int | 技能总数 |

---

### 错误响应

#### 401 Unauthorized - 密码错误

**请求体：**
```http
POST /api/skills/export HTTP/1.1
Content-Type: multipart/form-data

password=wrong-password
```

**响应体：**
```json
{
  "detail": "密码错误"
}
```

#### 422 Validation Error - 参数缺失

**请求体：**
```http
POST /api/skills/export HTTP/1.1
Content-Type: multipart/form-data

（空，未传password参数）
```

**响应体：**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "password"],
      "msg": "Field required",
      "input": null
    }
  ],
  "message": "Validation failed"
}
```

---

## 注意事项

1. **请求方法**：必须使用 `POST`，使用 `GET` 会被路由到技能详情接口，返回 `{"detail":"Skill not found"}`
2. **密码安全**：密码通过 `FormData` 明文传输，建议在生产环境使用 HTTPS
3. **当前密码**：`test-key-for-dev-2026`
4. **数据量**：当前库中共有 21 个技能
