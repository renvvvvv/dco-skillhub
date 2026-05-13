import { useState, useEffect } from 'react';

interface WeeklyPick {
  skill_slug: string;
  skill_name: string;
  author: string;
  department: string;
  reason: string;
  downloads: number;
  rating: number;
  rating_count: number;
}

interface WeeklyPicksData {
  id: string;
  week_start: string;
  week_end: string;
  week_number: number;
  year: number;
  picks: WeeklyPick[];
  selected_by_name: string;
  selected_at: string;
}

export function WeeklyPicks() {
  const [picksData, setPicksData] = useState<WeeklyPicksData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/arena/weekly-picks')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPicksData(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!picksData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">小智优选</h3>
          <p className="text-sm text-gray-500">本周精选即将揭晓，敬请期待！</p>
        </div>
      </div>
    );
  }

  const weekStart = new Date(picksData.week_start);
  const weekEnd = new Date(picksData.week_end);
  const dateRange = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'from-amber-50 to-yellow-50 border-amber-200';
      case 1:
        return 'from-gray-50 to-slate-50 border-gray-200';
      case 2:
        return 'from-orange-50 to-amber-50 border-orange-200';
      default:
        return 'from-gray-50 to-white border-gray-200';
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200">
            <span className="text-white font-bold text-sm">1</span>
          </div>
        );
      case 1:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full flex items-center justify-center shadow-lg shadow-gray-200">
            <span className="text-white font-bold text-sm">2</span>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-white font-bold text-sm">3</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">小智优选</h3>
              <p className="text-sm text-white/80">第{picksData.week_number}周 · {dateRange}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
            每周精选
          </span>
        </div>
      </div>

      {/* Skill列表 */}
      <div className="p-4 space-y-3">
        {picksData.picks.map((pick, index) => (
          <a
            key={pick.skill_slug}
            href={`/skill/${pick.skill_slug}`}
            className={`block bg-gradient-to-r ${getRankStyle(index)} border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}
          >
            <div className="flex items-start gap-3">
              {getRankBadge(index)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">{pick.skill_name}</h4>
                  <div className="flex items-center gap-1 text-amber-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{pick.rating > 0 ? pick.rating.toFixed(1) : '-'}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{pick.reason}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {pick.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {pick.downloads}次下载
                  </span>
                  {pick.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {pick.rating_count}人评价
                    </span>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* 底部 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>精选由 {picksData.selected_by_name} 挑选</span>
          <span>每周一更新</span>
        </div>
      </div>
    </div>
  );
}
