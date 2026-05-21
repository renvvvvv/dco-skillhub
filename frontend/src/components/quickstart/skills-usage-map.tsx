import { useState } from 'react'
import { RolePath, QuickResource } from './quickstart-api'

interface SkillsUsageMapProps {
  roles: RolePath[]
  resources: QuickResource[]
}

export function SkillsUsageMap({ roles, resources }: SkillsUsageMapProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(roles[0]?.id || null)
  const [activeStep, setActiveStep] = useState(0)

  const currentRole = roles.find(r => r.id === selectedRole)

  return (
    <div className="space-y-8">
      {/* 角色选择 - 使用与首页一致的卡片风格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map(role => (
          <div
            key={role.id}
            className="group cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: selectedRole === role.id 
                ? '0 20px 50px rgba(0, 51, 204, 0.14)' 
                : '0 2px 16px rgba(0, 51, 204, 0.06)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              border: selectedRole === role.id 
                ? '1px solid rgba(0, 51, 204, 0.3)' 
                : '1px solid #D6E4FF',
            }}
            onClick={() => {
              setSelectedRole(role.id)
              setActiveStep(0)
            }}
            onMouseEnter={(e) => {
              if (selectedRole !== role.id) {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 51, 204, 0.14)'
                e.currentTarget.style.borderColor = 'rgba(0, 51, 204, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRole !== role.id) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 16px rgba(0, 51, 204, 0.06)'
                e.currentTarget.style.borderColor = '#D6E4FF'
              }
            }}
          >
            <div style={{ padding: '32px 28px 28px' }}>
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
                }}
              >
                {role.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 20,
                  color: '#0F1A4D',
                  margin: '0 0 10px 0',
                  lineHeight: 1.3,
                }}
              >
                {role.name}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#8C9DBE',
                  margin: 0,
                }}
              >
                {role.description}
              </p>
              <div 
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#0033CC',
                  fontWeight: 500,
                }}
              >
                <span>{role.steps.length} 个步骤</span>
                <span style={{ color: '#D6E4FF' }}>|</span>
                <span>点击开始学习</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 学习路径 - 流程图风格 */}
      {currentRole && (
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
              padding: '28px 32px',
              background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
              borderBottom: '1px solid #D6E4FF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{currentRole.icon}</span>
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
                  {currentRole.name} - 学习路径
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8C9DBE' }}>
                  按步骤完成学习，快速掌握核心能力
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '32px' }}>
            {/* 流程图步骤 */}
            <div className="flex items-start gap-2 overflow-x-auto pb-6">
              {currentRole.steps.map((step, index) => (
                <div key={step.order} className="flex items-start gap-2 shrink-0">
                  <div className="flex flex-col items-center" style={{ width: 140 }}>
                    {/* 步骤圆圈 */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        ...(index === activeStep
                          ? {
                              background: 'linear-gradient(135deg, #0033CC 0%, #0066FF 100%)',
                              color: '#fff',
                              boxShadow: '0 4px 16px rgba(0, 51, 204, 0.3)',
                              transform: 'scale(1.1)',
                            }
                          : index < activeStep
                          ? {
                              background: '#10B981',
                              color: '#fff',
                            }
                          : {
                              background: '#F1F5F9',
                              color: '#94A3B8',
                            }),
                      }}
                      onClick={() => setActiveStep(index)}
                    >
                      {index < activeStep ? '✓' : step.icon}
                    </div>
                    
                    {/* 步骤标题 */}
                    <h4
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: index === activeStep ? 600 : 500,
                        fontSize: 14,
                        color: index === activeStep ? '#0033CC' : '#0F1A4D',
                        margin: '12px 0 4px',
                        textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      {step.title}
                    </h4>
                    
                    {/* 步骤描述 */}
                    <p
                      style={{
                        fontSize: 12,
                        color: '#8C9DBE',
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                  
                  {/* 箭头连接 */}
                  {index < currentRole.steps.length - 1 && (
                    <div 
                      style={{
                        width: 40,
                        height: 2,
                        background: index < activeStep ? '#10B981' : '#E2E8F0',
                        marginTop: 24,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: -4,
                          top: -4,
                          width: 0,
                          height: 0,
                          borderLeft: `6px solid ${index < activeStep ? '#10B981' : '#E2E8F0'}`,
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 步骤详情 */}
            <div
              style={{
                marginTop: 24,
                padding: '24px',
                background: '#F8FAFF',
                borderRadius: 12,
                border: '1px solid #D6E4FF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #0033CC 0%, #0066FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {currentRole.steps[activeStep]?.icon}
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#0F1A4D',
                      margin: 0,
                    }}
                  >
                    步骤 {activeStep + 1}: {currentRole.steps[activeStep]?.title}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#8C9DBE' }}>
                    {currentRole.steps[activeStep]?.description}
                  </p>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(activeStep - 1)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: '1px solid #D6E4FF',
                    background: '#fff',
                    color: '#0F1A4D',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
                    opacity: activeStep === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  上一步
                </button>
                <button
                  disabled={activeStep === currentRole.steps.length - 1}
                  onClick={() => setActiveStep(activeStep + 1)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0033CC 0%, #0066FF 100%)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: activeStep === currentRole.steps.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: activeStep === currentRole.steps.length - 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 51, 204, 0.2)',
                  }}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速入门资源 */}
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
          Learning Resources
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map(resource => (
            <a
              key={resource.id}
              href={resource.url}
              className="group"
              style={{
                display: 'block',
                padding: '24px',
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #D6E4FF',
                boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                textDecoration: 'none',
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
              <div 
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  marginBottom: 16,
                }}
              >
                {resource.icon}
              </div>
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#0F1A4D',
                  margin: '0 0 8px 0',
                  transition: 'color 0.3s ease',
                }}
                className="group-hover:text-[#0033CC]"
              >
                {resource.title}
              </h4>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#8C9DBE',
                  margin: 0,
                }}
              >
                {resource.description}
              </p>
              <div
                style={{
                  marginTop: 12,
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: '#F1F5F9',
                  fontSize: 12,
                  color: '#64748B',
                  fontWeight: 500,
                }}
              >
                {resource.type === 'video' ? '视频教程' : resource.type === 'demo' ? '演示项目' : '文档指南'}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
