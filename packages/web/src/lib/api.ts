import type { 
  Issue, CreateIssue, UpdateIssue, IssueListQuery, IssueWithRelations,
  Project, CreateProject, UpdateProject, ProjectWithStats,
  Cycle, CreateCycle, UpdateCycle, CycleWithStats,
  Label, CreateLabel, UpdateLabel,
  Comment, CreateCommentInput, UpdateCommentInput,
  ChecklistItem, CreateChecklistItem, UpdateChecklistItem,
  IssueDependencies, CreateDependency, BlockedIssue, ActionableIssue, CriticalPath,
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

// Comments API
export const commentsApi = {
  list: (issueId: string) =>
    fetchApi<ApiResponse<Comment[]>>(`/issues/${issueId}/comments`),
  create: (issueId: string, data: CreateCommentInput) =>
    fetchApi<ApiResponse<Comment>>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateCommentInput) =>
    fetchApi<ApiResponse<Comment>>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/comments/${id}`, { method: 'DELETE' }),
}

// Checklist API
export const checklistApi = {
  list: (issueId: string) =>
    fetchApi<ApiResponse<ChecklistItem[]>>(`/issues/${issueId}/checklist`),
  getProgress: (issueId: string) =>
    fetchApi<ApiResponse<{ completed: number; total: number }>>(`/issues/${issueId}/checklist/progress`),
  create: (issueId: string, data: CreateChecklistItem) =>
    fetchApi<ApiResponse<ChecklistItem>>(`/issues/${issueId}/checklist`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateChecklistItem) =>
    fetchApi<ApiResponse<ChecklistItem>>(`/checklist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  toggle: (id: string) =>
    fetchApi<ApiResponse<ChecklistItem>>(`/checklist/${id}/toggle`, {
      method: 'POST',
    }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/checklist/${id}`, { method: 'DELETE' }),
  reorder: (issueId: string, itemIds: string[]) =>
    fetchApi<ApiResponse<ChecklistItem[]>>(`/issues/${issueId}/checklist/reorder`, {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    }),
}

// Dependencies API
export const dependenciesApi = {
  // Get all dependencies for an issue
  get: (issueId: string) =>
    fetchApi<ApiResponse<IssueDependencies>>(`/issues/${issueId}/dependencies`),
  
  // Add a dependency
  add: (issueId: string, data: CreateDependency) =>
    fetchApi<ApiResponse<{ id: string }>>(`/issues/${issueId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Remove a dependency
  remove: (dependencyId: string) =>
    fetchApi<{ success: boolean }>(`/dependencies/${dependencyId}`, { method: 'DELETE' }),
  
  // Check if an issue is blocked
  isBlocked: (issueId: string) =>
    fetchApi<ApiResponse<{ isBlocked: boolean }>>(`/issues/${issueId}/is-blocked`),
  
  // Get all blocked issues
  getBlocked: (projectId?: string) => {
    const qs = projectId ? `?projectId=${projectId}` : ''
    return fetchApi<ApiResponse<BlockedIssue[]>>(`/issues/blocked${qs}`)
  },
  
  // Get actionable (unblocked) issues
  getActionable: (projectId?: string, status?: string) => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (status) params.set('status', status)
    const qs = params.toString()
    return fetchApi<ApiResponse<ActionableIssue[]>>(`/issues/actionable${qs ? `?${qs}` : ''}`)
  },
  
  // Get critical path for a project
  getCriticalPath: (projectId: string) =>
    fetchApi<ApiResponse<CriticalPath>>(`/projects/${projectId}/critical-path`),
}
