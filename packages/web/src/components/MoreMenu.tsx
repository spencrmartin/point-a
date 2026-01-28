import { useState } from 'react'
import { useStore, type DisplayOptions } from '@/stores/useStore'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import {
  MoreHorizontal,
  Filter,
  SlidersHorizontal,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Check,
  Circle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Bug,
  Sparkles,
  Wrench,
  CheckSquare,
  Layers,
  X,
  ArrowUpDown,
  Eye,
  EyeOff,
} from 'lucide-react'

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

interface MoreMenuProps {
  // For timeline view - calendar view mode switching
  calendarViewMode?: ViewMode
  onCalendarViewModeChange?: (mode: ViewMode) => void
  showCalendarViews?: boolean
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', icon: Circle, color: 'text-gray-400' },
  { value: 'todo', label: 'Todo', icon: Circle, color: 'text-blue-400' },
  { value: 'in_progress', label: 'In Progress', icon: Circle, color: 'text-yellow-400' },
  { value: 'in_review', label: 'In Review', icon: Circle, color: 'text-purple-400' },
  { value: 'done', label: 'Done', icon: Check, color: 'text-green-400' },
  { value: 'cancelled', label: 'Cancelled', icon: X, color: 'text-red-400' },
]

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'text-red-500' },
  { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
  { value: 'medium', label: 'Medium', icon: Minus, color: 'text-yellow-500' },
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-blue-500' },
  { value: 'none', label: 'No Priority', icon: Minus, color: 'text-gray-400' },
]

const TYPE_OPTIONS = [
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature', icon: Sparkles, color: 'text-purple-500' },
  { value: 'improvement', label: 'Improvement', icon: Wrench, color: 'text-blue-500' },
  { value: 'task', label: 'Task', icon: CheckSquare, color: 'text-green-500' },
  { value: 'epic', label: 'Epic', icon: Layers, color: 'text-indigo-500' },
]

const GROUP_BY_OPTIONS: { value: DisplayOptions['groupBy']; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'none', label: 'No grouping' },
]

const SORT_BY_OPTIONS: { value: DisplayOptions['sortBy']; label: string }[] = [
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
]

const CALENDAR_VIEW_OPTIONS = [
  { value: 'month' as ViewMode, label: 'Month', icon: LayoutGrid },
  { value: 'week' as ViewMode, label: 'Week', icon: CalendarRange },
  { value: 'day' as ViewMode, label: 'Day', icon: Calendar },
  { value: 'agenda' as ViewMode, label: 'Agenda', icon: CalendarDays },
]

export function MoreMenu({ 
  calendarViewMode, 
  onCalendarViewModeChange,
  showCalendarViews = false 
}: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'main' | 'filter' | 'display' | 'view'>('main')
  const { filters, setFilters, clearFilters, hasActiveFilters, displayOptions, setDisplayOptions } = useStore()
  
  const activeFilters = hasActiveFilters()
  const activeCount = filters.status.length + filters.priority.length + filters.type.length + (filters.assignee ? 1 : 0)

  const toggleFilter = (type: 'status' | 'priority' | 'type', value: string) => {
    const current = filters[type] as string[]
    if (current.includes(value)) {
      setFilters({ [type]: current.filter(v => v !== value) })
    } else {
      setFilters({ [type]: [...current, value] })
    }
  }

  const renderMainMenu = () => (
    <div className="space-y-1">
      {showCalendarViews && (
        <button
          onClick={() => setActiveSection('view')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            View
          </span>
          <span className="text-xs text-muted-foreground capitalize">{calendarViewMode}</span>
        </button>
      )}
      <button
        onClick={() => setActiveSection('filter')}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </span>
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setActiveSection('display')}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Display
        </span>
        <span className="text-xs text-muted-foreground capitalize">{displayOptions.groupBy}</span>
      </button>
    </div>
  )

  const renderViewSection = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-2 border-b">
        <button onClick={() => setActiveSection('main')} className="text-muted-foreground hover:text-foreground">
          <ArrowDown className="h-4 w-4 rotate-90" />
        </button>
        <span className="font-medium text-sm">Calendar View</span>
      </div>
      <div className="space-y-1">
        {CALENDAR_VIEW_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              onClick={() => {
                onCalendarViewModeChange?.(option.value)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                calendarViewMode === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {option.label}
              </span>
              {calendarViewMode === option.value && <Check className="h-4 w-4" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderFilterSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection('main')} className="text-muted-foreground hover:text-foreground">
            <ArrowDown className="h-4 w-4 rotate-90" />
          </button>
          <span className="font-medium text-sm">Filters</span>
        </div>
        {activeFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
            Clear
          </Button>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = filters.status.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleFilter('status', option.value)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border',
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent hover:bg-muted'
                )}
              >
                <Icon className={cn('h-3 w-3', option.color)} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
        <div className="flex flex-wrap gap-1">
          {PRIORITY_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = filters.priority.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleFilter('priority', option.value)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border',
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent hover:bg-muted'
                )}
              >
                <Icon className={cn('h-3 w-3', option.color)} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = filters.type.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleFilter('type', option.value)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border',
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent hover:bg-muted'
                )}
              >
                <Icon className={cn('h-3 w-3', option.color)} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderDisplaySection = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <button onClick={() => setActiveSection('main')} className="text-muted-foreground hover:text-foreground">
          <ArrowDown className="h-4 w-4 rotate-90" />
        </button>
        <span className="font-medium text-sm">Display</span>
      </div>

      {/* Group By */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <Layers className="h-3 w-3" />
          Group by
        </label>
        <div className="space-y-0.5">
          {GROUP_BY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDisplayOptions({ groupBy: option.value })}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                displayOptions.groupBy === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              {option.label}
              {displayOptions.groupBy === option.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          Sort by
        </label>
        <div className="space-y-0.5">
          {SORT_BY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDisplayOptions({ sortBy: option.value })}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                displayOptions.sortBy === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              {option.label}
              {displayOptions.sortBy === option.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Order */}
      <div className="flex gap-1">
        <button
          onClick={() => setDisplayOptions({ sortOrder: 'asc' })}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors border',
            displayOptions.sortOrder === 'asc'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-muted/50 border-transparent hover:bg-muted'
          )}
        >
          <ArrowUp className="h-3 w-3" />
          Asc
        </button>
        <button
          onClick={() => setDisplayOptions({ sortOrder: 'desc' })}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors border',
            displayOptions.sortOrder === 'desc'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-muted/50 border-transparent hover:bg-muted'
          )}
        >
          <ArrowDown className="h-3 w-3" />
          Desc
        </button>
      </div>

      {/* Toggles */}
      <div className="space-y-1 pt-2 border-t">
        <button
          onClick={() => setDisplayOptions({ showEmptyGroups: !displayOptions.showEmptyGroups })}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
        >
          <span className="flex items-center gap-1">
            {displayOptions.showEmptyGroups ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Empty groups
          </span>
          <div className={cn(
            'w-6 h-3.5 rounded-full transition-colors relative',
            displayOptions.showEmptyGroups ? 'bg-primary' : 'bg-muted'
          )}>
            <div className={cn(
              'absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform',
              displayOptions.showEmptyGroups ? 'translate-x-2.5' : 'translate-x-0.5'
            )} />
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setActiveSection('main')
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="sm:hidden px-2">
          <MoreHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded-full min-w-[18px]">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        {activeSection === 'main' && renderMainMenu()}
        {activeSection === 'view' && renderViewSection()}
        {activeSection === 'filter' && renderFilterSection()}
        {activeSection === 'display' && renderDisplaySection()}
      </PopoverContent>
    </Popover>
  )
}
