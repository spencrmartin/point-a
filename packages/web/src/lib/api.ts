import type { 
  Issue, CreateIssue, UpdateIssue, IssueListQuery, IssueWithRelations,
  Project, CreateProject, UpdateProject, ProjectWithStats,
  Cycle, CreateCycle, UpdateCycle, CycleWithStats,
  Label, CreateLabel, UpdateLabel,
  ApiResponse 
} from '@point-a/shared'

const API_BASE = '/api'
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(error.message || `HTTP ${res.status}`)
      }

      return res.json()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      
      // Only retry on network errors (not HTTP errors like 404, 500)
      const isNetworkError = lastError.message.includes('fetch') || 
                            lastError.message.includes('network') ||
                            lastError.message.includes('ETIMEDOUT') ||
                            lastError.name === 'TypeError'
      
      if (!isNetworkError || attempt === MAX_RETRIES - 1) {
        throw lastError
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
      console.log(`API request failed, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`)
      await delay(retryDelay)
    }
  }
  
  throw lastError || new Error('Request failed')
}

// Projects API
export const projectsApi = {
  list: () => fetchApi<ApiResponse<ProjectWithStats[]>>('/projects'),
  get: (id: string) => fetchApi<ApiResponse<Project>>(`/projects/${id}`),
  create: (data: CreateProject) => 
    fetchApi<ApiResponse<Project>>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateProject) =>
    fetchApi<ApiResponse<Project>>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
}

// Issues API
export const issuesApi = {
  list: (query?: Partial<IssueListQuery>) => {
    const params = new URLSearchParams()
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value))
      })
    }
    const qs = params.toString()
    return fetchApi<ApiResponse<IssueWithRelations[]> & { meta: { total: number } }>(
      `/issues${qs ? `?${qs}` : ''}`
    )
  },
  get: (id: string) => fetchApi<ApiResponse<IssueWithRelations>>(`/issues/${id}`),
  create: (data: CreateIssue) =>
    fetchApi<ApiResponse<IssueWithRelations>>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateIssue) =>
    fetchApi<ApiResponse<IssueWithRelations>>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string) =>
    fetchApi<ApiResponse<IssueWithRelations>>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/issues/${id}`, { method: 'DELETE' }),
  bulkUpdate: (ids: string[], update: UpdateIssue) =>
    fetchApi<ApiResponse<{ updated: number }>>('/issues/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, update }),
    }),
}

// Cycles API
export const cyclesApi = {
  list: (projectId?: string) => {
    const qs = projectId ? `?projectId=${projectId}` : ''
    return fetchApi<ApiResponse<CycleWithStats[]>>(`/cycles${qs}`)
  },
  get: (id: string) => fetchApi<ApiResponse<CycleWithStats>>(`/cycles/${id}`),
  create: (data: CreateCycle) =>
    fetchApi<ApiResponse<CycleWithStats>>('/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateCycle) =>
    fetchApi<ApiResponse<CycleWithStats>>(`/cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/cycles/${id}`, { method: 'DELETE' }),
}

// Labels API
export const labelsApi = {
  list: (projectId?: string) => {
    const qs = projectId ? `?projectId=${projectId}` : ''
    return fetchApi<ApiResponse<Label[]>>(`/labels${qs}`)
  },
  get: (id: string) => fetchApi<ApiResponse<Label>>(`/labels/${id}`),
  create: (data: CreateLabel) =>
    fetchApi<ApiResponse<Label>>('/labels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateLabel) =>
    fetchApi<ApiResponse<Label>>(`/labels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/labels/${id}`, { method: 'DELETE' }),
}
