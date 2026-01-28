import * as Dialog from '@radix-ui/react-dialog'
import { X, Keyboard } from 'lucide-react'
import { SHORTCUT_DEFINITIONS, formatShortcut } from '../hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcutGroups = [
  {
    title: 'Global',
    shortcuts: [
      { ...SHORTCUT_DEFINITIONS.commandPalette },
      { ...SHORTCUT_DEFINITIONS.quickCreate },
      { ...SHORTCUT_DEFINITIONS.search },
      { ...SHORTCUT_DEFINITIONS.settings },
      { ...SHORTCUT_DEFINITIONS.help },
      { ...SHORTCUT_DEFINITIONS.escape },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { ...SHORTCUT_DEFINITIONS.goToInbox },
      { ...SHORTCUT_DEFINITIONS.goToMyIssues },
      { ...SHORTCUT_DEFINITIONS.goToHome },
    ],
  },
  {
    title: 'Issue List',
    shortcuts: [
      { ...SHORTCUT_DEFINITIONS.moveUp },
      { ...SHORTCUT_DEFINITIONS.moveDown },
      { ...SHORTCUT_DEFINITIONS.openIssue },
      { ...SHORTCUT_DEFINITIONS.selectIssue },
    ],
  },
  {
    title: 'Quick Actions',
    shortcuts: [
      { ...SHORTCUT_DEFINITIONS.setPriority },
      { ...SHORTCUT_DEFINITIONS.setStatus },
      { ...SHORTCUT_DEFINITIONS.assignIssue },
      { ...SHORTCUT_DEFINITIONS.editIssue },
      { ...SHORTCUT_DEFINITIONS.setDueDate },
      { ...SHORTCUT_DEFINITIONS.deleteIssue },
    ],
  },
]

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Keyboard className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="grid grid-cols-2 gap-8">
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                💡 Tips
              </h4>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>• Use <kbd className="px-1 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">J</kbd> and <kbd className="px-1 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">K</kbd> to navigate issues like in Vim</li>
                <li>• Press <kbd className="px-1 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">X</kbd> to select multiple issues for bulk actions</li>
                <li>• Quick actions work on the currently focused issue</li>
              </ul>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
