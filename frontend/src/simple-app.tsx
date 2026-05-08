import { useState, useEffect } from 'react'
import { getSkills, searchSkills, getSkill, publishSkill, updateSkill, deleteSkill, recordView, getStats, getKpi, getTrend, getRealtimeEvents, getSearchAnalysis, adminLogin, getPending, approveSkill, getAuditLogs, Skill, SkillDetail, StatsData, KpiData, TrendData, RealtimeEvent, SearchAnalysis, AuditLog } from './api/simple-client'
import { UploadZone } from './features/publish/upload-zone'
import { SearchBar } from './features/search/search-bar'
import { Button } from './shared/ui/button'
import { Input } from './shared/ui/input'
import { Label } from './shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './shared/ui/card'
import { StaffSearchInput, Staff, refreshStaffCache } from './components/StaffSearchInput'

const SKILL_TAGS = ['技术开发', '数据分析', '产品设计', '运维支撑', '项目管理', '市场营销']
const TAG_COLORS: Record<string, string> = {
  '技术开发': 'bg-blue-100 text-blue-700',
  '数据分析': 'bg-purple-100 text-purple-700',
  '产品设计': 'bg-pink-100 text-pink-700',
  '运维支撑': 'bg-green-100 text-green-700',
  '项目管理': 'bg-orange-100 text-orange-700',
  '市场营销': 'bg-red-100 text-red-700',
}

// 二级标签配置
const SUB_TAGS: Record<string, string[]> = {
  '技术开发': ['智航开发', '飞书开发', 'MCP开发', 'Agent开发', '自动化开发', '通用开发'],
  '数据分析': ['运维数据', '业务数据', '用户分析', '成本分析', '预测分析'],
  '产品设计': ['UI设计', '原型设计', '交互设计', '设计规范'],
  '运维支撑': ['智航运维', '飞书运维', '监控告警', '故障处理', '容量管理', '变更管理'],
  '项目管理': ['需求管理', '进度跟踪', '风险管控', '资源协调', '敏捷实践'],
  '市场营销': ['内容运营', '活动策划', '用户增长', '竞品分析', '品牌传播'],
}
const SUB_TAG_COLORS: Record<string, string> = {
  '智航开发': 'bg-blue-50 text-blue-600',
  '飞书开发': 'bg-blue-50 text-blue-600',
  'MCP开发': 'bg-blue-50 text-blue-600',
  'Agent开发': 'bg-blue-50 text-blue-600',
  '自动化开发': 'bg-blue-50 text-blue-600',
  '通用开发': 'bg-blue-50 text-blue-600',
  '运维数据': 'bg-purple-50 text-purple-600',
  '业务数据': 'bg-purple-50 text-purple-600',
  '用户分析': 'bg-purple-50 text-purple-600',
  '成本分析': 'bg-purple-50 text-purple-600',
  '预测分析': 'bg-purple-50 text-purple-600',
  'UI设计': 'bg-pink-50 text-pink-600',
  '原型设计': 'bg-pink-50 text-pink-600',
  '交互设计': 'bg-pink-50 text-pink-600',
  '设计规范': 'bg-pink-50 text-pink-600',
  '智航运维': 'bg-green-50 text-green-600',
  '飞书运维': 'bg-green-50 text-green-600',
  '监控告警': 'bg-green-50 text-green-600',
  '故障处理': 'bg-green-50 text-green-600',
  '容量管理': 'bg-green-50 text-green-600',
  '变更管理': 'bg-green-50 text-green-600',
  '需求管理': 'bg-orange-50 text-orange-600',
  '进度跟踪': 'bg-orange-50 text-orange-600',
  '风险管控': 'bg-orange-50 text-orange-600',
  '资源协调': 'bg-orange-50 text-orange-600',
  '敏捷实践': 'bg-orange-50 text-orange-600',
  '内容运营': 'bg-red-50 text-red-600',
  '活动策划': 'bg-red-50 text-red-600',
  '用户增长': 'bg-red-50 text-red-600',
  '竞品分析': 'bg-red-50 text-red-600',
  '品牌传播': 'bg-red-50 text-red-600',
}

const STATS_COLORS = ['from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-amber-500', 'from-red-500 to-pink-500']

const LOG_TYPE_COLORS: Record<string, string> = {
  'view': 'bg-blue-100 text-blue-700',
  'download': 'bg-green-100 text-green-700',
  'publish': 'bg-purple-100 text-purple-700',
  'update': 'bg-orange-100 text-orange-700',
  'approve': 'bg-emerald-100 text-emerald-700',
  'reject': 'bg-red-100 text-red-700',
  'delete_pending': 'bg-orange-100 text-orange-700',
  'delete': 'bg-red-100 text-red-700',
  'search': 'bg-cyan-100 text-cyan-700',
}

const LOG_TYPE_LABELS: Record<string, string> = {
  'view': '浏览', 'download': '下载', 'publish': '发布', 'update': '更新', 'approve': '通过', 'reject': '拒绝', 'delete_pending': '删除申请', 'delete': '删除', 'search': '搜索',
}

// 二级标签多选组件
function TagMultiSelect({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  
  // 同步外部value变化到selectedParents
  useEffect(() => {
    const parents = SKILL_TAGS.filter(p => value.some(t => (SUB_TAGS[p] || []).includes(t)))
    setSelectedParents(parents)
  }, [value])
  
  function toggleParent(parent: string) {
    const next = selectedParents.includes(parent) 
      ? selectedParents.filter(p => p !== parent)
      : [...selectedParents, parent]
    setSelectedParents(next)
    // 清除该父标签下已选的子标签
    if (selectedParents.includes(parent)) {
      const subTags = SUB_TAGS[parent] || []
      onChange(value.filter(t => !subTags.includes(t)))
    }
  }
  
  function toggleSubTag(_parent: string, subTag: string) {
    const selected = value.includes(subTag)
    const next = selected ? value.filter(t => t !== subTag) : [...value, subTag]
    onChange(next)
  }
  
  return (
    <div className="space-y-3">
      {/* 一级标签 */}
      <div className="flex flex-wrap gap-2">
        {SKILL_TAGS.map(tag => {
          const selected = selectedParents.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleParent(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selected ? `${TAG_COLORS[tag]} border-transparent` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {selected && <span className="mr-1">✓</span>}{tag}
            </button>
          )
        })}
      </div>
      {/* 二级标签 */}
      {selectedParents.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-200">
          {selectedParents.map(parent => (
            <div key={parent} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium mr-1">{parent}:</span>
              {(SUB_TAGS[parent] || []).map(subTag => {
                const selected = value.includes(subTag)
                return (
                  <button
                    key={subTag}
                    type="button"
                    onClick={() => toggleSubTag(parent, subTag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${selected ? `${SUB_TAG_COLORS[subTag] || 'bg-gray-100 text-gray-700'} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                  >
                    {selected && <span className="mr-0.5">✓</span>}{subTag}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 标签展示组件（支持一级和二级标签）
function TagDisplay({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || SUB_TAG_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
      ))}
    </div>
  )
}

// 排名条形组件
function RankBar({ items, valueKey, labelKey, colorIndex = 0 }: { items: any[]; valueKey: string; labelKey: string; colorIndex?: number }) {
  if (!items || items.length === 0) return <p className="text-gray-400 text-sm">暂无数据</p>
  const max = Math.max(...items.map(i => i[valueKey]))
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct = max > 0 ? (item[valueKey] / max) * 100 : 0
        const color = STATS_COLORS[(colorIndex + idx) % STATS_COLORS.length]
        return (
          <div key={item[labelKey]} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 truncate max-w-[70%]">{idx + 1}. {item[labelKey]}</span>
              <span className="text-sm font-bold text-gray-900">{item[valueKey]}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 环形图组件（纯CSS）
function DonutChart({ items }: { items: { name: string; count: number }[] }) {
  if (!items || items.length === 0) return <p className="text-gray-400 text-sm">暂无数据</p>
  const total = items.reduce((s, i) => s + i.count, 0)
  let acc = 0
  const segments = items.map((item, idx) => {
    const pct = total > 0 ? (item.count / total) * 100 : 0
    const start = acc
    acc += pct
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    return { ...item, pct, start, color: colors[idx % colors.length] }
  })
  const gradient = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ')
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 shrink-0">
        <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{total}</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {segments.map(s => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-gray-600 truncate">{s.name}</span>
            <span className="text-sm font-bold text-gray-900 ml-auto">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 区域柱状图组件
function RegionBarChart({ items }: { items: { id: string; name: string; count: number }[] }) {
  if (!items || items.length === 0) return <p className="text-gray-400 text-sm">暂无数据</p>
  const max = Math.max(...items.map(i => i.count), 1)
  const regionColors: Record<string, string> = {
    'hq': 'from-gray-500 to-gray-600',
    'hb1': 'from-red-500 to-rose-500',
    'xs': 'from-orange-500 to-amber-500',
    'hb2': 'from-yellow-500 to-amber-500',
    'hb3': 'from-green-500 to-emerald-500',
    'hd1': 'from-teal-500 to-cyan-500',
    'hd2': 'from-blue-500 to-indigo-500',
    'hn': 'from-indigo-500 to-purple-500',
    'hg': 'from-purple-500 to-pink-500',
    'qt': 'from-pink-500 to-rose-500',
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const pct = max > 0 ? (item.count / max) * 100 : 0
        const color = regionColors[item.id] || 'from-gray-400 to-gray-500'
        return (
          <div key={item.id} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
              <span className="text-sm font-bold text-gray-900">{item.count}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ========== 运营驾驶舱组件 ==========

// KPI 卡片
function KpiCard({ title, value, subValue, icon, color }: { title: string; value: number; subValue?: string; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <span className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-sm`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
    </div>
  )
}

// 趋势折线图（SVG）
function TrendLineChart({ data, height = 200 }: { data: TrendData | undefined; height?: number }) {
  if (!data || !data.dates || data.dates.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">暂无趋势数据</p>
  }

  const series = data.series
  const allValues = [...series.views, ...series.downloads, ...series.publishes]
  const maxVal = Math.max(...allValues, 1)
  const minVal = Math.min(...allValues, 0)
  const range = maxVal - minVal || 1
  const width = 600
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const getX = (i: number) => padding.left + (i / (data.dates.length - 1 || 1)) * chartW
  const getY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH

  const colors = {
    views: '#8b5cf6',
    downloads: '#ec4899',
    publishes: '#10b981',
  }

  const buildPath = (values: number[]) => {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ')
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + chartH * (1 - pct)
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padding.left - 5} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{Math.round(minVal + range * pct)}</text>
            </g>
          )
        })}
        {/* Lines */}
        {(Object.keys(series) as Array<keyof typeof series>).filter(k => k !== 'searches' && k !== 'unique_users').map(key => (
          <path key={key} d={buildPath(series[key])} fill="none" stroke={colors[key as keyof typeof colors] || '#6b7280'} strokeWidth={2} />
        ))}
        {/* X axis labels */}
        {data.dates.map((d, i) => (
          <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize={10} fill="#9ca3af">
            {d.slice(5)}
          </text>
        ))}
        {/* Legend */}
        <g transform={`translate(${width - 140}, 10)`}>
          {Object.entries(colors).map(([key, color], i) => (
            <g key={key} transform={`translate(0, ${i * 18})`}>
              <line x1={0} y1={6} x2={16} y2={6} stroke={color} strokeWidth={2} />
              <text x={22} y={10} fontSize={11} fill="#6b7280">{key === 'views' ? '浏览' : key === 'downloads' ? '下载' : '发布'}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

// 活动流组件
function ActivityStream({ events }: { events: RealtimeEvent[] }) {
  if (!events || events.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">暂无活动</p>
  }

  const typeIcons: Record<string, string> = {
    'skill.view': '👁',
    'skill.download': '⬇',
    'skill.publish': '📦',
    'search': '🔍',
    'tag.click': '🏷',
    'admin.action': '⚙',
    'page.view': '📄',
  }

  const typeColors: Record<string, string> = {
    'skill.view': 'bg-purple-100 text-purple-600',
    'skill.download': 'bg-pink-100 text-pink-600',
    'skill.publish': 'bg-emerald-100 text-emerald-600',
    'search': 'bg-blue-100 text-blue-600',
    'tag.click': 'bg-orange-100 text-orange-600',
    'admin.action': 'bg-gray-100 text-gray-600',
    'page.view': 'bg-gray-100 text-gray-600',
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
      {events.map(e => (
        <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${typeColors[e.type] || 'bg-gray-100 text-gray-600'}`}>
            {typeIcons[e.type] || '•'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{e.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {e.user && <span className="text-xs text-gray-400">{e.user}</span>}
              <span className="text-xs text-gray-300">{formatTime(e.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 搜索分析组件
function SearchAnalysisPanel({ data }: { data: SearchAnalysis | undefined }) {
  if (!data) return <p className="text-gray-400 text-sm text-center py-8">暂无数据</p>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{data.total_searches}</div>
          <div className="text-xs text-gray-500">总搜索</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{data.zero_result_rate}%</div>
          <div className="text-xs text-gray-500">零结果率</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{data.unique_queries || data.top_queries?.length || 0}</div>
          <div className="text-xs text-gray-500">不同关键词</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">热搜关键词</h4>
        <div className="flex flex-wrap gap-2">
          {data.top_queries?.slice(0, 10).map((q, i) => (
            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
              {q.query} <span className="text-blue-400">({q.count})</span>
            </span>
          )) || <span className="text-xs text-gray-400">暂无数据</span>}
        </div>
      </div>

      {data.zero_result_queries && data.zero_result_queries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-2">零结果搜索</h4>
          <div className="flex flex-wrap gap-2">
            {data.zero_result_queries.slice(0, 5).map((q, i) => (
              <span key={i} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                {q.query} <span className="text-red-400">({q.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 运营驾驶舱主组件
function StatsView() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [trend, setTrend] = useState<TrendData | null>(null)
  const [realtime, setRealtime] = useState<RealtimeEvent[]>([])
  const [searchAnalysis, setSearchAnalysis] = useState<SearchAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, kpiRes, trendRes, realtimeRes, searchRes] = await Promise.all([
          getStats(),
          getKpi(),
          getTrend(timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30),
          getRealtimeEvents(15),
          getSearchAnalysis(7),
        ])
        setStats(statsRes.data)
        setKpi(kpiRes.data)
        setTrend(trendRes.data)
        setRealtime(realtimeRes.data || [])
        setSearchAnalysis(searchRes.data)
      } catch (err) {
        console.error('加载统计失败', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()

    // 实时活动流轮询
    const interval = setInterval(async () => {
      try {
        const res = await getRealtimeEvents(15)
        setRealtime(res.data || [])
      } catch (e) {
        // ignore
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载运营数据...</p>
      </div>
    )
  }

  const kpiData = kpi?.[timeRange] || kpi?.today
  const downloadSorted = stats ? [...stats.skills].sort((a, b) => b.downloads - a.downloads).slice(0, 10) : []
  const devSorted = stats ? [...stats.developers].sort((a, b) => b.count - a.count).slice(0, 10) : []

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SkillHub 运营驾驶舱</h2>
          <p className="text-sm text-gray-500 mt-1">实时监控技能市场运营数据</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'today' ? '今日' : r === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* 平台累计概览 */}
      {stats?.overview && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <span>📊</span> 平台累计数据
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: '技能总数', value: stats.overview.skills_total, icon: '📦', color: 'bg-emerald-500' },
              { label: '版本总数', value: stats.overview.versions_total, icon: '🏷', color: 'bg-violet-500' },
              { label: '作者人数', value: stats.overview.authors_total, icon: '👤', color: 'bg-orange-500' },
              { label: '部门覆盖', value: stats.overview.departments_total, icon: '🏢', color: 'bg-blue-500' },
              { label: '标签种类', value: stats.overview.tags_total, icon: '🏷', color: 'bg-pink-500' },
              { label: '待审核', value: stats.overview.pending_total, icon: '⏳', color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white text-lg mx-auto mb-2`}>
                  {item.icon}
                </div>
                <div className="text-xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="技能发布" value={kpiData?.skills_total || 0} icon="📦" color="bg-emerald-500" />
        <KpiCard title="下载次数" value={kpiData?.downloads || 0} icon="⬇" color="bg-pink-500" />
        <KpiCard title="浏览次数" value={kpiData?.views || 0} icon="👁" color="bg-purple-500" />
        <KpiCard title="搜索次数" value={kpiData?.searches || 0} icon="🔍" color="bg-blue-500" />
        <KpiCard title="活跃用户" value={kpiData?.unique_users || 0} icon="👤" color="bg-orange-500" />
      </div>

      {/* 趋势图 + 活动流 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm">📈</span>
              趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={trend || undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm">⚡</span>
              实时活动
              <span className="ml-auto flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityStream events={realtime} />
          </CardContent>
        </Card>
      </div>

      {/* 排行榜 + 区域分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm">⬇</span>
              技能下载排行榜
            </CardTitle>
          </CardHeader>
          <CardContent><RankBar items={downloadSorted} valueKey="downloads" labelKey="name" colorIndex={0} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm">🏢</span>
              区域上传分布
            </CardTitle>
          </CardHeader>
          <CardContent><RegionBarChart items={stats?.regions || []} /></CardContent>
        </Card>
      </div>

      {/* 搜索分析 + 个人排行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm">🔍</span>
              搜索分析
            </CardTitle>
          </CardHeader>
          <CardContent><SearchAnalysisPanel data={searchAnalysis || undefined} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm">👤</span>
              个人上传排行榜
            </CardTitle>
          </CardHeader>
          <CardContent><RankBar items={devSorted} valueKey="count" labelKey="name" colorIndex={3} /></CardContent>
        </Card>
      </div>

      {/* 原有补充卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.centers && stats.centers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm">🏛</span>
                  职能中心上传分布
                </CardTitle>
              </CardHeader>
              <CardContent><DonutChart items={stats.centers} /></CardContent>
            </Card>
          )}

          {stats.datacenters && stats.datacenters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm">🖥</span>
                  数据中心上传分布
                </CardTitle>
              </CardHeader>
              <CardContent><RankBar items={stats.datacenters.slice(0, 10)} valueKey="count" labelKey="name" colorIndex={1} /></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// 密码验证弹窗
function AdminLoginDialog({ isOpen, onLogin, onClose }: { isOpen: boolean; onLogin: (token: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    try {
      setIsSubmitting(true)
      setError('')
      console.log('[AdminLogin] 提交密码:', password)
      const result = await adminLogin(password)
      console.log('[AdminLogin] 登录成功:', result)
      onLogin(result.data?.token || (result as any).token)
    } catch (err: any) {
      console.error('[AdminLogin] 登录失败:', err.message || err)
      setError('密码错误: ' + (err.message || '未知错误'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">管理控制台</h2>
          <p className="text-sm text-gray-500 mt-1">请输入密码进入</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" className="text-center" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-pink-500 to-purple-500">{isSubmitting ? '验证中...' : '进入'}</Button>
          <Button type="button" variant="outline" onClick={onClose} className="w-full">取消</Button>
        </form>
      </div>
    </div>
  )
}

// 管理控制台组件
function AdminView({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'pending' | 'logs'>('pending')
  const [pendingSkills, setPendingSkills] = useState<Skill[]>([])
  const [pendingVersions, setPendingVersions] = useState<any[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logType, setLogType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logPage, setLogPage] = useState(0)
  const [logTotal, setLogTotal] = useState(0)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const token = 'admin'

  async function loadPending() {
    setIsLoading(true)
    try {
      const result = await getPending(token)
      setPendingSkills(result.data.skills)
      setPendingVersions(result.data.versions)
    } catch (err) {
      alert('加载失败: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadLogs(page = 0) {
    setIsLoading(true)
    try {
      const result = await getAuditLogs(token, { type: logType || undefined, page, size: 20 })
      setLogs(result.data.content)
      setLogTotal(result.data.totalPages)
      setLogPage(result.data.number)
    } catch (err) {
      alert('加载失败: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pending') loadPending()
    else loadLogs(0)
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'logs') loadLogs(0)
  }, [logType])

  async function handleApprove(slug: string, action: 'approve' | 'reject' | 'delete') {
    const reason = action === 'reject' ? prompt('请输入拒绝原因:') : action === 'delete' ? prompt('请输入删除原因:') : ''
    if ((action === 'reject' || action === 'delete') && reason === null) return
    try {
      await approveSkill(token, slug, action, reason || undefined)
      alert(action === 'approve' ? '审核通过' : action === 'delete' ? '已删除' : '已拒绝')
      loadPending()
    } catch (err) {
      alert('操作失败: ' + (err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">上线与管理</h2>
          <p className="text-gray-500 text-sm">技能审核与系统日志</p>
        </div>
        <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700">退出登录</button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📋 待审核</button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>📝 日志查询</button>
      </div>

      {isLoading && <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto"></div></div>}

      {!isLoading && activeTab === 'pending' && (
        <div className="space-y-6">
          {/* 待审核技能 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">待审核技能 ({pendingSkills.length})</CardTitle></CardHeader>
            <CardContent>
              {pendingSkills.length === 0 ? <p className="text-gray-400 text-sm">暂无待审核技能</p> : (
                <div className="space-y-3">
                  {pendingSkills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">{skill.name}</p>
                        <p className="text-sm text-gray-500">作者: {skill.author_name} | 部门: {(skill as any).author_department || '-'} | 版本: {skill.latest_version}</p>
                        <p className="text-xs text-gray-400 mt-1">提交时间: {new Date(skill.created_at).toLocaleString()}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${(skill as any).status === 'delete_pending' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{(skill as any).status === 'delete_pending' ? '删除申请' : '审核中'}</span>
                      </div>
                      <div className="flex gap-2">
                        {(skill as any).status === 'delete_pending' ? (
                          <>
                            <button onClick={() => handleApprove(skill.slug, 'delete')} className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">确认删除</button>
                            <button onClick={() => handleApprove(skill.slug, 'reject')} className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">驳回</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingSkill(skill)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">查看编辑</button>
                            <button onClick={() => handleApprove(skill.slug, 'approve')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">同意发布</button>
                            <button onClick={() => handleApprove(skill.slug, 'reject')} className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">拒绝</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 待审核版本 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">待审核版本 ({pendingVersions.length})</CardTitle></CardHeader>
            <CardContent>
              {pendingVersions.length === 0 ? <p className="text-gray-400 text-sm">暂无待审核版本</p> : (
                <div className="space-y-3">
                  {pendingVersions.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">{v.skill_name}</p>
                        <p className="text-sm text-gray-500">新版本: {v.version} | 标签: {v.tag}</p>
                        <p className="text-xs text-gray-400 mt-1">提交时间: {new Date(v.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(v.skill_slug, 'approve')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">通过</button>
                        <button onClick={() => handleApprove(v.skill_slug, 'reject')} className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">拒绝</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setLogType('')} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${!logType ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>全部</button>
            {Object.entries(LOG_TYPE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setLogType(key)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${logType === key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">时间</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">类型</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">技能</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">IP</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">用户</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LOG_TYPE_COLORS[log.type] || 'bg-gray-100 text-gray-600'}`}>{LOG_TYPE_LABELS[log.type] || log.type}</span></td>
                        <td className="px-4 py-3 text-gray-900">{log.skill_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                        <td className="px-4 py-3 text-gray-600">{log.user || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{log.detail}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无日志</td></tr>}
                  </tbody>
                </table>
              </div>
              {logTotal > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <button onClick={() => loadLogs(logPage - 1)} disabled={logPage <= 0} className="px-3 py-1 rounded-lg text-sm border hover:bg-gray-50 disabled:opacity-30">上一页</button>
                  <span className="px-3 py-1 text-sm text-gray-600">第 {logPage + 1} / {logTotal} 页</span>
                  <button onClick={() => loadLogs(logPage + 1)} disabled={logPage >= logTotal - 1} className="px-3 py-1 rounded-lg text-sm border hover:bg-gray-50 disabled:opacity-30">下一页</button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {editingSkill && (
        <编辑SkillDialog
          skill={editingSkill as any}
          isOpen={true}
          onClose={() => setEditingSkill(null)}
          onSave={() => { setEditingSkill(null); loadPending() }}
        />
      )}
    </div>
  )
}

// 更新 Dialog
function 更新Dialog({ skill, isOpen, onClose, onSuccess }: { 
  skill: SkillDetail | null, isOpen: boolean, onClose: () => void, onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [version, set版本号] = useState('')
  const [tag, set标签] = useState('稳定版')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !skill) { alert('请选择文件'); return }
    const formData = new FormData()
    formData.append('skillZip', file)
    formData.append('version', version)
    formData.append('tag', tag)
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/skills/${skill.slug}/versions`, { method: 'POST', body: formData })
      if (!response.ok) { const error = await response.json(); throw new Error(error.detail || '更新 failed') }
      alert('版本号 updated successfully!')
      onSuccess()
      onClose()
    } catch (err) { alert('更新 failed: ' + (err as Error).message) }
    finally { setIsSubmitting(false) }
  }
  if (!isOpen || !skill) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">更新 Skill 版本号</h2>
          <p className="text-sm text-gray-500 mt-1">{skill.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><Label>New 版本号 Package (ZIP/TAR.GZ/7Z/RAR)</Label><div className="mt-2"><UploadZone onFileSelect={setFile} />{file && <p className="mt-2 text-sm text-green-600">已选择: {file.name}</p>}</div></div>
          <div><Label htmlFor="update版本号">版本号</Label><Input id="update版本号" value={version} onChange={(e) => set版本号(e.target.value)} placeholder="例如: 1.1.0" required /></div>
          <div><Label htmlFor="update标签">标签</Label><select id="update标签" value={tag} onChange={(e) => set标签(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="稳定版">Stable</option><option value="测试版">Beta</option></select></div>
          <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose} className="flex-1">取消</Button><Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">{isSubmitting ? '更新中...' : 'Confirm 更新'}</Button></div>
        </form>
      </div>
    </div>
  )
}

// 编辑 Skill Dialog
function 编辑SkillDialog({ skill, isOpen, onClose, onSave }: {
  skill: SkillDetail | null, isOpen: boolean, onClose: () => void, onSave: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmployeeId, setAuthorEmployeeId] = useState('')
  const [authorDepartment, setAuthorDepartment] = useState('')
  const [authorOrganization, setAuthorOrganization] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (skill) {
      setName(skill.name)
      setDescription(skill.description || '')
      // @ts-ignore
      setAuthorName(skill.author_name || '')
      // @ts-ignore
      setAuthorEmployeeId(skill.author_employee_id || '')
      // @ts-ignore
      setAuthorDepartment(skill.author_department || '')
      // @ts-ignore
      setAuthorOrganization(skill.author_organization || '')
      setTags(skill.tags || [])
    }
  }, [skill, isOpen])

  function handleStaffSelect(staff: Staff) {
    setAuthorName(staff.name)
    setAuthorEmployeeId(staff.new_employee_id || staff.employee_id || '')
    setAuthorDepartment(staff.department)
    setAuthorOrganization(staff.organization)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!skill) return
    if (!name.trim()) { alert('请输入技能名称'); return }
    // 简介无字数限制
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('description', description.trim())
    formData.append('authorName', authorName)
    formData.append('authorEmail', skill.author_email || '')
    formData.append('authorEmployeeId', authorEmployeeId)
    formData.append('authorDepartment', authorDepartment)
    formData.append('authorOrganization', authorOrganization)
    formData.append('tags', tags.join(','))
    try {
      await updateSkill(skill.slug, formData)
      // 刷新人员缓存，确保新人员下次能搜到
      refreshStaffCache()
      alert('保存成功!')
      onSave()
      onClose()
    } catch (err) {
      alert('保存失败: ' + (err as Error).message)
    }
  }

  if (!isOpen || !skill) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">编辑 Skill</h2>
          <p className="text-sm text-gray-500 mt-1">{skill.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><Label htmlFor="editName">技能名称</Label><Input id="editName" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label htmlFor="editDescription">技能简介</Label><Input id="editDescription" value={description} onChange={(e) => setDescription(e.target.value)} /></div>

          <div><Label>人员搜索</Label><div className="mt-2"><StaffSearchInput onSelect={handleStaffSelect} placeholder="输入姓名或工号搜索..." /></div></div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="editAuthorName">作者名称</Label><Input id="editAuthorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} /></div>
            <div><Label htmlFor="editAuthorEmployeeId">作者工号</Label><Input id="editAuthorEmployeeId" value={authorEmployeeId} onChange={(e) => setAuthorEmployeeId(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="editAuthorDepartment">部门</Label><Input id="editAuthorDepartment" value={authorDepartment} onChange={(e) => setAuthorDepartment(e.target.value)} /></div>
            <div><Label htmlFor="editAuthorOrganization">组织</Label><Input id="editAuthorOrganization" value={authorOrganization} onChange={(e) => setAuthorOrganization(e.target.value)} /></div>
          </div>

          <div><Label>标签</Label><div className="mt-2"><TagMultiSelect value={tags} onChange={setTags} /></div></div>

          <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose} className="flex-1">取消</Button><Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">保存</Button></div>
        </form>
      </div>
    </div>
  )
}

import { StartPage } from './start-page'

// Skill Card
function SimpleSkillCard({ skill, onClick, onDelete }: { skill: Skill; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const isPending = skill.status === 'pending'
  const isDeletePending = (skill as any).status === 'delete_pending'
  return (
    <Card className={`cursor-pointer hover:shadow-lg transition-shadow relative group ${isDeletePending ? 'opacity-50' : ''}`}>
      <div onClick={onClick}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{skill.name}</CardTitle>
            {isPending && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">审核中</span>}
            {isDeletePending && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">删除审核中</span>}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2">{skill.description || '暂无描述'}</p>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500"><span>作者: {skill.author_name}</span><span>下载: {skill.download_count}</span></div>
          <div className="mt-3 flex items-center justify-between">
            <TagDisplay tags={skill.tags} />
            <span className="px-2 py-1 bg-gray-100 rounded text-xs shrink-0">v{skill.latest_version}</span>
          </div>
        </CardContent>
      </div>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        title="删除 Skill"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </Card>
  )
}

// Main App
export function SimpleApp() {
  const [currentView, setCurrentView] = useState<'start' | 'home' | 'publish' | 'detail' | 'stats' | 'admin'>('start')
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [is更新DialogOpen, setIs更新DialogOpen] = useState(false)
  const [is编辑DialogOpen, setIs编辑DialogOpen] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [activeSubTags, setActiveSubTags] = useState<string[]>([])
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const PAGE_SIZE = 12

  useEffect(() => { if (currentView !== 'start') { loadSkills(0) } }, [currentView])

  // 构建筛选用的标签列表
  // 规则：如果只选了一级标签（没选其二级标签），则展示该分类下所有技能（含所有二级标签）
  //       如果选了二级标签，则只展示该二级标签的技能
  function getFilterTags() {
    // 如果有选中的二级标签，只用二级标签筛选（更精确）
    if (activeSubTags.length > 0) {
      return activeSubTags
    }
    // 如果只选了一级标签，展开为该分类下所有标签（一级+所有二级）
    const tags = new Set<string>()
    activeTags.forEach(parent => {
      tags.add(parent)
      ;(SUB_TAGS[parent] || []).forEach(sub => tags.add(sub))
    })
    return Array.from(tags)
  }

  async function loadSkills(page = 0) {
    try {
      setIsLoading(true); setError(null)
      setCurrentPage(page)
      const filterTags = getFilterTags()
      const params = { page, size: PAGE_SIZE, ...(filterTags.length > 0 ? { tags: filterTags.join(',') } : {}) }
      console.log('[loadSkills] Request params:', params)
      const result = await getSkills(params)
      console.log('[loadSkills] Response:', result.data.totalElements, 'items,', result.data.totalPages, 'pages')
      setSkills(result.data.content)
      setTotalPages(result.data.totalPages)
    }
    catch (err) { setError('加载失败: ' + (err as Error).message) }
    finally { setIsLoading(false) }
  }

  // 搜索筛选状态
  const [searchFilters, setSearchFilters] = useState<{ author?: string; department?: string; tag?: string }>({})

  async function handle搜索(query: string, filters?: { author?: string; department?: string; tag?: string }) {
    // 保存搜索关键词，用于翻页时保持搜索状态
    if (query.trim()) setSearchQuery(query)
    // 保存筛选条件
    if (filters) setSearchFilters(filters)
    const effectiveFilters = filters || searchFilters
    const q = query.trim() || searchQuery
    // 无关键词且无筛选条件时，回到列表模式
    if (!q && !effectiveFilters.author && !effectiveFilters.department && !effectiveFilters.tag) { 
      loadSkills(0); return 
    }
    try {
      setIsLoading(true)
      setCurrentPage(0)
      const result = await searchSkills(q, effectiveFilters)
      let results = result.data.content
      // 本地标签筛选（与后端筛选叠加）
      const filterTags = getFilterTags()
      if (filterTags.length > 0) {
        results = results.filter(s => filterTags.some(t => (s.tags || []).includes(t)))
      }
      // 本地分页
      const total = results.length
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
      setSkills(results.slice(0, PAGE_SIZE))
    }
    catch (err) { setError('搜索 failed: ' + (err as Error).message) }
    finally { setIsLoading(false) }
  }

  async function handle搜索翻页(page: number) {
    const q = searchQuery
    const effectiveFilters = searchFilters
    if (!q && !effectiveFilters.author && !effectiveFilters.department && !effectiveFilters.tag) { 
      loadSkills(page); return 
    }
    try {
      setIsLoading(true)
      setCurrentPage(page)
      const result = await searchSkills(q, effectiveFilters)
      let results = result.data.content
      const filterTags = getFilterTags()
      if (filterTags.length > 0) {
        results = results.filter(s => filterTags.some(t => (s.tags || []).includes(t)))
      }
      const total = results.length
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
      setSkills(results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE))
    }
    catch (err) { setError('搜索 failed: ' + (err as Error).message) }
    finally { setIsLoading(false) }
  }

  function toggleTag(tag: string) {
    const next = activeTags.includes(tag) ? activeTags.filter(t => t !== tag) : [...activeTags, tag]
    setActiveTags(next)
    // 取消一级标签时，清除对应的二级标签
    if (activeTags.includes(tag)) {
      const subTagsForCategory = SUB_TAGS[tag] || []
      setActiveSubTags(prev => prev.filter(t => !subTagsForCategory.includes(t)))
    }
  }

  function toggleSubTag(tag: string) {
    const next = activeSubTags.includes(tag) ? activeSubTags.filter(t => t !== tag) : [...activeSubTags, tag]
    setActiveSubTags(next)
  }

  useEffect(() => {
    if (currentView === 'home') loadSkills(0)
  }, [activeTags, activeSubTags])

  async function handleSkillClick(slug: string) {
    try {
      await recordView(slug)
      const result = await getSkill(slug)
      setSelectedSkill(result.data)
      setCurrentView('detail')
    }
    catch (err) { alert('加载详情失败: ' + (err as Error).message) }
  }

  async function handleDeleteSkill(e: React.MouseEvent, slug: string) {
    e.stopPropagation()
    if (!confirm('确定要删除这个 Skill 吗？删除申请将提交给管理员审批。')) return
    try {
      await deleteSkill(slug)
      alert('删除申请已提交，等待管理员审批!')
      loadSkills()
    } catch (err) {
      alert('删除失败: ' + (err as Error).message)
    }
  }

  async function handleEditSuccess() {
    if (!selectedSkill) return
    const result = await getSkill(selectedSkill.slug)
    setSelectedSkill(result.data)
    setSkills(prev => prev.map(s => s.slug === selectedSkill.slug ? result.data as Skill : s))
  }

  function handleAdminClick() {
    if (adminToken) {
      setCurrentView('admin')
    } else {
      setShowAdminLogin(true)
    }
  }

  function handleAdminLogin(token: string) {
    setAdminToken(token)
    setShowAdminLogin(false)
    setCurrentView('admin')
  }

  function handleAdminLogout() {
    setAdminToken(null)
    setCurrentView('home')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 onClick={() => setCurrentView('start')} className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent cursor-pointer">DCO SkillHub</h1>
            <nav className="hidden sm:flex bg-gray-100/80 p-1 rounded-xl">
              {[{ key: 'start', label: '开始' }, { key: 'home', label: '浏览' }, { key: 'publish', label: '发布' }, { key: 'stats', label: '展示' }, { key: 'admin', label: '上线与管理' }].map((item) => (
                <button key={item.key} onClick={() => item.key === 'admin' ? handleAdminClick() : setCurrentView(item.key as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentView === item.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{item.label}</button>
              ))}
            </nav>
            <div className="sm:hidden">
              <select value={currentView} onChange={(e) => { const v = e.target.value; v === 'admin' ? handleAdminClick() : setCurrentView(v as any) }} className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-pink-500">
                <option value="start">开始</option><option value="home">浏览</option><option value="publish">发布</option><option value="stats">展示</option><option value="admin">上线与管理</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main>
        {currentView === 'start' && <StartPage onEnter={() => setCurrentView('home')} />}
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">发现与分享技能</h2>
                <div className="max-w-2xl mx-auto"><SearchBar onSearch={handle搜索} availableTags={SKILL_TAGS} /></div>
                {/* 一级标签 */}
                <div className="max-w-2xl mx-auto mt-4 flex flex-wrap justify-center gap-2">
                  {SKILL_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTags.includes(tag) ? `${TAG_COLORS[tag]} border-transparent shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                      {activeTags.includes(tag) && <span className="mr-1">✓</span>}{tag}
                    </button>
                  ))}
                  {(activeTags.length > 0 || activeSubTags.length > 0) && (
                    <button onClick={() => { setActiveTags([]); setActiveSubTags([]) }} className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">清除全部</button>
                  )}
                </div>
                {/* 二级标签 */}
                {activeTags.length > 0 && (
                  <div className="max-w-2xl mx-auto mt-3 flex flex-wrap justify-center gap-2">
                    {activeTags.map(parentTag => (
                      <div key={parentTag} className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-400 font-medium">{parentTag}:</span>
                        {(SUB_TAGS[parentTag] || []).map(subTag => (
                          <button
                            key={subTag}
                            onClick={() => toggleSubTag(subTag)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${activeSubTags.includes(subTag) ? `${SUB_TAG_COLORS[subTag] || 'bg-gray-100 text-gray-700'} border-transparent shadow-sm` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                          >
                            {activeSubTags.includes(subTag) && <span className="mr-0.5">✓</span>}{subTag}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isLoading && <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div><p className="mt-4 text-gray-500">加载中...</p></div>}
              {error && <div className="text-center py-12"><p className="text-red-500 mb-4">{error}</p><Button onClick={() => loadSkills(currentPage)}>重试</Button></div>}
              {!isLoading && !error && skills.length === 0 && <div className="text-center py-12"><p className="text-gray-500">暂无技能</p></div>}
              {!isLoading && !error && skills.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{skills.map(skill => <SimpleSkillCard key={skill.id} skill={skill} onClick={() => handleSkillClick(skill.slug)} onDelete={(e) => handleDeleteSkill(e, skill.slug)} />)}</div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Button variant="outline" size="sm" onClick={() => handle搜索翻页(currentPage - 1)} disabled={currentPage <= 0}>上一页</Button>
                      <span className="px-4 py-1.5 rounded-lg bg-gray-100 text-sm font-medium">第 {currentPage + 1} / {totalPages} 页</span>
                      <Button variant="outline" size="sm" onClick={() => handle搜索翻页(currentPage + 1)} disabled={currentPage >= totalPages - 1}>下一页</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {currentView === 'publish' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <发布View onSuccess={() => { loadSkills(); setCurrentView('home') }} />
          </div>
        )}
        {currentView === 'detail' && selectedSkill && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DetailView skill={selectedSkill} on返回={() => setCurrentView('home')} on更新={() => setIs更新DialogOpen(true)} on编辑={() => setIs编辑DialogOpen(true)} />
          </div>
        )}
        {currentView === 'stats' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <StatsView />
          </div>
        )}
        {currentView === 'admin' && adminToken && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminView onLogout={handleAdminLogout} />
          </div>
        )}
      </main>

      <更新Dialog skill={selectedSkill} isOpen={is更新DialogOpen} onClose={() => setIs更新DialogOpen(false)} onSuccess={loadSkills} />
      <编辑SkillDialog skill={selectedSkill} isOpen={is编辑DialogOpen} onClose={() => setIs编辑DialogOpen(false)} onSave={() => { handleEditSuccess(); loadSkills() }} />
      <AdminLoginDialog isOpen={showAdminLogin} onLogin={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />
    </div>
  )
}

// 发布 View
function 发布View({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [authorEmployeeId, setAuthorEmployeeId] = useState('')
  const [authorDepartment, setAuthorDepartment] = useState('')
  const [authorOrganization, setAuthorOrganization] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [skillName, setSkillName] = useState('')
  const [skillDesc, setSkillDesc] = useState('')
  
  function handleStaffSelect(staff: Staff) {
    setAuthorName(staff.name)
    setAuthorEmployeeId(staff.new_employee_id || staff.employee_id || '')
    setAuthorDepartment(staff.department)
    setAuthorOrganization(staff.organization)
  }

  async function parseZip(file: File) {
    try {
      const formData = new FormData()
      formData.append('skillZip', file)
      const response = await fetch('/api/skills/parse', { method: 'POST', body: formData })
      if (!response.ok) { throw new Error('解析失败') }
      const result = await response.json()
      setSkillName(result.data.name)
      setSkillDesc(result.data.description)
    } catch (err) {
      console.error('解析ZIP失败:', err)
    }
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) { alert('请选择文件'); return }
    
    const nameValue = authorName.trim()
    if (!nameValue) { alert('请输入作者名称'); return }
    if (!skillName.trim()) { alert('技能名称不能为空'); return }
    
    const formData = new FormData()
    formData.append('skillZip', file)
    formData.append('authorName', nameValue)
    formData.append('authorEmployeeId', authorEmployeeId)
    formData.append('authorDepartment', authorDepartment)
    formData.append('authorOrganization', authorOrganization)
    formData.append('version', '1.0.0')
    formData.append('tag', 'stable')
    formData.append('tags', tags.join(','))
    formData.append('skillName', skillName.trim())
    formData.append('skillDescription', skillDesc.trim())
    try {
      setIsSubmitting(true)
      await publishSkill(formData)
      // 刷新人员缓存，确保新人员下次能搜到
      refreshStaffCache()
      alert('发布成功! 请等待管理员审核。')
      onSuccess()
    } catch (err) {
      alert('发布失败: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader><CardTitle>发布 New Skill</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>技能包 (ZIP/TAR.GZ/7Z/RAR)</Label><div className="mt-2"><UploadZone onFileSelect={(f) => { setFile(f); if (f) parseZip(f) }} />{file && <p className="mt-2 text-sm text-green-600">已选择: {file.name}</p>}</div></div>
          
          <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <h3 className="font-medium text-gray-900">技能信息</h3>
            <div><Label htmlFor="skillName">技能名称</Label><Input id="skillName" value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder={skillName ? '' : '上传后自动识别'} required /></div>
            <div><Label htmlFor="skillDesc">技能简介</Label><Input id="skillDesc" value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} placeholder={skillDesc ? '' : '上传后自动识别'} /></div>
          </div>
          
          <div><Label>人员搜索</Label><div className="mt-2"><StaffSearchInput onSelect={handleStaffSelect} placeholder="输入姓名或工号搜索..." /></div></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="authorName">作者名称</Label><Input id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required /></div>
            <div><Label htmlFor="authorEmployeeId">作者工号</Label><Input id="authorEmployeeId" value={authorEmployeeId} onChange={(e) => setAuthorEmployeeId(e.target.value)} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="authorDepartment">部门</Label><Input id="authorDepartment" value={authorDepartment} onChange={(e) => setAuthorDepartment(e.target.value)} /></div>
            <div><Label htmlFor="authorOrganization">组织</Label><Input id="authorOrganization" value={authorOrganization} onChange={(e) => setAuthorOrganization(e.target.value)} /></div>
          </div>

          <div><Label>标签</Label><div className="mt-2"><TagMultiSelect value={tags} onChange={setTags} /></div></div>
          
          <div className="flex space-x-4 pt-4"><Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">{isSubmitting ? '发布中...' : '发布 Skill'}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

// Detail View with 下载 and 更新 Buttons
function DetailView({ skill, on返回, on更新, on编辑 }: { skill: SkillDetail; on返回: () => void; on更新: () => void; on编辑: () => void }) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={on返回}>← 返回</Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{skill.name}</CardTitle>
              {skill.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">审核中</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={on编辑} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                编辑
              </button>
              {skill.status === 'approved' ? (
                <a href={`/api/skills/${skill.slug}/download`} download className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all hover:-translate-y-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  下载
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-300 text-white font-medium rounded-xl cursor-not-allowed opacity-60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  审核中不可下载
                </span>
              )}
              <button onClick={on更新} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                更新
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-lg">{skill.description || '暂无描述'}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>作者: {skill.author_name}</span>
            {/* @ts-ignore */}
            {(skill as any).author_department && <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>部门: {(skill as any).author_department}</span>}
            {/* @ts-ignore */}
            {(skill as any).author_organization && <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>组织: {(skill as any).author_organization}</span>}
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>下载: {skill.download_count}</span>
          </div>
          <TagDisplay tags={skill.tags} />
          {skill.versions && skill.versions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>版本号 History</h3>
              <div className="space-y-3">{skill.versions.map(v => (
                <div key={v.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3"><span className="font-semibold text-gray-900">{v.version}</span>{v.tag && <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${v.tag === '稳定版' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.tag}</span>}{v.is_latest && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">最新</span>}</div>
                  {skill.status === 'approved' ? (
                    <a href={`/api/skills/${skill.slug}/download?version=${v.version}`} className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center gap-1 hover:underline" download>下载<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                  ) : (
                    <span className="text-gray-400 text-sm flex items-center gap-1 cursor-not-allowed">审核中<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
                  )}
                </div>
              ))}</div>
            </div>
          )}
          {skill.readme_content && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>文档说明</h3>
              <pre className="bg-gray-50 p-5 rounded-xl text-sm overflow-x-auto border border-gray-100 text-gray-700 leading-relaxed">{skill.readme_content}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
