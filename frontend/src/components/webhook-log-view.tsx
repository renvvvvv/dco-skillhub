import { useState, useEffect } from 'react'
import { getWebhookLogs, getWebhookLogDetail, getWebhookStats, testWebhook, retryWebhook, sendDailyReport, sendWeeklyReport, WebhookLog } from '../api/simple-client'
import { Button } from '../shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card'

const LOG_TYPE_LABELS: Record<string, string> = {
  'daily_report': '日报',
  'weekly_report': '周报',
  'alert_pending': '告警',
  'manual_test': '测试',
  'retry': '重试',
}

const LOG_TYPE_COLORS: Record<string, string> = {
  'daily_report': 'bg-blue-100 text-blue-700',
  'weekly_report': 'bg-purple-100 text-purple-700',
  'alert_pending': 'bg-red-100 text-red-700',
  'manual_test': 'bg-gray-100 text-gray-700',
  'retry': 'bg-orange-100 text-orange-700',
}

interface WebhookLogViewProps {
  token: string
}

export function WebhookLogView({ token }: WebhookLogViewProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function loadLogs(pageNum = 0) {
    setIsLoading(true)
    try {
      const result = await getWebhookLogs(token, {
        type: filterType || undefined,
        status: filterStatus || undefined,
        page: pageNum,
        size: 20,
      })
      setLogs(result.data.content)
      setTotalPages(result.data.totalPages)
      setPage(result.data.number)
    } catch (err) {
      setMessage('加载失败: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadStats() {
    try {
      const result = await getWebhookStats(token)
      setStats(result.data)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  async function handleTest() {
    try {
      setMessage('发送测试中...')
      const result = await testWebhook(token)
      if (result.success) {
        setMessage('✅ 测试发送成功')
        loadLogs()
        loadStats()
      } else {
        setMessage('❌ 测试发送失败')
      }
    } catch (err) {
      setMessage('❌ 测试失败: ' + (err as Error).message)
    }
  }

  async function handleSendDaily() {
    try {
      setMessage('发送日报中...')
      const result = await sendDailyReport(token)
      if (result.success) {
        setMessage('✅ 日报发送成功')
        loadLogs()
        loadStats()
      } else {
        setMessage('❌ 日报发送失败: ' + result.message)
      }
    } catch (err) {
      setMessage('❌ 发送失败: ' + (err as Error).message)
    }
  }

  async function handleSendWeekly() {
    try {
      setMessage('发送周报中...')
      const result = await sendWeeklyReport(token)
      if (result.success) {
        setMessage('✅ 周报发送成功')
        loadLogs()
        loadStats()
      } else {
        setMessage('❌ 周报发送失败: ' + result.message)
      }
    } catch (err) {
      setMessage('❌ 发送失败: ' + (err as Error).message)
    }
  }

  async function handleRetry(id: string) {
    try {
      setMessage('重试中...')
      const result = await retryWebhook(token, id)
      if (result.success) {
        setMessage('✅ 重试成功')
        loadLogs()
        loadStats()
      } else {
        setMessage('❌ 重试失败: ' + result.message)
      }
    } catch (err) {
      setMessage('❌ 重试失败: ' + (err as Error).message)
    }
  }

  async function handleViewDetail(id: string) {
    try {
      const result = await getWebhookLogDetail(token, id)
      setSelectedLog(result.data)
    } catch (err) {
      setMessage('加载详情失败: ' + (err as Error).message)
    }
  }

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [filterType, filterStatus])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhook 日志管理</h2>
          <p className="text-sm text-gray-500 mt-1">查看飞书通知发送记录和详情</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTest} variant="outline" className="text-sm">🧪 测试发送</Button>
          <Button onClick={handleSendDaily} className="text-sm bg-blue-500 hover:bg-blue-600">📊 发送日报</Button>
          <Button onClick={handleSendWeekly} className="text-sm bg-purple-500 hover:bg-purple-600">📈 发送周报</Button>
        </div>
      </div>

      {message && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">总发送次数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-xs text-gray-500">成功</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-gray-500">失败</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.success_rate}%</div>
              <div className="text-xs text-gray-500">成功率</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选 */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部类型</option>
          <option value="daily_report">日报</option>
          <option value="weekly_report">周报</option>
          <option value="alert_pending">告警</option>
          <option value="manual_test">测试</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
        </select>
        <Button onClick={() => { setFilterType(''); setFilterStatus(''); }} variant="outline" className="text-sm">
          重置筛选
        </Button>
      </div>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">发送日志</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">类型</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">发送时间</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">耗时</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LOG_TYPE_COLORS[log.type] || 'bg-gray-100 text-gray-600'}`}>
                          {LOG_TYPE_LABELS[log.type] || log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'success' ? (
                          <span className="text-green-600 font-medium">✅ 成功</span>
                        ) : (
                          <span className="text-red-600 font-medium">❌ 失败</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.duration_ms}ms
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(log.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看
                          </button>
                          {log.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(log.id)}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              重试
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        暂无日志
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <button
                onClick={() => loadLogs(page - 1)}
                disabled={page <= 0}
                className="px-3 py-1 rounded-lg text-sm border hover:bg-gray-50 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                第 {page + 1} / {totalPages} 页
              </span>
              <button
                onClick={() => loadLogs(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg text-sm border hover:bg-gray-50 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Webhook 日志详情</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 text-gray-900">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">类型:</span>
                  <span className="ml-2">{LOG_TYPE_LABELS[selectedLog.type] || selectedLog.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">状态:</span>
                  <span className={`ml-2 font-medium ${selectedLog.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedLog.status === 'success' ? '✅ 成功' : '❌ 失败'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">耗时:</span>
                  <span className="ml-2">{selectedLog.duration_ms}ms</span>
                </div>
                <div>
                  <span className="text-gray-500">发送时间:</span>
                  <span className="ml-2">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">HTTP状态码:</span>
                  <span className="ml-2">{selectedLog.response_code || '-'}</span>
                </div>
              </div>

              {/* 业务数据快照 */}
              {selectedLog.report_data && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">业务数据快照</h3>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(selectedLog.report_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* 请求内容 */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">请求内容 (Request Body)</h3>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-600">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 响应内容 */}
              {selectedLog.response_body && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">响应内容 (Response Body)</h3>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-gray-600">
                      {JSON.stringify(selectedLog.response_body, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {selectedLog.error_message && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-700 mb-2">错误信息</h3>
                  <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setSelectedLog(null)}
                  variant="outline"
                  className="flex-1"
                >
                  关闭
                </Button>
                {selectedLog.status === 'failed' && (
                  <Button
                    onClick={() => { handleRetry(selectedLog.id); setSelectedLog(null); }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    重试发送
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}