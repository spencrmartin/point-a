import { useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useProjects } from '@/hooks/useProjects'
import { useCreateIssue } from '@/hooks/useIssues'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { X, ChevronDown } from 'lucide-react'
import type { IssuePriority, IssueType } from '@point-a/shared'

export function QuickCreateModal() {
  const { quickCreateOpen, setQuickCreateOpen, currentProjectId } = useStore()
  const { data: projectsData } = useProjects()
  const createIssue = useCreateIssue()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState(currentProjectId || '')
  const [priority, setPriority] = useState<IssuePriority>('none')
  const [type, setType] = useState<IssueType>('task')

  const projects = projectsData?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !projectId) return

    await createIssue.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId,
      priority,
      type,
    })

    // Reset and close
    setTitle('')
    setDescription('')
    setPriority('none')
    setType('task')
    setQuickCreateOpen(false)
  }

  if (!quickCreateOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setQuickCreateOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">New Issue</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuickCreateOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Title */}
            <input
              type="text"
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground"
              autoFocus
            />

            {/* Description */}
            <textarea
              placeholder="Add description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
            />

            {/* Options row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Project selector */}
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-1.5 text-sm bg-muted rounded-md border-none outline-none"
              >
                <option value="">Select project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.icon} {project.name}
                  </option>
                ))}
              </select>

              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="px-3 py-1.5 text-sm bg-muted rounded-md border-none outline-none"
              >
                <option value="none">No priority</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>

              {/* Type */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className="px-3 py-1.5 text-sm bg-muted rounded-md border-none outline-none"
              >
                <option value="task">✅ Task</option>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature</option>
                <option value="improvement">🔧 Improvement</option>
                <option value="epic">📦 Epic</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to create
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || !projectId}>
                Create Issue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
