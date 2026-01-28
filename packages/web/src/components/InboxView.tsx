import { useState } from 'react'
import { useIssues, useCreateIssue, useBulkUpdateIssues, useDeleteIssue } from '@/hooks/useIssues'
import { useProjects } from '@/hooks/useProjects'
import { useStore } from '@/stores/useStore'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { 
  Plus, 
  Inbox as InboxIcon, 
  ArrowUp, 
  ArrowRight, 
  ArrowDown,
  LayoutList,
  LayoutGrid,
  Calendar,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu'
import type { IssueWithRelations } from '@point-a/shared'

const priorityConfig = {
  urgent: { label: 'Urgent', icon: ArrowUp, color: 'text-red-500' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-500' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-yellow-500' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-blue-500' },
  none: { label: 'No Priority', icon: ArrowRight, color: 'text-muted-foreground' },
}

const statusConfig = {
  backlog: { label: 'Backlog', color: 'bg-gray-500' },
  todo: { label: 'Todo', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500' },
  in_review: { label: 'In Review', color: 'bg-purple-500' },
  done: { label: 'Done', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
}

export function InboxView() {
  const [quickInput, setQuickInput] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { setActiveIssueId, subViewMode, setSubViewMode } = useStore()
  
  // Fetch inbox items (backlog with no priority)
  const { data: issuesData, isLoading } = useIssues({
    status: 'backlog',
    priority: 'none',
  })
  
  const { data: projectsData } = useProjects()
  const projects = projectsData?.data || []
  const defaultProject = projects[0]
  
  const createIssue = useCreateIssue()
  const bulkUpdate = useBulkUpdateIssues()
  const deleteIssue = useDeleteIssue()
  
  // API returns { data: IssueWithRelations[] }
  const issues = issuesData?.data || []

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickInput.trim() || !defaultProject) return
    
    await createIssue.mutateAsync({
      title: quickInput.trim(),
      projectId: defaultProject.id,
      status: 'backlog',
      priority: 'none',
    })
    setQuickInput('')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === issues.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(issues.map((i: IssueWithRelations) => i.id)))
    }
  }

  const handleBulkPriority = async (priority: string) => {
    if (selectedIds.size === 0) return
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      update: { priority: priority as any },
    })
    setSelectedIds(new Set())
  }

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return
    await bulkUpdate.mutateAsync({
      ids: Array.from(selectedIds),
      update: { status: status as any },
    })
    setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      await deleteIssue.mutateAsync(id)
    }
    setSelectedIds(new Set())
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <InboxIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Inbox</h1>
            <p className="text-sm text-muted-foreground">
              {issues.length} item{issues.length !== 1 ? 's' : ''} to triage
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={subViewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setSubViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={subViewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setSubViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={subViewMode === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setSubViewMode('timeline')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Capture */}
      <form onSubmit={handleQuickCreate} className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Capture a thought... (press Enter to add)"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!quickInput.trim() || createIssue.isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </form>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 border-b bg-muted/50 flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => handleBulkPriority(key)}>
                  <config.icon className={cn('h-4 w-4 mr-2', config.color)} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => handleBulkStatus(key)}>
                  <div className={cn('w-2 h-2 rounded-full mr-2', config.color)} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Issue List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center">
            <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Inbox Zero!</h3>
            <p className="text-sm text-muted-foreground">
              All caught up. Add a new thought above or enjoy the calm.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Select All */}
            <div className="px-4 py-2 bg-muted/30 flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === issues.length && issues.length > 0}
                onCheckedChange={selectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size === issues.length ? 'Deselect all' : 'Select all'}
              </span>
            </div>
            
            {issues.map((issue) => (
              <InboxItem
                key={issue.id}
                issue={issue}
                selected={selectedIds.has(issue.id)}
                onSelect={() => toggleSelect(issue.id)}
                onClick={() => setActiveIssueId(issue.id)}
                projects={projects}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InboxItem({ 
  issue, 
  selected, 
  onSelect, 
  onClick,
}: { 
  issue: IssueWithRelations
  selected: boolean
  onSelect: () => void
  onClick: () => void
  projects?: any[]
}) {
  const bulkUpdate = useBulkUpdateIssues()
  const deleteIssue = useDeleteIssue()

  const handlePriority = async (priority: string) => {
    await bulkUpdate.mutateAsync({
      ids: [issue.id],
      update: { priority: priority as any },
    })
  }

  const handleStatus = async (status: string) => {
    await bulkUpdate.mutateAsync({
      ids: [issue.id],
      update: { status: status as any },
    })
  }

  return (
    <div 
      className={cn(
        'px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors',
        selected && 'bg-primary/5'
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onSelect}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {issue.identifier}
          </span>
          <span className="truncate">{issue.title}</span>
        </div>
        {issue.project && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: issue.project.color }}
            />
            <span className="text-xs text-muted-foreground">
              {issue.project.name}
            </span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowUp className="h-4 w-4 mr-2" />
              Set Priority
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => handlePriority(key)}>
                  <config.icon className={cn('h-4 w-4 mr-2', config.color)} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div className="w-4 h-4 mr-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              Set Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => handleStatus(key)}>
                  <div className={cn('w-2 h-2 rounded-full mr-2', config.color)} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => deleteIssue.mutate(issue.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
