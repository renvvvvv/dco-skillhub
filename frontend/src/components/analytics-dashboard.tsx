import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { Heatmap } from './heatmap';
import { 
  getAnalyticsOverview, 
  getAnalyticsTrend, 
  getAnalyticsSkills, 
  getAnalyticsSearch,
  getAnalyticsHeatmap,
  getAnalyticsDayDetail,
  getStats
} from '../api/simple-client';

interface DayDetail {
  date: string;
  metric: string;
  total: number;
  hourly: { [key: string]: number };
  top_skills: any[];
  top_users: any[];
}

const TIME_PRESETS = [
  { label: '最近7天', days: 7 },
  { label: '最近30天', days: 30 },
  { label: '本月', days: null },
  { label: '上月', days: -1 },
  { label: '本季度', days: -2 },
  { label: '上季度', days: -3 },
  { label: '至今', days: -4 },
];

const METRIC_OPTIONS = [
  { label: '下载', value: 'downloads' },
  { label: '浏览', value: 'views' },
  { label: '搜索', value: 'searches' },
  { label: '发布', value: 'publishes' },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPresetDates(days: number | null): { start: string; end: string } {
  const end = new Date();
  if (days === null) {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return { start: formatDate(start), end: formatDate(end) };
  }
  if (days === -1) {
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
    return { start: formatDate(start), end: formatDate(monthEnd) };
  }
  if (days === -2) {
    const quarter = Math.floor(end.getMonth() / 3);
    const start = new Date(end.getFullYear(), quarter * 3, 1);
    return { start: formatDate(start), end: formatDate(end) };
  }
  if (days === -3) {
    const quarter = Math.floor(end.getMonth() / 3) - 1;
    const year = quarter < 0 ? end.getFullYear() - 1 : end.getFullYear();
    const adjustedQuarter = quarter < 0 ? 3 : quarter;
    const start = new Date(year, adjustedQuarter * 3, 1);
    const quarterEnd = new Date(year, adjustedQuarter * 3 + 3, 0);
    return { start: formatDate(start), end: formatDate(quarterEnd) };
  }
  if (days === -4) {
    const start = new Date(2026, 3, 14); // 2026-04-14
    return { start: formatDate(start), end: formatDate(end) };
  }
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return { start: formatDate(start), end: formatDate(end) };
}

function getGroupBy(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays <= 7) return 'day';
  if (diffDays <= 30) return '4days';
  if (diffDays <= 120) return 'week';
  return 'month';
}

function aggregateTrendData(trend: any, groupBy: string): any {
  if (!trend || !trend.dates) return null;
  
  const dates = trend.dates;
  const downloads = trend.downloads || [];
  const views = trend.views || [];
  const searches = trend.searches || [];
  const publishes = trend.publishes || [];
  
  if (groupBy === 'day') {
    return trend;
  }
  
  const resultDates: string[] = [];
  const resultDownloads: number[] = [];
  const resultViews: number[] = [];
  const resultSearches: number[] = [];
  const resultPublishes: number[] = [];
  
  if (groupBy === '4days') {
    for (let i = 0; i < dates.length; i += 4) {
      const groupEnd = Math.min(i + 3, dates.length - 1);
      resultDates.push(`${dates[i].slice(5)}~${dates[groupEnd].slice(5)}`);
      resultDownloads.push(downloads.slice(i, i + 4).reduce((a: number, b: number) => a + b, 0));
      resultViews.push(views.slice(i, i + 4).reduce((a: number, b: number) => a + b, 0));
      resultSearches.push(searches.slice(i, i + 4).reduce((a: number, b: number) => a + b, 0));
      resultPublishes.push(publishes.slice(i, i + 4).reduce((a: number, b: number) => a + b, 0));
    }
  } else if (groupBy === 'week') {
    let currentWeekDownloads = 0;
    let currentWeekViews = 0;
    let currentWeekSearches = 0;
    let currentWeekPublishes = 0;
    let weekStart = '';
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      if (date.getDay() === 1 || i === 0) {
        if (weekStart) {
          resultDates.push(weekStart);
          resultDownloads.push(currentWeekDownloads);
          resultViews.push(currentWeekViews);
          resultSearches.push(currentWeekSearches);
          resultPublishes.push(currentWeekPublishes);
        }
        weekStart = dates[i].slice(5);
        currentWeekDownloads = 0;
        currentWeekViews = 0;
        currentWeekSearches = 0;
        currentWeekPublishes = 0;
      }
      currentWeekDownloads += downloads[i] || 0;
      currentWeekViews += views[i] || 0;
      currentWeekSearches += searches[i] || 0;
      currentWeekPublishes += publishes[i] || 0;
    }
    if (weekStart) {
      resultDates.push(weekStart);
      resultDownloads.push(currentWeekDownloads);
      resultViews.push(currentWeekViews);
      resultSearches.push(currentWeekSearches);
      resultPublishes.push(currentWeekPublishes);
    }
  } else if (groupBy === 'month') {
    let currentMonth = '';
    let currentMonthDownloads = 0;
    let currentMonthViews = 0;
    let currentMonthSearches = 0;
    let currentMonthPublishes = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const month = dates[i].slice(0, 7);
      if (month !== currentMonth) {
        if (currentMonth) {
          resultDates.push(currentMonth);
          resultDownloads.push(currentMonthDownloads);
          resultViews.push(currentMonthViews);
          resultSearches.push(currentMonthSearches);
          resultPublishes.push(currentMonthPublishes);
        }
        currentMonth = month;
        currentMonthDownloads = 0;
        currentMonthViews = 0;
        currentMonthSearches = 0;
        currentMonthPublishes = 0;
      }
      currentMonthDownloads += downloads[i] || 0;
      currentMonthViews += views[i] || 0;
      currentMonthSearches += searches[i] || 0;
      currentMonthPublishes += publishes[i] || 0;
    }
    if (currentMonth) {
      resultDates.push(currentMonth);
      resultDownloads.push(currentMonthDownloads);
      resultViews.push(currentMonthViews);
      resultSearches.push(currentMonthSearches);
      resultPublishes.push(currentMonthPublishes);
    }
  }
  
  return {
    dates: resultDates,
    downloads: resultDownloads,
    views: resultViews,
    searches: resultSearches,
    publishes: resultPublishes,
  };
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(getPresetDates(7));
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [searchAnalysis, setSearchAnalysis] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapMetric, setHeatmapMetric] = useState('downloads');
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [totalSkills, setTotalSkills] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const dates = getPresetDates(7);
    setDateRange(dates);
  }, []);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadData();
    }
  }, [dateRange]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [overviewRes, trendRes, skillsRes, searchRes, heatmapRes, statsRes] = await Promise.all([
        getAnalyticsOverview(dateRange.start, dateRange.end),
        getAnalyticsTrend(dateRange.start, dateRange.end),
        getAnalyticsSkills(dateRange.start, dateRange.end, 'downloads', 10),
        getAnalyticsSearch(dateRange.start, dateRange.end),
        getAnalyticsHeatmap(dateRange.start, dateRange.end, heatmapMetric),
        getStats(),
      ]);

      setOverview(overviewRes.data);
      setTrend(trendRes.data);
      setSkills(skillsRes.data || []);
      setSearchAnalysis(searchRes.data);
      setHeatmapData(heatmapRes.data || []);
      
      // 从 stats API 获取总技能数
      if (statsRes.data && statsRes.data.skills) {
        setTotalSkills(statsRes.data.skills.length);
      }
    } catch (err) {
      console.error('加载运营数据失败', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleHeatmapCellClick(date: string) {
    try {
      const res = await getAnalyticsDayDetail(date, heatmapMetric);
      setSelectedDay(res.data);
    } catch (err) {
      console.error('加载日期详情失败', err);
    }
  }

  function handlePresetChange(index: number) {
    setSelectedPreset(index);
    const dates = getPresetDates(TIME_PRESETS[index].days);
    setDateRange(dates);
  }

  function handleCustomDateChange(type: 'start' | 'end', value: string) {
    setSelectedPreset(-1);
    setDateRange(prev => ({ ...prev, [type]: value }));
  }

  async function handleHeatmapMetricChange(metric: string) {
    setHeatmapMetric(metric);
    if (dateRange.start && dateRange.end) {
      try {
        const res = await getAnalyticsHeatmap(dateRange.start, dateRange.end, metric);
        setHeatmapData(res.data || []);
      } catch (err) {
        console.error('加载热力图失败', err);
      }
    }
  }

  // 计算趋势图聚合方式
  const groupBy = dateRange.start && dateRange.end ? getGroupBy(dateRange.start, dateRange.end) : 'day';
  
  // 聚合趋势数据
  const aggregatedTrend = trend ? aggregateTrendData(trend, groupBy) : null;

  if (isLoading && !overview) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载运营数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* 时间选择器 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap">
                {TIME_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetChange(idx)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedPreset === idx 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 概览卡片 */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{overview.views || 0}</div>
                <div className="text-sm text-gray-500">浏览量</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{overview.downloads || 0}</div>
                <div className="text-sm text-gray-500">下载量</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{overview.searches || 0}</div>
                <div className="text-sm text-gray-500">搜索量</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{overview.publishes || 0}</div>
                <div className="text-sm text-gray-500">发布量</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 趋势图 */}
        {aggregatedTrend && (
          <Card>
            <CardHeader>
              <CardTitle>趋势分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {aggregatedTrend.dates.map((date: string, idx: number) => {
                  const maxVal = Math.max(
                    ...aggregatedTrend.downloads,
                    ...aggregatedTrend.views,
                    ...aggregatedTrend.searches,
                    ...aggregatedTrend.publishes
                  ) || 1;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-1">
                        <div 
                          className="bg-blue-500 rounded-sm" 
                          style={{ height: `${(aggregatedTrend.views[idx] / maxVal) * 200}px` }}
                        ></div>
                        <div 
                          className="bg-green-500 rounded-sm" 
                          style={{ height: `${(aggregatedTrend.downloads[idx] / maxVal) * 200}px` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{date}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">浏览</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">下载</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 技能排行 */}
        {skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>热门技能 TOP10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">{idx + 1}</span>
                      <div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-gray-500">{skill.author || '未知作者'}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">⬇ {skill.downloads || 0}</span>
                      <span className="text-blue-600">👁 {skill.views || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索分析 */}
        {searchAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>搜索分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{searchAnalysis.total_searches || 0}</div>
                  <div className="text-sm text-gray-500">总搜索</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{searchAnalysis.searches_with_results || 0}</div>
                  <div className="text-sm text-gray-500">有结果</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{searchAnalysis.searches_without_results || 0}</div>
                  <div className="text-sm text-gray-500">无结果</div>
                </div>
              </div>
              
              {searchAnalysis.top_queries && searchAnalysis.top_queries.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">热门搜索词</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchAnalysis.top_queries.map((item: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {item.query} ({item.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 热力图 */}
        <Card>
          <CardHeader>
            <CardTitle>活动热力图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {METRIC_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleHeatmapMetricChange(option.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    heatmapMetric === option.value
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Heatmap 
              data={heatmapData} 
              metric={heatmapMetric}
              onCellClick={handleHeatmapCellClick}
            />
          </CardContent>
        </Card>

        {/* 日期详情弹窗 */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{selectedDay.date} 详细数据</h3>
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-2xl font-bold mb-4">
                  {selectedDay.total} {selectedDay.metric === 'downloads' ? '下载' : selectedDay.metric === 'views' ? '浏览' : '搜索'}
                </div>
                
                {/* 小时分布 */}
                {selectedDay.hourly && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">小时分布</h4>
                    <div className="flex items-end gap-1 h-32">
                      {Object.entries(selectedDay.hourly).map(([hour, count]) => (
                        <div key={hour} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-pink-500 rounded-sm" 
                            style={{ height: `${(count as number / Math.max(...Object.values(selectedDay.hourly))) * 100}%` }}
                          ></div>
                          <span className="text-xs text-gray-500 mt-1">{hour}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 热门技能 */}
                {selectedDay.top_skills && selectedDay.top_skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">热门技能</h4>
                    <div className="space-y-2">
                      {selectedDay.top_skills.map((skill: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{skill.name}</span>
                          <span className="text-pink-600">{skill.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
