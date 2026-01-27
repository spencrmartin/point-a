import { useState } from 'react'
import { useStore, type DisplayOptions } from '@/stores/useStore'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { 
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  EyeOff,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

const GROUP_BY_OPTIONS: { value: DisplayOptions['groupBy']; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'project', label: 'Project' },
  { value: 'none', label: 'No grouping' },
]

const SORT_BY_OPTIONS: { value: DisplayOptions['sortBy']; label: string }[] = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'title', label: 'Title' },
]

export function DisplayPopover() {
  const [open, setOpen] = useState(false)
  const { displayOptions, setDisplayOptions } = useStore()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b">
          <span className="font-medium">Display options</span>
        </div>

        <div className="p-3 space-y-4">
          {/* Group By */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Group by
            </label>
            <div className="space-y-1">
              {GROUP_BY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDisplayOptions({ groupBy: option.value })}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
                    displayOptions.groupBy === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {option.label}
                  {displayOptions.groupBy === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort by
            </label>
            <div className="space-y-1">
              {SORT_BY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDisplayOptions({ sortBy: option.value })}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
                    displayOptions.sortBy === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {option.label}
                  {displayOptions.sortBy === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Order</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayOptions({ sortOrder: 'asc' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border',
                  displayOptions.sortOrder === 'asc'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent hover:bg-muted'
                )}
              >
                <ArrowUp className="h-4 w-4" />
                Ascending
              </button>
              <button
                onClick={() => setDisplayOptions({ sortOrder: 'desc' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border',
                  displayOptions.sortOrder === 'desc'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent hover:bg-muted'
                )}
              >
                <ArrowDown className="h-4 w-4" />
                Descending
              </button>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2 pt-2 border-t">
            <button
              onClick={() => setDisplayOptions({ showEmptyGroups: !displayOptions.showEmptyGroups })}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                {displayOptions.showEmptyGroups ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Show empty groups
              </span>
              <div className={cn(
                'w-8 h-5 rounded-full transition-colors relative',
                displayOptions.showEmptyGroups ? 'bg-primary' : 'bg-muted'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  displayOptions.showEmptyGroups ? 'translate-x-3.5' : 'translate-x-0.5'
                )} />
              </div>
            </button>

            <button
              onClick={() => setDisplayOptions({ showSubIssues: !displayOptions.showSubIssues })}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Show sub-issues
              </span>
              <div className={cn(
                'w-8 h-5 rounded-full transition-colors relative',
                displayOptions.showSubIssues ? 'bg-primary' : 'bg-muted'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  displayOptions.showSubIssues ? 'translate-x-3.5' : 'translate-x-0.5'
                )} />
              </div>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
