import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { getAnalyticsOverview, getAnalyticsTrend } from '../api/simple-client';

interface WeekData {
  weekStart: string;
  weekEnd: string;
  label: string;
  downloads: number;
  views: number;
  searches: number;
  publishes: number;
  uniqueUsers: number;
  activeSkills: number;
}

export function WeeklyReport() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  async function loadWeeklyData() {
    setIsLoading(true);
    try {
      // 项目开始日期
      const projectStart = new Date('2026-04-14');
      const now = new Date();
      
      const weekList: WeekData[] = [];
      let currentWeekStart = new Date(projectStart);
      
      // 调整到周一开始
      const dayOfWeek = currentWeekStart.getDay();
      const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      currentWeekStart.setDate(diff);
      
      while (currentWeekStart <= now) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (weekEnd > now) {
          weekEnd.setTime(now.getTime());
        }
        
        const startStr = currentWeekStart.toISOString().split('T')[0];
        const endStr = weekEnd.toISOString().split('T')[0];
        
        try {
          const [overviewRes, trendRes] = await Promise.all([
            getAnalyticsOverview(startStr, endStr),
            getAnalyticsTrend(startStr, endStr),
          ]);
          
          const overview = overviewRes.data;
          const trend = trendRes.data;
          
          weekList.push({
            weekStart: startStr,
            weekEnd: endStr,
            label: `${startStr.slice(5)} ~ ${endStr.slice(5)}`,
            downloads: overview?.downloads || 0,
            views: overview?.views || 0,
            searches: overview?.searches || 0,
            publishes: overview?.publishes || 0,
            uniqueUsers: overview?.unique_users || 0,
            activeSkills: trend?.dates?.length || 0,
          });
        } catch (err) {
          console.error(`加载 ${startStr}~${endStr} 数据失败`, err);
        }
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
      
      setWeeks(weekList.reverse());
    } catch (err) {
      console.error('加载周报数据失败', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载周报数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="py-4">
        <h2 className="text-2xl font-bold text-gray-900">运营周报</h2>
        <p className="text-sm text-gray-500 mt-1">每周运营数据统计（从项目启动至今）</p>
      </div>

      {/* 汇总卡片 */}
      {weeks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: '累计下载', 
              value: weeks.reduce((sum, w) => sum + w.downloads, 0), 
              icon: '📥', 
              color: 'bg-pink-500' 
            },
            { 
              label: '累计浏览', 
              value: weeks.reduce((sum, w) => sum + w.views, 0), 
              icon: '👁', 
              color: 'bg-purple-500' 
            },
            { 
              label: '累计搜索', 
              value: weeks.reduce((sum, w) => sum + w.searches, 0), 
              icon: '🔍', 
              color: 'bg-blue-500' 
            },
            { 
              label: '累计发布', 
              value: weeks.reduce((sum, w) => sum + w.publishes, 0), 
              icon: '📦', 
              color: 'bg-emerald-500' 
            },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white text-lg`}>
                    <span>{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 周报列表 */}
      <div className="space-y-4">
        {weeks.map((week, index) => (
          <Card 
            key={week.weekStart}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedWeek(selectedWeek?.weekStart === week.weekStart ? null : week)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-pink-600">第 {weeks.length - index} 周</span>
                  <span className="text-sm text-gray-400">{week.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">点击查看详情</span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedWeek?.weekStart === week.weekStart ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: '下载', value: week.downloads, icon: '📥' },
                  { label: '浏览', value: week.views, icon: '👁' },
                  { label: '搜索', value: week.searches, icon: '🔍' },
                  { label: '发布', value: week.publishes, icon: '📦' },
                  { label: '活跃用户', value: week.uniqueUsers, icon: '👤' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
              
              {/* 展开详情 */}
              {selectedWeek?.weekStart === week.weekStart && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">本周趋势</h4>
                  <div className="h-32 flex items-end gap-1">
                    {/* 简化的趋势图 */}
                    {[week.downloads, week.views, week.searches, week.publishes].map((value, idx) => {
                      const maxValue = Math.max(week.downloads, week.views, week.searches, week.publishes, 1);
                      const height = (value / maxValue) * 100;
                      const colors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500'];
                      const labels = ['下载', '浏览', '搜索', '发布'];
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="text-xs font-bold text-gray-700 mb-1">{value}</div>
                          <div 
                            className={`w-full ${colors[idx]} rounded-t-sm transition-all`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                          <div className="text-xs text-gray-500 mt-1">{labels[idx]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {weeks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无周报数据</p>
        </div>
      )}
    </div>
  );
}
