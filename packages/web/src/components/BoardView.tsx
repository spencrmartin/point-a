import { useMemo } from 'react'
import { IssueCard } from './IssueCard'
import { BoardColumnSkeleton } from './Skeleton'
import { useStore } from '@/stores/useStore'
import { useIssues, useUpdateIssueStatus } from '@/hooks/useIssues'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import type { IssueStatus } from '@point-a/shared'

const columns: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', label: 'Todo', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
]

export function BoardView() {
  const { currentProjectId, setActiveIssueId, setQuickCreateOpen } = useStore()
  const { data, isLoading, isFetching } = useIssues({ projectId: currentProjectId || undefined })
  const updateStatus = useUpdateIssueStatus()

  const issuesByStatus = useMemo(() => {
    const issues = data?.data || []
    return columns.reduce((acc, col) => {
      acc[col.id] = issues.filter((issue) => issue.status === col.id)
      return acc
    }, {} as Record<IssueStatus, typeof issues>)
  }, [data])

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

  return (
    <div className={cn(
      'flex gap-4 overflow-x-auto pb-4 h-full transition-opacity duration-150',
      isFetching && 'opacity-70'
    )}>
      {columns.map((column) => (
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
