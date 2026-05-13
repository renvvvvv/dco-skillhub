// import { Card, CardContent } from '../shared/ui/card'

interface PopularityAwardTabProps {
  award: any
  candidates: any[]
  onViewDetail?: (slug: string) => void
}

export function PopularityAwardTab({ award, candidates, onViewDetail }: PopularityAwardTabProps) {
  return (
    <div className="space-y-8">
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

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">人气排行榜TOP10</h3>
        <div className="space-y-3">
          {candidates.length > 0 ? (
            candidates.map(candidate => (
              <div key={candidate.rank} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  candidate.rank <= 3 ? 'bg-gradient-to-r from-pink-50 to-red-50 border-pink-200' : 'bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  candidate.rank === 1 ? 'bg-pink-400 text-white' :
                  candidate.rank === 2 ? 'bg-gray-300 text-white' :
                  candidate.rank === 3 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {candidate.rank <= 3 ? ['🥇', '🥈', '🥉'][candidate.rank - 1] : candidate.rank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{candidate.skill_name}</p>
                  <p className="text-sm text-gray-500">
                    {candidate.author} · {candidate.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-600">{candidate.popularity_index}分</p>
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
