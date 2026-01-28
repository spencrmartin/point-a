import { useEffect, useCallback, useRef } from 'react'

export interface Shortcut {
  key: string
  meta?: boolean
  shift?: boolean
  alt?: boolean
  ctrl?: boolean
  description: string
  category: 'global' | 'navigation' | 'issues' | 'actions'
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: Shortcut[]
}

// Check if user is typing in an input field
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  )
}

// Normalize key for comparison
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Escape': 'escape',
    'Enter': 'enter',
    'Backspace': 'backspace',
    'Delete': 'delete',
    'Tab': 'tab',
    ' ': 'space',
  }
  return keyMap[key] || key.toLowerCase()
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Skip if typing in input (unless it's Escape or a meta key combo)
    const isInput = isInputElement(event.target)
    const hasMeta = event.metaKey || event.ctrlKey
    
    if (isInput && !hasMeta && event.key !== 'Escape') {
      return
    }

    const pressedKey = normalizeKey(event.key)

    for (const shortcut of shortcutsRef.current) {
      const shortcutKey = normalizeKey(shortcut.key)
      
      // Check if all modifiers match
      const metaMatch = (shortcut.meta || false) === (event.metaKey || event.ctrlKey)
      const shiftMatch = (shortcut.shift || false) === event.shiftKey
      const altMatch = (shortcut.alt || false) === event.altKey
      
      if (
        pressedKey === shortcutKey &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        // For non-meta shortcuts, don't trigger if in input
        if (!hasMeta && isInput && shortcutKey !== 'escape') {
          continue
        }
        
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        return
      }
    }
  }, [enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Predefined shortcut definitions (without actions - those are added by components)
export const SHORTCUT_DEFINITIONS = {
  // Global
  commandPalette: { key: 'k', meta: true, description: 'Open command palette', category: 'global' as const },
  quickCreate: { key: 'n', meta: true, description: 'Quick create issue', category: 'global' as const },
  search: { key: '/', meta: true, description: 'Search', category: 'global' as const },
  settings: { key: ',', meta: true, description: 'Open settings', category: 'global' as const },
  help: { key: '?', meta: true, description: 'Show keyboard shortcuts', category: 'global' as const },
  escape: { key: 'escape', description: 'Close modal / Cancel', category: 'global' as const },
  
  // Navigation
  goToInbox: { key: 'i', description: 'Go to Inbox', category: 'navigation' as const },
  goToMyIssues: { key: 'm', description: 'Go to My Issues', category: 'navigation' as const },
  goToHome: { key: 'h', description: 'Go to Home', category: 'navigation' as const },
  
  // Issue list navigation
  moveUp: { key: 'k', description: 'Move up', category: 'issues' as const },
  moveDown: { key: 'j', description: 'Move down', category: 'issues' as const },
  openIssue: { key: 'enter', description: 'Open selected issue', category: 'issues' as const },
  selectIssue: { key: 'x', description: 'Select/deselect issue', category: 'issues' as const },
  
  // Quick actions on selected issue
  setPriority: { key: 'p', description: 'Set priority', category: 'actions' as const },
  setStatus: { key: 's', description: 'Set status', category: 'actions' as const },
  assignIssue: { key: 'a', description: 'Assign issue', category: 'actions' as const },
  editIssue: { key: 'e', description: 'Edit issue', category: 'actions' as const },
  deleteIssue: { key: 'delete', description: 'Delete issue', category: 'actions' as const },
  setDueDate: { key: 'd', description: 'Set due date', category: 'actions' as const },
}

// Format shortcut for display
export function formatShortcut(shortcut: Pick<Shortcut, 'key' | 'meta' | 'shift' | 'alt'>): string {
  const parts: string[] = []
  
  if (shortcut.meta) parts.push('⌘')
  if (shortcut.shift) parts.push('⇧')
  if (shortcut.alt) parts.push('⌥')
  
  // Format the key nicely
  const keyDisplay: Record<string, string> = {
    'escape': 'Esc',
    'enter': '↵',
    'delete': 'Del',
    'backspace': '⌫',
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
    'space': 'Space',
    'tab': 'Tab',
  }
  
  const key = shortcut.key.toLowerCase()
  parts.push(keyDisplay[key] || shortcut.key.toUpperCase())
  
  return parts.join('')
}
