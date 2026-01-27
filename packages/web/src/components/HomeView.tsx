import { useMemo } from 'react'
import { useIssues } from '@/hooks/useIssues'
import { useProjects } from '@/hooks/useProjects'
import { useStore } from '@/stores/useStore'
import { ProjectIcon } from '@/lib/project-icons'
import { cn, formatRelativeDate } from '@/lib/utils'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ArrowUp,
  Inbox
} from 'lucide-react'
import type { IssueWithRelations } from '@point-a/shared'

export function HomeView() {
  const { data: issuesData, isLoading } = useIssues({})
  const { data: projectsData } = useProjects()
  const { setActiveIssueId, setCurrentProjectId, setViewMode } = useStore()

  const issues = issuesData?.data || []
  const projects = projectsData?.data || []

  // Calculate stats
  const stats = useMemo(() => {
    const total = issues.length
    const done = issues.filter(i => i.status === 'done').length
    const inProgress = issues.filter(i => i.status === 'in_progress').length
    const urgent = issues.filter(i => i.priority === 'urgent' || i.priority === 'high').length
    const overdue = issues.filter(i => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'done').length
    
    return { total, done, inProgress, urgent, overdue }
  }, [issues])

  // Get recent and priority issues
  const recentIssues = useMemo(() => {
    return [...issues]
      .filter(i => i.status !== 'done' && i.status !== 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [issues])

  const urgentIssues = useMemo(() => {
    return issues
      .filter(i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'done')
      .slice(0, 5)
  }, [issues])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Inbox}
          label="Total Issues"
          value={stats.total}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats.inProgress}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.done}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={AlertCircle}
          label="High Priority"
          value={stats.urgent}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Issues</h2>
          <div className="space-y-2">
            {recentIssues.length > 0 ? (
              recentIssues.map(issue => (
                <IssueTile 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                />
              ))
            ) : (
              <EmptyState message="No recent issues" />
            )}
          </div>
        </div>

        {/* High Priority */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Needs Attention</h2>
          <div className="space-y-2">
            {urgentIssues.length > 0 ? (
              urgentIssues.map(issue => (
                <IssueTile 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                  showPriority
                />
              ))
            ) : (
              <EmptyState message="No urgent issues" icon={CheckCircle2} />
            )}
          </div>
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProjectId(project.id)
                  setViewMode('board')
                }}
                className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: project.color + '20' }}
                >
                  <ProjectIcon iconId={project.icon} size={20} color={project.color} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.openIssueCount} open
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  bgColor 
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: string
  bgColor: string
}) {
  return (
    <div className="p-4 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function IssueTile({ 
  issue, 
  onClick,
  showPriority = false
}: { 
  issue: IssueWithRelations
  onClick: () => void
  showPriority?: boolean
}) {
  const statusIcon = {
    backlog: Circle,
    todo: Circle,
    in_progress: Clock,
    in_review: Clock,
    done: CheckCircle2,
    cancelled: Circle,
  }[issue.status] || Circle

  const statusColor = {
    backlog: 'text-gray-400',
    todo: 'text-blue-400',
    in_progress: 'text-yellow-500',
    in_review: 'text-purple-500',
    done: 'text-green-500',
    cancelled: 'text-red-400',
  }[issue.status] || 'text-gray-400'

  const StatusIcon = statusIcon

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
    >
      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{issue.title}</p>
        <p className="text-xs text-muted-foreground">
          {issue.identifier} · {formatRelativeDate(issue.createdAt)}
        </p>
      </div>
      {showPriority && (issue.priority === 'urgent' || issue.priority === 'high') && (
        <ArrowUp className={cn(
          'w-4 h-4 flex-shrink-0',
          issue.priority === 'urgent' ? 'text-red-500' : 'text-orange-500'
        )} />
      )}
    </button>
  )
}

function EmptyState({ message, icon: Icon = Circle }: { message: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Icon className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
