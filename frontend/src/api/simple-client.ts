/**
 * 简化版 API 客户端 - 适配 SkillHub Lite 后端
 */

const API_BASE = '/api';

export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  readme_content?: string;
  author_name: string;
  author_email: string;
  admin_key_hash?: string;
  download_count: number;
  latest_version: string;
  tags?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillVersion {
  id: string;
  skill_id: string;
  version: string;
  tag: string | null;
  is_latest: boolean;
  storage_path: string;
  file_size: number;
  file_hash: string;
  created_at: string;
}

export interface SkillDetail extends Skill {
  versions: SkillVersion[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  token?: string;
}

export interface StatsData {
  skills: { name: string; slug: string; downloads: number; views: number }[];
  regions: { id: string; name: string; count: number }[];
  datacenters: { name: string; count: number }[];
  centers: { name: string; count: number }[];
  unmapped_departments: { name: string; count: number }[];
  departments: { name: string; count: number }[];
  developers: { name: string; count: number }[];
  overview?: {
    skills_total: number;
    versions_total: number;
    authors_total: number;
    departments_total: number;
    tags_total: number;
    pending_total: number;
  };
}

// KPI 数据
export interface KpiData {
  today: { skills_total: number; downloads: number; views: number; searches: number; unique_users: number };
  yesterday: { skills_total: number; downloads: number; views: number; searches: number; unique_users: number };
  this_week: { skills_total: number; downloads: number; views: number; searches: number; unique_users: number };
  this_month: { skills_total: number; downloads: number; views: number; searches: number; unique_users: number };
}

// 趋势数据
export interface TrendData {
  dates: string[];
  series: {
    views: number[];
    downloads: number[];
    publishes: number[];
    searches: number[];
    unique_users: number[];
  };
}

// 实时事件
export interface RealtimeEvent {
  id: string;
  type: string;
  user: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// 搜索分析
export interface SearchAnalysis {
  period_days: number;
  total_searches: number;
  zero_result_count: number;
  zero_result_rate: number;
  unique_queries?: number;
  top_queries: { query: string; count: number }[];
  zero_result_queries: { query: string; count: number }[];
}

export interface AuditLog {
  id: string;
  type: string;
  skill_slug: string;
  skill_name: string;
  ip: string;
  user: string;
  timestamp: string;
  detail: string;
}

// 获取技能列表
export async function getSkills(params?: { 
  page?: number; 
  size?: number; 
  tag?: string;
  tags?: string;
}): Promise<ApiResponse<PageResponse<Skill>>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  if (params?.tag) query.set('tag', params.tag);
  if (params?.tags) query.set('tags', params.tags);
  
  const response = await fetch(`${API_BASE}/skills?${query}`);
  if (!response.ok) throw new Error('Failed to fetch skills');
  return response.json();
}

// 获取技能详情
export async function getSkill(slug: string): Promise<ApiResponse<SkillDetail>> {
  const response = await fetch(`${API_BASE}/skills/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch skill');
  return response.json();
}

// 搜索技能（支持按作者、部门、标签筛选）
export async function searchSkills(
  q: string,
  filters?: { author?: string; department?: string; tag?: string }
): Promise<ApiResponse<{ content: Skill[]; totalElements: number }>> {
  const params = new URLSearchParams();
  params.set('q', q);
  if (filters?.author) params.set('author', filters.author);
  if (filters?.department) params.set('department', filters.department);
  if (filters?.tag) params.set('tag', filters.tag);
  
  const response = await fetch(`${API_BASE}/search?${params}`);
  if (!response.ok) throw new Error('Failed to search skills');
  return response.json();
}

// 发布技能
export async function publishSkill(formData: FormData): Promise<ApiResponse<{
  id: string;
  name: string;
  slug: string;
  version: string;
  downloadUrl: string;
}>> {
  const response = await fetch(`${API_BASE}/skills`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish skill');
  }
  return response.json();
}

// 更新技能信息
export async function updateSkill(slug: string, formData: FormData): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${API_BASE}/skills/${slug}`, {
    method: 'PUT',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update skill');
  }
  return response.json();
}

// 删除技能（无限制）
export async function deleteSkill(slug: string): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${API_BASE}/skills/${slug}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete skill');
  }
  return response.json();
}

// 记录浏览量
export async function recordView(slug: string): Promise<ApiResponse<{ success: boolean }>> {
  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(slug)}/view`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to record view');
  return response.json();
}

// 获取统计数据（原始）
export async function getStats(): Promise<ApiResponse<StatsData>> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

// 获取KPI汇总
export async function getKpi(): Promise<ApiResponse<KpiData>> {
  const response = await fetch(`${API_BASE}/stats/kpi`);
  if (!response.ok) throw new Error('Failed to fetch KPI');
  return response.json();
}

// 获取趋势数据
export async function getTrend(days: number = 30): Promise<ApiResponse<TrendData>> {
  const response = await fetch(`${API_BASE}/stats/trend?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch trend');
  return response.json();
}

// 获取实时活动流
export async function getRealtimeEvents(limit: number = 20): Promise<ApiResponse<RealtimeEvent[]>> {
  const response = await fetch(`${API_BASE}/stats/realtime?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch realtime events');
  return response.json();
}

// 获取搜索分析
export async function getSearchAnalysis(days: number = 7): Promise<ApiResponse<SearchAnalysis>> {
  const response = await fetch(`${API_BASE}/stats/search-analysis?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch search analysis');
  return response.json();
}

// 管理员登录
export async function adminLogin(password: string): Promise<ApiResponse<{ token: string }>> {
  const formData = new FormData();
  formData.append('password', password);
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '登录失败');
  }
  return response.json();
}

// 获取待审核列表
export async function getPending(token: string): Promise<ApiResponse<{ skills: Skill[]; versions: any[] }>> {
  const response = await fetch(`${API_BASE}/admin/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch pending');
  return response.json();
}

// 审核操作
export async function approveSkill(token: string, slug: string, action: 'approve' | 'reject' | 'delete', reason?: string): Promise<ApiResponse<{ message: string }>> {
  const formData = new FormData();
  formData.append('slug', slug);
  formData.append('action', action);
  if (reason) formData.append('reason', reason);
  const response = await fetch(`${API_BASE}/admin/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '审核失败');
  }
  return response.json();
}

// 获取审计日志
export async function getAuditLogs(token: string, params?: { type?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<AuditLog>>> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  
  const response = await fetch(`${API_BASE}/admin/logs?${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.json();
}

// 获取下载链接
export function getDownloadUrl(slug: string, version?: string): string {
  if (version) {
    return `${API_BASE}/skills/${slug}/download?version=${encodeURIComponent(version)}`;
  }
  return `${API_BASE}/skills/${slug}/download`;
}

// Webhook 日志相关接口
export interface WebhookLog {
  id: string;
  type: string;
  channel: string;
  status: string;
  webhook_url: string;
  request_body: any;
  response_body: any;
  response_code: number;
  error_message: string;
  duration_ms: number;
  timestamp: string;
  report_data?: any;
  card_template?: string;
}

// 获取 Webhook 日志列表
export async function getWebhookLogs(token: string, params?: { type?: string; status?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<WebhookLog>>> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  
  const response = await fetch(`${API_BASE}/admin/webhook-logs?${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch webhook logs');
  return response.json();
}

// 获取 Webhook 日志详情
export async function getWebhookLogDetail(token: string, id: string): Promise<ApiResponse<WebhookLog>> {
  const response = await fetch(`${API_BASE}/admin/webhook-logs/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch webhook log detail');
  return response.json();
}

// 获取 Webhook 统计
export async function getWebhookStats(token: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/admin/webhook-logs/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch webhook stats');
  return response.json();
}

// 测试发送 Webhook
export async function testWebhook(token: string, channel: string = 'internal'): Promise<ApiResponse<WebhookLog>> {
  const response = await fetch(`${API_BASE}/admin/webhook-logs/test?channel=${channel}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to test webhook');
  return response.json();
}

// 重试 Webhook
export async function retryWebhook(token: string, id: string, channel?: string): Promise<ApiResponse<any>> {
  const url = channel 
    ? `${API_BASE}/admin/webhook-logs/${id}/retry?channel=${channel}`
    : `${API_BASE}/admin/webhook-logs/${id}/retry`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to retry webhook');
  return response.json();
}

// 手动发送日报
export async function sendDailyReport(token: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/admin/send-daily-report`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to send daily report');
  return response.json();
}

// 手动发送周报
export async function sendWeeklyReport(token: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/admin/send-weekly-report`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to send weekly report');
  return response.json();
}

// 健康检查
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await fetch('/health');
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// ========== 埋点追踪 ==========

export async function trackEvent(
  event: string,
  skillId?: string,
  data?: Record<string, any>
): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      skill_id: skillId,
      data,
      user_id: getUserId(),
    }),
  });
  if (!response.ok) throw new Error('Failed to track event');
  return response.json();
}

export async function getSkillStats(slug: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/skills/${slug}/stats`);
  if (!response.ok) throw new Error('Failed to get skill stats');
  return response.json();
}

export async function getSkillScoreDetail(slug: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/skills/${slug}/score-detail`);
  if (!response.ok) throw new Error('Failed to get skill score detail');
  return response.json();
}

export async function rateSkill(
  slug: string,
  rating: number,
  comment?: string
): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/skills/${slug}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating,
      comment,
      user_id: getUserId(),
    }),
  });
  if (!response.ok) throw new Error('Failed to rate skill');
  return response.json();
}

export async function getArenaCandidates(): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/arena/candidates`);
  if (!response.ok) throw new Error('Failed to get arena candidates');
  return response.json();
}

export async function getArenaRankings(
  type: string = 'all',
  limit: number = 10
): Promise<ApiResponse<any>> {
  const response = await fetch(
    `${API_BASE}/arena/rankings?type=${type}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to get arena rankings');
  return response.json();
}

// 获取大区排行榜（排除数智中心）
export async function getRegionRankings(
  metric: string = 'publishes',
  limit: number = 10
): Promise<ApiResponse<any>> {
  const response = await fetch(
    `${API_BASE}/rankings/regions?metric=${metric}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to get region rankings');
  return response.json();
}

// 获取职能中心排行榜（排除数智中心）
export async function getCenterRankings(
  metric: string = 'publishes',
  limit: number = 10
): Promise<ApiResponse<any>> {
  const response = await fetch(
    `${API_BASE}/rankings/centers?metric=${metric}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to get center rankings');
  return response.json();
}

// 获取融合排行榜（各大区 + 职能中心，排除数智中心）
export async function getCombinedRankings(
  metric: string = 'publishes',
  limit: number = 20
): Promise<ApiResponse<any>> {
  const response = await fetch(
    `${API_BASE}/rankings/combined?metric=${metric}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to get combined rankings');
  return response.json();
}

// 前端黑名单IP（与后端保持一致，用于过滤可疑IP）
const BLOCKED_IPS = new Set([
  "111.56.183.77",
  "60.31.150.220",
  "39.154.197.229",
  "106.35.221.81",
  // 2026-06-11 可疑扫描IP
  "60.31.143.234",
  "1.25.47.6",
  "110.19.124.223",
  "39.154.199.120",
  "1.25.31.186",
  "39.154.211.115",
  // 2026-06-10 可疑扫描IP
  "1.181.123.124",
  "220.195.74.35",
  // 2026-06-09 可疑扫描IP
  "36.102.133.223",
  // 2026-06-12 可疑扫描IP
  "14.17.105.142",
  "14.18.237.12",
  "111.55.25.223",
  "222.222.126.121",
  // 2026-06-13 可疑扫描IP
  "218.4.137.98",
]);

// 获取原始事件数据并过滤
async function getFilteredEvents(startDate: string, endDate: string): Promise<any[]> {
  // 获取原始事件数据
  const events: any[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    try {
      const response = await fetch(`${API_BASE}/events?date=${dateStr}&limit=10000`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          events.push(...data.data);
        }
      }
    } catch (e) {
      console.error(`获取${dateStr}事件失败`, e);
    }
  }
  
  // 过滤黑名单IP
  return events.filter(event => !event.ip || !BLOCKED_IPS.has(event.ip));
}

// 计算过滤后的统计数据
function calculateStats(events: any[]): any {
  const downloads = events.filter(e => e.type === 'skill.download').length;
  const views = events.filter(e => e.type === 'skill.view').length;
  const searches = events.filter(e => e.type === 'search').length;
  const publishes = events.filter(e => e.type === 'skill.publish').length;
  const uniqueUsers = new Set(events.filter(e => e.user).map(e => e.user)).size;
  
  return {
    downloads,
    views,
    searches,
    publishes,
    unique_users: uniqueUsers
  };
}

// 过滤事件数据中的可疑IP
function filterBlockedIps(data: any): any {
  if (!data) return data;
  
  // 如果是数组，过滤每个元素
  if (Array.isArray(data)) {
    return data.filter(item => {
      if (item.ip && BLOCKED_IPS.has(item.ip)) return false;
      if (item.events && Array.isArray(item.events)) {
        item.events = item.events.filter((e: any) => !e.ip || !BLOCKED_IPS.has(e.ip));
      }
      return true;
    });
  }
  
  // 如果是对象，递归处理
  if (typeof data === 'object') {
    const result = { ...data };
    
    // 过滤事件数组
    if (result.events && Array.isArray(result.events)) {
      result.events = result.events.filter((e: any) => !e.ip || !BLOCKED_IPS.has(e.ip));
    }
    
    // 过滤技能数组中的事件
    if (result.skills && Array.isArray(result.skills)) {
      result.skills = result.skills.map((skill: any) => {
        if (skill.events && Array.isArray(skill.events)) {
          return {
            ...skill,
            events: skill.events.filter((e: any) => !e.ip || !BLOCKED_IPS.has(e.ip))
          };
        }
        return skill;
      });
    }
    
    return result;
  }
  
  return data;
}

// ========== 运营数据分析 API ==========

export async function getAnalyticsOverview(startDate: string, endDate: string): Promise<ApiResponse<any>> {
  // 获取原始事件并计算过滤后的统计
  const events = await getFilteredEvents(startDate, endDate);
  const stats = calculateStats(events);
  
  return {
    success: true,
    data: {
      ...stats,
      period: `${startDate} ~ ${endDate}`
    }
  };
}

export async function getAnalyticsTrend(startDate: string, endDate: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/trend?start_date=${startDate}&end_date=${endDate}`);
  if (!response.ok) throw new Error('Failed to get analytics trend');
  const data = await response.json();
  return filterBlockedIps(data);
}

export async function getAnalyticsSkills(startDate: string, endDate: string, sortBy: string = 'downloads', limit: number = 10): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/skills?start_date=${startDate}&end_date=${endDate}&sort_by=${sortBy}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to get analytics skills');
  const data = await response.json();
  return filterBlockedIps(data);
}

export async function getAnalyticsSearch(startDate: string, endDate: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/search?start_date=${startDate}&end_date=${endDate}`);
  if (!response.ok) throw new Error('Failed to get analytics search');
  const data = await response.json();
  return filterBlockedIps(data);
}

export async function getAnalyticsHeatmap(startDate: string, endDate: string, metric: string = 'downloads'): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/heatmap?start_date=${startDate}&end_date=${endDate}&metric=${metric}`);
  if (!response.ok) throw new Error('Failed to get analytics heatmap');
  const data = await response.json();
  return filterBlockedIps(data);
}

export async function getAnalyticsDayDetail(date: string, metric: string = 'downloads'): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/analytics/day-detail?date=${date}&metric=${metric}`);
  if (!response.ok) throw new Error('Failed to get analytics day detail');
  const data = await response.json();
  return filterBlockedIps(data);
}

// ========== 评奖数据 API（排除数智中心）==========

export async function getRankingDepartments(metric: string = 'composite', limit: number = 10): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/rankings/departments?metric=${metric}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to get department rankings');
  return response.json();
}

export async function getRankingDevelopers(metric: string = 'composite', limit: number = 10): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/rankings/developers?metric=${metric}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to get developer rankings');
  return response.json();
}

export async function getRankingCenters(metric: string = 'composite'): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/rankings/centers?metric=${metric}`);
  if (!response.ok) throw new Error('Failed to get center rankings');
  return response.json();
}

export async function getRankingRegions(metric: string = 'publishes'): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE}/rankings/regions?metric=${metric}`);
  if (!response.ok) throw new Error('Failed to get region rankings');
  return response.json();
}

// 获取用户ID（基于IP的简单标识）
function getUserId(): string {
  // 尝试从localStorage获取
  let userId = localStorage.getItem('skillhub_user_id');
  if (!userId) {
    // 生成随机ID
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('skillhub_user_id', userId);
  }
  return userId;
}
