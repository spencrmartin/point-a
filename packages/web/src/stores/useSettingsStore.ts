import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan'
export type DefaultView = 'board' | 'list' | 'timeline'
export type DefaultGrouping = 'status' | 'priority' | 'none'
export type DefaultPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type DefaultIssueType = 'bug' | 'feature' | 'improvement' | 'task' | 'epic'

interface SettingsState {
  // Appearance
  theme: Theme
  accentColor: AccentColor
  compactMode: boolean
  sidebarDefaultExpanded: boolean
  homeBackground: string | null // Base64 image or null

  // Default Views
  defaultView: DefaultView
  defaultGrouping: DefaultGrouping
  defaultSortField: 'createdAt' | 'updatedAt' | 'priority' | 'title'
  defaultSortOrder: 'asc' | 'desc'
  showCompletedIssues: boolean

  // Issues
  defaultProjectId: string | null
  defaultPriority: DefaultPriority
  defaultIssueType: DefaultIssueType
  autoAssignToMe: boolean
  myName: string

  // Keyboard shortcuts
  shortcutsEnabled: boolean

  // Actions
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setCompactMode: (compact: boolean) => void
  setSidebarDefaultExpanded: (expanded: boolean) => void
  setHomeBackground: (background: string | null) => void
  setDefaultView: (view: DefaultView) => void
  setDefaultGrouping: (grouping: DefaultGrouping) => void
  setDefaultSortField: (field: 'createdAt' | 'updatedAt' | 'priority' | 'title') => void
  setDefaultSortOrder: (order: 'asc' | 'desc') => void
  setShowCompletedIssues: (show: boolean) => void
  setDefaultProjectId: (id: string | null) => void
  setDefaultPriority: (priority: DefaultPriority) => void
  setDefaultIssueType: (type: DefaultIssueType) => void
  setAutoAssignToMe: (auto: boolean) => void
  setMyName: (name: string) => void
  setShortcutsEnabled: (enabled: boolean) => void
  resetToDefaults: () => void
}

const defaultSettings = {
  theme: 'system' as Theme,
  accentColor: 'blue' as AccentColor,
  compactMode: false,
  sidebarDefaultExpanded: true,
  homeBackground: null as string | null,
  defaultView: 'board' as DefaultView,
  defaultGrouping: 'status' as DefaultGrouping,
  defaultSortField: 'createdAt' as const,
  defaultSortOrder: 'desc' as const,
  showCompletedIssues: true,
  defaultProjectId: null,
  defaultPriority: 'none' as DefaultPriority,
  defaultIssueType: 'task' as DefaultIssueType,
  autoAssignToMe: false,
  myName: '',
  shortcutsEnabled: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setSidebarDefaultExpanded: (sidebarDefaultExpanded) => set({ sidebarDefaultExpanded }),
      setHomeBackground: (homeBackground) => set({ homeBackground }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setDefaultGrouping: (defaultGrouping) => set({ defaultGrouping }),
      setDefaultSortField: (defaultSortField) => set({ defaultSortField }),
      setDefaultSortOrder: (defaultSortOrder) => set({ defaultSortOrder }),
      setShowCompletedIssues: (showCompletedIssues) => set({ showCompletedIssues }),
      setDefaultProjectId: (defaultProjectId) => set({ defaultProjectId }),
      setDefaultPriority: (defaultPriority) => set({ defaultPriority }),
      setDefaultIssueType: (defaultIssueType) => set({ defaultIssueType }),
      setAutoAssignToMe: (autoAssignToMe) => set({ autoAssignToMe }),
      setMyName: (myName) => set({ myName }),
      setShortcutsEnabled: (shortcutsEnabled) => set({ shortcutsEnabled }),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'point-a-settings',
    }
  )
)
