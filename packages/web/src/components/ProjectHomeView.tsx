import { useMemo, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useProject, useUpdateProject } from '@/hooks/useProjects'
import { useIssues } from '@/hooks/useIssues'
import { Button } from './ui/button'
import { ProjectIcon } from '@/lib/project-icons'
import { cn, formatRelativeDate } from '@/lib/utils'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ArrowUp,
  Pencil,
  X,
  Check,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import type { IssueWithRelations } from '@point-a/shared'

export function ProjectHomeView() {
  const { currentProjectId, setActiveIssueId } = useStore()
  const { data: projectData, isLoading: projectLoading } = useProject(currentProjectId)
  const { data: issuesData, isLoading: issuesLoading } = useIssues(
    currentProjectId ? { projectId: currentProjectId } : undefined
  )
  const updateProject = useUpdateProject()

  const project = projectData?.data
  const issues = issuesData?.data || []

  const [isEditingReadme, setIsEditingReadme] = useState(false)
  const [readmeContent, setReadmeContent] = useState('')

  // Calculate project stats
  const stats = useMemo(() => {
    const total = issues.length
    const open = issues.filter(i => i.status !== 'done' && i.status !== 'cancelled').length
    const done = issues.filter(i => i.status === 'done').length
    const inProgress = issues.filter(i => i.status === 'in_progress').length
    const inReview = issues.filter(i => i.status === 'in_review').length
    const blocked = 0 // TODO: Add when dependencies are implemented
    const urgent = issues.filter(i => i.priority === 'urgent' || i.priority === 'high').length

    // Calculate velocity (issues completed in last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const completedThisWeek = issues.filter(i => 
      i.status === 'done' && 
      i.completedAt && 
      new Date(i.completedAt) >= oneWeekAgo
    ).length

    // Calculate completion percentage
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0

    return { 
      total, 
      open, 
      done, 
      inProgress, 
      inReview,
      blocked, 
      urgent, 
      completedThisWeek,
      completionPercent
    }
  }, [issues])

  // Get recent activity (recently updated issues)
  const recentActivity = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [issues])

  // Get issues needing attention
  const needsAttention = useMemo(() => {
    return issues
      .filter(i => 
        (i.priority === 'urgent' || i.priority === 'high') && 
        i.status !== 'done' && 
        i.status !== 'cancelled'
      )
      .slice(0, 5)
  }, [issues])

  const handleEditReadme = () => {
    setReadmeContent(project?.description || '')
    setIsEditingReadme(true)
  }

  const handleSaveReadme = async () => {
    if (!currentProjectId) return
    
    try {
      await updateProject.mutateAsync({
        id: currentProjectId,
        data: { description: readmeContent }
      })
      setIsEditingReadme(false)
      toast.success('README updated')
    } catch (err) {
      toast.error('Failed to update README')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingReadme(false)
    setReadmeContent('')
  }

  if (projectLoading || issuesLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Project Header with README as subdescription */}
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: project.color + '20' }}
        >
          <ProjectIcon iconId={project.icon} size={32} color={project.color} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {project.key} · {stats.open} open issues · {stats.completionPercent}% complete
          </p>
          {/* README as subdescription */}
          <div className="mt-3">
            {isEditingReadme ? (
              <div className="space-y-3">
                <textarea
                  value={readmeContent}
                  onChange={(e) => setReadmeContent(e.target.value)}
                  placeholder="Add a description for your project..."
                  className="w-full h-24 px-3 py-2 rounded-md border bg-background text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveReadme}
                    disabled={updateProject.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {updateProject.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : project.description ? (
              <div className="group relative">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
                <button
                  onClick={handleEditReadme}
                  className="absolute -right-2 -top-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditReadme}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Add description
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="rounded-xl border bg-card/90 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">In Review</span>
              <span className="font-medium">{stats.inReview}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">High Priority</span>
              <span className="font-medium text-orange-500">{stats.urgent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Velocity</span>
              <span className="font-medium text-purple-500">{stats.completedThisWeek}/week</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-xs text-muted-foreground">Progress</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${stats.completionPercent}%`,
                  backgroundColor: project.color 
                }}
              />
            </div>
            <span className="text-xs font-medium">{stats.completionPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Circle}
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
          icon={CheckCircle2}
          label="Completed"
          value={stats.done}
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

      {/* Two Column Layout for Needs Attention & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Needs Attention
          </h2>
          <div className="space-y-2">
            {needsAttention.length > 0 ? (
              needsAttention.map(issue => (
                <IssueRow 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                />
              ))
            ) : (
              <div className="rounded-xl border bg-card/90 backdrop-blur-sm p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No urgent issues</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map(issue => (
                <IssueRow 
                  key={issue.id} 
                  issue={issue} 
                  onClick={() => setActiveIssueId(issue.id)}
                  showDate
                />
              ))
            ) : (
              <div className="rounded-xl border bg-card/90 backdrop-blur-sm p-6 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
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

function IssueRow({ 
  issue, 
  onClick,
  showDate = false
}: { 
  issue: IssueWithRelations
  onClick: () => void
  showDate?: boolean
}) {
  const statusColor = {
    backlog: 'bg-gray-400',
    todo: 'bg-blue-400',
    in_progress: 'bg-yellow-500',
    in_review: 'bg-purple-500',
    done: 'bg-green-500',
    cancelled: 'bg-red-400',
  }[issue.status] || 'bg-gray-400'

  const priorityIcon = issue.priority === 'urgent' || issue.priority === 'high'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg border bg-card/90 hover:bg-muted/50 transition-colors text-left"
    >
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{issue.title}</p>
        <p className="text-xs text-muted-foreground">
          {issue.identifier}
          {showDate && ` · ${formatRelativeDate(issue.updatedAt)}`}
        </p>
      </div>
      {priorityIcon && (
        <ArrowUp className={cn(
          'w-3.5 h-3.5 flex-shrink-0',
          issue.priority === 'urgent' ? 'text-red-500' : 'text-orange-500'
        )} />
      )}
    </button>
  )
}
