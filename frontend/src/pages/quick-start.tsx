import { useSearchSkills } from '@/shared/hooks/use-skill-queries'
import { useUserStats } from '@/shared/hooks/use-user-stats'
import { SkeletonList } from '@/shared/components/skeleton-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Download, Heart } from 'lucide-react'

// 排行榜组件
function RankingList({ 
  title, 
  icon: Icon, 
  items, 
  isLoading,
}: { 
  title: string
  icon: React.ElementType
  items: Array<{ name: string; value: number }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonList count={5} />
        </CardContent>
      </Card>
    )
  }

  // 数据为空时显示空状态
  if (!items || items.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <svg 
              className="w-16 h-16 mb-4 opacity-50" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-sm">暂无数据</p>
            <p className="text-xs mt-1 opacity-70">数据将在用户活跃后显示</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 10).map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                  ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    index === 1 ? 'bg-gray-100 text-gray-700' : 
                    index === 2 ? 'bg-orange-100 text-orange-700' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </span>
                <span className="font-medium truncate max-w-[150px]">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-primary">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 空状态组件
function EmptyState({ title }: { title: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <svg 
            className="w-16 h-16 mb-4 opacity-50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="text-sm">暂无数据</p>
          <p className="text-xs mt-1 opacity-70">数据将在用户活跃后显示</p>
        </div>
      </CardContent>
    </Card>
  )
}

// 柱状图组件
function BarChart({ 
  title, 
  data, 
  isLoading 
}: { 
  title: string
  data: Array<{ name: string; value: number }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonList count={5} />
        </CardContent>
      </Card>
    )
  }

  // 数据为空时显示空状态
  if (!data || data.length === 0) {
    return <EmptyState title={title} />
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 8).map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 飞书文档嵌入组件
function FeishuDocEmbed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          帮助文档
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[600px] border-0">
          <iframe
            src="https://vnet.feishu.cn/wiki/Uo9vwrxOEi4Iq9kPtvscqfYgnKL?table=ldxkarb80MY9mrHb"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title="飞书帮助文档"
            className="rounded-b-lg"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickStartPage() {
  // 获取技能数据
  const { data: popularSkills, isLoading: isLoadingPopular } = useSearchSkills({
    sort: 'downloads',
    size: 10,
  })
  
  const { data: starredSkills, isLoading: isLoadingStarred } = useSearchSkills({
    sort: 'stars',
    size: 10,
  })

  // 获取用户统计数据
  const { 
    topUploaders, 
    topDownloaders, 
    isLoadingUploads, 
    isLoadingDownloads 
  } = useUserStats(10, 10)

  // 技能下载排行榜
  const skillDownloads = popularSkills?.items.map(skill => ({
    name: skill.displayName,
    value: skill.downloadCount || 0,
  })) || []

  // 技能收藏排行榜
  const skillStars = starredSkills?.items.map(skill => ({
    name: skill.displayName,
    value: skill.starCount || 0,
  })) || []

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 页面标题 */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-gradient">
          快速开始
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          查看 Skill 排行榜、统计数据，或浏览帮助文档快速上手
        </p>
      </div>

      {/* 第一行：技能下载排行榜 + 用户上传排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList
          title="Skill 下载排行榜"
          icon={Download}
          items={skillDownloads}
          isLoading={isLoadingPopular}
        />
        <BarChart
          title="人员 Skill 上传数量"
          data={topUploaders}
          isLoading={isLoadingUploads}
        />
      </div>

      {/* 第二行：技能收藏排行榜 + 用户下载排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList
          title="Skill 收藏排行榜"
          icon={Heart}
          items={skillStars}
          isLoading={isLoadingStarred}
        />
        <BarChart
          title="人员 Skill 下载量"
          data={topDownloaders}
          isLoading={isLoadingDownloads}
        />
      </div>

      {/* 第三行：飞书文档嵌入 */}
      <div className="grid grid-cols-1 gap-6">
        <FeishuDocEmbed />
      </div>
    </div>
  )
}
