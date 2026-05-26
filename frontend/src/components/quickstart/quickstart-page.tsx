import { useState, useEffect } from 'react'
import {
  getQuickstartConfig,
} from './quickstart-api'
import { SkillsUsageMap } from './skills-usage-map'
import { StandardDocuments } from './standard-documents'

export function QuickStartPage() {
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [configRes] = await Promise.all([
        getQuickstartConfig(),
      ])

      if (configRes.success) {
        setConfig(configRes.data)
      }
    } catch (error) {
      console.error('加载速成地图数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#F8FAFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div 
          style={{
            width: 48,
            height: 48,
            border: '3px solid #D6E4FF',
            borderTopColor: '#0033CC',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  const usageMap = config?.usage_map || {}
  const standards = config?.standards || {}

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      {/* 页面标题区 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
          borderBottom: '1px solid #D6E4FF',
          padding: '60px 5vw 40px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
            Quick Start Guide
          </div>
          
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 48px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: '#0F1A4D',
              marginBottom: 12,
            }}
          >
            速成地图
          </h1>
          
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: 1.7,
              color: '#8C9DBE',
              maxWidth: 600,
            }}
          >
            快速上手 SkillHub，从入门到精通，发现最佳实践与标准化开发流程
          </p>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '40px 5vw 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="space-y-12">
            {/* 模块1：速成 Skills 使用地图 */}
            <section>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: '#0033CC',
                    opacity: 0.7,
                    marginBottom: 8,
                  }}
                >
                  Skills Usage Map
                </div>
                <h2
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    lineHeight: 1.2,
                    color: '#0F1A4D',
                    margin: 0,
                  }}
                >
                  速成 Skills 使用地图
                </h2>
              </div>
              <SkillsUsageMap
                roles={usageMap.roles || []}
                resources={usageMap.resources || []}
              />
            </section>

            {/* 分隔线 */}
            <div style={{ width: '100%', height: 1, background: '#D6E4FF' }} />

            {/* 模块2：上传 Skills 标准文档 */}
            <section>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: '#0033CC',
                    opacity: 0.7,
                    marginBottom: 8,
                  }}
                >
                  Development Standards
                </div>
                <h2
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    lineHeight: 1.2,
                    color: '#0F1A4D',
                    margin: 0,
                  }}
                >
                  上传 Skills 标准文档
                </h2>
              </div>
              <StandardDocuments
                documents={standards.documents || []}
                templates={standards.templates || []}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


