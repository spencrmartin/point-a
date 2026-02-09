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
  GitBranch,
  Plus,
  Search,
  FileText,
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
  
  // Determine if we're in a project context (project selected and not on global home)
  const isInProjectContext = currentProjectId && viewMode !== 'home'
  
  // Home button behavior: if in project context, go to project-home; otherwise go to global home
  const handleHomeClick = () => {
    if (isInProjectContext) {
      setViewMode('project-home')
    } else {
      setViewMode('home')
    }
  }
  
  // Check if home is active (either global home when no project, or project-home when in project)
  const isHomeActive = viewMode === 'home' || viewMode === 'project-home'

  return (
    <TooltipProvider delayDuration={0}>
      <header className="h-14 px-4 flex items-center justify-between">
        {/* Left: Search hint + Project indicator */}
        <div className="w-48 hidden sm:flex items-center gap-2">
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

        {/* Center: Project indicator + View switcher */}
        <div className="flex items-center gap-3">
          {/* Project indicator */}
          {isInProjectContext && currentProject && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: currentProject.color + '20' }}
            >
              <ProjectIcon iconId={currentProject.icon} size={18} color={currentProject.color} />
            </div>
          )}
          
          {/* View switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <ViewButton
              icon={isInProjectContext ? FileText : Home}
              label={isInProjectContext ? 'README' : 'Home'}
              active={isHomeActive}
              onClick={handleHomeClick}
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
            <ViewButton
              icon={GitBranch}
              label="Graph"
              active={viewMode === 'graph'}
              onClick={() => setViewMode('graph')}
            />
          </div>
        </div>

        {/* Right: Create button */}
        <div className="flex items-center gap-1">
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
