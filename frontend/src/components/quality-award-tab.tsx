// import { Card, CardContent } from '../shared/ui/card'

interface QualityAwardTabProps {
  award: any
  candidates: any[]
  onViewDetail?: (slug: string) => void
}

export function QualityAwardTab({ award, candidates, onViewDetail }: QualityAwardTabProps) {
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
            <p className="text-xl font-bold text-pink-600">按等级</p>
          </div>
        </div>
      </div>

      {/* 评分维度 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 评分维度</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {award.scoring && Object.entries(award.scoring).map(([key, criteria]: [string, any]) => (
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
          <ul className="space-y-2">
            {award.criteria.map((criterion: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 指标计算公式 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔢 指标计算公式</h3>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="font-mono text-lg text-center">
                总分 = 质量水平×40% + 使用价值×30% + 创新程度×20% + 维护活跃度×10%
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">质量水平（40分）</p>
                <p className="text-gray-600 mt-1">README完整度(15) + 标签丰富度(10) + 版本迭代(10) + 代码规范(5)</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">使用价值（30分）</p>
                <p className="text-gray-600 mt-1">min(下载量×1.5, 30)</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">创新程度（20分）</p>
                <p className="text-gray-600 mt-1">min(复杂标签数×5, 20)</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">维护活跃度（10分）</p>
                <p className="text-gray-600 mt-1">max(0, 10 - 更新天数/15)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 奖励规则 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">💰 奖励规则</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {award.rewards.map((reward: any) => (
            <div key={reward.level} className={`rounded-xl p-4 border ${
              reward.level === 'S' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' :
              reward.level === 'A' ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' :
              reward.level === 'B' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
              'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <div className="text-center">
                <p className="text-2xl font-bold">{reward.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">¥{reward.reward}</p>
                <p className="text-sm text-gray-500 mt-1">≥{reward.minScore}分</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 动态候选人TOP10 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏅 质量排行榜TOP10</h3>
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
                }`}
                >
                  {candidate.rank <= 3 ? ['🥇', '🥈', '🥉'][candidate.rank - 1] : candidate.rank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{candidate.skill_name}</p>
                  <p className="text-sm text-gray-500">
                    {candidate.author} · {candidate.department} · {candidate.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{candidate.total_score}分</p>
                  <p className="text-xs text-gray-400">
                    等级: {candidate.level}
                  </p>
                  {candidate.skill_slug && onViewDetail && (
                    <button
                      onClick={() => onViewDetail(candidate.skill_slug)}
                      className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      查看详情
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
    </div>
  )
}
