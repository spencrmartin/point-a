import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'
import { useProjects } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { PointALogo } from './PointALogo'
import { ProjectIcon } from '@/lib/project-icons'
import { 
  LayoutDashboard, 
  Inbox, 
  FolderKanban,
  Plus,
  ChevronLeft,
  Settings,
  Search
} from 'lucide-react'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, currentProjectId, setCurrentProjectId, setViewMode, setSettingsOpen, setCreateProjectOpen } = useStore()
  const { data: projectsData } = useProjects()
  const projects = projectsData?.data || []

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-full bg-card/80 backdrop-blur-sm rounded-2xl border shadow-sm flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64 overflow-hidden' : 'w-16 overflow-visible'
        )}
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className={cn(
                  "flex items-center hover:opacity-80 transition-opacity",
                  sidebarOpen ? "gap-3" : "w-full justify-center"
                )}
              >
                <PointALogo size={32} />
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">
                <p>Expand sidebar</p>
              </TooltipContent>
            )}
          </Tooltip>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        {sidebarOpen ? (
          <div className="p-3">
            <Button variant="outline" className="w-full justify-start text-muted-foreground">
              <Search className="h-4 w-4 mr-2" />
              Search...
              <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
            </Button>
          </div>
        ) : (
          <div className="p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full">
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Search (⌘K)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem icon={Inbox} label="Inbox" collapsed={!sidebarOpen} />
          <NavItem icon={LayoutDashboard} label="My Issues" collapsed={!sidebarOpen} />
          
          {/* Projects Section */}
          <div className="pt-4">
            {sidebarOpen && (
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Projects
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={() => setCreateProjectOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {projects.map((project) => {
              const projectButton = (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProjectId(project.id)
                    setViewMode('board')
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    'hover:bg-accent',
                    currentProjectId === project.id && 'bg-accent',
                    !sidebarOpen && 'justify-center'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: project.color + '20', color: project.color }}
                  >
                    <ProjectIcon iconId={project.icon} size={14} />
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {project.openIssueCount}
                      </span>
                    </>
                  )}
                </button>
              )

              if (!sidebarOpen) {
                return (
                  <Tooltip key={project.id}>
                    <TooltipTrigger asChild>
                      {projectButton}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{project.name} ({project.openIssueCount})</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return projectButton
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t">
          <NavItem 
            icon={Settings} 
            label="Settings" 
            collapsed={!sidebarOpen} 
            onClick={() => setSettingsOpen(true)}
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavItem({ 
  icon: Icon, 
  label, 
  collapsed,
  active,
  onClick 
}: { 
  icon: React.ElementType
  label: string
  collapsed: boolean
  active?: boolean
  onClick?: () => void
}) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
        'hover:bg-accent',
        active && 'bg-accent',
        collapsed && 'justify-center'
      )}
    >
      <Icon className="h-4 w-4" />
      {!collapsed && <span>{label}</span>}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
