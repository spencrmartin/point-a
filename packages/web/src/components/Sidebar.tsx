import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSavedViewsStore, SAVED_VIEW_ICONS, type SavedViewIcon } from '@/stores/useSavedViewsStore'
import { useKeyboardContext } from '@/contexts/KeyboardContext'
import { useProjects } from '@/hooks/useProjects'
import { useIssues } from '@/hooks/useIssues'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { PointALogo } from './PointALogo'
import { ProjectIcon } from '@/lib/project-icons'
import { 
  LayoutDashboard, 
  Inbox, 
  User,
  FolderKanban,
  Plus,
  ChevronLeft,
  ChevronDown,
  Settings,
  Search,
  Home,
  Bookmark,
  ChevronRight,
  Flame,
  Zap,
  Bug,
  Rocket,
  Star,
  Heart,
  Flag,
  Target,
  Clock,
  Calendar,
  Filter,
  Layers,
  Grid,
  List,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  Archive,
  MoreHorizontal,
  Pencil,
  Trash2,
  Keyboard,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu'
import { toast } from 'sonner'

// Map icon names to Lucide components
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

function SavedViewIconComponent({ icon, className }: { icon: SavedViewIcon; className?: string }) {
  const IconComponent = iconMap[icon] || Bookmark
  return <IconComponent className={className} />
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, currentProjectId, setCurrentProjectId, viewMode, setViewMode, setCreateProjectOpen, setFilters, setDisplayOptions } = useStore()
  const { getUserIdentifier } = useUserStore()
  const { views, activeViewId, setActiveView, updateView, deleteView } = useSavedViewsStore()
  const { setSettingsOpen, setShortcutsHelpOpen } = useKeyboardContext()
  const { data: projectsData } = useProjects()
  const projects = projectsData?.data || []
  
  // Collapsible sections state
  const [savedViewsExpanded, setSavedViewsExpanded] = useState(true)
  
  // Handle changing a saved view's icon
  const handleChangeIcon = (viewId: string, newIcon: SavedViewIcon) => {
    updateView(viewId, { icon: newIcon })
    toast.success('Icon updated')
  }
  
  // Handle deleting a saved view
  const handleDeleteView = (viewId: string, viewName: string) => {
    deleteView(viewId)
    toast.success(`"${viewName}" deleted`)
  }
  
  // Fetch inbox count (backlog + no priority)
  const { data: inboxData } = useIssues({ status: 'backlog', priority: 'none' })
  const inboxCount = inboxData?.data?.length || 0
  
  // Fetch my issues count
  const userIdentifier = getUserIdentifier()
  const { data: myIssuesData } = useIssues(
    userIdentifier ? { assignee: userIdentifier } : undefined
  )
  const myIssuesCount = myIssuesData?.data?.filter(
    (i: any) => i.status !== 'done' && i.status !== 'cancelled'
  )?.length || 0

  // Handle clicking a saved view
  const handleSavedViewClick = (view: typeof views[0]) => {
    setActiveView(view.id)
    setFilters(view.filters)
    setDisplayOptions({
      groupBy: view.groupBy,
      sortBy: view.sortBy,
      sortOrder: view.sortOrder,
    })
    if (view.projectId) {
      setCurrentProjectId(view.projectId)
    } else {
      setCurrentProjectId(null)
    }
    setViewMode('list')
  }

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
                onClick={() => {
                  setCurrentProjectId(null)
                  setViewMode('home')
                }}
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
                <p>Home</p>
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
          <NavItem 
            icon={Inbox} 
            label="Inbox" 
            collapsed={!sidebarOpen} 
            active={viewMode === 'inbox'}
            count={inboxCount}
            onClick={() => {
              setCurrentProjectId(null)
              setViewMode('inbox')
            }}
          />
          <NavItem 
            icon={User} 
            label="My Issues" 
            collapsed={!sidebarOpen}
            active={viewMode === 'my-issues'}
            count={myIssuesCount}
            onClick={() => {
              setCurrentProjectId(null)
              setViewMode('my-issues')
            }}
          />
          
          {/* Saved Views Section */}
          {views.length > 0 && (
            <div className="pt-4">
              {sidebarOpen ? (
                <button
                  onClick={() => setSavedViewsExpanded(!savedViewsExpanded)}
                  className="w-full flex items-center justify-between px-2 mb-2 hover:bg-transparent"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Saved Views
                  </span>
                  {savedViewsExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="flex justify-center mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1">
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Saved Views</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              
              {(savedViewsExpanded || !sidebarOpen) && views.map((view) => {
                if (!sidebarOpen) {
                  return (
                    <Tooltip key={view.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSavedViewClick(view)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                            'hover:bg-accent',
                            activeViewId === view.id && 'bg-accent',
                            'justify-center'
                          )}
                        >
                          <SavedViewIconComponent icon={view.icon} className="h-4 w-4 flex-shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{view.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <div
                    key={view.id}
                    className={cn(
                      'group flex items-center gap-1 rounded-md transition-colors',
                      'hover:bg-accent',
                      activeViewId === view.id && 'bg-accent'
                    )}
                  >
                    <button
                      onClick={() => handleSavedViewClick(view)}
                      className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm"
                    >
                      <SavedViewIconComponent icon={view.icon} className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{view.name}</span>
                    </button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 mr-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity">
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Pencil className="h-4 w-4 mr-2" />
                            Change Icon
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="p-2">
                            <div className="grid grid-cols-5 gap-1">
                              {SAVED_VIEW_ICONS.map((iconName) => {
                                const IconComp = iconMap[iconName]
                                return (
                                  <button
                                    key={iconName}
                                    onClick={() => handleChangeIcon(view.id, iconName)}
                                    className={cn(
                                      'p-2 rounded hover:bg-muted',
                                      view.icon === iconName && 'bg-primary/10'
                                    )}
                                    title={iconName}
                                  >
                                    <IconComp className="h-4 w-4" />
                                  </button>
                                )
                              })}
                            </div>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteView(view.id, view.name)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}

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
        <div className="p-3 border-t space-y-1">
          <NavItem 
            icon={Keyboard} 
            label="Shortcuts" 
            collapsed={!sidebarOpen} 
            onClick={() => setShortcutsHelpOpen(true)}
            shortcut="⌘?"
          />
          <NavItem 
            icon={Settings} 
            label="Settings" 
            collapsed={!sidebarOpen} 
            onClick={() => setSettingsOpen(true)}
            shortcut="⌘,"
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
  count,
  shortcut,
  onClick 
}: { 
  icon: React.ElementType
  label: string
  collapsed: boolean
  active?: boolean
  count?: number
  shortcut?: string
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
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {count}
            </Badge>
          )}
          {shortcut && (
            <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {button}
            {count !== undefined && count > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}{shortcut ? ` (${shortcut})` : ''}{count !== undefined && count > 0 ? ` (${count})` : ''}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
