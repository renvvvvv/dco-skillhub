import { useState, useEffect } from 'react';

interface LogViewerProps {
  token: string;
}

type LogType = 'all' | 'activity' | 'expert' | 'audit' | 'ratings' | 'system';

interface UnifiedLog {
  id: string;
  timestamp: string;
  type: string;
  category: string;
  user: string;
  skill_id?: string;
  skill_name?: string;
  action: string;
  details: string;
  metadata?: any;
}

export function AdminLogViewer({ token }: LogViewerProps) {
  const [activeTab, setActiveTab] = useState<LogType>('all');
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      const allLogs: UnifiedLog[] = [];

      // 1. 获取用户活动日志
      const activityRes = await fetch(`/api/admin/activity-logs?days=${days}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activityRes.ok) {
        const data = await activityRes.json();
        if (data.success) {
          data.data.forEach((log: any) => {
            allLogs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: log.activity_type,
              category: '用户活动',
              user: log.user_id || 'anonymous',
              skill_id: log.skill_id,
              action: log.activity_type,
              details: JSON.stringify(log.details)?.substring(0, 200) || '-',
              metadata: log.details,
            });
          });
        }
      }

      // 2. 获取专家评审日志
      const expertRes = await fetch(`/api/admin/expert-reviews?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (expertRes.ok) {
        const data = await expertRes.json();
        if (data.success) {
          data.data.forEach((log: any) => {
            allLogs.push({
              id: log.id,
              timestamp: log.created_at,
              type: 'expert_review',
              category: '专家评审',
              user: log.expert_name,
              skill_id: log.skill_id,
              action: '专家评审',
              details: log.overall_comment || `评分维度: ${Object.keys(log.dimensions || {}).length}个`,
              metadata: log.dimensions,
            });
          });
        }
      }

      // 3. 获取代码审计日志
      const auditRes = await fetch(`/api/admin/code-audit-logs?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditRes.ok) {
        const data = await auditRes.json();
        if (data.success) {
          data.data.forEach((log: any) => {
            allLogs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: 'code_audit',
              category: '代码审计',
              user: 'system',
              skill_id: log.skill_id,
              action: '自动化检测',
              details: `评分: ${log.score}分, 问题数: ${log.results?.summary?.total_issues || 0}`,
              metadata: log.results,
            });
          });
        }
      }

      // 4. 获取旧版系统日志（audit_logs）
      const oldLogsRes = await fetch(`/api/admin/logs?size=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (oldLogsRes.ok) {
        const data = await oldLogsRes.json();
        if (data.success && data.data?.content) {
          data.data.content.forEach((log: any) => {
            allLogs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: log.type,
              category: '系统日志',
              user: log.user || 'system',
              skill_id: log.skill_slug,
              skill_name: log.skill_name,
              action: log.type,
              details: log.detail || '-',
              metadata: { ip: log.ip },
            });
          });
        }
      }

      // 按时间排序（最新的在前）
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(allLogs);

      // 获取汇总数据
      const summaryRes = await fetch(`/api/admin/activity-summary?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSummary(summaryData.data);
        }
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
  }, [days, token]);

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    // 按类型过滤
    if (activeTab !== 'all') {
      if (activeTab === 'ratings' && log.type !== 'skill.rate') return false;
      if (activeTab === 'activity' && log.category !== '用户活动') return false;
      if (activeTab === 'expert' && log.category !== '专家评审') return false;
      if (activeTab === 'audit' && log.category !== '代码审计') return false;
      if (activeTab === 'system' && log.category !== '系统日志') return false;
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.user?.toLowerCase().includes(query) ||
        log.skill_id?.toLowerCase().includes(query) ||
        log.skill_name?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.category?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const tabs = [
    { key: 'all' as LogType, label: '全部日志', icon: '📋' },
    { key: 'activity' as LogType, label: '用户活动', icon: '👤' },
    { key: 'ratings' as LogType, label: '评分评论', icon: '⭐' },
    { key: 'expert' as LogType, label: '专家评审', icon: '👨‍💼' },
    { key: 'audit' as LogType, label: '代码审计', icon: '🔍' },
    { key: 'system' as LogType, label: '系统日志', icon: '⚙️' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '用户活动': return 'bg-blue-100 text-blue-700';
      case '专家评审': return 'bg-purple-100 text-purple-700';
      case '代码审计': return 'bg-orange-100 text-orange-700';
      case '系统日志': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">统一日志中心</h2>
          <p className="text-sm text-gray-500 mt-1">整合所有系统日志、用户活动、专家评审和代码审计记录</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索日志..."
            className="px-4 py-2 border border-gray-200 rounded-lg w-64"
          />
          <label className="text-sm text-gray-600">时间范围:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          >
            <option value={1}>今天</option>
            <option value={7}>最近7天</option>
            <option value={30}>最近30天</option>
            <option value={90}>最近90天</option>
          </select>
          <button
            onClick={fetchAllLogs}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 汇总统计 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">总活动数</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_activities || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">日志总数</p>
            <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">活跃用户</p>
            <p className="text-2xl font-bold text-green-600">{summary.top_users?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">活跃Skill</p>
            <p className="text-2xl font-bold text-purple-600">{summary.top_skills?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">活动类型</p>
            <p className="text-2xl font-bold text-orange-600">{Object.keys(summary.type_distribution || {}).length}</p>
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
              {tab.key === 'all' 
                ? logs.length 
                : logs.filter(l => {
                    if (tab.key === 'ratings') return l.type === 'skill.rate';
                    if (tab.key === 'activity') return l.category === '用户活动';
                    if (tab.key === 'expert') return l.category === '专家评审';
                    if (tab.key === 'audit') return l.category === '代码审计';
                    if (tab.key === 'system') return l.category === '系统日志';
                    return true;
                  }).length}
            </span>
          </button>
        ))}
      </div>

      {/* 日志列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">暂无日志记录</p>
          <p className="text-sm mt-1">{searchQuery ? '请尝试其他搜索条件' : '当前时间范围内没有日志'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">分类</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Skill</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {log.user}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.skill_name || log.skill_id || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
                      <div className="truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            显示 {filteredLogs.length} 条记录
          </div>
        </div>
      )}
    </div>
  );
}
