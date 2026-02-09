import { useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { PROJECT_ICONS, PROJECT_COLORS, getProjectIcon } from '@/lib/project-icons'
import { toast } from 'sonner'

export function EditProjectModal() {
  const { editProjectId, setEditProjectId, currentProjectId, setCurrentProjectId, setViewMode } = useStore()
  const { data: projectData, isLoading } = useProject(editProjectId)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const project = projectData?.data

  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[6])
  const [iconId, setIconId] = useState('folder')
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sync local state with project data when it loads
  useEffect(() => {
    if (project) {
      setName(project.name)
      setKey(project.key)
      setDescription(project.description || '')
      setColor(project.color)
      setIconId(project.icon)
    }
  }, [project])

  const handleClose = () => {
    setEditProjectId(null)
    setShowDeleteConfirm(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!editProjectId) return

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
      await updateProject.mutateAsync({
        id: editProjectId,
        data: {
          name: name.trim(),
          key: key.toUpperCase().trim(),
          description: description.trim() || undefined,
          color,
          icon: iconId,
        },
      })

      toast.success('Project updated')
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to update project')
    }
  }

  const handleDelete = async () => {
    if (!editProjectId) return

    try {
      await deleteProject.mutateAsync(editProjectId)
      
      // If we deleted the currently selected project, go back to home
      if (currentProjectId === editProjectId) {
        setCurrentProjectId(null)
        setViewMode('home')
      }
      
      toast.success(`"${project?.name}" deleted`)
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete project')
    }
  }

  if (!editProjectId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : showDeleteConfirm ? (
          /* Delete Confirmation */
          <div className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Project</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Are you sure you want to delete <strong>"{project?.name}"</strong>?
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 w-full text-left">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    The project and all settings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All issues in this project
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All comments and checklists
                  </li>
                </ul>
                <p className="text-sm text-red-500 font-medium mt-3">
                  This action cannot be undone.
                </p>
              </div>
              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md w-full">
                  {error}
                </div>
              )}
              <div className="flex gap-2 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={deleteProject.isPending}
                >
                  {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Project</h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Icon & Color Preview */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: color + '20', color }}
                >
                  {(() => {
                    const IconComponent = getProjectIcon(iconId)
                    return <IconComponent size={32} />
                  })()}
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
                  {PROJECT_ICONS.map((iconConfig) => {
                    const IconComponent = iconConfig.icon
                    return (
                      <button
                        key={iconConfig.id}
                        type="button"
                        onClick={() => setIconId(iconConfig.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          iconId === iconConfig.id
                            ? 'bg-primary/20 ring-2 ring-primary text-primary'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                        title={iconConfig.label}
                      >
                        <IconComponent size={18} />
                      </button>
                    )
                  })}
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
                  onChange={(e) => setName(e.target.value)}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProject.isPending}>
                  {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
