import { Command } from 'cmdk'
import { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Inbox,
  User,
  Home,
  Settings,
  Keyboard,
  FolderKanban,
  Calendar,
  LayoutList,
  LayoutGrid,
  Clock,
} from 'lucide-react'
import { useStore } from '../stores/useStore'
import { useIssues } from '../hooks/useIssues'
import { useProjects } from '../hooks/useProjects'
import { formatShortcut } from '../hooks/useKeyboardShortcuts'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuickCreate: () => void
  onOpenSettings: () => void
  onOpenShortcutsHelp: () => void
  onOpenIssue: (issueId: string) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onQuickCreate,
  onOpenSettings,
  onOpenShortcutsHelp,
  onOpenIssue,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const { setViewMode, setCurrentProjectId, currentProjectId } = useStore()
  const { data: issuesData } = useIssues({ projectId: currentProjectId || undefined })
  const { data: projectsData } = useProjects()

  const issues = issuesData?.data || []
  const projects = projectsData?.data || []

  // Filter issues based on search
  const filteredIssues = useMemo(() => {
    if (!search) return issues.slice(0, 5) // Show recent 5 when no search
    const lowerSearch = search.toLowerCase()
    return issues
      .filter(
        (issue) =>
          issue.title.toLowerCase().includes(lowerSearch) ||
          issue.identifier.toLowerCase().includes(lowerSearch) ||
          issue.description?.toLowerCase().includes(lowerSearch)
      )
      .slice(0, 10)
  }, [issues, search])

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const handleSelect = (callback: () => void) => {
    callback()
    onOpenChange(false)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
            <Search className="w-5 h-5 text-zinc-400" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search issues, projects, or type a command..."
              className="flex-1 py-4 text-base bg-transparent outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            <kbd className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="mb-2">
              <CommandItem
                onSelect={() => handleSelect(onQuickCreate)}
                icon={<Plus className="w-4 h-4" />}
                shortcut={formatShortcut({ key: 'N', meta: true })}
              >
                Create new issue
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(onOpenSettings)}
                icon={<Settings className="w-4 h-4" />}
                shortcut={formatShortcut({ key: ',', meta: true })}
              >
                Open settings
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(onOpenShortcutsHelp)}
                icon={<Keyboard className="w-4 h-4" />}
                shortcut={formatShortcut({ key: '?', meta: true })}
              >
                Keyboard shortcuts
              </CommandItem>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="mb-2">
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('home'))}
                icon={<Home className="w-4 h-4" />}
              >
                Go to Home
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('inbox'))}
                icon={<Inbox className="w-4 h-4" />}
              >
                Go to Inbox
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('my-issues'))}
                icon={<User className="w-4 h-4" />}
              >
                Go to My Issues
              </CommandItem>
            </Command.Group>

            {/* View Modes */}
            <Command.Group heading="View Modes" className="mb-2">
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('list'))}
                icon={<LayoutList className="w-4 h-4" />}
              >
                List view
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('board'))}
                icon={<LayoutGrid className="w-4 h-4" />}
              >
                Board view
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(() => setViewMode('timeline'))}
                icon={<Clock className="w-4 h-4" />}
              >
                Timeline view
              </CommandItem>
            </Command.Group>

            {/* Projects */}
            {projects.length > 0 && (
              <Command.Group heading="Projects" className="mb-2">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() =>
                      handleSelect(() => {
                        setCurrentProjectId(project.id)
                        setViewMode('list')
                      })
                    }
                    icon={
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center text-xs"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      >
                        {project.icon || '📋'}
                      </div>
                    }
                  >
                    {project.name}
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* Issues */}
            {filteredIssues.length > 0 && (
              <Command.Group heading={search ? 'Issues' : 'Recent Issues'} className="mb-2">
                {filteredIssues.map((issue) => (
                  <CommandItem
                    key={issue.id}
                    onSelect={() => handleSelect(() => onOpenIssue(issue.id))}
                    icon={<FolderKanban className="w-4 h-4" />}
                  >
                    <span className="text-zinc-400 mr-2 font-mono text-xs">
                      {issue.identifier}
                    </span>
                    {issue.title}
                  </CommandItem>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  )
}

// Helper component for command items
function CommandItem({
  children,
  icon,
  shortcut,
  onSelect,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-zinc-700 dark:text-zinc-300 data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:bg-zinc-800 outline-none"
    >
      {icon && <span className="text-zinc-400">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}
