# 周报SVG模板目录

## 目录结构

```
backend/app/templates/weekly_report/
├── template.svg          # 原始SVG模板文件
├── template.svg.bak      # 模板备份
└── README.md            # 本文件

backend/storage/weekly_svg/
├── weekly_2026-05-11.svg  # 生成的周报SVG
├── weekly_2026-05-04.svg
└── ...
```

## 使用流程

1. **放置模板**
   - 将周报SVG模板文件放入 `backend/app/templates/weekly_report/template.svg`
   - 模板中使用占位符如 `{{skills_total}}`、`{{downloads}}` 等

2. **生成周报**
   - 后端读取模板文件
   - 替换占位符为实际数据
   - 输出到 `backend/storage/weekly_svg/weekly_YYYY-MM-DD.svg`

3. **转换为PNG**
   - 使用 `cairosvg` 或 `inkscape` 转换
   - 命令: `cairosvg input.svg -o output.png`

4. **发送到飞书**
   - 通过Webhook发送PNG图片到内部/外部群

## 占位符说明

模板中支持以下占位符：

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{{week_range}}` | 周范围 | 2026-05-04 ~ 2026-05-10 |
| `{{skills_total}}` | 新增Skill数 | 7 |
| `{{downloads}}` | 下载次数 | 12 |
| `{{views}}` | 浏览次数 | 27 |
| `{{publishes}}` | 发布次数 | 7 |
| `{{searches}}` | 搜索次数 | 62 |
| `{{unique_users}}` | 活跃用户数 | 3 |
| `{{total_skills}}` | 技能总量 | 62 |
| `{{total_views}}` | 总访问量 | 239 |
| `{{total_downloads}}` | 总下载量 | 150 |
| `{{department_1_name}}` | Top1部门名 | 数智中心 |
| `{{department_1_score}}` | Top1部门评分 | 108.6 |
| `{{skill_1_name}}` | Top1技能名 | 智航数据查询 |
| `{{skill_1_author}}` | Top1技能作者 | 邓昊 |

## API接口

### 生成周报SVG
```bash
POST /api/admin/generate-weekly-svg
Authorization: Bearer {token}
Content-Type: application/json

{
  "week_type": "current"  // current 本周 | last 上周
}
```

### 下载周报PNG
```bash
GET /api/admin/weekly-report-png?week=2026-05-04
Authorization: Bearer {token}
```

## 依赖安装

```bash
pip install cairosvg pillow
```

## 注意事项

1. 模板文件必须是有效的SVG格式
2. 占位符使用双大括号 `{{}}` 包裹
3. 中文字体需要确保服务器已安装（如思源黑体）
4. 生成的PNG建议宽度 800-1200px，适合飞书卡片展示
