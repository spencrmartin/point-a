import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { HomeView } from './components/HomeView'
import { BoardView } from './components/BoardView'
import { ListView } from './components/ListView'
import { TimelineView } from './components/TimelineView'
import { DependencyGraphView } from './components/DependencyGraphView'
import { InboxView } from './components/InboxView'
import { MyIssuesView } from './components/MyIssuesView'
import { QuickCreateModal } from './components/QuickCreateModal'
import { CreateProjectModal } from './components/CreateProjectModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { Settings } from './components/Settings'
import { CommandPalette } from './components/CommandPalette'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { KeyboardProvider, useKeyboardContext } from './contexts/KeyboardContext'
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
  const { viewMode, setQuickCreateOpen, setSidebarOpen, setActiveIssueId } = useStore()
  const { theme, accentColor } = useSettingsStore()
  
  // Keyboard context for modals
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isShortcutsHelpOpen,
    setShortcutsHelpOpen,
    isQuickCreateOpen,
    isSettingsOpen,
    setSettingsOpen,
  } = useKeyboardContext()

  // Sync keyboard context with store for QuickCreateModal
  useEffect(() => {
    if (isQuickCreateOpen) {
      setQuickCreateOpen(true)
    }
  }, [isQuickCreateOpen, setQuickCreateOpen])

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(!e.matches)
    }
    
    // Set initial state
    handleResize(mediaQuery)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleResize)
    return () => mediaQuery.removeEventListener('change', handleResize)
  }, [setSidebarOpen])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemDark)
      
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

  const { homeBackground } = useSettingsStore()

  // Handle opening issue from command palette
  const handleOpenIssue = (issueId: string) => {
    setActiveIssueId(issueId)
  }

  return (
    <div className="h-screen p-3 relative">
      {/* Global Background */}
      {homeBackground ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${homeBackground})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-background" />
      )}
      
      {/* Panels Container */}
      <div className="relative h-full flex gap-3">
        {/* Sidebar Panel */}
        <Sidebar />
        
        {/* Right Side (Header + Content stacked) */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Header Panel */}
          <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm">
            <Header />
          </div>
          
          {/* Content Panel */}
          <main className="flex-1 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-auto">
            {viewMode === 'home' && <HomeView />}
            {viewMode === 'board' && <div className="p-4 h-full"><BoardView /></div>}
            {viewMode === 'list' && <div className="p-4 h-full"><ListView /></div>}
            {viewMode === 'timeline' && <div className="p-4 h-full"><TimelineView /></div>}
            {viewMode === 'graph' && <div className="h-full"><DependencyGraphView /></div>}
            {viewMode === 'inbox' && <InboxView />}
            {viewMode === 'my-issues' && <MyIssuesView />}
          </main>
        </div>
      </div>

      {/* Modals */}
      <QuickCreateModal />
      <CreateProjectModal />
      <IssueDetailModal />
      <Settings open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Keyboard-triggered modals */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onQuickCreate={() => {
          setCommandPaletteOpen(false)
          setQuickCreateOpen(true)
        }}
        onOpenSettings={() => {
          setCommandPaletteOpen(false)
          setSettingsOpen(true)
        }}
        onOpenShortcutsHelp={() => {
          setCommandPaletteOpen(false)
          setShortcutsHelpOpen(true)
        }}
        onOpenIssue={handleOpenIssue}
      />
      <KeyboardShortcutsHelp
        open={isShortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
      
      <Toaster position="bottom-right" />
    </div>
  )
}

function AppWithKeyboard() {
  return (
    <KeyboardProvider>
      <AppContent />
    </KeyboardProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithKeyboard />
    </QueryClientProvider>
  )
}
