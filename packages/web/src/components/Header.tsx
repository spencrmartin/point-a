import { useStore } from '@/stores/useStore'
import { useProjects } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { FilterPopover } from './FilterPopover'
import { DisplayPopover } from './DisplayPopover'
import { ProjectIcon } from '@/lib/project-icons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  Home,
  LayoutGrid, 
  List, 
  GanttChart,
  Plus,
  Search,
  Keyboard,
  Settings,
} from 'lucide-react'

interface HeaderProps {
  onOpenSettings?: () => void
  onOpenShortcuts?: () => void
}

export function Header({ onOpenSettings, onOpenShortcuts }: HeaderProps) {
  const { 
    currentProjectId, 
    viewMode, 
    setViewMode,
    setQuickCreateOpen 
  } = useStore()
  const { data: projectsData } = useProjects()
  
  const currentProject = projectsData?.data?.find(p => p.id === currentProjectId)
  const isHome = viewMode === 'home'

  return (
    <TooltipProvider delayDuration={0}>
      <header className="h-14 px-4 flex items-center justify-between">
        {/* Left: Search hint */}
        <div className="w-32 hidden sm:flex items-center">
          <button
            onClick={() => {
              // Trigger command palette via keyboard event
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-muted rounded">⌘K</kbd>
          </button>
        </div>

        {/* Center: View switcher */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <ViewButton
            icon={Home}
            label="Home"
            active={viewMode === 'home'}
            onClick={() => setViewMode('home')}
          />
          <ViewButton
            icon={LayoutGrid}
            label="Board"
            active={viewMode === 'board'}
            onClick={() => setViewMode('board')}
          />
          <ViewButton
            icon={List}
            label="List"
            active={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          />
          <ViewButton
            icon={GanttChart}
            label="Timeline"
            active={viewMode === 'timeline'}
            onClick={() => setViewMode('timeline')}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Keyboard shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={onOpenShortcuts}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keyboard shortcuts (⌘?)</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings (⌘,)</p>
            </TooltipContent>
          </Tooltip>

          {/* Create */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={() => setQuickCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Issue (⌘N)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}

function ViewButton({
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
  )
}
