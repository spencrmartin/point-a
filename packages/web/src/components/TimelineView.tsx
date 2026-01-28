import { useState, useMemo } from 'react'
import { useStore } from '@/stores/useStore'
import { useIssues } from '@/hooks/useIssues'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Skeleton, CalendarDaySkeleton } from './Skeleton'
import { FilterPopover } from './FilterPopover'
import { DisplayPopover } from './DisplayPopover'
import { MoreMenu } from './MoreMenu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
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

// Hex colors for SVG/inline styles
const statusHexColors: Record<IssueStatus, string> = {
  backlog: '#9ca3af',
  todo: '#3b82f6',
  in_progress: '#eab308',
  in_review: '#a855f7',
  done: '#22c55e',
  cancelled: '#ef4444',
}

// Helper to get date key string
const getDateKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

// Helper to check if two dates are the same day
const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
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

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Desktop: View Mode Switcher + Filter/Display */}
          <div className="hidden sm:flex items-center gap-2">
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
            <FilterPopover />
            <DisplayPopover />
          </div>
          {/* Mobile: More menu with all options */}
          <MoreMenu 
            showCalendarViews 
            calendarViewMode={viewMode} 
            onCalendarViewModeChange={setViewMode} 
          />
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            issues={issues}
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
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm transition-colors',
              active ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="sm:hidden">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Types for duration spans
interface IssueSpan {
  issue: IssueWithRelations
  startIndex: number  // Index in the days array where issue starts (or continues from prev week)
  endIndex: number    // Index in the days array where issue ends (or continues to next week)
  isStart: boolean    // True if this is the actual start date
  isEnd: boolean      // True if this is the actual end date
  row: number         // Which row (week) this span is in
}

// Month View Component with Duration Spans
function MonthView({
  currentDate,
  issues,
  onIssueClick,
}: {
  currentDate: Date
  issues: IssueWithRelations[]
  onIssueClick: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generate all days in the calendar view (6 weeks)
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

  // Calculate issue spans for the visible calendar
  const issueSpans = useMemo(() => {
    const spans: IssueSpan[] = []
    const calendarStart = days[0]
    const calendarEnd = days[days.length - 1]

    issues.forEach((issue) => {
      if (!issue.createdAt) return

      const startDate = new Date(issue.createdAt)
      startDate.setHours(0, 0, 0, 0)

      // End date is completedAt if done/cancelled, otherwise today (for in-progress visualization)
      let endDate: Date
      if (issue.completedAt) {
        endDate = new Date(issue.completedAt)
      } else if (issue.status === 'done' || issue.status === 'cancelled') {
        // Fallback for completed issues without completedAt
        endDate = new Date(issue.updatedAt)
      } else {
        // For active issues, show span to today
        endDate = new Date(today)
      }
      endDate.setHours(0, 0, 0, 0)

      // Skip if entirely outside calendar view
      if (endDate < calendarStart || startDate > calendarEnd) return

      // Clamp to calendar bounds
      const visibleStart = startDate < calendarStart ? calendarStart : startDate
      const visibleEnd = endDate > calendarEnd ? calendarEnd : endDate

      // Find indices in days array
      let startIdx = -1
      let endIdx = -1
      for (let i = 0; i < days.length; i++) {
        if (isSameDay(days[i], visibleStart) && startIdx === -1) startIdx = i
        if (isSameDay(days[i], visibleEnd)) endIdx = i
      }

      if (startIdx === -1 || endIdx === -1) return

      // Create spans for each week row the issue appears in
      const startRow = Math.floor(startIdx / 7)
      const endRow = Math.floor(endIdx / 7)

      for (let row = startRow; row <= endRow; row++) {
        const rowStart = row * 7
        const rowEnd = row * 7 + 6

        spans.push({
          issue,
          startIndex: Math.max(startIdx, rowStart),
          endIndex: Math.min(endIdx, rowEnd),
          isStart: startIdx >= rowStart && startIdx <= rowEnd && isSameDay(days[startIdx], startDate),
          isEnd: endIdx >= rowStart && endIdx <= rowEnd && isSameDay(days[endIdx], endDate),
          row,
        })
      }
    })

    return spans
  }, [issues, days, today])

  // Group spans by row for rendering
  const spansByRow = useMemo(() => {
    const byRow: Record<number, IssueSpan[]> = {}
    issueSpans.forEach((span) => {
      if (!byRow[span.row]) byRow[span.row] = []
      byRow[span.row].push(span)
    })
    // Sort spans in each row by start index
    Object.values(byRow).forEach((rowSpans) => {
      rowSpans.sort((a, b) => a.startIndex - b.startIndex)
    })
    return byRow
  }, [issueSpans])

  // Get issues that START on a specific date (for showing dots)
  const getIssuesStartingOn = (dateIndex: number): IssueSpan[] => {
    return issueSpans.filter((span) => span.startIndex === dateIndex && span.isStart)
  }

  // Get issues that END on a specific date (for showing dots)
  const getIssuesEndingOn = (dateIndex: number): IssueSpan[] => {
    return issueSpans.filter((span) => span.endIndex === dateIndex && span.isEnd)
  }

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

      {/* Calendar Grid - Render by weeks */}
      {Array.from({ length: 6 }).map((_, weekIndex) => {
        const weekSpans = spansByRow[weekIndex] || []

        return (
          <div key={weekIndex} className="relative">
            {/* Duration span lines (rendered as overlay) */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {weekSpans.slice(0, 4).map((span, spanIdx) => {
                const startCol = span.startIndex % 7
                const endCol = span.endIndex % 7
                const color = statusHexColors[span.issue.status || 'backlog']
                const topOffset = 36 + spanIdx * 14 // Below date number, stacked

                return (
                  <div
                    key={`${span.issue.id}-${weekIndex}`}
                    className="absolute flex items-center"
                    style={{
                      left: `calc(${(startCol / 7) * 100}% + 4px)`,
                      right: `calc(${((6 - endCol) / 7) * 100}% + 4px)`,
                      top: `${topOffset}px`,
                      height: '10px',
                    }}
                  >
                    {/* Start dot */}
                    {span.isStart && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                        style={{ backgroundColor: color }}
                        title={`${span.issue.identifier}: ${span.issue.title} (started)`}
                        onClick={() => onIssueClick(span.issue.id)}
                      />
                    )}

                    {/* Connecting line */}
                    <div
                      className="flex-1 h-0.5"
                      style={{ backgroundColor: color, opacity: 0.5 }}
                    />

                    {/* End dot */}
                    {span.isEnd && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                        style={{ backgroundColor: color }}
                        title={`${span.issue.identifier}: ${span.issue.title} (${span.issue.completedAt ? 'completed' : 'in progress'})`}
                        onClick={() => onIssueClick(span.issue.id)}
                      />
                    )}

                    {/* Continuation indicator (no dot, just line extending) */}
                    {!span.isStart && (
                      <div
                        className="w-1 h-0.5 flex-shrink-0"
                        style={{ backgroundColor: color, opacity: 0.5 }}
                      />
                    )}
                    {!span.isEnd && (
                      <div
                        className="w-1 h-0.5 flex-shrink-0"
                        style={{ backgroundColor: color, opacity: 0.5 }}
                      />
                    )}
                  </div>
                )
              })}
              {weekSpans.length > 4 && (
                <div
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: '4px', top: '92px' }}
                >
                  +{weekSpans.length - 4} more
                </div>
              )}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIdx) => {
                const globalIndex = weekIndex * 7 + dayIdx
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const isToday = date.getTime() === today.getTime()

                return (
                  <div
                    key={globalIndex}
                    className={cn(
                      'min-h-[100px] p-1 border-b border-r hover:bg-muted/50 transition-colors relative',
                      !isCurrentMonth && 'bg-muted/30',
                      dayIdx === 6 && 'border-r-0'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                      isToday && 'bg-primary text-primary-foreground',
                      !isCurrentMonth && 'text-muted-foreground'
                    )}>
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
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
