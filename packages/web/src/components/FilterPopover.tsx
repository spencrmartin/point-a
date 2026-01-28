import { useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useSavedViewsStore, SAVED_VIEW_ICONS, type SavedViewIcon } from '@/stores/useSavedViewsStore'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { 
  Filter, 
  X, 
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
  Check,
  Bookmark,
  Plus,
  Flame,
  Zap,
  Rocket,
  Star,
  Heart,
  Flag,
  Target,
  Clock,
  Calendar,
  Grid,
  List,
  CheckCircle,
  AlertTriangle,
  Eye,
  Archive,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

// Map icon names to Lucide components for the icon picker
const iconMap: Record<SavedViewIcon, LucideIcon> = {
  'flame': Flame,
  'zap': Zap,
  'bug': Bug,
  'rocket': Rocket,
  'star': Star,
  'heart': Heart,
  'bookmark': Bookmark,
  'flag': Flag,
  'target': Target,
  'clock': Clock,
  'calendar': Calendar,
  'filter': Filter,
  'layers': Layers,
  'grid': Grid,
  'list': List,
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'eye': Eye,
  'archive': Archive,
}

export function FilterPopover() {
  const [open, setOpen] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [viewName, setViewName] = useState('')
  const [viewIcon, setViewIcon] = useState<SavedViewIcon>('bookmark')
  
  const { filters, setFilters, clearFilters, hasActiveFilters, currentProjectId, displayOptions } = useStore()
  const { addView } = useSavedViewsStore()
  const activeFilters = hasActiveFilters()

  const toggleFilter = (type: 'status' | 'priority' | 'type', value: string) => {
    const current = filters[type] as string[]
    if (current.includes(value)) {
      setFilters({ [type]: current.filter(v => v !== value) })
    } else {
      setFilters({ [type]: [...current, value] })
    }
  }

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast.error('Please enter a view name')
      return
    }
    
    addView({
      name: viewName.trim(),
      icon: viewIcon,
      filters: { ...filters },
      projectId: currentProjectId,
      groupBy: displayOptions.groupBy,
      sortBy: displayOptions.sortBy,
      sortOrder: displayOptions.sortOrder,
    })
    
    toast.success(`View "${viewName}" saved!`)
    setViewName('')
    setViewIcon('bookmark')
    setShowSaveForm(false)
  }
  
  // Get the current icon component
  const CurrentIcon = iconMap[viewIcon] || Bookmark

  const activeCount = filters.status.length + filters.priority.length + filters.type.length + (filters.assignee ? 1 : 0)

  return (
    <TooltipProvider delayDuration={0}>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(activeFilters && 'border-primary', 'px-2 sm:px-3')}>
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
                {activeCount > 0 && (
                  <span className="ml-1 sm:ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="sm:hidden">
            <p>Filter{activeCount > 0 ? ` (${activeCount})` : ''}</p>
          </TooltipContent>
        </Tooltip>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-medium">Filters</span>
          {activeFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
              Clear all
            </Button>
          )}
        </div>

        <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = filters.status.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('status', option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors border',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', option.color)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Priority</label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = filters.priority.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('priority', option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors border',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', option.color)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = filters.type.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter('type', option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors border',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', option.color)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save as View */}
          {activeFilters && (
            <div className="pt-2 border-t">
              {!showSaveForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowSaveForm(true)}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save as View
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded border">
                          <CurrentIcon className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="grid grid-cols-5 gap-1">
                          {SAVED_VIEW_ICONS.map((iconName) => {
                            const IconComponent = iconMap[iconName]
                            return (
                              <button
                                key={iconName}
                                onClick={() => setViewIcon(iconName)}
                                className={cn(
                                  'p-2 rounded hover:bg-muted',
                                  viewIcon === iconName && 'bg-primary/10'
                                )}
                                title={iconName}
                              >
                                <IconComponent className="h-4 w-4" />
                              </button>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      placeholder="View name..."
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveView()
                        if (e.key === 'Escape') setShowSaveForm(false)
                      }}
                      className="flex-1"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowSaveForm(false)
                        setViewName('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleSaveView}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
