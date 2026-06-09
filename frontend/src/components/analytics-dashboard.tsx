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
    const quarter = Math.floor(end.getMonth() / 3);
    const start = new Date(end.getFullYear(), (quarter - 1) * 3, 1);
    const quarterEnd = new Date(end.getFullYear(), quarter * 3, 0);
    return { start: formatDate(start), end: formatDate(quarterEnd) };
  }
  if (days === -4) {
    const start = new Date(2024, 0, 1);
    return { start: formatDate(start), end: formatDate(end) };
  }
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return { start: formatDate(start), end: formatDate(end) };
}

// 根据时间区间确定聚合方式
function getGroupBy(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays <= 7) {
    return 'day'; // 7天内按天
  } else if (diffDays <= 30) {
    return '4days'; // 一个月按4天一组
  } else if (diffDays <= 120) {
    return 'week'; // 大于一个月按周
  } else {
    return 'month'; // 大于4个月按月
  }
}

// 聚合趋势数据
function aggregateTrendData(trend: any, groupBy: string) {
  if (!trend || !trend.dates || trend.dates.length === 0) {
    return trend;
  }
  
  if (groupBy === 'day') {
    return trend; // 按天不需要聚合
  }
  
  const dates = trend.dates;
  const downloads = trend.downloads;
  const views = trend.views;
  const searches = trend.searches;
  const publishes = trend.publishes;
  
  const resultDates: string[] = [];
  const resultDownloads: number[] = [];
  const resultViews: number[] = [];
  const resultSearches: number[] = [];
  const resultPublishes: number[] = [];
  
  if (groupBy === '4days') {
    // 按4天一组，只显示开始日期
    for (let i = 0; i < dates.length; i += 4) {
      const startDate = dates[i];
      // 简化显示：只显示开始日期，格式为 M-D
      const dateParts = startDate.split('-');
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      resultDates.push(`${month}-${day}`);
      
      const endIdx = Math.min(i + 4, dates.length);
      resultDownloads.push(downloads.slice(i, endIdx).reduce((a: number, b: number) => a + b, 0));
      resultViews.push(views.slice(i, endIdx).reduce((a: number, b: number) => a + b, 0));
      resultSearches.push(searches.slice(i, endIdx).reduce((a: number, b: number) => a + b, 0));
      resultPublishes.push(publishes.slice(i, endIdx).reduce((a: number, b: number) => a + b, 0));
    }
  } else if (groupBy === 'week') {
    // 按周分组（周一开始）
    let currentWeek: number[] = [];
    let currentWeekLabel = '';
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // 周一
      const weekLabel = `${weekStart.getMonth() + 1}-${weekStart.getDate()}周`;
      
      if (weekLabel !== currentWeekLabel && currentWeek.length > 0) {
        // 保存上一周
        resultDates.push(currentWeekLabel);
        resultDownloads.push(currentWeek.reduce((sum, idx) => sum + downloads[idx], 0));
        resultViews.push(currentWeek.reduce((sum, idx) => sum + views[idx], 0));
        resultSearches.push(currentWeek.reduce((sum, idx) => sum + searches[idx], 0));
        resultPublishes.push(currentWeek.reduce((sum, idx) => sum + publishes[idx], 0));
        currentWeek = [];
      }
      
      currentWeekLabel = weekLabel;
      currentWeek.push(i);
    }
    
    // 保存最后一周
    if (currentWeek.length > 0) {
      resultDates.push(currentWeekLabel);
      resultDownloads.push(currentWeek.reduce((sum, idx) => sum + downloads[idx], 0));
      resultViews.push(currentWeek.reduce((sum, idx) => sum + views[idx], 0));
      resultSearches.push(currentWeek.reduce((sum, idx) => sum + searches[idx], 0));
      resultPublishes.push(currentWeek.reduce((sum, idx) => sum + publishes[idx], 0));
    }
  } else if (groupBy === 'month') {
    // 按月分组
    let currentMonth: number[] = [];
    let currentMonthLabel = '';
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthLabel !== currentMonthLabel && currentMonth.length > 0) {
        // 保存上一月
        resultDates.push(currentMonthLabel);
        resultDownloads.push(currentMonth.reduce((sum, idx) => sum + downloads[idx], 0));
        resultViews.push(currentMonth.reduce((sum, idx) => sum + views[idx], 0));
        resultSearches.push(currentMonth.reduce((sum, idx) => sum + searches[idx], 0));
        resultPublishes.push(currentMonth.reduce((sum, idx) => sum + publishes[idx], 0));
        currentMonth = [];
      }
      
      currentMonthLabel = monthLabel;
      currentMonth.push(i);
    }
    
    // 保存最后一月
    if (currentMonth.length > 0) {
      resultDates.push(currentMonthLabel);
      resultDownloads.push(currentMonth.reduce((sum, idx) => sum + downloads[idx], 0));
      resultViews.push(currentMonth.reduce((sum, idx) => sum + views[idx], 0));
      resultSearches.push(currentMonth.reduce((sum, idx) => sum + searches[idx], 0));
      resultPublishes.push(currentMonth.reduce((sum, idx) => sum + publishes[idx], 0));
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

// 平滑曲线图组件
// 小时趋势图组件
function HourlyTrendChart({ hourly }: { hourly: { [key: string]: number } }) {
  const hours = Object.keys(hourly).sort();
  const values = hours.map(h => hourly[h]);
  
  if (!values || values.length === 0) return null;
  
  const maxVal = Math.max(...values, 1);
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const getX = (i: number) => padding.left + (i / (hours.length - 1 || 1)) * chartW;
  const getY = (v: number) => padding.top + chartH - (v / maxVal) * chartH;
  
  // 生成平滑曲线路径
  const generateSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpx1 = curr.x + (next.x - curr.x) * 0.3;
      const cpy1 = curr.y;
      const cpx2 = curr.x + (next.x - curr.x) * 0.7;
      const cpy2 = next.y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  const points = values.map((v, i) => ({ x: getX(i), y: getY(v) }));
  const linePath = generateSmoothPath(points);
  
  // 填充区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  
  // 找出峰值
  const maxValue = Math.max(...values);
  const maxIndex = values.indexOf(maxValue);
  
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
        <defs>
          <linearGradient id="hourly-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}
        
        {/* 填充区域 */}
        <path d={areaPath} fill="url(#hourly-gradient)" />
        
        {/* 曲线 */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
        
        {/* 数据点 */}
        {points.map((point, i) => (
          <g key={i}>
            <circle 
              cx={point.x} 
              cy={point.y} 
              r={i === maxIndex ? 5 : 3} 
              fill={i === maxIndex ? '#ef4444' : 'white'} 
              stroke={i === maxIndex ? '#ef4444' : '#3b82f6'} 
              strokeWidth={2} 
            />
            {/* 峰值标注 */}
            {i === maxIndex && (
              <g>
                <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight="bold">
                  峰值 {maxValue}
                </text>
              </g>
            )}
            <title>{`${hours[i]}: ${values[i]}`}</title>
          </g>
        ))}
        
        {/* X轴标签（每3小时显示一个） */}
        {hours.map((h, i) => (
          i % 3 === 0 && (
            <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {h.split(':')[0]}:00
            </text>
          )
        ))}
      </svg>
    </div>
  );
}

function SmoothLineChart({ data, dates, color = '#ec4899' }: { data: number[]; dates: string[]; color?: string }) {
  if (!data || data.length === 0) return null;
  
  const maxVal = Math.max(...data, 1);
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const getY = (v: number) => padding.top + chartH - (v / maxVal) * chartH;
  
  // 生成平滑曲线路径
  const generateSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpx1 = curr.x + (next.x - curr.x) * 0.3;
      const cpy1 = curr.y;
      const cpx2 = curr.x + (next.x - curr.x) * 0.7;
      const cpy2 = next.y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  const points = data.map((v, i) => ({ x: getX(i), y: getY(v) }));
  const linePath = generateSmoothPath(points);
  
  // 填充区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}
        
        {/* 填充区域 */}
        <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />
        
        {/* 曲线 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        
        {/* 数据点 */}
        {points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r={4} fill="white" stroke={color} strokeWidth={2} />
            <title>{`${dates[i]}: ${data[i]}`}</title>
          </g>
        ))}
        
        {/* X轴标签 */}
        {dates.map((d, i) => (
          <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize={10} fill="#9ca3af">
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [searchAnalysis, setSearchAnalysis] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapMetric, setHeatmapMetric] = useState('downloads');
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSkills, setTotalSkills] = useState(0);

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
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 卡片 */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { title: '总技能数', value: totalSkills, icon: '📚', color: 'bg-indigo-500' },
              { title: '下载次数', value: overview.downloads, icon: '📥', color: 'bg-pink-500' },
              { title: '浏览次数', value: overview.views, icon: '👁', color: 'bg-purple-500' },
              { title: '搜索次数', value: overview.searches, icon: '🔍', color: 'bg-blue-500' },
              { title: '发布次数', value: overview.publishes, icon: '📦', color: 'bg-emerald-500' },
              { title: '活跃用户', value: overview.unique_users, icon: '👤', color: 'bg-orange-500' },
            ].map((item: any) => (
              <Card key={item.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white text-lg`}>
                      <span>{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{item.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 运营热力图 + 趋势分析（双栏） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">🔥 运营热力图（按天）</CardTitle>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {METRIC_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleHeatmapMetricChange(option.value)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        heatmapMetric === option.value 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Heatmap 
                data={heatmapData} 
                metric={heatmapMetric}
                onCellClick={handleHeatmapCellClick}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📈 趋势分析</CardTitle>
                <div className="text-xs text-gray-500">
                  {groupBy === 'day' && '按天展示'}
                  {groupBy === '4days' && '按4天一组'}
                  {groupBy === 'week' && '按周展示'}
                  {groupBy === 'month' && '按月展示'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {aggregatedTrend && (
                <SmoothLineChart 
                  data={aggregatedTrend[heatmapMetric] || aggregatedTrend.downloads} 
                  dates={aggregatedTrend.dates}
                  color="#ec4899"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 技能热度排行（单栏） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔥 技能热度排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill: any, idx: number) => (
                <div key={skill.slug} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                      <p className="text-xs text-gray-500">{skill.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{skill.downloads}</p>
                    <p className="text-xs text-gray-500">下载</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 日期详情弹窗 */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{selectedDay.date} 详情</h3>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    总{heatmapMetric === 'downloads' ? '下载' : heatmapMetric === 'views' ? '浏览' : heatmapMetric === 'searches' ? '搜索' : '发布'}
                  </p>
                  <p className="text-2xl font-bold">{selectedDay.total}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">小时分布趋势</h4>
                <HourlyTrendChart hourly={selectedDay.hourly} />
              </div>

              {selectedDay.top_skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">热门技能</h4>
                  <div className="space-y-1">
                    {selectedDay.top_skills.slice(0, 5).map((skill: any) => (
                      <div key={skill.slug} className="flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span className="text-gray-500">{skill[heatmapMetric] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.top_users.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">活跃用户</h4>
                  <div className="space-y-1">
                    {selectedDay.top_users.slice(0, 5).map((user: any) => (
                      <div key={user.name} className="flex justify-between text-sm">
                        <span>{user.name}</span>
                        <span className="text-gray-500">{user[heatmapMetric] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 搜索分析 */}
        {searchAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔍 搜索分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">热门搜索词</h4>
                  <div className="space-y-1">
                    {searchAnalysis.top_queries?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{idx + 1}. {item.query}</span>
                        <span className="text-gray-500">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">无结果搜索</h4>
                  <div className="space-y-1">
                    {searchAnalysis.zero_result_queries?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span className="text-red-500">{idx + 1}. {item.query}</span>
                        <span className="text-gray-500">{item.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
