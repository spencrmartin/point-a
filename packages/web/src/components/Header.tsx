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
  Plus
} from 'lucide-react'

export function Header() {
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
        {/* Left: Spacer for balance */}
        <div className="w-24 hidden sm:block" />

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
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" onClick={() => setQuickCreateOpen(true)}>
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Issue (⌘K)</p>
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
