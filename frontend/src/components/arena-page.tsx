import { useState, useEffect } from 'react'
import { Card, CardContent } from '../shared/ui/card'
import { getArenaCandidates, getArenaRankings } from '../api/simple-client'
import { ScoreDetailModal } from './score-detail-modal'
import { WeeklyPicks } from './weekly-picks'

// 奖项配置（新版）
const AWARD_CONFIG = {
  quality: {
    id: 'quality',
    name: '应用质量奖',
    icon: '✨',
    category: '质量激励类',
    budget: 20000,
    period: '季度',
    description: '季度评选高质量的AI应用Skill，综合评估文档质量、使用价值和创新程度',
    criteria: [
      'README文档完整（至少1000字）',
      '标签丰富（至少5个标签）',
      '通过功能验证、可落地部署',
      '包含创新技术标签（Agent/MCP/自动化）'
    ],
    judge: '数智中心',
    schedule: ['4月', '7月', '11月', '次年1月'],
    rewards: [
      { level: 'S', minScore: 90, reward: 500, label: 'S级卓越' },
      { level: 'A', minScore: 75, reward: 300, label: 'A级优秀' },
      { level: 'B', minScore: 60, reward: 200, label: 'B级良好' },
      { level: 'C', minScore: 45, reward: 100, label: 'C级合格' }
    ]
  },
  popularity: {
    id: 'popularity',
    name: '用户喜爱奖',
    icon: '❤️',
    category: '人气评选类',
    budget: 3400,
    period: '半年度',
    description: '半年度评选最受用户喜爱的AI应用Skill，综合评估使用深度、互动热度和传播广度',
    criteria: [
      '被下载使用的次数',
      '用户实际使用时长',
      '被收藏和评分的数量',
      '被分享和传播的次数'
    ],
    judge: '数智中心',
    schedule: ['7月', '次年1月'],
    ranks: [
      { rank: 1, reward: 800, count: 1, label: '第一名', threshold: 500 },
      { rank: 2, reward: 500, count: 2, label: '第二名', threshold: 300 },
      { rank: 3, reward: 300, count: 3, label: '第三名', threshold: 150 }
    ]
  },
  innovation: {
    id: 'innovation',
    name: '卓越创新奖',
    icon: '🏆',
    category: '功能评选类',
    budget: 12800,
    period: '半年度',
    description: '半年度评选功能强大、提效显著等的AI应用Skill',
    criteria: '综合评估功能强大程度、提效显著性',
    judge: '评选小组（数智中心50% + 各区域50%）',
    schedule: ['7月', '次年1月'],
    ranks: [
      { rank: 1, reward: 1000, count: 1, label: '第一名' },
      { rank: 2, reward: 800, count: 3, label: '第二名' },
      { rank: 3, reward: 500, count: 6, label: '第三名' }
    ],
    scoringCriteria: {
      efficiency: { name: '提效显著性', weight: 40, maxScore: 40 },
      applicability: { name: '推广应用性', weight: 30, maxScore: 30 },
      usability: { name: '应用便捷性', weight: 15, maxScore: 15 },
      extensibility: { name: '可扩展性', weight: 15, maxScore: 15 }
    }
  }
}

// 规则配置
const RULES = [
  { icon: '📋', title: '申报限制', content: '同一AI应用Skill每年仅可申报一次，不可重复领取基础奖励' },
  { icon: '🚫', title: '违规处理', content: '如发现刷量、抄袭等行为，取消当年评选资格' },
  { icon: '©️', title: '知识产权', content: '插件成果归公司所有，开发者享有署名权' },
  { icon: '🔒', title: '安全审核', content: '涉及公司敏感数据的插件需通过安全审核后方可参评' },
  { icon: '✅', title: '审批流程', content: '评选结果经运维负责人审批后正式生效' },
  { icon: '💬', title: '异议处理', content: '公示期内如有异议，由体系运营中心及IT技术中心复核处理' }
]


export function ArenaPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly-picks' | 'quality' | 'popularity' | 'innovation'>('overview')
  const [candidates, setCandidates] = useState<Record<string, any[]>>({})
  const [, setRankings] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkillSlug, setSelectedSkillSlug] = useState<string | null>(null)
  const [selectedAwardType, setSelectedAwardType] = useState<'quality' | 'popularity' | 'innovation'>('quality')
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    loadCandidates()
  }, [])

  async function loadCandidates() {
    setIsLoading(true)
    try {
      // 获取候选人数据
      const candidatesRes = await getArenaCandidates()
      if (candidatesRes.success) {
        setCandidates(candidatesRes.data)
      }
      
      // 获取排行榜
      const rankingsRes = await getArenaRankings('all', 10)
      if (rankingsRes.success) {
        setRankings(rankingsRes.data)
      }
    } catch (err) {
      console.error('加载候选人数据失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 头部 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">🏆 DC运维-Skill擂台</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          为激励AI应用创新、提升工作效率，特设立Skill擂台激励方案。
          通过季度和半年度评选，表彰优秀的AI应用Skill开发者和团队。
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium">
            总预算: ¥36,200
          </span>
          <span className="px-4 py-2 bg-green-50 text-green-700 rounded-full font-medium">
            评选周期: 季度/半年度
          </span>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'overview', label: '方案总览', icon: '📊' },
            { key: 'weekly-picks', label: '⭐ 小智优选', icon: '' },
            { key: 'quality', label: '应用质量奖', icon: '✨' },
            { key: 'popularity', label: '用户喜爱奖', icon: '❤️' },
            { key: 'innovation', label: '卓越创新奖', icon: '🏆' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab candidates={candidates} />}
          {activeTab === 'weekly-picks' && <WeeklyPicksTab />}
          {activeTab === 'quality' && <AwardDetailTab award={AWARD_CONFIG.quality} candidates={candidates.quality || []} awardType="quality" onViewDetail={handleViewDetail} />}
          {activeTab === 'popularity' && <AwardDetailTab award={AWARD_CONFIG.popularity} candidates={candidates.popularity || []} awardType="popularity" onViewDetail={handleViewDetail} />}
          {activeTab === 'innovation' && <InnovationAwardTab award={AWARD_CONFIG.innovation} candidates={candidates.innovation || []} onViewDetail={handleViewDetail} />}
        </div>
      </div>

      {/* 评分详情弹窗 */}
      <ScoreDetailModal
        slug={selectedSkillSlug || ''}
        awardType={selectedAwardType}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  )

  function handleViewDetail(slug: string, awardType: 'quality' | 'popularity' | 'innovation') {
    setSelectedSkillSlug(slug)
    setSelectedAwardType(awardType)
    setIsDetailOpen(true)
  }
}

// 方案总览
function OverviewTab({ candidates }: { candidates: Record<string, any[]> }) {
  return (
    <div className="space-y-8">
      {/* 三个奖项卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(AWARD_CONFIG).map(award => (
          <Card key={award.id} className="border-l-4 hover:shadow-lg transition-shadow"
            style={{
              borderLeftColor: award.id === 'basic' ? '#3b82f6' : award.id === 'popular' ? '#ec4899' : '#f59e0b'
            }}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <span className="text-4xl">{award.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{award.name}</h3>
                <p className="text-sm text-gray-500">{award.category}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">评选周期</span>
                  <span className="font-medium">{award.period}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">总预算</span>
                  <span className="font-medium text-green-600">¥{award.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">评选机构</span>
                  <span className="font-medium">{award.judge}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{award.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 评选规则 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 评选规则</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RULES.map((rule, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{rule.icon}</span>
                <h4 className="font-semibold text-gray-900">{rule.title}</h4>
              </div>
              <p className="text-sm text-gray-600">{rule.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 小智优选 + 候选人概览 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏅 本周精选 & 候选人</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 小智优选 */}
          <div className="lg:col-span-1">
            <WeeklyPicks />
          </div>
          
          {/* 候选人概览 */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(candidates).map(([awardId, awardCandidates]) => {
              const award = AWARD_CONFIG[awardId as keyof typeof AWARD_CONFIG]
              return (
                <Card key={awardId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{award.icon}</span>
                      <h4 className="font-bold text-gray-900">{award.name}</h4>
                    </div>
                    {awardCandidates.length > 0 ? (
                      <div className="space-y-3">
                        {awardCandidates.map(candidate => (
                          <div key={candidate.rank} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              candidate.rank === 1 ? 'bg-amber-400 text-white' :
                              candidate.rank === 2 ? 'bg-gray-300 text-white' :
                              'bg-orange-400 text-white'
                            }`}>
                              {candidate.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{candidate.skillName}</p>
                              <p className="text-xs text-gray-500">{candidate.author} · {candidate.department}</p>
                            </div>
                            <span className="text-sm font-bold text-green-600">{candidate.metric}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 py-4">暂无数据</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// 小智优选标签页
function WeeklyPicksTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⭐</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">小智优选</h2>
            <p className="text-gray-600">每周精选3个优质Skill，由管理员人工挑选</p>
          </div>
        </div>
      </div>
      <WeeklyPicks />
    </div>
  )
}

// 奖项详情页（通用）
function AwardDetailTab({ award, candidates, awardType, onViewDetail: _onViewDetail2 }: { award: any; candidates: any[]; awardType: 'quality' | 'popularity'; onViewDetail?: (slug: string, awardType: 'quality' | 'popularity' | 'innovation') => void }) {
  return (
    <div className="space-y-8">
      {/* 奖项介绍 */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{award.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{award.name}</h2>
            <p className="text-gray-600">{award.category} · {award.period}评选</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">{award.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">总预算</p>
            <p className="text-xl font-bold text-green-600">¥{award.budget.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">评选机构</p>
            <p className="text-xl font-bold text-blue-600">{award.judge}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">评选时间</p>
            <p className="text-xl font-bold text-purple-600">{award.schedule?.join('、')}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">奖励标准</p>
            <p className="text-xl font-bold text-pink-600">
              {award.rewardPerSkill ? `¥${award.rewardPerSkill}/个` : '按排名'}
            </p>
          </div>
        </div>
      </div>

      {/* 评选标准 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 评选标准</h3>
        <div className="bg-gray-50 rounded-xl p-6 border">
          {Array.isArray(award.criteria) ? (
            <ul className="space-y-2">
              {award.criteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{criterion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">{award.criteria}</p>
          )}
        </div>
      </div>

      {/* 指标计算公式 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔢 指标计算公式</h3>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <FormulaDisplay awardId={award.id} />
        </div>
      </div>

      {/* 动态候选人TOP3 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏅 动态候选人TOP3</h3>
        <div className="space-y-3">
          {candidates.length > 0 ? (
            candidates.map(candidate => (
              <div key={candidate.rank} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  candidate.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  candidate.rank === 1 ? 'bg-amber-400 text-white' :
                  candidate.rank === 2 ? 'bg-gray-300 text-white' :
                  candidate.rank === 3 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {candidate.rank <= 3 ? ['🥇', '🥈', '🥉'][candidate.rank - 1] : candidate.rank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{candidate.skill_name || candidate.skillName}</p>
                  <p className="text-sm text-gray-500">
                    {candidate.author} · {candidate.department} · {candidate.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{candidate.metric || `${candidate.total_score || candidate.popularity_index}分`}</p>
                  <p className="text-xs text-gray-400">
                    {candidate.trend === 'up' ? '📈 上升' : candidate.trend === 'down' ? '📉 下降' : '➡️ 稳定'}
                  </p>
                  {candidate.skill_slug && _onViewDetail2 && (
                    <button
                      onClick={() => _onViewDetail2(candidate.skill_slug, awardType)}
                      className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      查看分数计算详情
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
              <p className="text-gray-400">暂无候选人数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 奖励明细 */}
      {award.ranks && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">💰 奖励明细</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {award.ranks.map(rank => (
              <div key={rank.rank} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-700">{rank.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">¥{rank.reward}</p>
                  <p className="text-sm text-gray-500 mt-1">共{rank.count}名</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 卓越创新奖特殊页面
function InnovationAwardTab({ award, candidates, onViewDetail: _onViewDetail }: { award: typeof AWARD_CONFIG.innovation; candidates: any[]; onViewDetail?: (slug: string, awardType: 'quality' | 'popularity' | 'innovation') => void }) {
  return (
    <div className="space-y-8">
      {/* 奖项介绍 */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{award.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{award.name}</h2>
            <p className="text-gray-600">{award.category} · {award.period}评选</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">{award.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">总预算</p>
            <p className="text-xl font-bold text-green-600">¥{award.budget.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">评选机构</p>
            <p className="text-xl font-bold text-blue-600">{award.judge}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">评选时间</p>
            <p className="text-xl font-bold text-purple-600">{award.schedule?.join('、')}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-sm text-gray-500">奖励方式</p>
            <p className="text-xl font-bold text-pink-600">按排名</p>
          </div>
        </div>
      </div>

      {/* 评分维度 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 评分维度</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {award.scoringCriteria && Object.entries(award.scoringCriteria).map(([key, criteria]) => (
            <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-gray-600">{criteria.name}</p>
              <p className="text-2xl font-bold text-blue-600">{criteria.weight}%</p>
              <p className="text-xs text-gray-500 mt-1">满分{criteria.maxScore}分</p>
            </div>
          ))}
        </div>
      </div>

      {/* 评选标准 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 评选标准</h3>
        <div className="bg-gray-50 rounded-xl p-6 border">
          <p className="text-gray-700">{award.criteria}</p>
        </div>
      </div>

      {/* 指标计算公式 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔢 综合评分公式</h3>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="font-mono text-lg text-center">
                总分 = 提效显著性 × 40% + 推广应用性 × 30% + 应用便捷性 × 15% + 可扩展性 × 15%
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">提效显著性（40分）</p>
                <p className="text-gray-600 mt-1">评估Skill对工作效率的提升程度</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">推广应用性（30分）</p>
                <p className="text-gray-600 mt-1">评估Skill在不同场景的适用程度</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">应用便捷性（15分）</p>
                <p className="text-gray-600 mt-1">评估Skill的使用便捷程度</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">可扩展性（15分）</p>
                <p className="text-gray-600 mt-1">评估Skill的功能扩展潜力</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 动态候选人TOP3 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏅 动态候选人TOP3</h3>
        <div className="space-y-3">
          {candidates.length > 0 ? (
            candidates.map(candidate => (
              <div key={candidate.rank} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  candidate.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  candidate.rank === 1 ? 'bg-amber-400 text-white' :
                  candidate.rank === 2 ? 'bg-gray-300 text-white' :
                  candidate.rank === 3 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {candidate.rank <= 3 ? ['🥇', '🥈', '🥉'][candidate.rank - 1] : candidate.rank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{candidate.skill_name || candidate.skillName}</p>
                  <p className="text-sm text-gray-500">
                    {candidate.author} · {candidate.department} · {candidate.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{candidate.metric || `${candidate.total_score}分`}</p>
                  <p className="text-xs text-gray-400">
                    {candidate.trend === 'up' ? '📈 上升' : candidate.trend === 'down' ? '📉 下降' : '➡️ 稳定'}
                  </p>
                  {candidate.skill_slug && _onViewDetail && (
                    <button
                      onClick={() => _onViewDetail(candidate.skill_slug, 'innovation')}
                      className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      查看分数计算详情
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
              <p className="text-gray-400">暂无候选人数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 奖励明细 */}
      {award.ranks && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">💰 奖励明细</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {award.ranks.map(rank => (
              <div key={rank.rank} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-700">{rank.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">¥{rank.reward}</p>
                  <p className="text-sm text-gray-500 mt-1">共{rank.count}名</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 公式展示组件
function FormulaDisplay({ awardId }: { awardId: string }) {
  if (awardId === 'quality') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="font-mono text-lg text-center">
            总分 = 质量水平×40% + 使用价值×30% + 创新程度×20% + 维护活跃度×10%
          </p>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 质量水平(40分)：README完整度(15) + 标签丰富度(10) + 版本迭代(10) + 代码规范(5)</p>
          <p>• 使用价值(30分)：min(下载量×1.5, 30)</p>
          <p>• 创新程度(20分)：min(复杂标签数×5, 20)</p>
          <p>• 维护活跃度(10分)：max(0, 10 - 更新天数/15)</p>
        </div>
      </div>
    )
  }

  if (awardId === 'popularity') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="font-mono text-lg text-center">
            人气指数 = 使用深度×40% + 互动热度×35% + 传播广度×25%
          </p>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 使用深度(400分)：下载×2 + 使用×5 + 时长×0.5</p>
          <p>• 互动热度(350分)：收藏×10 + 评分×20 + 评论×5</p>
          <p>• 传播广度(250分)：分享×15 + 搜索点击×3 + 推荐曝光×0.1</p>
        </div>
      </div>
    )
  }

  if (awardId === 'innovation') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="font-mono text-lg text-center">
            总分 = 使用价值×35% + 质量水平×25% + 创新程度×20% + 推广效果×15% + 维护活跃度×5%
          </p>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 使用价值(35分)：min(下载量×2, 35)</p>
          <p>• 质量水平(25分)：README(10) + 标签(10) + 版本(5)</p>
          <p>• 创新程度(20分)：min(复杂标签数×5, 20)</p>
          <p>• 推广效果(15分)：搜索×0.5 + 收藏×2 + 分享×3</p>
          <p>• 维护活跃度(5分)：max(0, 5 - 更新天数/30)</p>
        </div>
      </div>
    )
  }

  return null
}
