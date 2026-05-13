import { useState, useEffect } from 'react'

interface ScoreDetailModalProps {
  slug: string
  awardType: 'quality' | 'popularity' | 'innovation'
  isOpen: boolean
  onClose: () => void
}

export function ScoreDetailModal({ slug, awardType, isOpen, onClose }: ScoreDetailModalProps) {
  const [detail, setDetail] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && slug) {
      loadScoreDetail()
    }
  }, [isOpen, slug, awardType])

  async function loadScoreDetail() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(slug)}/score-detail?award=${awardType}`)
      const result = await response.json()
      if (result.success) {
        setDetail(result.data)
      }
    } catch (err) {
      console.error('加载评分详情失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📊 评分计算详情</h2>
            <p className="text-sm text-gray-500">{detail?.skill_name || slug}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">加载评分详情...</p>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* 总分概览 */}
              <ScoreOverview detail={detail} awardType={awardType} />
              
              {/* 详细维度得分 */}
              <ScoreDimensions detail={detail} awardType={awardType} />
              
              {/* 计算公式展示 */}
              <ScoreFormula detail={detail} awardType={awardType} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无评分数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 总分概览
function ScoreOverview({ detail, awardType }: { detail: any; awardType: string }) {
  const getScoreColor = (score: number, max: number) => {
    const ratio = score / max
    if (ratio >= 0.9) return 'text-red-600'
    if (ratio >= 0.75) return 'text-orange-600'
    if (ratio >= 0.6) return 'text-yellow-600'
    if (ratio >= 0.45) return 'text-blue-600'
    return 'text-gray-600'
  }

  const getLevel = (score: number) => {
    if (score >= 90) return { label: 'S级', desc: '卓越', color: 'bg-red-100 text-red-700' }
    if (score >= 75) return { label: 'A级', desc: '优秀', color: 'bg-orange-100 text-orange-700' }
    if (score >= 60) return { label: 'B级', desc: '良好', color: 'bg-yellow-100 text-yellow-700' }
    if (score >= 45) return { label: 'C级', desc: '合格', color: 'bg-blue-100 text-blue-700' }
    return { label: 'D级', desc: '待改进', color: 'bg-gray-100 text-gray-700' }
  }

  const totalScore = detail.total_score || detail.popularity_index || 0
  const maxScore = awardType === 'popularity' ? 1000 : 100
  const level = getLevel(awardType === 'popularity' ? totalScore / 10 : totalScore)

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">综合评分</p>
          <p className={`text-4xl font-bold ${getScoreColor(totalScore, maxScore)}`}>
            {totalScore}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${level.color}`}>
            {level.label} · {level.desc}
          </span>
          <p className="text-xs text-gray-400 mt-2">满分{maxScore}分</p>
        </div>
      </div>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
        <div 
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
          style={{ width: `${Math.min((totalScore / maxScore) * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}

// 详细维度得分
function ScoreDimensions({ detail, awardType }: { detail: any; awardType: string }) {
  if (awardType === 'quality') {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">📊 各维度得分</h3>
        <DimensionBar 
          name="质量水平" 
          score={detail.quality_score} 
          max={40} 
          color="bg-blue-500"
          details={[
            { label: 'README完整度', value: detail.details?.readme?.score || 0, max: 15 },
            { label: '标签丰富度', value: detail.details?.tags?.score || 0, max: 10 },
            { label: '版本迭代', value: detail.details?.versions?.score || 0, max: 10 },
            { label: '代码规范', value: detail.details?.code?.score || 0, max: 5 },
          ]}
        />
        <DimensionBar 
          name="使用价值" 
          score={detail.usage_score} 
          max={30} 
          color="bg-green-500"
          details={[
            { label: '下载量', value: detail.stats?.total_downloads || 0, suffix: '次' },
            { label: '下载得分', value: detail.usage_score || 0, max: 30 },
          ]}
        />
        <DimensionBar 
          name="创新程度" 
          score={detail.innovation_score} 
          max={20} 
          color="bg-purple-500"
          details={[
            { label: '复杂标签数', value: detail.details?.tags?.matched?.length || 0, suffix: '个' },
            { label: '创新得分', value: detail.innovation_score || 0, max: 20 },
          ]}
        />
        <DimensionBar 
          name="维护活跃度" 
          score={detail.maintenance_score} 
          max={10} 
          color="bg-pink-500"
          details={[
            { label: '更新天数', value: detail.details?.maintenance?.update_days || 0, suffix: '天前' },
            { label: '维护得分', value: detail.maintenance_score || 0, max: 10 },
          ]}
        />
      </div>
    )
  }

  if (awardType === 'popularity') {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">📊 各维度得分</h3>
        <DimensionBar 
          name="使用深度" 
          score={detail.usage_depth} 
          max={400} 
          color="bg-blue-500"
          details={[
            { label: '下载量', value: detail.details?.downloads?.count || 0, suffix: '次', score: detail.details?.downloads?.score || 0 },
            { label: '使用次数', value: detail.details?.uses?.count || 0, suffix: '次', score: detail.details?.uses?.score || 0 },
            { label: '使用时长', value: detail.details?.duration?.total || 0, suffix: '分钟', score: detail.details?.duration?.score || 0 },
          ]}
        />
        <DimensionBar 
          name="互动热度" 
          score={detail.interaction_heat} 
          max={350} 
          color="bg-red-500"
          details={[
            { label: '收藏数', value: detail.details?.favorites?.count || 0, suffix: '次', score: detail.details?.favorites?.score || 0 },
            { label: '评分次数', value: detail.details?.ratings?.count || 0, suffix: '次', score: detail.details?.ratings?.score || 0 },
            { label: '评论数', value: detail.details?.comments?.count || 0, suffix: '次', score: detail.details?.comments?.score || 0 },
          ]}
        />
        <DimensionBar 
          name="传播广度" 
          score={detail.spread_breadth} 
          max={250} 
          color="bg-purple-500"
          details={[
            { label: '分享数', value: detail.details?.shares?.count || 0, suffix: '次', score: detail.details?.shares?.score || 0 },
            { label: '搜索点击', value: detail.details?.search_clicks?.count || 0, suffix: '次', score: detail.details?.search_clicks?.score || 0 },
            { label: '推荐曝光', value: detail.details?.recommend_shows?.count || 0, suffix: '次', score: detail.details?.recommend_shows?.score || 0 },
          ]}
        />
      </div>
    )
  }

  if (awardType === 'innovation') {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">📊 各维度得分</h3>
        <DimensionBar name="使用价值" score={detail.usage_score} max={35} color="bg-blue-500" />
        <DimensionBar name="质量水平" score={detail.quality_score} max={25} color="bg-green-500" />
        <DimensionBar name="创新程度" score={detail.innovation_score} max={20} color="bg-purple-500" />
        <DimensionBar name="推广效果" score={detail.promotion_score} max={15} color="bg-orange-500" />
        <DimensionBar name="维护活跃度" score={detail.maintenance_score} max={5} color="bg-pink-500" />
      </div>
    )
  }

  return null
}

// 维度得分条组件
function DimensionBar({ 
  name, 
  score, 
  max, 
  color,
  details
}: { 
  name: string; 
  score: number; 
  max: number; 
  color: string;
  details?: Array<{ label: string; value: number; max?: number; suffix?: string; score?: number }>
}) {
  const percentage = Math.min((score / max) * 100, 100)

  return (
    <div className="bg-gray-50 rounded-xl p-4 border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{name}</span>
        <span className="text-sm font-bold">{score} / {max}分</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {details && details.length > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {details.map((detail, index) => (
            <div key={index} className="bg-white rounded p-2 border">
              <p className="text-gray-500">{detail.label}</p>
              <p className="font-bold text-gray-900">
                {detail.value}{detail.suffix || ''}
                {detail.max && <span className="text-gray-400 font-normal"> / {detail.max}分</span>}
                {detail.score !== undefined && <span className="text-blue-600"> (+{detail.score}分)</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 计算公式展示
function ScoreFormula({ detail, awardType }: { detail: any; awardType: string }) {
  return (
    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
      <h3 className="font-bold text-gray-900 mb-4">🔢 计算公式</h3>
      
      {awardType === 'quality' && (
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-mono font-bold text-center text-lg">
              总分 = 质量水平 + 使用价值 + 创新程度 + 维护活跃度
            </p>
          </div>
          <FormulaStep 
            title="质量水平 (40分)"
            formula="README完整度(15) + 标签丰富度(10) + 版本迭代(10) + 代码规范(5)"
            calculation={`${detail.details?.readme?.score || 0} + ${detail.details?.tags?.score || 0} + ${detail.details?.versions?.score || 0} + ${detail.details?.code?.score || 0} = ${detail.quality_score}分`}
          />
          <FormulaStep 
            title="使用价值 (30分)"
            formula="min(下载量 × 1.5, 30)"
            calculation={`min(${detail.stats?.total_downloads || 0} × 1.5, 30) = ${detail.usage_score}分`}
          />
          <FormulaStep 
            title="创新程度 (20分)"
            formula="min(复杂标签数 × 5, 20)"
            calculation={`min(${detail.details?.tags?.matched?.length || 0} × 5, 20) = ${detail.innovation_score}分`}
          />
          <FormulaStep 
            title="维护活跃度 (10分)"
            formula="max(0, 10 - 更新天数/15)"
            calculation={`max(0, 10 - ${detail.details?.maintenance?.update_days || 0}/15) = ${detail.maintenance_score}分`}
          />
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="font-bold text-green-700">
              总分 = {detail.quality_score} + {detail.usage_score} + {detail.innovation_score} + {detail.maintenance_score} = {detail.total_score}分
            </p>
          </div>
        </div>
      )}
      
      {awardType === 'popularity' && (
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-mono font-bold text-center text-lg">
              人气指数 = 使用深度 + 互动热度 + 传播广度
            </p>
          </div>
          <FormulaStep 
            title="使用深度 (400分)"
            formula="下载×2 + 使用×5 + 时长×0.5"
            calculation={`${detail.details?.downloads?.score || 0} + ${detail.details?.uses?.score || 0} + ${detail.details?.duration?.score || 0} = ${detail.usage_depth}分`}
          />
          <FormulaStep 
            title="互动热度 (350分)"
            formula="收藏×10 + 评分×20 + 评论×5"
            calculation={`${detail.details?.favorites?.score || 0} + ${detail.details?.ratings?.score || 0} + ${detail.details?.comments?.score || 0} = ${detail.interaction_heat}分`}
          />
          <FormulaStep 
            title="传播广度 (250分)"
            formula="分享×15 + 搜索点击×3 + 推荐曝光×0.1"
            calculation={`${detail.details?.shares?.score || 0} + ${detail.details?.search_clicks?.score || 0} + ${detail.details?.recommend_shows?.score || 0} = ${detail.spread_breadth}分`}
          />
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="font-bold text-green-700">
              人气指数 = {detail.usage_depth} + {detail.interaction_heat} + {detail.spread_breadth} = {detail.popularity_index}分
            </p>
          </div>
        </div>
      )}
      
      {awardType === 'innovation' && (
        <div className="space-y-3 text-sm">
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-mono font-bold text-center text-lg">
              总分 = 使用价值×35% + 质量水平×25% + 创新程度×20% + 推广效果×15% + 维护活跃度×5%
            </p>
          </div>
          <FormulaStep 
            title="使用价值 (35分)"
            formula="min(下载量 × 2, 35)"
            calculation={`min(${detail.stats?.total_downloads || 0} × 2, 35) = ${detail.usage_score}分`}
          />
          <FormulaStep 
            title="质量水平 (25分)"
            formula="README(10) + 标签(10) + 版本(5)"
            calculation={`${detail.quality_score}分`}
          />
          <FormulaStep 
            title="创新程度 (20分)"
            formula="min(复杂标签数 × 5, 20)"
            calculation={`= ${detail.innovation_score}分`}
          />
          <FormulaStep 
            title="推广效果 (15分)"
            formula="搜索×0.5 + 收藏×2 + 分享×3"
            calculation={`= ${detail.promotion_score}分`}
          />
          <FormulaStep 
            title="维护活跃度 (5分)"
            formula="max(0, 5 - 更新天数/30)"
            calculation={`= ${detail.maintenance_score}分`}
          />
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="font-bold text-green-700">
              总分 = {detail.usage_score} + {detail.quality_score} + {detail.innovation_score} + {detail.promotion_score} + {detail.maintenance_score} = {detail.total_score}分
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// 公式步骤组件
function FormulaStep({ title, formula, calculation }: { title: string; formula: string; calculation: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-gray-600 mt-1">公式: {formula}</p>
      <p className="text-blue-600 font-mono mt-1">计算: {calculation}</p>
    </div>
  )
}
