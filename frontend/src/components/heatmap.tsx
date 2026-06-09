import { useState } from 'react';

interface HeatmapData {
  date: string;
  value: number;
  weekday: number;
  week: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  metric: string;
  onCellClick: (date: string) => void;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_PER_PAGE = 35; // 5周 * 7天 = 35天

const getColorIntensity = (value: number, maxValue: number): string => {
  if (maxValue === 0) return 'bg-gray-100';
  const ratio = value / maxValue;
  
  if (ratio <= 0.1) return 'bg-blue-50';
  if (ratio <= 0.2) return 'bg-blue-100';
  if (ratio <= 0.3) return 'bg-blue-200';
  if (ratio <= 0.4) return 'bg-blue-300';
  if (ratio <= 0.5) return 'bg-blue-400';
  if (ratio <= 0.6) return 'bg-blue-500';
  if (ratio <= 0.7) return 'bg-blue-600';
  if (ratio <= 0.8) return 'bg-blue-700';
  if (ratio <= 0.9) return 'bg-blue-800';
  return 'bg-blue-900';
};

export function Heatmap({ data, metric, onCellClick }: HeatmapProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  if (!data || data.length === 0) {
    return (<div className="text-center py-8 text-gray-500">暂无数据</div>);
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  // 判断是否需要分页（超过35天）
  const needPagination = data.length > DAYS_PER_PAGE;
  
  // 分页逻辑
  const totalPages = needPagination ? Math.ceil(data.length / DAYS_PER_PAGE) : 1;
  const startIndex = currentPage * DAYS_PER_PAGE;
  const endIndex = Math.min(startIndex + DAYS_PER_PAGE, data.length);
  const displayData = needPagination ? data.slice(startIndex, endIndex) : data;
  
  // 按周分组
  const weeks: { [key: number]: HeatmapData[] } = {};
  displayData.forEach(d => {
    if (!weeks[d.week]) weeks[d.week] = [];
    weeks[d.week].push(d);
  });

  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full">
      {/* 分页控件 */}
      {needPagination && (
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-sm text-gray-500">
            显示 {startIndex + 1} - {endIndex} 天，共 {data.length} 天
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← 上一页
            </button>
            <span className="text-sm text-gray-600">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页 →
            </button>
          </div>
        </div>
      )}
      
      {/* 星期标签 */}
      <div className="flex mb-1">
        <div className="w-8"></div>
        {WEEKDAY_LABELS.map((label, idx) => (
          <div key={idx} className="flex-1 text-center text-xs text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>
      
      {/* 热力图网格 */}
      <div className="space-y-1">
        {weekNumbers.map(weekNum => (
          <div key={weekNum} className="flex">
            <div className="w-8 flex items-center justify-center text-xs text-gray-400">
              W{weekNum}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map(weekday => {
                const dayData = weeks[weekNum].find(d => d.weekday === weekday);
                if (!dayData) {
                  return <div key={weekday} className="aspect-square"></div>;
                }
                
                const isHovered = hoveredDate === dayData.date;
                const colorClass = getColorIntensity(dayData.value, maxValue);
                
                return (
                  <div
                    key={weekday}
                    className={`aspect-square rounded-sm cursor-pointer transition-all ${colorClass} ${
                      isHovered ? 'ring-2 ring-pink-500 scale-110' : ''
                    } ${dayData.value > 0 ? 'hover:ring-2 hover:ring-pink-300' : ''}`}
                    onClick={() => dayData.value > 0 && onCellClick(dayData.date)}
                    onMouseEnter={() => setHoveredDate(dayData.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    title={`${dayData.date}: ${dayData.value} ${metric}`}
                  >
                    {dayData.value > 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className={`text-xs font-medium ${
                          dayData.value > maxValue * 0.5 ? 'text-white' : 'text-gray-700'
                        }`}>
                          {dayData.value}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* 图例 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500">少</span>
        {['bg-blue-50', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-900'].map((color, idx) => (
          <div key={idx} className={`w-4 h-4 rounded-sm ${color}`}></div>
        ))}
        <span className="text-xs text-gray-500">多</span>
      </div>
    </div>
  );
}
