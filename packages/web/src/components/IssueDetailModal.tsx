import { useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { useIssue, useUpdateIssue, useDeleteIssue } from '@/hooks/useIssues'
import { Button } from './ui/button'
import { CreatableCombobox, type ComboboxOption } from './ui/creatable-combobox'
import { CommentThread } from './CommentThread'
import { ChecklistSection } from './ChecklistSection'
import { DependencySection } from './DependencySection'
import { cn, formatRelativeDate } from '@/lib/utils'
import { 
  X, 
  Circle, 
  CircleDot, 
  Clock, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Minus,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  CheckSquare,
  Bug,
  Sparkles,
  Wrench,
  Layers,
  Trash2,
  Calendar,
  User,
  Tag,
  FileText,
} from 'lucide-react'
import type { IssuePriority, IssueType, IssueStatus } from '@point-a/shared'

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: 'backlog', label: 'Backlog', iconComponent: Circle },
  { value: 'todo', label: 'To Do', iconComponent: CircleDot },
  { value: 'in_progress', label: 'In Progress', iconComponent: Clock },
  { value: 'in_review', label: 'In Review', iconComponent: Eye },
  { value: 'done', label: 'Done', iconComponent: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', iconComponent: XCircle },
]

const PRIORITY_OPTIONS: ComboboxOption[] = [
  { value: 'none', label: 'No Priority', iconComponent: Minus, color: '#9ca3af' },
  { value: 'low', label: 'Low', iconComponent: ArrowDown, color: '#3b82f6' },
  { value: 'medium', label: 'Medium', iconComponent: Minus, color: '#eab308' },
  { value: 'high', label: 'High', iconComponent: ArrowUp, color: '#f97316' },
  { value: 'urgent', label: 'Urgent', iconComponent: AlertCircle, color: '#ef4444' },
]

const TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'task', label: 'Task', iconComponent: CheckSquare, color: '#6b7280' },
  { value: 'bug', label: 'Bug', iconComponent: Bug, color: '#ef4444' },
  { value: 'feature', label: 'Feature', iconComponent: Sparkles, color: '#8b5cf6' },
  { value: 'improvement', label: 'Improvement', iconComponent: Wrench, color: '#3b82f6' },
  { value: 'epic', label: 'Epic', iconComponent: Layers, color: '#6366f1' },
]

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: 'text-gray-500', bg: 'bg-gray-500' },
  todo: { label: 'Todo', color: 'text-blue-500', bg: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  in_review: { label: 'In Review', color: 'text-purple-500', bg: 'bg-purple-500' },
  done: { label: 'Done', color: 'text-green-500', bg: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500' },
}

export function IssueDetailModal() {
  const { activeIssueId, setActiveIssueId } = useStore()
  const { data: issueData, isLoading } = useIssue(activeIssueId)
  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()

  const issue = issueData?.data

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('backlog')
  const [priority, setPriority] = useState<IssuePriority>('none')
  const [type, setType] = useState<IssueType>('task')
  const [assignee, setAssignee] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sync local state with issue data
  useEffect(() => {
    if (issue) {
      setTitle(issue.title)
      setDescription(issue.description || '')
      setStatus(issue.status)
      setPriority(issue.priority)
      setType(issue.type)
      setAssignee(issue.assignee || '')
    }
  }, [issue])

  const handleClose = () => {
    setActiveIssueId(null)
    setIsEditing(false)
    setShowDeleteConfirm(false)
  }

  const handleSave = async () => {
    if (!issue) return

    await updateIssue.mutateAsync({
      id: issue.id,
      data: {
        title,
        description: description || undefined,
        status,
        priority,
        type,
        assignee: assignee || undefined,
      },
    })
    setIsEditing(false)
  }

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return
    setStatus(newStatus)
    await updateIssue.mutateAsync({
      id: issue.id,
      data: { status: newStatus },
    })
  }

  const handlePriorityChange = async (newPriority: IssuePriority) => {
    if (!issue) return
    setPriority(newPriority)
    await updateIssue.mutateAsync({
      id: issue.id,
      data: { priority: newPriority },
    })
  }

  const handleTypeChange = async (newType: IssueType) => {
    if (!issue) return
    setType(newType)
    await updateIssue.mutateAsync({
      id: issue.id,
      data: { type: newType },
    })
  }

  const handleDelete = async () => {
    if (!issue) return
    await deleteIssue.mutateAsync(issue.id)
    handleClose()
  }

  // Handle escape key
  useEffect(() => {
    if (!activeIssueId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          handleClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIssueId, showDeleteConfirm])

  if (!activeIssueId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-xl shadow-2xl border overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : issue ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full', statusConfig[issue.status].bg)} />
                <span className="text-sm font-mono text-muted-foreground">
                  {issue.identifier}
                </span>
                {issue.project && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${issue.project.color}20`,
                      color: issue.project.color 
                    }}
                  >
                    {issue.project.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xl font-semibold bg-transparent border-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <h1 
                      className="text-xl font-semibold cursor-pointer hover:text-primary/80"
                      onClick={() => setIsEditing(true)}
                    >
                      {issue.title}
                    </h1>
                  )}
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Circle className="h-3 w-3" />
                      Status
                    </label>
                    <CreatableCombobox
                      options={STATUS_OPTIONS}
                      value={status}
                      onChange={(v) => handleStatusChange(v as IssueStatus)}
                      placeholder="Status..."
                      searchPlaceholder="Search..."
                      allowCreate={false}
                      className="w-full"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Priority
                    </label>
                    <CreatableCombobox
                      options={PRIORITY_OPTIONS}
                      value={priority}
                      onChange={(v) => handlePriorityChange(v as IssuePriority)}
                      placeholder="Priority..."
                      searchPlaceholder="Search..."
                      allowCreate={false}
                      className="w-full"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Type
                    </label>
                    <CreatableCombobox
                      options={TYPE_OPTIONS}
                      value={type}
                      onChange={(v) => handleTypeChange(v as IssueType)}
                      placeholder="Type..."
                      searchPlaceholder="Search..."
                      allowCreate={false}
                      className="w-full"
                    />
                  </div>

                  {/* Assignee */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Assignee
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                      {issue.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {issue.assignee.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{issue.assignee}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Labels */}
                {issue.labels && issue.labels.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {issue.labels.map((label) => (
                        <span
                          key={label.id}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${label.color}20`,
                            color: label.color 
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={6}
                      className="w-full text-sm bg-background border rounded-md p-3 outline-none resize-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div 
                      className="min-h-[100px] p-3 border rounded-md bg-background cursor-pointer hover:bg-muted/50"
                      onClick={() => setIsEditing(true)}
                    >
                      {issue.description ? (
                        <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No description. Click to add one.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="pt-4 border-t">
                  <ChecklistSection issueId={issue.id} />
                </div>

                {/* Dependencies */}
                <div className="pt-4 border-t">
                  <DependencySection issueId={issue.id} />
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-6 text-xs text-muted-foreground pt-4 border-t">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Created {formatRelativeDate(issue.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Updated {formatRelativeDate(issue.updatedAt)}
                  </div>
                  {issue.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Due {formatRelativeDate(issue.dueDate)}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="pt-4 border-t">
                  <CommentThread issueId={issue.id} />
                </div>
              </div>
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/50">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset to original values
                    if (issue) {
                      setTitle(issue.title)
                      setDescription(issue.description || '')
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateIssue.isPending}>
                  {updateIssue.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-card/95 flex items-center justify-center">
                <div className="text-center space-y-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <Trash2 className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Delete Issue</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to delete "{issue.identifier}"? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteIssue.isPending}
                    >
                      {deleteIssue.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Issue not found
          </div>
        )}
      </div>
    </div>
  )
}
