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
}

// 获取技能列表
export async function getSkills(params?: { 
  page?: number; 
  size?: number; 
  tag?: string 
}): Promise<ApiResponse<PageResponse<Skill>>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  if (params?.tag) query.set('tag', params.tag);
  
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

// 发布新版本
export async function publishVersion(
  slug: string, 
  formData: FormData
): Promise<ApiResponse<{
  skillId: string;
  version: string;
  tag: string;
  downloadUrl: string;
}>> {
  const response = await fetch(`${API_BASE}/skills/${slug}/versions`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish version');
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
