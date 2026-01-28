import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IssueFilters } from './useStore'

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15)

export interface SavedView {
  id: string
  name: string
  icon: string
  filters: IssueFilters
  projectId: string | null // null means all projects
  groupBy: 'status' | 'priority' | 'assignee' | 'project' | 'none'
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'title'
  sortOrder: 'asc' | 'desc'
  createdAt: string
}

interface SavedViewsState {
  views: SavedView[]
  activeViewId: string | null
  
  // Actions
  addView: (view: Omit<SavedView, 'id' | 'createdAt'>) => string
  updateView: (id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>) => void
  deleteView: (id: string) => void
  setActiveView: (id: string | null) => void
  reorderViews: (viewIds: string[]) => void
}

// Default saved views
const defaultViews: SavedView[] = [
  {
    id: 'my-high-priority',
    name: 'High Priority',
    icon: '🔥',
    filters: {
      status: [],
      priority: ['urgent', 'high'],
      type: [],
      assignee: null,
    },
    projectId: null,
    groupBy: 'status',
    sortBy: 'priority',
    sortOrder: 'asc',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: '🚀',
    filters: {
      status: ['in_progress', 'in_review'],
      priority: [],
      type: [],
      assignee: null,
    },
    projectId: null,
    groupBy: 'priority',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bugs',
    name: 'All Bugs',
    icon: '🐛',
    filters: {
      status: [],
      priority: [],
      type: ['bug'],
      assignee: null,
    },
    projectId: null,
    groupBy: 'status',
    sortBy: 'priority',
    sortOrder: 'asc',
    createdAt: new Date().toISOString(),
  },
]

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set, get) => ({
      views: defaultViews,
      activeViewId: null,

      addView: (view) => {
        const id = generateId()
        const newView: SavedView = {
          ...view,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          views: [...state.views, newView],
        }))
        return id
      },

      updateView: (id, updates) => {
        set((state) => ({
          views: state.views.map((view) =>
            view.id === id ? { ...view, ...updates } : view
          ),
        }))
      },

      deleteView: (id) => {
        set((state) => ({
          views: state.views.filter((view) => view.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId,
        }))
      },

      setActiveView: (id) => {
        set({ activeViewId: id })
      },

      reorderViews: (viewIds) => {
        const { views } = get()
        const viewMap = new Map(views.map((v) => [v.id, v]))
        const reorderedViews = viewIds
          .map((id) => viewMap.get(id))
          .filter((v): v is SavedView => v !== undefined)
        set({ views: reorderedViews })
      },
    }),
    {
      name: 'point-a-saved-views',
    }
  )
)
