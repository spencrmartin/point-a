import { useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { useCreateIssue } from '@/hooks/useIssues'
import { Button } from './ui/button'
import { CreatableCombobox, type ComboboxOption } from './ui/creatable-combobox'
import { X } from 'lucide-react'
import type { IssuePriority, IssueType, IssueStatus } from '@point-a/shared'

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: 'backlog', label: 'Backlog', icon: '📋' },
  { value: 'todo', label: 'To Do', icon: '📝' },
  { value: 'in_progress', label: 'In Progress', icon: '🔄' },
  { value: 'in_review', label: 'In Review', icon: '👀' },
  { value: 'done', label: 'Done', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌' },
]

const PRIORITY_OPTIONS: ComboboxOption[] = [
  { value: 'none', label: 'No Priority', icon: '⚪' },
  { value: 'low', label: 'Low', icon: '🔵' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'high', label: 'High', icon: '🟠' },
  { value: 'urgent', label: 'Urgent', icon: '🔴' },
]

const TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'task', label: 'Task', icon: '✅' },
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'feature', label: 'Feature', icon: '✨' },
  { value: 'improvement', label: 'Improvement', icon: '🔧' },
  { value: 'epic', label: 'Epic', icon: '📦' },
]

const PROJECT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
]

const PROJECT_ICONS = ['📋', '🚀', '💡', '🎯', '⚡', '🔧', '📦', '🎨', '📊', '🔬']

export function QuickCreateModal() {
  const { quickCreateOpen, setQuickCreateOpen, currentProjectId, setCurrentProjectId } = useStore()
  const { data: projectsData } = useProjects()
  const createIssue = useCreateIssue()
  const createProject = useCreateProject()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState<IssueStatus>('backlog')
  const [priority, setPriority] = useState<IssuePriority>('none')
  const [type, setType] = useState<IssueType>('task')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const projects = projectsData?.data || []

  // Set default project when modal opens
  useEffect(() => {
    if (quickCreateOpen && currentProjectId) {
      setProjectId(currentProjectId)
    }
  }, [quickCreateOpen, currentProjectId])

  const projectOptions: ComboboxOption[] = projects.map((p) => ({
    value: p.id,
    label: p.name,
    icon: p.icon,
    color: p.color,
  }))

  const handleCreateProject = async (name: string) => {
    try {
      // Generate a key from the name
      const key = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4) || 'PROJ'
      
      // Pick random color and icon
      const color = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
      const icon = PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)]

      const result = await createProject.mutateAsync({
        name,
        key,
        color,
        icon,
      })

      if (result?.data?.id) {
        setProjectId(result.data.id)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!projectId) {
      setError('Please select or create a project')
      return
    }

    setIsCreating(true)

    try {
      await createIssue.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        status,
        priority,
        type,
      })

      // Reset and close
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create issue')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setProjectId(currentProjectId || '')
    setStatus('backlog')
    setPriority('none')
    setType('task')
    setError('')
    setQuickCreateOpen(false)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!quickCreateOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const form = document.querySelector('form')
        form?.requestSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quickCreateOpen])

  if (!quickCreateOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">New Issue</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                placeholder="Add description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Project selector */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Project
                </label>
                <CreatableCombobox
                  options={projectOptions}
                  value={projectId}
                  onChange={setProjectId}
                  onCreateNew={handleCreateProject}
                  placeholder="Select project..."
                  searchPlaceholder="Search or create..."
                  createText="Create project"
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Status
                </label>
                <CreatableCombobox
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(v) => setStatus(v as IssueStatus)}
                  placeholder="Status..."
                  searchPlaceholder="Search..."
                  allowCreate={false}
                  className="w-full"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Priority
                </label>
                <CreatableCombobox
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(v) => setPriority(v as IssuePriority)}
                  placeholder="Priority..."
                  searchPlaceholder="Search..."
                  allowCreate={false}
                  className="w-full"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Type
                </label>
                <CreatableCombobox
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={(v) => setType(v as IssueType)}
                  placeholder="Type..."
                  searchPlaceholder="Search..."
                  allowCreate={false}
                  className="w-full"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border">Enter</kbd> to create
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Issue'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
