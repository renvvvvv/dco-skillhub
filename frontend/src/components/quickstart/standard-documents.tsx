import { useState } from 'react'
import { StandardDocument, SkillTemplate, ChecklistItem } from './quickstart-api'

interface StandardDocumentsProps {
  documents: StandardDocument[]
  templates: SkillTemplate[]
}

export function StandardDocuments({ documents, templates }: StandardDocumentsProps) {
  const [selectedDoc, setSelectedDoc] = useState<StandardDocument | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'docs' | 'templates' | 'workflow'>('docs')

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
  const directoryStructure = `
skill-name/
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
              setSelectedDoc(null)
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="group cursor-pointer"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: selectedDoc?.id === doc.id 
                    ? '0 20px 50px rgba(0, 51, 204, 0.14)' 
                    : '0 2px 16px rgba(0, 51, 204, 0.06)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  border: selectedDoc?.id === doc.id 
                    ? '1px solid rgba(0, 51, 204, 0.3)' 
                    : '1px solid #D6E4FF',
                }}
                onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                onMouseEnter={(e) => {
                  if (selectedDoc?.id !== doc.id) {
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 51, 204, 0.14)'
                    e.currentTarget.style.borderColor = 'rgba(0, 51, 204, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDoc?.id !== doc.id) {
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
                      background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      marginBottom: 16,
                    }}
                  >
                    {doc.icon}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#0F1A4D',
                        margin: 0,
                      }}
                    >
                      {doc.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#F1F5F9',
                        color: '#64748B',
                        fontWeight: 500,
                      }}
                    >
                      {doc.version}
                    </span>
                  </div>
                  
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#8C9DBE',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {doc.description}
                  </p>
                  
                  {doc.type === 'checklist' && doc.items && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>完成进度</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0033CC' }}>{getChecklistProgress(doc.items)}%</span>
                      </div>
                      <div style={{ width: '100%', background: '#E2E8F0', borderRadius: 999, height: 6 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 999,
                            background: 'linear-gradient(90deg, #0033CC, #0066FF)',
                            transition: 'width 0.5s ease',
                            width: `${getChecklistProgress(doc.items)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {doc.downloadUrl && (
                    <button
                      style={{
                        marginTop: 16,
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        border: '1px solid #D6E4FF',
                        background: '#fff',
                        color: '#0033CC',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(doc.downloadUrl, '_blank')
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8FAFF'
                        e.currentTarget.style.borderColor = '#0033CC'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff'
                        e.currentTarget.style.borderColor = '#D6E4FF'
                      }}
                    >
                      下载 {doc.fileName}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 文档详情 */}
          {selectedDoc && (
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
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 28 }}>{selectedDoc.icon}</span>
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
                    {selectedDoc.title}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8C9DBE' }}>
                    {selectedDoc.description}
                  </p>
                </div>
              </div>
              
              <div style={{ padding: '32px' }}>
                {selectedDoc.type === 'specification' && selectedDoc.sections && (
                  <div className="space-y-4">
                    {selectedDoc.sections.map((section, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '20px',
                          background: '#F8FAFF',
                          borderRadius: 10,
                          borderLeft: '4px solid #0033CC',
                        }}
                      >
                        <h4
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#0F1A4D',
                            margin: '0 0 8px 0',
                          }}
                        >
                          {section.title}
                        </h4>
                        <p
                          style={{
                            fontSize: 14,
                            lineHeight: 1.7,
                            color: '#64748B',
                            margin: 0,
                          }}
                        >
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDoc.type === 'checklist' && selectedDoc.items && (
                  <div className="space-y-3">
                    {selectedDoc.items.map(item => (
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
                )}

                {selectedDoc.type === 'guide' && (
                  <div>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: '#64748B', marginBottom: 24 }}>
                      {selectedDoc.description}
                    </p>
                    {selectedDoc.downloadUrl && (
                      <button
                        style={{
                          padding: '12px 28px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #0033CC 0%, #0066FF 100%)',
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 51, 204, 0.2)',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => window.open(selectedDoc.downloadUrl, '_blank')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 51, 204, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 51, 204, 0.2)'
                        }}
                      >
                        下载模板
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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
