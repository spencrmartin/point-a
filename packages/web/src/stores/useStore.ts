import { create } from 'zustand'
import type { ProjectWithStats, IssueWithRelations } from '@point-a/shared'

// Filter types
export interface IssueFilters {
  status: string[]
  priority: string[]
  type: string[]
  assignee: string | null
}

// Display options
export interface DisplayOptions {
  showEmptyGroups: boolean
  showSubIssues: boolean
  groupBy: 'status' | 'priority' | 'assignee' | 'project' | 'none'
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'title'
  sortOrder: 'asc' | 'desc'
}

interface AppState {
  // Current project context
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void

  // Selected issues for bulk operations
  selectedIssueIds: Set<string>
  toggleIssueSelection: (id: string) => void
  selectAllIssues: (ids: string[]) => void
  clearSelection: () => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // View preferences
  viewMode: 'home' | 'project-home' | 'board' | 'list' | 'timeline' | 'inbox' | 'my-issues'
  setViewMode: (mode: 'home' | 'project-home' | 'board' | 'list' | 'timeline' | 'inbox' | 'my-issues') => void
  
  // Sub-view for inbox/my-issues (which layout to use within those sections)
  subViewMode: 'board' | 'list' | 'timeline'
  setSubViewMode: (mode: 'board' | 'list' | 'timeline') => void

  // Filters
  filters: IssueFilters
  setFilters: (filters: Partial<IssueFilters>) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean

  // Display options
  displayOptions: DisplayOptions
  setDisplayOptions: (options: Partial<DisplayOptions>) => void

  // Quick create modal
  quickCreateOpen: boolean
  setQuickCreateOpen: (open: boolean) => void

  // Issue detail modal
  activeIssueId: string | null
  setActiveIssueId: (id: string | null) => void

  // Settings modal
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // Create project modal
  createProjectOpen: boolean
  setCreateProjectOpen: (open: boolean) => void

  // Edit project modal
  editProjectId: string | null
  setEditProjectId: (id: string | null) => void
}

const defaultFilters: IssueFilters = {
  status: [],
  priority: [],
  type: [],
  assignee: null,
}

const defaultDisplayOptions: DisplayOptions = {
  showEmptyGroups: true,
  showSubIssues: false,
  groupBy: 'status',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export const useStore = create<AppState>((set, get) => ({
  // Current project
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  // Selection
  selectedIssueIds: new Set(),
  toggleIssueSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedIssueIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedIssueIds: newSet }
    }),
  selectAllIssues: (ids) => set({ selectedIssueIds: new Set(ids) }),
  clearSelection: () => set({ selectedIssueIds: new Set() }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // View
  viewMode: 'home',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Sub-view for inbox/my-issues
  subViewMode: 'list',
  setSubViewMode: (mode) => set({ subViewMode: mode }),

  // Filters
  filters: defaultFilters,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  clearFilters: () => set({ filters: defaultFilters }),
  hasActiveFilters: () => {
    const { filters } = get()
    return (
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.type.length > 0 ||
      filters.assignee !== null
    )
  },

  // Display options
  displayOptions: defaultDisplayOptions,
  setDisplayOptions: (newOptions) => set((state) => ({
    displayOptions: { ...state.displayOptions, ...newOptions }
  })),

  // Modals
  quickCreateOpen: false,
  setQuickCreateOpen: (open) => set({ quickCreateOpen: open }),

  activeIssueId: null,
  setActiveIssueId: (id) => set({ activeIssueId: id }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  createProjectOpen: false,
  setCreateProjectOpen: (open) => set({ createProjectOpen: open }),

  editProjectId: null,
  setEditProjectId: (id) => set({ editProjectId: id }),
}))
