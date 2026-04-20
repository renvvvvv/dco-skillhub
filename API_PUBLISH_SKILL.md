# 发布技能接口文档

## 接口信息

| 项目 | 内容 |
|------|------|
| **接口名称** | 发布新技能 |
| **请求方法** | `POST` |
| **请求路径** | `/api/skills` |
| **Content-Type** | `multipart/form-data` |
| **接口说明** | 上传技能 ZIP 包，系统自动解析包内 `skill.md` 文件提取技能元数据，并创建技能记录 |

---

## 请求参数

### 文件参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `skillZip` | File | **是** | 技能压缩包，必须为 `.zip` 格式，大小不超过 100MB |

### 表单参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `authorName` | string | **是** | - | 作者姓名 |
| `authorEmail` | string | 否 | `""` | 作者邮箱 |
| `version` | string | 否 | `"1.0.0"` | 技能版本号 |
| `tag` | string | 否 | `"stable"` | 版本标签，如 `stable`、`beta`、`alpha` |
| `authorEmployeeId` | string | 否 | `""` | 作者工号 |
| `authorDepartment` | string | 否 | `""` | 作者部门 |
| `authorOrganization` | string | 否 | `""` | 作者组织/公司 |

---

## ZIP 包规范

ZIP 包内必须包含一个 `skill.md` 文件（不区分大小写），系统会从中提取技能信息。

### skill.md 推荐格式

```markdown
---
name: "技能名称"
description: "技能的简短描述"
---

# 技能名称

这里是技能的详细说明文档，支持 Markdown 格式。
```

### 解析规则

1. 如果包含 YAML frontmatter（`---` 包裹的头部），系统会解析 `name` 和 `description` 字段
2. 如果没有 YAML frontmatter，第一行作为名称，后续内容作为描述
3. 描述字段最多保留 200 个字符

---

## 响应结果

### 成功响应 (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "skill-slug",
    "name": "技能名称",
    "slug": "skill-slug",
    "version": "1.0.0",
    "downloadUrl": "/api/skills/skill-slug/download"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `data.id` | string | 技能唯一标识（同 slug） |
| `data.name` | string | 技能名称 |
| `data.slug` | string | URL 友好的技能标识 |
| `data.version` | string | 版本号 |
| `data.downloadUrl` | string | 技能下载接口路径 |

---

### 错误响应

#### 400 Bad Request - 文件类型错误

```json
{
  "detail": "Only ZIP files allowed"
}
```

#### 400 Bad Request - 文件过大

```json
{
  "detail": "File too large"
}
```

#### 400 Bad Request - ZIP 中未找到 skill.md

```json
{
  "detail": "ZIP 中未找到 skill.md 文件"
}
```

#### 409 Conflict - 技能已存在

```json
{
  "detail": "Skill already exists"
}
```

#### 422 Validation Error - 参数校验失败

```json
{
  "detail": [...],
  "message": "Validation failed"
}
```

---

## 请求示例

### cURL

```bash
curl -X POST "http://211.154.18.252:10143/api/skills" \
  -F "skillZip=@/path/to/your-skill.zip" \
  -F "authorName=张三" \
  -F "authorEmail=zhangsan@example.com" \
  -F "version=1.0.0" \
  -F "tag=stable" \
  -F "authorEmployeeId=10086" \
  -F "authorDepartment=技术部" \
  -F "authorOrganization=智航科技"
```

### Python (requests)

```python
import requests

url = "http://211.154.18.252:10143/api/skills"

files = {
    "skillZip": ("your-skill.zip", open("your-skill.zip", "rb"), "application/zip")
}

data = {
    "authorName": "张三",
    "authorEmail": "zhangsan@example.com",
    "version": "1.0.0",
    "tag": "stable",
    "authorEmployeeId": "10086",
    "authorDepartment": "技术部",
    "authorOrganization": "智航科技"
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

### JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append("skillZip", fileInput.files[0]);
formData.append("authorName", "张三");
formData.append("authorEmail", "zhangsan@example.com");
formData.append("version", "1.0.0");
formData.append("tag", "stable");

fetch("http://211.154.18.252:10143/api/skills", {
  method: "POST",
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 注意事项

1. **文件格式**：仅接受 `.zip` 文件，其他格式会返回 400 错误
2. **文件大小**：单个文件最大支持 **100MB**
3. **重复发布**：同一 `slug`（由技能名称生成）的技能不能重复创建，会返回 409 错误
4. **slug 生成规则**：名称转小写 → 移除特殊字符 → 空格替换为 `-`
   - 例：`"Web Search"` → `"web-search"`
   - 例：`"智航数据查询"` → `"智航数据查询"`
