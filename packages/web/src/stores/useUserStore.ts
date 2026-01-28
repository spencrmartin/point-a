import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatarUrl: string | null
}

interface UserState {
  // User identity
  user: User | null
  isOnboarded: boolean

  // Actions
  setUser: (user: Partial<User>) => void
  clearUser: () => void
  setOnboarded: (onboarded: boolean) => void

  // Helpers
  getDisplayName: () => string
  getInitials: () => string
  getUserIdentifier: () => string // For matching assignee field
}

// Generate a simple unique ID
const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substring(2, 11)
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,

      setUser: (userData) => set((state) => {
        const currentUser = state.user
        const newUser: User = {
          id: currentUser?.id || generateUserId(),
          name: userData.name ?? currentUser?.name ?? '',
          username: userData.username ?? currentUser?.username ?? '',
          email: userData.email ?? currentUser?.email ?? '',
          avatarUrl: userData.avatarUrl ?? currentUser?.avatarUrl ?? null,
        }
        return { user: newUser, isOnboarded: true }
      }),

      clearUser: () => set({ user: null, isOnboarded: false }),

      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      getDisplayName: () => {
        const { user } = get()
        if (!user) return 'Anonymous'
        return user.name || user.username || 'Anonymous'
      },

      getInitials: () => {
        const { user } = get()
        if (!user) return '?'
        const name = user.name || user.username || ''
        if (!name) return '?'
        const parts = name.trim().split(/\s+/)
        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
      },

      getUserIdentifier: () => {
        const { user } = get()
        if (!user) return ''
        // Return the most specific identifier for matching assignee
        return user.username || user.name || user.email || ''
      },
    }),
    {
      name: 'point-a-user',
    }
  )
)
