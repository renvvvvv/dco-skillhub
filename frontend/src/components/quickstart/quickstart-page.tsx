import { useState, useEffect } from 'react'
import { ScenarioMapTab } from './scenario-map-tab'
import { CollectionsTab } from './collections-tab'
import {
  getQuickstartConfig,
  getScenarios,
  getCollections,
  createScenario,
  // updateScenario,
  deleteScenario,
  updateScenarioSkills,
  createCollection,
  // updateCollection,
  deleteCollection,
  updateCollectionSkills,
  incrementCollectionPlay,
  ScenarioMap,
  Collection,
} from './quickstart-api'
import { getSkills, Skill } from '../../api/simple-client'
import { SkillsUsageMap } from './skills-usage-map'
import { StandardDocuments } from './standard-documents'

export function QuickStartPage() {
  const [mainTab, setMainTab] = useState<'quickstart' | 'scenarios'>('quickstart')
  const [config, setConfig] = useState<any>(null)
  const [scenarios, setScenarios] = useState<ScenarioMap[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [configRes, scenariosRes, collectionsRes, skillsRes] = await Promise.all([
        getQuickstartConfig(),
        getScenarios(),
        getCollections(),
        getSkills(),
      ])

      if (configRes.success) {
        setConfig(configRes.data)
      }
      if (scenariosRes.success) {
        setScenarios(scenariosRes.data)
      }
      if (collectionsRes.success) {
        setCollections(collectionsRes.data)
      }
      if (skillsRes.success) {
        setSkills(skillsRes.data?.content || skillsRes.data || [])
      }
    } catch (error) {
      console.error('加载速成地图数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateScenario = async (data: Partial<ScenarioMap>) => {
    const res = await createScenario(data)
    if (res.success) {
      setScenarios([...scenarios, res.data])
    }
  }

  const handleDeleteScenario = async (id: string) => {
    const res = await deleteScenario(id)
    if (res.success) {
      setScenarios(scenarios.filter(s => s.id !== id))
    }
  }

  const handleUpdateScenarioSkills = async (scenarioId: string, skills: any[]) => {
    const res = await updateScenarioSkills(scenarioId, skills)
    if (res.success) {
      setScenarios(scenarios.map(s => s.id === scenarioId ? res.data : s))
    }
  }

  const handleCreateCollection = async (data: Partial<Collection>) => {
    const res = await createCollection(data)
    if (res.success) {
      setCollections([...collections, res.data])
    }
  }

  const handleDeleteCollection = async (id: string) => {
    const res = await deleteCollection(id)
    if (res.success) {
      setCollections(collections.filter(c => c.id !== id))
    }
  }

  const handleUpdateCollectionSkills = async (collectionId: string, skills: any[]) => {
    const res = await updateCollectionSkills(collectionId, skills)
    if (res.success) {
      setCollections(collections.map(c => c.id === collectionId ? res.data : c))
    }
  }

  const handlePlayCollection = async (collectionId: string) => {
    await incrementCollectionPlay(collectionId)
    const res = await getCollections()
    if (res.success) {
      setCollections(res.data)
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

      {/* 主模块页签 */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #D6E4FF',
          position: 'sticky',
          top: 64,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'flex',
            gap: 0,
          }}
        >
          {[
            { key: 'quickstart' as const, label: '速成与标准', icon: '🚀' },
            { key: 'scenarios' as const, label: '场景地图与精选集', icon: '🗺️' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              style={{
                padding: '16px 28px',
                border: 'none',
                background: 'transparent',
                color: mainTab === tab.key ? '#0033CC' : '#8C9DBE',
                fontSize: 15,
                fontWeight: mainTab === tab.key ? 600 : 500,
                cursor: 'pointer',
                borderBottom: mainTab === tab.key ? '2px solid #0033CC' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '40px 5vw 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {mainTab === 'quickstart' && (
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
          )}

          {mainTab === 'scenarios' && (
            <div>
              <ScenarioCollectionsPage
                scenarios={scenarios}
                collections={collections}
                skills={skills}
                onCreateScenario={handleCreateScenario}
                onDeleteScenario={handleDeleteScenario}
                onUpdateScenarioSkills={handleUpdateScenarioSkills}
                onCreateCollection={handleCreateCollection}
                onDeleteCollection={handleDeleteCollection}
                onUpdateCollectionSkills={handleUpdateCollectionSkills}
                onPlayCollection={handlePlayCollection}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 场景地图与精选集双子页
function ScenarioCollectionsPage({
  scenarios,
  collections,
  skills,
  onCreateScenario,
  onDeleteScenario,
  onUpdateScenarioSkills,
  onCreateCollection,
  onDeleteCollection,
  onUpdateCollectionSkills,
  onPlayCollection,
}: {
  scenarios: ScenarioMap[]
  collections: Collection[]
  skills: Skill[]
  onCreateScenario: (data: Partial<ScenarioMap>) => void
  onDeleteScenario: (id: string) => void
  onUpdateScenarioSkills: (scenarioId: string, skills: any[]) => void
  onCreateCollection: (data: Partial<Collection>) => void
  onDeleteCollection: (id: string) => void
  onUpdateCollectionSkills: (collectionId: string, skills: any[]) => void
  onPlayCollection: (collectionId: string) => void
}) {
  const [subTab, setSubTab] = useState<'scenarios' | 'collections'>('scenarios')

  return (
    <div className="space-y-8">
      {/* 子页签 */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 6,
          boxShadow: '0 2px 16px rgba(0, 51, 204, 0.06)',
          border: '1px solid #D6E4FF',
        }}
      >
        {[
          { key: 'scenarios' as const, label: '场景地图', icon: '📍', count: scenarios.length },
          { key: 'collections' as const, label: '精选集', icon: '⭐', count: collections.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: subTab === tab.key ? '#0033CC' : 'transparent',
              color: subTab === tab.key ? '#FFFFFF' : '#8C9DBE',
              fontSize: 14,
              fontWeight: subTab === tab.key ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 999,
                background: subTab === tab.key ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: subTab === tab.key ? '#fff' : '#64748B',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 内容 */}
      {subTab === 'scenarios' && (
        <ScenarioMapTab
          scenarios={scenarios}
          availableSkills={skills}
          onCreateScenario={onCreateScenario}
          onUpdateScenario={() => {}}
          onDeleteScenario={onDeleteScenario}
          onUpdateSkills={onUpdateScenarioSkills}
        />
      )}
      {subTab === 'collections' && (
        <CollectionsTab
          collections={collections}
          availableSkills={skills}
          onCreateCollection={onCreateCollection}
          onUpdateCollection={() => {}}
          onDeleteCollection={onDeleteCollection}
          onUpdateSkills={onUpdateCollectionSkills}
          onPlayCollection={onPlayCollection}
        />
      )}
    </div>
  )
}
