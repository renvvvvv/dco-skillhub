import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { VERSION_LOGS, getVersionColor, getVersionLabel, VersionLog } from '../data/version-logs';

export function PlatformChangelog() {
  const [selectedVersion, setSelectedVersion] = useState<VersionLog | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = filterType === 'all' 
    ? [...VERSION_LOGS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : VERSION_LOGS.filter(log => log.type === filterType).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const typeStats = {
    all: VERSION_LOGS.length,
    feature: VERSION_LOGS.filter(l => l.type === 'feature').length,
    fix: VERSION_LOGS.filter(l => l.type === 'fix').length,
    optimize: VERSION_LOGS.filter(l => l.type === 'optimize').length,
    docs: VERSION_LOGS.filter(l => l.type === 'docs').length,
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">平台迭代日志</h2>
          <p className="text-sm text-gray-500 mt-1">SkillHub 平台版本迭代记录</p>
        </div>
        
        {/* 筛选器 */}
        <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap gap-1">
          {[
            { label: '全部', value: 'all', count: typeStats.all },
            { label: '新功能', value: 'feature', count: typeStats.feature },
            { label: '修复', value: 'fix', count: typeStats.fix },
            { label: '优化', value: 'optimize', count: typeStats.optimize },
            { label: '文档', value: 'docs', count: typeStats.docs },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === option.value 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总版本数', value: VERSION_LOGS.length, icon: '📦', color: 'bg-blue-500' },
          { label: '新功能', value: typeStats.feature, icon: '✨', color: 'bg-green-500' },
          { label: '修复', value: typeStats.fix, icon: '🔧', color: 'bg-red-500' },
          { label: '优化', value: typeStats.optimize, icon: '⚡', color: 'bg-yellow-500' },
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

      {/* 时间线 */}
      <div className="relative">
        {/* 时间线中轴线 */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform md:-translate-x-0.5"></div>
        
        <div className="space-y-8">
          {filteredLogs.map((log, index) => (
            <div 
              key={log.version}
              className={`relative flex flex-col md:flex-row gap-4 ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* 时间点 */}
              <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-white border-4 border-pink-500 rounded-full transform -translate-x-1/2 z-10"></div>
              
              {/* 内容卡片 */}
              <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'
              }`}>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedVersion(selectedVersion?.version === log.version ? null : log)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-pink-600">{log.version}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getVersionColor(log.type)}`}>
                          {getVersionLabel(log.type)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">{log.date}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{log.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {log.changes.slice(0, selectedVersion?.version === log.version ? undefined : 3).map((change, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-pink-500 mt-1">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                      {log.changes.length > 3 && selectedVersion?.version !== log.version && (
                        <li className="text-sm text-pink-500 cursor-pointer hover:underline">
                          点击查看更多...
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 空状态 */}
      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无该类型的版本记录</p>
        </div>
      )}
    </div>
  );
}
