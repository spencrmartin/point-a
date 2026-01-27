import { useState, useMemo } from 'react'
import { useStore } from '@/stores/useStore'
import { useIssues } from '@/hooks/useIssues'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Skeleton, CalendarDaySkeleton } from './Skeleton'
import type { IssueWithRelations, IssueStatus } from '@point-a/shared'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
} from 'lucide-react'

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

const statusColors: Record<IssueStatus, string> = {
  backlog: 'bg-gray-400',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  in_review: 'bg-purple-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function TimelineView() {
  const { currentProjectId, setActiveIssueId } = useStore()
  const { data, isLoading, isFetching } = useIssues({ projectId: currentProjectId || undefined })

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const issues = data?.data || []

  // Get issues with due dates mapped by date string
  const issuesByDate = useMemo(() => {
    const map: Record<string, IssueWithRelations[]> = {}
    issues.forEach((issue) => {
      if (issue.dueDate) {
        const dateKey = new Date(issue.dueDate).toISOString().split('T')[0]
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(issue)
      }
    })
    return map
  }, [issues])

  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Show skeleton only on initial load
  if (isLoading && !data) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-muted h-10" />
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <CalendarDaySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'h-full flex flex-col transition-opacity duration-150',
      isFetching && 'opacity-70'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">
            {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {viewMode === 'agenda' && 'Agenda'}
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <ViewModeButton
            icon={LayoutGrid}
            label="Month"
            active={viewMode === 'month'}
            onClick={() => setViewMode('month')}
          />
          <ViewModeButton
            icon={CalendarRange}
            label="Week"
            active={viewMode === 'week'}
            onClick={() => setViewMode('week')}
          />
          <ViewModeButton
            icon={Calendar}
            label="Day"
            active={viewMode === 'day'}
            onClick={() => setViewMode('day')}
          />
          <ViewModeButton
            icon={CalendarDays}
            label="Agenda"
            active={viewMode === 'agenda'}
            onClick={() => setViewMode('agenda')}
          />
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            issuesByDate={issuesByDate}
            onIssueClick={setActiveIssueId}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            issuesByDate={issuesByDate}
            onIssueClick={setActiveIssueId}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            issuesByDate={issuesByDate}
            onIssueClick={setActiveIssueId}
          />
        )}
        {viewMode === 'agenda' && (
          <AgendaView
            issues={issues}
            onIssueClick={setActiveIssueId}
          />
        )}
      </div>
    </div>
  )
}

function ViewModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
        active ? 'bg-background shadow-sm' : 'hover:bg-background/50'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// Month View Component
function MonthView({
  currentDate,
  issuesByDate,
  onIssueClick,
}: {
  currentDate: Date
  issuesByDate: Record<string, IssueWithRelations[]>
  onIssueClick: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = useMemo(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const result: Date[] = []
    const current = new Date(startDate)
    while (result.length < 42) {
      result.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [currentDate])

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-muted">
        {DAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0]
          const dayIssues = issuesByDate[dateKey] || []
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          const isToday = date.getTime() === today.getTime()

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors',
                !isCurrentMonth && 'bg-muted/30',
                index % 7 === 6 && 'border-r-0'
              )}
            >
              <div className={cn(
                'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                isToday && 'bg-primary text-primary-foreground',
                !isCurrentMonth && 'text-muted-foreground'
              )}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onIssueClick(issue.id)
                    }}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                      statusColors[issue.status || 'backlog'],
                      'text-white'
                    )}
                  >
                    {issue.identifier} {issue.title}
                  </div>
                ))}
                {dayIssues.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayIssues.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({
  currentDate,
  issuesByDate,
  onIssueClick,
}: {
  currentDate: Date
  issuesByDate: Record<string, IssueWithRelations[]>
  onIssueClick: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      return day
    })
  }, [currentDate])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 bg-muted border-b">
        <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
          Time
        </div>
        {days.map((date, index) => {
          const isToday = date.getTime() === today.getTime()
          return (
            <div key={index} className={cn(
              'p-2 text-center border-r last:border-r-0',
              isToday && 'bg-primary/10'
            )}>
              <div className="text-xs text-muted-foreground">{DAYS[date.getDay()]}</div>
              <div className={cn(
                'text-lg font-semibold',
                isToday && 'text-primary'
              )}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* All Day Events */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-xs text-muted-foreground border-r bg-muted/50">
          All day
        </div>
        {days.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0]
          const dayIssues = issuesByDate[dateKey] || []
          return (
            <div key={index} className="p-1 border-r last:border-r-0 min-h-[60px]">
              {dayIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onIssueClick(issue.id)}
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 mb-1',
                    statusColors[issue.status || 'backlog'],
                    'text-white'
                  )}
                >
                  {issue.identifier}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Time Grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-2 text-xs text-muted-foreground border-r bg-muted/50 text-right pr-3">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {days.map((_, index) => (
              <div key={index} className="border-r last:border-r-0 h-12 hover:bg-muted/30" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  currentDate,
  issuesByDate,
  onIssueClick,
}: {
  currentDate: Date
  issuesByDate: Record<string, IssueWithRelations[]>
  onIssueClick: (id: string) => void
}) {
  const dateKey = currentDate.toISOString().split('T')[0]
  const dayIssues = issuesByDate[dateKey] || []
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* All Day Events */}
      <div className="p-3 border-b bg-muted/50">
        <div className="text-xs text-muted-foreground mb-2">All day</div>
        <div className="flex flex-wrap gap-2">
          {dayIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue.id)}
              className={cn(
                'text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80',
                statusColors[issue.status || 'backlog'],
                'text-white'
              )}
            >
              {issue.identifier} - {issue.title}
            </div>
          ))}
          {dayIssues.length === 0 && (
            <div className="text-sm text-muted-foreground">No issues due today</div>
          )}
        </div>
      </div>

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b last:border-b-0">
            <div className="w-20 p-2 text-sm text-muted-foreground border-r bg-muted/30 text-right pr-3 flex-shrink-0">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div className="flex-1 h-16 hover:bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Agenda View Component
function AgendaView({
  issues,
  onIssueClick,
}: {
  issues: IssueWithRelations[]
  onIssueClick: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { groupedByDate, issuesWithoutDueDate } = useMemo(() => {
    const withDueDate = issues
      .filter((issue) => issue.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

    const grouped = withDueDate.reduce((acc, issue) => {
      const dateKey = new Date(issue.dueDate!).toISOString().split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(issue)
      return acc
    }, {} as Record<string, IssueWithRelations[]>)

    return {
      groupedByDate: grouped,
      issuesWithoutDueDate: issues.filter((issue) => !issue.dueDate),
    }
  }, [issues])

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([dateKey, dateIssues]) => {
        const date = new Date(dateKey)
        const isToday = date.getTime() === today.getTime()
        const isPast = date.getTime() < today.getTime()
        const isTomorrow = date.getTime() === today.getTime() + 86400000

        return (
          <div key={dateKey} className="border rounded-lg overflow-hidden">
            <div className={cn(
              'px-4 py-2 font-medium flex items-center gap-2',
              isToday && 'bg-primary text-primary-foreground',
              isPast && !isToday && 'bg-red-500/10 text-red-600',
              !isToday && !isPast && 'bg-muted'
            )}>
              <Calendar className="h-4 w-4" />
              {isToday && 'Today'}
              {isTomorrow && 'Tomorrow'}
              {!isToday && !isTomorrow && date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="text-sm opacity-70">({dateIssues.length} issues)</span>
            </div>
            <div className="divide-y">
              {dateIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onIssueClick(issue.id)}
                  className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                >
                  <div className={cn('w-2 h-2 rounded-full', statusColors[issue.status || 'backlog'])} />
                  <span className="text-sm font-mono text-muted-foreground">{issue.identifier}</span>
                  <span className="flex-1">{issue.title}</span>
                  {issue.assignee && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs">{issue.assignee.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Issues without due date */}
      {issuesWithoutDueDate.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2 font-medium bg-muted/50 flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            No due date
            <span className="text-sm opacity-70">({issuesWithoutDueDate.length} issues)</span>
          </div>
          <div className="divide-y">
            {issuesWithoutDueDate.slice(0, 10).map((issue) => (
              <div
                key={issue.id}
                onClick={() => onIssueClick(issue.id)}
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
              >
                <div className={cn('w-2 h-2 rounded-full', statusColors[issue.status || 'backlog'])} />
                <span className="text-sm font-mono text-muted-foreground">{issue.identifier}</span>
                <span className="flex-1">{issue.title}</span>
              </div>
            ))}
            {issuesWithoutDueDate.length > 10 && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                +{issuesWithoutDueDate.length - 10} more issues without due date
              </div>
            )}
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground border rounded-lg">
          No issues found
        </div>
      )}
    </div>
  )
}
