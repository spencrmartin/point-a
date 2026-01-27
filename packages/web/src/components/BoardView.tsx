import { useMemo } from 'react'
import { IssueCard } from './IssueCard'
import { BoardColumnSkeleton } from './Skeleton'
import { useStore } from '@/stores/useStore'
import { useIssues, useUpdateIssueStatus } from '@/hooks/useIssues'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import type { IssueStatus, IssueWithRelations } from '@point-a/shared'

const columns: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', label: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
]

export function BoardView() {
  const { currentProjectId, setActiveIssueId, setQuickCreateOpen, filters, displayOptions } = useStore()
  const { data, isLoading, isFetching } = useIssues({ projectId: currentProjectId || undefined })
  const updateStatus = useUpdateIssueStatus()

  // Apply filters and sorting
  const filteredAndSortedIssues = useMemo(() => {
    let issues = data?.data || []

    // Apply status filter
    if (filters.status.length > 0) {
      issues = issues.filter(issue => filters.status.includes(issue.status))
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      issues = issues.filter(issue => filters.priority.includes(issue.priority))
    }

    // Apply type filter
    if (filters.type.length > 0) {
      issues = issues.filter(issue => filters.type.includes(issue.type))
    }

    // Apply assignee filter
    if (filters.assignee) {
      issues = issues.filter(issue => issue.assignee === filters.assignee)
    }

    // Apply sorting
    const sortMultiplier = displayOptions.sortOrder === 'asc' ? 1 : -1
    issues = [...issues].sort((a, b) => {
      switch (displayOptions.sortBy) {
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
          return (priorityOrder[a.priority] - priorityOrder[b.priority]) * sortMultiplier
        }
        case 'title':
          return a.title.localeCompare(b.title) * sortMultiplier
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * sortMultiplier
        case 'updatedAt':
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * sortMultiplier
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortMultiplier
      }
    })

    return issues
  }, [data, filters, displayOptions])

  const issuesByStatus = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = filteredAndSortedIssues.filter((issue) => issue.status === col.id)
      return acc
    }, {} as Record<IssueStatus, IssueWithRelations[]>)
  }, [filteredAndSortedIssues])

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('issueId', issueId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault()
    const issueId = e.dataTransfer.getData('issueId')
    if (issueId) {
      updateStatus.mutate({ id: issueId, status })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Show skeleton only on initial load, not on refetches
  if (isLoading && !data) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <BoardColumnSkeleton key={col.id} />
        ))}
      </div>
    )
  }

  // Filter columns based on showEmptyGroups setting
  const visibleColumns = displayOptions.showEmptyGroups 
    ? columns 
    : columns.filter(col => (issuesByStatus[col.id]?.length || 0) > 0)

  return (
    <div className={cn(
      'flex gap-4 overflow-x-auto pb-4 h-full transition-opacity duration-150',
      isFetching && 'opacity-70'
    )}>
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-72 flex flex-col"
          onDrop={(e) => handleDrop(e, column.id)}
          onDragOver={handleDragOver}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', column.color)} />
              <h3 className="font-medium text-sm">{column.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {issuesByStatus[column.id]?.length || 0}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setQuickCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Column Content */}
          <div className="flex-1 space-y-2 overflow-y-auto min-h-[200px] p-1">
            {issuesByStatus[column.id]?.map((issue) => (
              <div
                key={issue.id}
                draggable
                onDragStart={(e) => handleDragStart(e, issue.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <IssueCard
                  issue={issue}
                  onClick={() => setActiveIssueId(issue.id)}
                />
              </div>
            ))}
            
            {issuesByStatus[column.id]?.length === 0 && (
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                Drop issues here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
