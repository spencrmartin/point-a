import { useMemo } from 'react'
import { useIssues } from '@/hooks/useIssues'
import { useProjects } from '@/hooks/useProjects'
import { useStore } from '@/stores/useStore'
import { useUserStore } from '@/stores/useUserStore'
import { ProjectIcon } from '@/lib/project-icons'
import { cn, formatRelativeDate } from '@/lib/utils'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ArrowUp,
  Inbox,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react'
import { Button } from './ui/button'
import type { IssueWithRelations } from '@point-a/shared'

export function HomeView() {
  const { data: issuesData, isLoading } = useIssues({})
  const { data: projectsData } = useProjects()
  const { setActiveIssueId, setCurrentProjectId, setViewMode } = useStore()
  const { getDisplayName } = useUserStore()

  const issues = issuesData?.data || []
  const projects = projectsData?.data || []
  const userName = getDisplayName()

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const total = issues.length
    const open = issues.filter(i => i.status !== 'done' && i.status !== 'cancelled').length
    const done = issues.filter(i => i.status === 'done').length
    const inProgress = issues.filter(i => i.status === 'in_progress').length
    const urgent = issues.filter(i => i.priority === 'urgent' || i.priority === 'high').length
    
    // Completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = issues.filter(i => 
      i.status === 'done' && 
      i.completedAt && 
      new Date(i.completedAt) >= today
    ).length

    // Completed this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const completedThisWeek = issues.filter(i => 
      i.status === 'done' && 
      i.completedAt && 
      new Date(i.completedAt) >= oneWeekAgo
    ).length
    
    return { total, open, done, inProgress, urgent, completedToday, completedThisWeek }
  }, [issues])

  // Get user's assigned issues (focus items)
  const myFocusIssues = useMemo(() => {
    const userIdentifier = useUserStore.getState().getUserIdentifier()
    if (!userIdentifier) return []
    
    return issues
      .filter(i => 
        i.assignee === userIdentifier && 
        i.status !== 'done' && 
        i.status !== 'cancelled'
      )
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
        const priorityDiff = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
        if (priorityDiff !== 0) return priorityDiff
        // Then by created date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(0, 5)
  }, [issues])

  // Get recent issues
  const recentIssues = useMemo(() => {
    return [...issues]
      .filter(i => i.status !== 'done' && i.status !== 'cancelled')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [issues])

  // Get urgent/high priority issues
  const urgentIssues = useMemo(() => {
    return issues
      .filter(i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'done')
      .slice(0, 5)
  }, [issues])

  // Calculate project stats
  const projectStats = useMemo(() => {
    return projects.map(project => {
      const projectIssues = issues.filter(i => i.projectId === project.id)
      const total = projectIssues.length
      const done = projectIssues.filter(i => i.status === 'done').length
      const percent = total > 0 ? Math.round((done / total) * 100) : 0
      return { ...project, total, done, percent }
    })
  }, [projects, issues])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span className="text-3xl">👋</span>
          {greeting}, {userName !== 'Anonymous' ? userName : 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your projects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Inbox}
          label="Open Issues"
          value={stats.open}
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
          icon={Sparkles}
          label="Done Today"
          value={stats.completedToday}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={stats.completedThisWeek}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
          subtitle="completed"
        />
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Your Focus */}
        {myFocusIssues.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="h-4 w-4" />
                Your Focus
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setViewMode('my-issues')}
              >
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {myFocusIssues.map(issue => (
                <IssueTile 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                  showProject
                  showPriority
                />
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Needs Attention
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {urgentIssues.length > 0 ? (
              urgentIssues.map(issue => (
                <IssueTile 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                  showPriority
                  showProject
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState message="No urgent issues" icon={CheckCircle2} />
              </div>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Projects
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projectStats.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProjectId(project.id)
                  setViewMode('project-home')
                }}
                className="p-4 rounded-xl border bg-card/90 backdrop-blur-sm hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: project.color + '20' }}
                  >
                    <ProjectIcon iconId={project.icon} size={20} color={project.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.openIssueCount} open · {project.done} done
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{project.percent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${project.percent}%`,
                        backgroundColor: project.color 
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
            
            {projects.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
                <Button variant="outline" size="sm" onClick={() => useStore.getState().setCreateProjectOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recently Updated */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Recently Updated
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recentIssues.length > 0 ? (
              recentIssues.map(issue => (
                <IssueTile 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                  showDate
                  showProject
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState message="No recent issues" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  bgColor,
  subtitle
}: { 
  icon: React.ElementType
  label: string
  value: number
  color: string
  bgColor: string
  subtitle?: string
}) {
  return (
    <div className="p-4 rounded-xl border bg-card/90 backdrop-blur-sm">
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
  showPriority = false,
  showProject = false,
  showDate = false
}: { 
  issue: IssueWithRelations
  onClick: () => void
  showPriority?: boolean
  showProject?: boolean
  showDate?: boolean
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
      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card/90 backdrop-blur-sm hover:bg-muted/50 transition-colors text-left"
    >
      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{issue.title}</p>
        <p className="text-xs text-muted-foreground">
          {issue.identifier}
          {showProject && issue.project && ` · ${issue.project.name}`}
          {showDate && ` · ${formatRelativeDate(issue.updatedAt)}`}
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
