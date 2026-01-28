import { useIssues } from '@/hooks/useIssues'
import { useStore } from '@/stores/useStore'
import { useUserStore } from '@/stores/useUserStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  User, 
  LayoutList,
  LayoutGrid,
  Calendar,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IssueWithRelations } from '@point-a/shared'

const priorityConfig = {
  urgent: { label: 'Urgent', icon: ArrowUp, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  none: { label: 'No Priority', icon: ArrowRight, color: 'text-muted-foreground', bg: 'bg-muted' },
}

const statusConfig = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-gray-500' },
  todo: { label: 'Todo', icon: Circle, color: 'text-blue-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-yellow-500' },
  in_review: { label: 'In Review', icon: AlertCircle, color: 'text-purple-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: Circle, color: 'text-red-500' },
}

export function MyIssuesView() {
  const { subViewMode, setSubViewMode, setActiveIssueId } = useStore()
  const { user, getInitials, getUserIdentifier } = useUserStore()
  
  const userIdentifier = getUserIdentifier()
  
  // Fetch issues assigned to current user
  const { data: issuesData, isLoading } = useIssues({
    assignee: userIdentifier || undefined,
  })
  
  // API returns { data: IssueWithRelations[] }
  const issues: IssueWithRelations[] = issuesData?.data || []
  
  // Group issues by status for quick stats
  const issuesByStatus = issues.reduce((acc: Record<string, number>, issue: IssueWithRelations) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Filter out completed for active count
  const activeIssues = issues.filter((i: IssueWithRelations) => i.status !== 'done' && i.status !== 'cancelled')
  const completedIssues = issues.filter((i: IssueWithRelations) => i.status === 'done')

  // If no user is set, show onboarding prompt
  if (!user || !userIdentifier) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Set up your profile</h2>
          <p className="text-muted-foreground mb-6">
            To see your assigned issues, first set your name in Settings. 
            This will be used to match issues assigned to you.
          </p>
          <Button onClick={() => useStore.getState().setSettingsOpen(true)}>
            Open Settings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {getInitials()}
          </div>
          <div>
            <h1 className="text-xl font-semibold">My Issues</h1>
            <p className="text-sm text-muted-foreground">
              {activeIssues.length} active · {completedIssues.length} completed
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

      {/* Quick Stats */}
      <div className="p-4 border-b flex gap-4 overflow-x-auto">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = issuesByStatus[status] || 0
          if (count === 0 && (status === 'cancelled')) return null
          return (
            <div 
              key={status}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50"
            >
              <config.icon className={cn('h-4 w-4', config.color)} />
              <span className="text-sm font-medium">{count}</span>
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No issues assigned</h3>
            <p className="text-sm text-muted-foreground">
              Issues assigned to "{userIdentifier}" will appear here.
            </p>
          </div>
        ) : (
          <MyIssuesList issues={issues} onIssueClick={setActiveIssueId} />
        )}
      </div>
    </div>
  )
}

function MyIssuesList({ 
  issues, 
  onIssueClick 
}: { 
  issues: IssueWithRelations[]
  onIssueClick: (id: string) => void
}) {
  // Group by priority for better organization
  const groupedIssues = {
    urgent: issues.filter(i => i.priority === 'urgent' && i.status !== 'done'),
    high: issues.filter(i => i.priority === 'high' && i.status !== 'done'),
    medium: issues.filter(i => i.priority === 'medium' && i.status !== 'done'),
    low: issues.filter(i => i.priority === 'low' && i.status !== 'done'),
    none: issues.filter(i => i.priority === 'none' && i.status !== 'done'),
    completed: issues.filter(i => i.status === 'done' || i.status === 'cancelled'),
  }

  return (
    <div className="divide-y">
      {Object.entries(groupedIssues).map(([priority, items]) => {
        if (items.length === 0) return null
        const config = priority === 'completed' 
          ? { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' }
          : priorityConfig[priority as keyof typeof priorityConfig]
        
        return (
          <div key={priority}>
            <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
              <config.icon className={cn('h-4 w-4', config.color)} />
              <span className="text-sm font-medium">{config.label}</span>
              <Badge variant="secondary" className="ml-auto">
                {items.length}
              </Badge>
            </div>
            {items.map((issue) => (
              <IssueRow 
                key={issue.id} 
                issue={issue} 
                onClick={() => onIssueClick(issue.id)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function IssueRow({ 
  issue, 
  onClick 
}: { 
  issue: IssueWithRelations
  onClick: () => void
}) {
  const statusCfg = statusConfig[issue.status as keyof typeof statusConfig]
  const StatusIcon = statusCfg?.icon || Circle

  return (
    <div 
      className="px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusCfg?.color)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {issue.identifier}
          </span>
          <span className={cn(
            'truncate',
            (issue.status === 'done' || issue.status === 'cancelled') && 'line-through text-muted-foreground'
          )}>
            {issue.title}
          </span>
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
            {issue.dueDate && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className={cn(
                  'text-xs',
                  new Date(issue.dueDate) < new Date() && issue.status !== 'done'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                )}>
                  Due {new Date(issue.dueDate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
