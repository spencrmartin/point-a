import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'
import { useProjects } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { PointALogo } from './PointALogo'
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
  const { sidebarOpen, toggleSidebar, currentProjectId, setCurrentProjectId, setSettingsOpen } = useStore()
  const { data: projectsData } = useProjects()
  const projects = projectsData?.data || []

  return (
    <aside
      className={cn(
        'h-full bg-card border-r flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <PointALogo size={32} />
            <span className="font-semibold">Point A</span>
          </div>
        ) : (
          <PointALogo size={28} className="mx-auto" />
        )}
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
      {sidebarOpen && (
        <div className="p-3">
          <Button variant="outline" className="w-full justify-start text-muted-foreground">
            <Search className="h-4 w-4 mr-2" />
            Search...
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>
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
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setCurrentProjectId(project.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                'hover:bg-accent',
                currentProjectId === project.id && 'bg-accent'
              )}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-xs"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                {project.icon}
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
          ))}
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
  return (
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
}
