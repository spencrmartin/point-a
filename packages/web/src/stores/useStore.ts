import { create } from 'zustand'
import type { ProjectWithStats, IssueWithRelations } from '@point-a/shared'

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
  toggleSidebar: () => void
  
  // View preferences
  viewMode: 'board' | 'list' | 'timeline'
  setViewMode: (mode: 'board' | 'list' | 'timeline') => void

  // Quick create modal
  quickCreateOpen: boolean
  setQuickCreateOpen: (open: boolean) => void

  // Issue detail modal
  activeIssueId: string | null
  setActiveIssueId: (id: string | null) => void

  // Settings modal
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
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
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // View
  viewMode: 'board',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Modals
  quickCreateOpen: false,
  setQuickCreateOpen: (open) => set({ quickCreateOpen: open }),

  activeIssueId: null,
  setActiveIssueId: (id) => set({ activeIssueId: id }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
}))
