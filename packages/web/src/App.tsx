import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { BoardView } from './components/BoardView'
import { ListView } from './components/ListView'
import { TimelineView } from './components/TimelineView'
import { QuickCreateModal } from './components/QuickCreateModal'
import { Settings } from './components/Settings'
import { useStore } from './stores/useStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { useEffect } from 'react'

// Configure QueryClient with aggressive caching for snappy UI
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when switching windows
      refetchOnMount: false, // Don't refetch if data exists
      refetchOnReconnect: false,
    },
  },
})

function AppContent() {
  const { viewMode, setQuickCreateOpen, setViewMode, settingsOpen, setSettingsOpen } = useStore()
  const { theme, accentColor, shortcutsEnabled } = useSettingsStore()

  // Apply theme and accent color
  useEffect(() => {
    const root = document.documentElement
    
    // Theme
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemDark)
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  // Apply accent color
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [accentColor])

  // Keyboard shortcuts
  useEffect(() => {
    if (!shortcutsEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Cmd/Ctrl + K for quick create
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickCreateOpen(true)
      }

      // Cmd/Ctrl + , for settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }

      // Cmd/Ctrl + 1/2/3 for view switching
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault()
        setViewMode('board')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault()
        setViewMode('list')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault()
        setViewMode('timeline')
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        setQuickCreateOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcutsEnabled, setQuickCreateOpen, setSettingsOpen, setViewMode])

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-4">
          {viewMode === 'board' && <BoardView />}
          {viewMode === 'list' && <ListView />}
          {viewMode === 'timeline' && <TimelineView />}
        </main>
      </div>

      <QuickCreateModal />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toaster position="bottom-right" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
