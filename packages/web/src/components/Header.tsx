import { useStore } from '@/stores/useStore'
import { useProjects } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { 
  LayoutGrid, 
  List, 
  GanttChart,
  Plus,
  Filter,
  SlidersHorizontal
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

  return (
    <header className="h-14 border-b bg-card px-4 flex items-center justify-between">
      {/* Left: Project info */}
      <div className="flex items-center gap-3">
        {currentProject ? (
          <>
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: currentProject.color + '20', color: currentProject.color }}
            >
              {currentProject.icon}
            </div>
            <div>
              <h1 className="font-semibold">{currentProject.name}</h1>
              <p className="text-xs text-muted-foreground">
                {currentProject.openIssueCount} open issues
              </p>
            </div>
          </>
        ) : (
          <h1 className="font-semibold">All Issues</h1>
        )}
      </div>

      {/* Center: View switcher */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
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
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Display
        </Button>
        <Button size="sm" onClick={() => setQuickCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Issue
        </Button>
      </div>
    </header>
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
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
        active ? 'bg-background shadow-sm' : 'hover:bg-background/50'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}
