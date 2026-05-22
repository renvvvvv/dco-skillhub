import { useState } from 'react'
import { StandardDocument, SkillTemplate, ChecklistItem } from './quickstart-api'

interface StandardDocumentsProps {
  documents: StandardDocument[]
  templates: SkillTemplate[]
}

export function StandardDocuments({ templates }: StandardDocumentsProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'docs' | 'templates' | 'workflow'>('docs')
  const [expandedSpec, setExpandedSpec] = useState<string | null>(null)

  const toggleChecklistItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
  }

  const getChecklistProgress = (items: ChecklistItem[]) => {
    const checked = items.filter(item => checkedItems.has(item.id)).length
    return Math.round((checked / items.length) * 100)
  }

  // 开发流程图数据
  const workflowSteps = [
    { id: '1', title: '需求分析', desc: '明确Skill功能定位与目标用户', icon: '📋', color: '#0033CC' },
    { id: '2', title: '架构设计', desc: '设计Skill整体架构与接口', icon: '🏗️', color: '#0066FF' },
    { id: '3', title: '代码开发', desc: '按规范编写核心功能代码', icon: '💻', color: '#00CC66' },
    { id: '4', title: '文档编写', desc: '完善README和API文档', icon: '📝', color: '#FF9900' },
    { id: '5', title: '质量检查', desc: '代码审查、测试与优化', icon: '🔍', color: '#FF3366' },
    { id: '6', title: '提交审核', desc: '提交管理员审核并发布', icon: '🚀', color: '#9933CC' },
  ]

  // 目录结构示例
  const directoryStructure = `skill-name/
├── README.md              # 项目说明文档
├── skill.json             # Skill元数据配置
├── CHANGELOG.md           # 更新日志
├── src/
│   ├── __init__.py
│   ├── main.py            # 入口文件
│   ├── core/              # 核心逻辑
│   ├── utils/             # 工具函数
│   └── config.py          # 配置文件
├── tests/
│   ├── __init__.py
│   ├── test_main.py       # 单元测试
│   └── conftest.py        # 测试配置
├── docs/
│   ├── api.md             # API文档
│   └── guide.md           # 使用指南
└── requirements.txt       # 依赖清单`

  // Skill开发规范详细内容
  const specDetails = [
    {
      id: 'naming',
      title: '命名规范',
      icon: '🏷️',
      color: '#0033CC',
      content: [
        {
          subtitle: 'Skill名称',
          text: '使用小写字母+连字符，如 data-processor、api-gateway-monitor',
          example: '✅ 正确: network-diagnostic-tool\n❌ 错误: NetworkDiagnosticTool、network_diagnostic'
        },
        {
          subtitle: 'Python文件',
          text: '使用snake_case命名，如 main.py、config_loader.py',
          example: '✅ 正确: data_parser.py\n❌ 错误: DataParser.py、data-parser.py'
        },
        {
          subtitle: '类名',
          text: '使用PascalCase命名，如 DataProcessor、ApiGatewayMonitor',
          example: '✅ 正确: NetworkDiagnosticTool\n❌ 错误: network_diagnostic_tool'
        },
        {
          subtitle: '函数与变量',
          text: '使用snake_case命名，如 process_data、get_config',
          example: '✅ 正确: parse_network_config()\n❌ 错误: ParseNetworkConfig()、parseNetworkConfig()'
        },
        {
          subtitle: '常量',
          text: '使用UPPER_SNAKE_CASE命名，如 MAX_RETRY_COUNT、DEFAULT_TIMEOUT',
          example: '✅ 正确: MAX_CONNECTION_TIMEOUT = 30\n❌ 错误: maxConnectionTimeout = 30'
        }
      ]
    },
    {
      id: 'structure',
      title: '目录结构',
      icon: '📁',
      color: '#0066FF',
      content: [
        {
          subtitle: '标准目录树',
          text: '每个Skill必须遵循标准目录结构，确保一致性和可维护性',
          example: directoryStructure
        },
        {
          subtitle: '必需文件说明',
          text: '以下文件为必须包含，缺失将导致审核不通过',
          example: 'README.md    - 项目说明、安装指南、使用示例\nskill.json   - Skill元数据（名称、版本、作者等）\nsrc/main.py  - 入口文件，包含主逻辑'
        },
        {
          subtitle: '推荐目录',
          text: '建议包含以下目录以提升代码质量',
          example: 'tests/       - 单元测试（覆盖率≥80%）\ndocs/        - 补充文档（API说明、架构图）\nexamples/    - 使用示例代码'
        }
      ]
    },
    {
      id: 'code',
      title: '代码规范',
      icon: '💻',
      color: '#00CC66',
      content: [
        {
          subtitle: 'Python版本',
          text: '使用Python 3.8+，充分利用类型注解和现代化特性',
          example: 'python_requires = ">=3.8"\n# 推荐使用 Python 3.10+ 的 match-case 语法'
        },
        {
          subtitle: '类型注解',
          text: '所有函数参数和返回值必须添加类型注解',
          example: 'def process_data(data: dict[str, Any], timeout: int = 30) -> Result:\n    """处理数据并返回结果"""\n    ...'
        },
        {
          subtitle: '异常处理',
          text: '使用try-except捕获异常，提供有意义的错误信息',
          example: 'try:\n    result = api.call()\nexcept ConnectionError as e:\n    logger.error(f"API连接失败: {e}")\n    raise SkillException(f"无法连接到服务: {e}") from e'
        },
        {
          subtitle: '日志规范',
          text: '使用标准logging模块，分级记录',
          example: 'import logging\n\nlogger = logging.getLogger(__name__)\n\nlogger.debug("调试信息")\nlogger.info("处理完成")\nlogger.warning("参数缺失，使用默认值")\nlogger.error("处理失败")'
        },
        {
          subtitle: '代码质量',
          text: '通过pylint/flake8检查，评分≥8.5',
          example: '# .pylintrc 推荐配置\n[MESSAGES CONTROL]\ndisable=C0103,R0903\n\n# 运行检查\npylint src/ --rcfile=.pylintrc\nflake8 src/ --max-line-length=100'
        }
      ]
    },
    {
      id: 'document',
      title: '文档规范',
      icon: '📝',
      color: '#FF9900',
      content: [
        {
          subtitle: 'README.md 必需内容',
          text: 'README必须包含以下章节',
          example: '## 1. 功能简介\n## 2. 安装指南\n## 3. 快速开始\n## 4. API文档\n## 5. 配置说明\n## 6. 示例代码\n## 7. 更新日志'
        },
        {
          subtitle: 'skill.json 配置',
          text: '元数据文件必须包含完整信息',
          example: '{\n  "name": "data-processor",\n  "version": "1.2.3",\n  "description": "数据处理工具",\n  "author": "张三",\n  "tags": ["data", "processing"],\n  "python_version": ">=3.8",\n  "dependencies": ["pandas", "numpy"]\n}'
        },
        {
          subtitle: '函数文档',
          text: '所有公共函数必须包含docstring',
          example: 'def process_data(data: dict, options: dict = None) -> Result:\n    """\n    处理输入数据并返回结果\n    \n    Args:\n        data: 输入数据字典\n        options: 处理选项（可选）\n        \n    Returns:\n        Result: 处理结果对象\n        \n    Raises:\n        ValueError: 数据格式错误\n        ConnectionError: 网络连接失败\n    """\n    ...'
        }
      ]
    },
    {
      id: 'test',
      title: '测试规范',
      icon: '✅',
      color: '#FF3366',
      content: [
        {
          subtitle: '测试覆盖率',
          text: '单元测试覆盖率必须≥80%',
          example: '# 运行测试并生成覆盖率报告\npytest tests/ --cov=src --cov-report=html\n\n# 查看覆盖率\nopen htmlcov/index.html'
        },
        {
          subtitle: '测试结构',
          text: '使用pytest框架，按功能模块组织测试',
          example: 'tests/\n├── __init__.py\n├── conftest.py          # 共享fixture\n├── test_main.py         # 主逻辑测试\n├── test_core/           # 核心模块测试\n│   ├── __init__.py\n│   ├── test_parser.py\n│   └── test_validator.py\n└── test_utils/          # 工具函数测试\n    ├── __init__.py\n    └── test_helpers.py'
        },
        {
          subtitle: '测试用例规范',
          text: '每个测试函数只测试一个功能点',
          example: 'def test_process_data_with_valid_input():\n    """测试正常数据处理"""\n    data = {"key": "value"}\n    result = process_data(data)\n    assert result.status == "success"\n    assert result.data is not None\n\ndef test_process_data_with_invalid_input():\n    """测试异常数据处理"""\n    with pytest.raises(ValueError):\n        process_data(None)'
        },
        {
          subtitle: 'Mock使用',
          text: '外部依赖使用mock，确保测试独立',
          example: '@pytest.fixture\ndef mock_api():\n    with patch("src.core.api_client.APIClient") as mock:\n        mock.return_value.call.return_value = {"status": "ok"}\n        yield mock\n\ndef test_api_call(mock_api):\n    result = call_external_api()\n    assert result["status"] == "ok"\n    mock_api.return_value.call.assert_called_once()'
        }
      ]
    },
    {
      id: 'version',
      title: '版本规范',
      icon: '🏷️',
      color: '#9933CC',
      content: [
        {
          subtitle: 'SemVer版本号',
          text: '使用语义化版本控制（SemVer）',
          example: '版本格式: MAJOR.MINOR.PATCH\n\n1.0.0  - 初始发布\n1.1.0  - 新增功能（向后兼容）\n1.1.1  - 修复bug\n2.0.0  - 重大更新（不兼容）'
        },
        {
          subtitle: 'CHANGELOG.md',
          text: '记录所有版本变更',
          example: '## [1.2.3] - 2024-01-15\n\n### Added\n- 新增数据导出功能\n- 支持JSON格式输出\n\n### Changed\n- 优化处理速度，提升30%\n\n### Fixed\n- 修复内存泄漏问题\n- 修复空指针异常'
        },
        {
          subtitle: 'Git标签',
          text: '每个版本必须打标签',
          example: '# 创建标签\ngit tag -a v1.2.3 -m "Release version 1.2.3"\n\n# 推送标签到远程\ngit push origin v1.2.3\n\n# 推送所有标签\ngit push origin --tags'
        }
      ]
    }
  ]

  // 代码示例
  const codeExamples = {
    skillJson: `{
  "name": "data-processor",
  "version": "1.2.3",
  "description": "高效的数据处理工具，支持多种格式转换",
  "author": "张三",
  "author_email": "zhangsan@example.com",
  "tags": ["data", "processing", "converter"],
  "python_version": ">=3.8",
  "dependencies": [
    "pandas>=1.3.0",
    "numpy>=1.21.0",
    "requests>=2.25.0"
  ],
  "entry_point": "src.main:main",
  "config_schema": {
    "timeout": {
      "type": "integer",
      "default": 30,
      "description": "请求超时时间（秒）"
    },
    "max_retries": {
      "type": "integer",
      "default": 3,
      "description": "最大重试次数"
    }
  }
}`,
    readme: `# Data Processor

## 功能简介

高效的数据处理工具，支持CSV、JSON、Excel等多种格式转换。

## 安装指南

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## 快速开始

\`\`\`python
from src.main import DataProcessor

processor = DataProcessor()
result = processor.process("data.csv", output_format="json")
print(result)
\`\`\`

## API文档

### DataProcessor.process(data, **options)

处理输入数据并返回结果。

**参数:**
- data: 输入数据（文件路径或数据对象）
- output_format: 输出格式（csv/json/excel）
- timeout: 超时时间（秒）

**返回:**
- Result对象，包含status和data字段

## 配置说明

通过环境变量或配置文件进行配置：

\`\`\`bash
export DATA_PROCESSOR_TIMEOUT=60
export DATA_PROCESSOR_MAX_RETRIES=5
\`\`\`

## 更新日志

参见 [CHANGELOG.md](CHANGELOG.md)`
  }

  // 发布前检查清单
  const prePublishChecklist = [
    { id: 'check-1', text: '代码通过 pylint/flake8 检查（评分≥8.5）', required: true },
    { id: 'check-2', text: '所有函数包含类型注解', required: true },
    { id: 'check-3', text: 'README.md 包含所有必需章节', required: true },
    { id: 'check-4', text: 'skill.json 配置完整且有效', required: true },
    { id: 'check-5', text: '单元测试覆盖率≥80%', required: true },
    { id: 'check-6', text: '所有测试用例通过', required: true },
    { id: 'check-7', text: 'CHANGELOG.md 已更新', required: true },
    { id: 'check-8', text: '版本号符合 SemVer 规范', required: true },
    { id: 'check-9', text: '无敏感信息硬编码（密码、Token等）', required: true },
    { id: 'check-10', text: '代码中包含适当的日志记录', required: false },
    { id: 'check-11', text: '异常处理完善，错误信息有意义', required: false },
    { id: 'check-12', text: '已添加使用示例代码', required: false },
  ]

  return (
    <div className="space-y-8">
      {/* 子页签 */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #D6E4FF', paddingBottom: 1 }}>
        {[
          { key: 'docs' as const, label: '标准文档', icon: '📋' },
          { key: 'templates' as const, label: '开发模板', icon: '📦' },
          { key: 'workflow' as const, label: '开发流程', icon: '📊' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setExpandedSpec(null)
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#0033CC' : '#8C9DBE',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #0033CC' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 标准文档 */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* 规范总览卡片 */}
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#0033CC',
                opacity: 0.7,
                marginBottom: 16,
              }}
            >
              Skill Development Standards
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specDetails.map(spec => (
                <div
                  key={spec.id}
                  className="group cursor-pointer"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: expandedSpec === spec.id
                      ? '0 20px 50px rgba(0, 51, 204, 0.14)'
                      : '0 2px 16px rgba(0, 51, 204, 0.06)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: expandedSpec === spec.id
                      ? '1px solid rgba(0, 51, 204, 0.3)'
                      : '1px solid #D6E4FF',
                  }}
                  onClick={() => setExpandedSpec(expandedSpec === spec.id ? null : spec.id)}
                  onMouseEnter={(e) => {
                    if (expandedSpec !== spec.id) {
                      e.currentTarget.style.transform = 'translateY(-6px)'
                      e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 51, 204, 0.14)'
                      e.currentTarget.style.borderColor = 'rgba(0, 51, 204, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedSpec !== spec.id) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 16px rgba(0, 51, 204, 0.06)'
                      e.currentTarget.style.borderColor = '#D6E4FF'
                    }
                  }}
                >
                  <div style={{ padding: '28px' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${spec.color}15 0%, ${spec.color}30 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        marginBottom: 16,
                      }}
                    >
                      {spec.icon}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#0F1A4D',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {spec.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: '#8C9DBE',
                        margin: 0,
                      }}
                    >
                      点击展开查看详细规范
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 详细规范内容 */}
          {expandedSpec && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                border: '1px solid #D6E4FF',
              }}
            >
              <div
                style={{
                  padding: '24px 32px',
                  background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                  borderBottom: '1px solid #D6E4FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>
                    {specDetails.find(s => s.id === expandedSpec)?.icon}
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      color: '#0F1A4D',
                      margin: 0,
                    }}
                  >
                    {specDetails.find(s => s.id === expandedSpec)?.title} - 详细规范
                  </h3>
                </div>
                <button
                  onClick={() => setExpandedSpec(null)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: '1px solid #D6E4FF',
                    background: '#fff',
                    color: '#64748B',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  收起
                </button>
              </div>
              <div style={{ padding: '32px' }}>
                <div className="space-y-6">
                  {specDetails.find(s => s.id === expandedSpec)?.content.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '24px',
                        background: '#F8FAFF',
                        borderRadius: 12,
                        border: '1px solid #D6E4FF',
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                          fontSize: 16,
                          color: '#0F1A4D',
                          margin: '0 0 8px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: specDetails.find(s => s.id === expandedSpec)?.color,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </span>
                        {item.subtitle}
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: '#64748B',
                          margin: '0 0 16px 0',
                        }}
                      >
                        {item.text}
                      </p>
                      <pre
                        style={{
                          background: '#0F1A4D',
                          color: '#E2E8F0',
                          padding: '16px',
                          borderRadius: 8,
                          fontSize: 13,
                          lineHeight: 1.6,
                          overflow: 'auto',
                          fontFamily: "'GeistMono', 'Fira Code', monospace",
                          margin: 0,
                        }}
                      >
                        {item.example}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 代码示例区 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
              border: '1px solid #D6E4FF',
            }}
          >
            <div
              style={{
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                borderBottom: '1px solid #D6E4FF',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#0F1A4D',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>📄</span>
                标准代码示例
              </h3>
            </div>
            <div style={{ padding: '32px' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* skill.json 示例 */}
                <div>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#0033CC',
                      margin: '0 0 12px 0',
                    }}
                  >
                    skill.json
                  </h4>
                  <pre
                    style={{
                      background: '#0F1A4D',
                      color: '#E2E8F0',
                      padding: '20px',
                      borderRadius: 10,
                      fontSize: 12,
                      lineHeight: 1.6,
                      overflow: 'auto',
                      fontFamily: "'GeistMono', 'Fira Code', monospace",
                      margin: 0,
                      maxHeight: 400,
                    }}
                  >
                    {codeExamples.skillJson}
                  </pre>
                </div>
                {/* README.md 示例 */}
                <div>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#0033CC',
                      margin: '0 0 12px 0',
                    }}
                  >
                    README.md
                  </h4>
                  <pre
                    style={{
                      background: '#0F1A4D',
                      color: '#E2E8F0',
                      padding: '20px',
                      borderRadius: 10,
                      fontSize: 12,
                      lineHeight: 1.6,
                      overflow: 'auto',
                      fontFamily: "'GeistMono', 'Fira Code', monospace",
                      margin: 0,
                      maxHeight: 400,
                    }}
                  >
                    {codeExamples.readme}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* 发布前检查清单 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
              border: '1px solid #D6E4FF',
            }}
          >
            <div
              style={{
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                borderBottom: '1px solid #D6E4FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      color: '#0F1A4D',
                      margin: 0,
                    }}
                  >
                    发布前检查清单
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8C9DBE' }}>
                    确保所有必需项已完成，提高审核通过率
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0033CC' }}>
                  {getChecklistProgress(prePublishChecklist)}%
                </div>
                <div style={{ fontSize: 12, color: '#8C9DBE' }}>完成度</div>
              </div>
            </div>
            <div style={{ padding: '32px' }}>
              {/* 进度条 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ width: '100%', background: '#E2E8F0', borderRadius: 999, height: 8 }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, #0033CC, #0066FF)',
                      transition: 'width 0.5s ease',
                      width: `${getChecklistProgress(prePublishChecklist)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 检查项 */}
              <div className="space-y-3">
                {prePublishChecklist.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: checkedItems.has(item.id) ? '#F0FDF4' : '#F8FAFF',
                      border: `1px solid ${checkedItems.has(item.id) ? '#86EFAC' : '#D6E4FF'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${checkedItems.has(item.id) ? '#10B981' : '#D6E4FF'}`,
                        background: checkedItems.has(item.id) ? '#10B981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      {checkedItems.has(item.id) && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: checkedItems.has(item.id) ? '#166534' : '#0F1A4D',
                        textDecoration: checkedItems.has(item.id) ? 'line-through' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.text}
                    </span>
                    {item.required && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        必需
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 开发模板 */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                  border: '1px solid #D6E4FF',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 51, 204, 0.14)'
                  e.currentTarget.style.borderColor = 'rgba(0, 51, 204, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(0, 51, 204, 0.06)'
                  e.currentTarget.style.borderColor = '#D6E4FF'
                }}
              >
                <div style={{ padding: '32px' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #0033CC 0%, #0066FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      marginBottom: 20,
                      color: '#fff',
                    }}
                  >
                    {template.icon}
                  </div>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 18,
                      color: '#0F1A4D',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {template.name}
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#8C9DBE',
                      margin: '0 0 24px 0',
                    }}
                  >
                    {template.description}
                  </p>
                  <button
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: '1px solid #D6E4FF',
                      background: '#fff',
                      color: '#0033CC',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => window.open(template.downloadUrl, '_blank')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8FAFF'
                      e.currentTarget.style.borderColor = '#0033CC'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff'
                      e.currentTarget.style.borderColor = '#D6E4FF'
                    }}
                  >
                    下载模板
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 目录结构说明 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
              border: '1px solid #D6E4FF',
            }}
          >
            <div
              style={{
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                borderBottom: '1px solid #D6E4FF',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#0F1A4D',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>📁</span>
                标准目录结构
              </h3>
            </div>
            <div style={{ padding: '32px' }}>
              <pre
                style={{
                  background: '#0F1A4D',
                  color: '#E2E8F0',
                  padding: '24px',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.8,
                  overflow: 'auto',
                  fontFamily: "'GeistMono', 'Fira Code', monospace",
                }}
              >
                {directoryStructure}
              </pre>
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div
                  style={{
                    padding: '16px',
                    background: '#F8FAFF',
                    borderRadius: 10,
                    border: '1px solid #D6E4FF',
                  }}
                >
                  <h5 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#0033CC' }}>必需文件</h5>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 2 }}>
                    <li>README.md</li>
                    <li>skill.json</li>
                    <li>src/__init__.py</li>
                  </ul>
                </div>
                <div
                  style={{
                    padding: '16px',
                    background: '#F8FAFF',
                    borderRadius: 10,
                    border: '1px solid #D6E4FF',
                  }}
                >
                  <h5 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#0033CC' }}>推荐目录</h5>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 2 }}>
                    <li>tests/ 测试用例</li>
                    <li>docs/ 文档</li>
                    <li>CHANGELOG.md</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 开发流程图 */}
      {activeTab === 'workflow' && (
        <div className="space-y-8">
          {/* 流程图 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '40px',
              boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
              border: '1px solid #D6E4FF',
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#0033CC',
                opacity: 0.7,
                marginBottom: 24,
              }}
            >
              Development Workflow
            </div>
            
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 shrink-0">
                  <div className="flex flex-col items-center" style={{ width: 160 }}>
                    {/* 步骤卡片 */}
                    <div
                      style={{
                        width: '100%',
                        padding: '20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 100%)',
                        border: `2px solid ${step.color}20`,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = step.color
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = `0 8px 24px ${step.color}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${step.color}20`
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}DD 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          margin: '0 auto 12px',
                          color: '#fff',
                        }}
                      >
                        {step.icon}
                      </div>
                      <h4
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                          fontSize: 15,
                          color: '#0F1A4D',
                          margin: '0 0 6px 0',
                        }}
                      >
                        {step.title}
                      </h4>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#8C9DBE',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>
                    
                    {/* 步骤编号 */}
                    <div
                      style={{
                        marginTop: 12,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: step.color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {step.id}
                    </div>
                  </div>
                  
                  {/* 箭头 */}
                  {index < workflowSteps.length - 1 && (
                    <div style={{ marginTop: 40, display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 32,
                          height: 2,
                          background: 'linear-gradient(90deg, #D6E4FF, #0033CC)',
                        }}
                      />
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid #0033CC',
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 流程说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '28px',
                boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                border: '1px solid #D6E4FF',
              }}
            >
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#0F1A4D',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>📋</span>
                开发前准备
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#64748B', fontSize: 14, lineHeight: 2 }}>
                <li>阅读 Skill 开发规范文档，了解标准要求</li>
                <li>确定 Skill 的功能定位和目标用户群体</li>
                <li>选择合适的开发模板（基础/高级/MCP/Agent）</li>
                <li>准备开发环境和依赖（Python 3.8+）</li>
                <li>设计 Skill 的输入输出接口和数据结构</li>
              </ul>
            </div>
            
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '28px',
                boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                border: '1px solid #D6E4FF',
              }}
            >
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#0F1A4D',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>✅</span>
                发布前检查
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#64748B', fontSize: 14, lineHeight: 2 }}>
                <li>代码通过 pylint/flake8 质量检查（评分≥8.5）</li>
                <li>README 文档完整，包含安装、使用、API说明</li>
                <li>单元测试覆盖率≥80%，所有测试用例通过</li>
                <li>版本号符合 SemVer 规范（如 v1.2.3）</li>
                <li>无敏感信息硬编码，使用环境变量配置</li>
              </ul>
            </div>
          </div>

          {/* 最佳实践提示 */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
              borderRadius: 14,
              padding: '28px',
              border: '1px solid #D6E4FF',
            }}
          >
            <h4
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                color: '#0F1A4D',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>💡</span>
              开发最佳实践
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: '模块化设计', desc: '将功能拆分为独立模块，便于维护和复用', icon: '🧩' },
                { title: '配置化', desc: '关键参数外部化，支持环境变量和配置文件', icon: '⚙️' },
                { title: '日志规范', desc: '使用标准logging，分级记录INFO/WARNING/ERROR', icon: '📝' },
                { title: '异常处理', desc: '完善的try-except，提供有意义的错误信息', icon: '🛡️' },
                { title: '类型注解', desc: '函数参数和返回值添加类型提示', icon: '🏷️' },
                { title: '文档注释', desc: '关键函数添加docstring，说明功能和参数', icon: '📚' },
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px',
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: '1px solid #D6E4FF',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: 14, color: '#0F1A4D', fontWeight: 600 }}>{tip.title}</h5>
                  <p style={{ margin: 0, fontSize: 13, color: '#8C9DBE', lineHeight: 1.5 }}>{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
