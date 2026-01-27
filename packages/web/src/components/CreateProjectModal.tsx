import { useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useCreateProject } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { X } from 'lucide-react'

const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

const PROJECT_ICONS = ['📋', '🚀', '💡', '🎯', '⚡', '🔧', '📦', '🎨', '📊', '🔬']

export function CreateProjectModal() {
  const { createProjectOpen, setCreateProjectOpen, setCurrentProjectId } = useStore()
  const createProject = useCreateProject()

  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[6]) // default indigo
  const [icon, setIcon] = useState('📋')
  const [error, setError] = useState('')

  const handleClose = () => {
    setCreateProjectOpen(false)
    setName('')
    setKey('')
    setDescription('')
    setColor(PROJECT_COLORS[6])
    setIcon('📋')
    setError('')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate key from name if key hasn't been manually edited
    if (!key || key === generateKey(name)) {
      setKey(generateKey(value))
    }
  }

  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    if (!key.trim()) {
      setError('Project key is required')
      return
    }

    if (key.length < 2 || key.length > 5) {
      setError('Project key must be 2-5 characters')
      return
    }

    try {
      const result = await createProject.mutateAsync({
        name: name.trim(),
        key: key.toUpperCase().trim(),
        description: description.trim() || undefined,
        color,
        icon,
      })

      // Select the new project
      if (result?.data?.id) {
        setCurrentProjectId(result.data.id)
      }

      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create project')
    }
  }

  if (!createProjectOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Project</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Icon & Color Preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: color + '20', color }}
            >
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Choose an icon and color for your project
              </p>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icon === emoji
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Project"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              autoFocus
            />
          </div>

          {/* Key */}
          <div>
            <label className="text-sm font-medium mb-2 block">Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
              placeholder="PROJ"
              maxLength={5}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for issue identifiers (e.g., {key || 'PROJ'}-123)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
