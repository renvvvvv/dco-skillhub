import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/api/client'

export interface UserStatItem {
  name: string
  value: number
}

async function fetchTopUploaders(limit: number = 10): Promise<UserStatItem[]> {
  return fetchJson<UserStatItem[]>(`/api/web/stats/uploads?limit=${limit}`)
}

async function fetchTopDownloaders(limit: number = 10): Promise<UserStatItem[]> {
  return fetchJson<UserStatItem[]>(`/api/web/stats/downloads?limit=${limit}`)
}

export function useTopUploaders(limit: number = 10) {
  return useQuery({
    queryKey: ['userStats', 'uploads', limit],
    queryFn: () => fetchTopUploaders(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTopDownloaders(limit: number = 10) {
  return useQuery({
    queryKey: ['userStats', 'downloads', limit],
    queryFn: () => fetchTopDownloaders(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Combined hook for both stats
export function useUserStats(uploadLimit: number = 10, downloadLimit: number = 10) {
  const uploadsQuery = useTopUploaders(uploadLimit)
  const downloadsQuery = useTopDownloaders(downloadLimit)

  return {
    topUploaders: uploadsQuery.data || [],
    topDownloaders: downloadsQuery.data || [],
    isLoadingUploads: uploadsQuery.isLoading,
    isLoadingDownloads: downloadsQuery.isLoading,
    isError: uploadsQuery.isError || downloadsQuery.isError,
  }
}
