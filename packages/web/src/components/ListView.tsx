import { useState, useMemo } from 'react'
import { useStore } from '@/stores/useStore'
import { useIssues, useUpdateIssue } from '@/hooks/useIssues'
import { cn, formatRelativeDate } from '@/lib/utils'
import { Button } from './ui/button'
import { ListRowSkeleton } from './Skeleton'
import type { IssueWithRelations, IssueStatus, IssuePriority } from '@point-a/shared'
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Bug,
  Sparkles,
  Wrench,
  CheckSquare,
  Layers,
  MoreHorizontal,
} from 'lucide-react'

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: 'text-gray-500', bg: 'bg-gray-500' },
  todo: { label: 'Todo', color: 'text-blue-500', bg: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  in_review: { label: 'In Review', color: 'text-purple-500', bg: 'bg-purple-500' },
  done: { label: 'Done', color: 'text-green-500', bg: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500' },
}

const priorityConfig: Record<IssuePriority, { icon: typeof AlertCircle; color: string; label: string }> = {
  urgent: { icon: AlertCircle, color: 'text-red-500', label: 'Urgent' },
  high: { icon: ArrowUp, color: 'text-orange-500', label: 'High' },
  medium: { icon: Minus, color: 'text-yellow-500', label: 'Medium' },
  low: { icon: ArrowDown, color: 'text-blue-500', label: 'Low' },
  none: { icon: Minus, color: 'text-gray-400', label: 'No priority' },
}

const typeIcons = {
  bug: Bug,
  feature: Sparkles,
  improvement: Wrench,
  task: CheckSquare,
  epic: Layers,
}

type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title'

export function ListView() {
  const { currentProjectId, setActiveIssueId, selectedIssueIds, toggleIssueSelection, selectAllIssues, clearSelection, filters, displayOptions } = useStore()
  const { data, isLoading, isFetching } = useIssues({ projectId: currentProjectId || undefined })
  const updateIssue = useUpdateIssue()
  
  const [sortField, setSortField] = useState<SortField>(displayOptions.sortBy === 'dueDate' ? 'createdAt' : displayOptions.sortBy as SortField)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(displayOptions.sortOrder)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['backlog', 'todo', 'in_progress', 'in_review']))

  // Map display options groupBy to list view groupBy
  const groupBy = displayOptions.groupBy === 'none' ? 'none' : 
                  displayOptions.groupBy === 'status' ? 'status' :
                  displayOptions.groupBy === 'priority' ? 'priority' : 'status'

  const rawIssues = data?.data || []
  
  // Apply filters from store
  const issues = useMemo(() => {
    let filtered = rawIssues

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(issue => filters.status.includes(issue.status))
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(issue => filters.priority.includes(issue.priority))
    }

    // Apply type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(issue => filters.type.includes(issue.type))
    }

    // Apply assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(issue => issue.assignee === filters.assignee)
    }

    return filtered
  }, [rawIssues, filters])

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'priority':
          const priorityOrder = ['urgent', 'high', 'medium', 'low', 'none']
          comparison = priorityOrder.indexOf(a.priority || 'none') - priorityOrder.indexOf(b.priority || 'none')
          break
        case 'status':
          const statusOrder = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
          comparison = statusOrder.indexOf(a.status || 'backlog') - statusOrder.indexOf(b.status || 'backlog')
          break
        case 'createdAt':
        case 'updatedAt':
          comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [issues, sortField, sortOrder])

  const groupedIssues = useMemo(() => {
    if (groupBy === 'none') return { all: sortedIssues }
    return sortedIssues.reduce((acc, issue) => {
      const key = groupBy === 'status' ? (issue.status || 'backlog') : (issue.priority || 'none')
      if (!acc[key]) acc[key] = []
      acc[key].push(issue)
      return acc
    }, {} as Record<string, IssueWithRelations[]>)
  }, [sortedIssues, groupBy])

  const allSelected = issues.length > 0 && selectedIssueIds.size === issues.length
  const someSelected = selectedIssueIds.size > 0 && selectedIssueIds.size < issues.length

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAllIssues(issues.map(i => i.id))
    }
  }

  // Show skeleton only on initial load
  if (isLoading && !data) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Group by:</span>
            <div className="h-8 w-24 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-auto border rounded-lg">
          <div className="sticky top-0 bg-card border-b z-10 h-10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'h-full flex flex-col transition-opacity duration-150',
      isFetching && 'opacity-70'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Grouped by {groupBy === 'none' ? 'none' : groupBy}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
          {rawIssues.length !== issues.length && ` (${rawIssues.length} total)`}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border rounded-lg">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b z-10">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
            <div className="w-8 flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={handleSelectAll}
                className="rounded border-muted-foreground/50"
              />
            </div>
            <div className="w-10" />
            <button
              onClick={() => handleSort('title')}
              className="flex-1 text-left hover:text-foreground flex items-center gap-1"
            >
              Title
              {sortField === 'title' && (
                <ChevronDown className={cn('h-3 w-3', sortOrder === 'asc' && 'rotate-180')} />
              )}
            </button>
            <button
              onClick={() => handleSort('status')}
              className="w-28 text-left hover:text-foreground flex items-center gap-1"
            >
              Status
              {sortField === 'status' && (
                <ChevronDown className={cn('h-3 w-3', sortOrder === 'asc' && 'rotate-180')} />
              )}
            </button>
            <button
              onClick={() => handleSort('priority')}
              className="w-24 text-left hover:text-foreground flex items-center gap-1"
            >
              Priority
              {sortField === 'priority' && (
                <ChevronDown className={cn('h-3 w-3', sortOrder === 'asc' && 'rotate-180')} />
              )}
            </button>
            <div className="w-24 text-left">Assignee</div>
            <button
              onClick={() => handleSort('createdAt')}
              className="w-28 text-left hover:text-foreground flex items-center gap-1"
            >
              Created
              {sortField === 'createdAt' && (
                <ChevronDown className={cn('h-3 w-3', sortOrder === 'asc' && 'rotate-180')} />
              )}
            </button>
            <div className="w-8" />
          </div>
        </div>

        {/* Body */}
        <div>
          {Object.entries(groupedIssues).map(([group, groupIssues]) => (
            <div key={group}>
              {/* Group Header */}
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted text-sm font-medium"
                >
                  {expandedGroups.has(group) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {groupBy === 'status' && (
                    <>
                      <div className={cn('w-2 h-2 rounded-full', statusConfig[group as IssueStatus]?.bg)} />
                      {statusConfig[group as IssueStatus]?.label || group}
                    </>
                  )}
                  {groupBy === 'priority' && (
                    <>
                      {(() => {
                        const config = priorityConfig[group as IssuePriority]
                        const Icon = config?.icon || Minus
                        return <Icon className={cn('h-4 w-4', config?.color)} />
                      })()}
                      {priorityConfig[group as IssuePriority]?.label || group}
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">({groupIssues.length})</span>
                </button>
              )}

              {/* Group Issues */}
              {(groupBy === 'none' || expandedGroups.has(group)) && (
                <div>
                  {groupIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      isSelected={selectedIssueIds.has(issue.id)}
                      onSelect={() => toggleIssueSelection(issue.id)}
                      onClick={() => setActiveIssueId(issue.id)}
                      onStatusChange={(status) => updateIssue.mutate({ id: issue.id, data: { status } })}
                      onPriorityChange={(priority) => updateIssue.mutate({ id: issue.id, data: { priority } })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {issues.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No issues found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IssueRow({
  issue,
  isSelected,
  onSelect,
  onClick,
  onStatusChange,
  onPriorityChange,
}: {
  issue: IssueWithRelations
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
  onStatusChange: (status: IssueStatus) => void
  onPriorityChange: (priority: IssuePriority) => void
}) {
  const TypeIcon = typeIcons[issue.type || 'task']

  return (
    <div
      className={cn(
        'flex items-center px-3 py-2 border-b hover:bg-muted/50 cursor-pointer group',
        isSelected && 'bg-primary/5'
      )}
    >
      <div className="w-8 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="rounded border-muted-foreground/50"
        />
      </div>
      
      <div className="w-10 flex items-center justify-center">
        <TypeIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{issue.identifier}</span>
          <span className="truncate">{issue.title}</span>
          {issue.labels && issue.labels.length > 0 && (
            <div className="flex items-center gap-1">
              {issue.labels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="px-1.5 py-0.5 text-xs rounded-full"
                  style={{ backgroundColor: `${label.color}20`, color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-28">
        <select
          value={issue.status || 'backlog'}
          onChange={(e) => {
            e.stopPropagation()
            onStatusChange(e.target.value as IssueStatus)
          }}
          className={cn(
            'text-xs px-2 py-1 rounded-full border-none bg-transparent cursor-pointer',
            statusConfig[issue.status || 'backlog'].color
          )}
        >
          {Object.entries(statusConfig).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      </div>
      
      <div className="w-24">
        <select
          value={issue.priority || 'none'}
          onChange={(e) => {
            e.stopPropagation()
            onPriorityChange(e.target.value as IssuePriority)
          }}
          className="text-xs px-2 py-1 rounded border-none bg-transparent cursor-pointer"
        >
          {Object.entries(priorityConfig).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      </div>
      
      <div className="w-24 flex items-center gap-1">
        {issue.assignee ? (
          <>
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs">{issue.assignee.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs truncate">{issue.assignee}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      
      <div className="w-28 text-xs text-muted-foreground">
        {formatRelativeDate(issue.createdAt)}
      </div>
      
      <div className="w-8">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
