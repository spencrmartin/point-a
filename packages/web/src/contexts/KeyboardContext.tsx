import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useKeyboardShortcuts, SHORTCUT_DEFINITIONS, Shortcut } from '../hooks/useKeyboardShortcuts'
import { useStore } from '../stores/useStore'

interface KeyboardContextValue {
  // Modal states
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  isShortcutsHelpOpen: boolean
  setShortcutsHelpOpen: (open: boolean) => void
  isQuickCreateOpen: boolean
  setQuickCreateOpen: (open: boolean) => void
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  
  // Issue selection for keyboard navigation
  selectedIssueId: string | null
  setSelectedIssueId: (id: string | null) => void
  selectedIssueIds: string[]
  toggleIssueSelection: (id: string) => void
  clearSelection: () => void
  
  // Issue to open in detail modal
  openIssueId: string | null
  setOpenIssueId: (id: string | null) => void
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null)

export function useKeyboardContext() {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboardContext must be used within KeyboardProvider')
  }
  return context
}

interface KeyboardProviderProps {
  children: ReactNode
}

export function KeyboardProvider({ children }: KeyboardProviderProps) {
  // Modal states
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isShortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  
  // Issue selection
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [openIssueId, setOpenIssueId] = useState<string | null>(null)
  
  // Store access
  const { setViewMode } = useStore()
  
  const toggleIssueSelection = useCallback((id: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])
  
  const clearSelection = useCallback(() => {
    setSelectedIssueIds([])
  }, [])

  // Check if any modal is open (to disable shortcuts)
  const isAnyModalOpen = isCommandPaletteOpen || isShortcutsHelpOpen || isQuickCreateOpen || isSettingsOpen || openIssueId !== null

  // Define shortcuts with actions
  const shortcuts: Shortcut[] = [
    // Global shortcuts (always active unless modal is open)
    {
      ...SHORTCUT_DEFINITIONS.commandPalette,
      action: () => setCommandPaletteOpen(true),
    },
    {
      ...SHORTCUT_DEFINITIONS.quickCreate,
      action: () => setQuickCreateOpen(true),
    },
    {
      ...SHORTCUT_DEFINITIONS.search,
      action: () => setCommandPaletteOpen(true), // Search opens command palette
    },
    {
      ...SHORTCUT_DEFINITIONS.settings,
      action: () => setSettingsOpen(true),
    },
    {
      ...SHORTCUT_DEFINITIONS.help,
      action: () => setShortcutsHelpOpen(true),
    },
    {
      ...SHORTCUT_DEFINITIONS.escape,
      action: () => {
        // Close modals in order of priority
        if (isCommandPaletteOpen) setCommandPaletteOpen(false)
        else if (isShortcutsHelpOpen) setShortcutsHelpOpen(false)
        else if (isQuickCreateOpen) setQuickCreateOpen(false)
        else if (isSettingsOpen) setSettingsOpen(false)
        else if (openIssueId) setOpenIssueId(null)
        else clearSelection()
      },
    },
    
    // Navigation shortcuts (only when no modal is open)
    ...(!isAnyModalOpen ? [
      {
        ...SHORTCUT_DEFINITIONS.goToInbox,
        action: () => setViewMode('inbox'),
      },
      {
        ...SHORTCUT_DEFINITIONS.goToMyIssues,
        action: () => setViewMode('my-issues'),
      },
      {
        ...SHORTCUT_DEFINITIONS.goToHome,
        action: () => setViewMode('home'),
      },
    ] : []),
  ]

  useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  })

  const value: KeyboardContextValue = {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isShortcutsHelpOpen,
    setShortcutsHelpOpen,
    isQuickCreateOpen,
    setQuickCreateOpen,
    isSettingsOpen,
    setSettingsOpen,
    selectedIssueId,
    setSelectedIssueId,
    selectedIssueIds,
    toggleIssueSelection,
    clearSelection,
    openIssueId,
    setOpenIssueId,
  }

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  )
}
