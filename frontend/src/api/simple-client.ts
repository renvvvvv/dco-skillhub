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
  departments: { name: string; count: number }[];
  developers: { name: string; count: number }[];
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

// 搜索技能
export async function searchSkills(q: string): Promise<ApiResponse<{ content: Skill[]; totalElements: number }>> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
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

// 获取统计数据
export async function getStats(): Promise<ApiResponse<StatsData>> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
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

// 健康检查
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await fetch('/health');
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}
