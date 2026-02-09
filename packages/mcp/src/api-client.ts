/**
 * API Client for MCP server
 * Uses HTTP API instead of direct database access to avoid native module issues
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Read API port from port file (written by API server)
function getApiPort(): number {
  const portFile = join(homedir(), '.point-a', 'api.port')
  if (existsSync(portFile)) {
    const port = parseInt(readFileSync(portFile, 'utf-8').trim())
    if (!isNaN(port)) {
      return port
    }
  }
  // Fallback to env var or default
  return parseInt(process.env.POINTA_API_PORT || '3001')
}

function getApiBaseUrl(): string {
  const port = getApiPort()
  return `http://localhost:${port}/api`
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// Types
interface Project {
  id: string
  key: string
  name: string
  description?: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
}

interface Issue {
  id: string
  identifier: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  assignee?: string
  estimate?: number
  dueDate?: string
  projectId: string
  cycleId?: string
  parentId?: string
  sortOrder?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  labels?: Label[]
  project?: { key: string; name: string }
}

interface Label {
  id: string
  name: string
  color: string
  projectId?: string
  createdAt: string
}

interface Cycle {
  id: string
  name: string
  description?: string
  projectId: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

interface Dependency {
  id: string
  dependencyType: string
  issue: {
    id: string
    identifier: string
    title: string
    status: string
    priority: string
  }
}

interface IssueDependencies {
  blocks: Dependency[]
  blockedBy: Dependency[]
  relatesTo: Dependency[]
  duplicates: Dependency[]
}

interface ApiResponse<T> {
  data: T
}

// API Client
export const apiClient = {
  // Projects
  async listProjects(): Promise<Project[]> {
    const res = await fetchApi<ApiResponse<Project[]>>('/projects')
    return res.data
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      const res = await fetchApi<ApiResponse<Project>>(`/projects/${id}`)
      return res.data
    } catch {
      return null
    }
  },

  async getProjectByKey(key: string): Promise<Project | null> {
    const projects = await this.listProjects()
    return projects.find(p => p.key === key) || null
  },

  async createProject(data: { key: string; name: string; description?: string; color?: string; icon?: string }): Promise<Project> {
    const res = await fetchApi<ApiResponse<Project>>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Issues
  async listIssues(query?: {
    projectId?: string
    status?: string
    priority?: string
    assignee?: string
    search?: string
    limit?: number
  }): Promise<Issue[]> {
    const params = new URLSearchParams()
    if (query) {
      if (query.projectId) params.set('projectId', query.projectId)
      if (query.status) params.set('status', query.status)
      if (query.priority) params.set('priority', query.priority)
      if (query.assignee) params.set('assignee', query.assignee)
      if (query.search) params.set('search', query.search)
      if (query.limit) params.set('limit', String(query.limit))
    }
    const qs = params.toString()
    const res = await fetchApi<ApiResponse<Issue[]>>(`/issues${qs ? `?${qs}` : ''}`)
    return res.data
  },

  async getIssue(id: string): Promise<Issue | null> {
    try {
      const res = await fetchApi<ApiResponse<Issue>>(`/issues/${id}`)
      return res.data
    } catch {
      return null
    }
  },

  async getIssueByIdentifier(identifier: string): Promise<Issue | null> {
    return this.getIssue(identifier)
  },

  async createIssue(data: {
    title: string
    projectId: string
    description?: string
    status?: string
    priority?: string
    type?: string
    assignee?: string
    dueDate?: string
  }): Promise<Issue> {
    const res = await fetchApi<ApiResponse<Issue>>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  async updateIssue(id: string, data: Partial<{
    title: string
    description: string
    status: string
    priority: string
    type: string
    assignee: string
    dueDate: string
  }>): Promise<Issue> {
    const res = await fetchApi<ApiResponse<Issue>>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return res.data
  },

  async deleteIssue(id: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/issues/${id}`, { method: 'DELETE' })
  },

  async bulkUpdateIssues(ids: string[], update: Partial<{
    status: string
    priority: string
    assignee: string
  }>): Promise<{ updated: number }> {
    const res = await fetchApi<ApiResponse<{ updated: number }>>('/issues/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, update }),
    })
    return res.data
  },

  // Labels
  async listLabels(projectId?: string): Promise<Label[]> {
    const qs = projectId ? `?projectId=${projectId}` : ''
    const res = await fetchApi<ApiResponse<Label[]>>(`/labels${qs}`)
    return res.data
  },

  async createLabel(data: { name: string; color?: string; projectId?: string }): Promise<Label> {
    const res = await fetchApi<ApiResponse<Label>>('/labels', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Cycles
  async listCycles(projectId?: string): Promise<Cycle[]> {
    const qs = projectId ? `?projectId=${projectId}` : ''
    const res = await fetchApi<ApiResponse<Cycle[]>>(`/cycles${qs}`)
    return res.data
  },

  async createCycle(data: { name: string; projectId: string; startDate?: string; endDate?: string }): Promise<Cycle> {
    const res = await fetchApi<ApiResponse<Cycle>>('/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Dependencies
  async getIssueDependencies(issueId: string): Promise<IssueDependencies> {
    const res = await fetchApi<ApiResponse<IssueDependencies>>(`/issues/${issueId}/dependencies`)
    return res.data
  },

  async addDependency(sourceIssueId: string, targetIssueId: string, dependencyType: 'blocks' | 'relates' | 'duplicates'): Promise<{ id: string }> {
    const res = await fetchApi<ApiResponse<{ id: string }>>(`/issues/${sourceIssueId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ targetIssueId, dependencyType }),
    })
    return res.data
  },

  async removeDependency(dependencyId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/dependencies/${dependencyId}`, { method: 'DELETE' })
  },

  async isIssueBlocked(issueId: string): Promise<boolean> {
    const res = await fetchApi<ApiResponse<{ isBlocked: boolean }>>(`/issues/${issueId}/is-blocked`)
    return res.data.isBlocked
  },

  async getBlockedIssues(projectId?: string): Promise<Issue[]> {
    const qs = projectId ? `?projectId=${projectId}` : ''
    const res = await fetchApi<ApiResponse<Issue[]>>(`/issues/blocked${qs}`)
    return res.data
  },

  async getActionableIssues(projectId?: string, status?: string): Promise<Issue[]> {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (status) params.set('status', status)
    const qs = params.toString()
    const res = await fetchApi<ApiResponse<Issue[]>>(`/issues/actionable${qs ? `?${qs}` : ''}`)
    return res.data
  },

  async getCriticalPath(projectId: string): Promise<{ path: string[]; totalEstimate: number }> {
    const res = await fetchApi<ApiResponse<{ path: string[]; totalEstimate: number }>>(`/projects/${projectId}/critical-path`)
    return res.data
  },

  // Stats
  async getStats(): Promise<{
    totalProjects: number
    totalIssues: number
    issuesByStatus: Record<string, number>
    issuesByPriority: Record<string, number>
  }> {
    const [projects, issues] = await Promise.all([
      this.listProjects(),
      this.listIssues({ limit: 1000 }),
    ])

    const issuesByStatus: Record<string, number> = {}
    const issuesByPriority: Record<string, number> = {}

    for (const issue of issues) {
      issuesByStatus[issue.status] = (issuesByStatus[issue.status] || 0) + 1
      issuesByPriority[issue.priority] = (issuesByPriority[issue.priority] || 0) + 1
    }

    return {
      totalProjects: projects.length,
      totalIssues: issues.length,
      issuesByStatus,
      issuesByPriority,
    }
  },
}

export type { Project, Issue, Label, Cycle, IssueDependencies, Dependency }
