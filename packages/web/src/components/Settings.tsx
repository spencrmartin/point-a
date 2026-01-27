import { useState } from 'react'
import { useSettingsStore, Theme, AccentColor, DefaultView, DefaultGrouping, DefaultPriority, DefaultIssueType } from '@/stores/useSettingsStore'
import { useProjects } from '@/hooks/useProjects'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import {
  X,
  Sun,
  Moon,
  Monitor,
  Palette,
  LayoutGrid,
  List,
  Calendar,
  Download,
  Upload,
  Trash2,
  Keyboard,
  Info,
  ChevronRight,
  Check,
  RotateCcw,
  Github,
  ExternalLink,
} from 'lucide-react'
import { PointALogo } from './PointALogo'

interface SettingsProps {
  open: boolean
  onClose: () => void
}

type SettingsSection = 'appearance' | 'views' | 'issues' | 'shortcuts' | 'data' | 'about'

const accentColors: { id: AccentColor; label: string; color: string }[] = [
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#8b5cf6' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
  { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
]

export function Settings({ open, onClose }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
  const settings = useSettingsStore()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl h-[600px] bg-card rounded-xl shadow-2xl border overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-48 bg-muted/50 border-r p-2 flex flex-col">
          <div className="p-3 mb-2">
            <h2 className="font-semibold text-lg">Settings</h2>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem
              icon={Palette}
              label="Appearance"
              active={activeSection === 'appearance'}
              onClick={() => setActiveSection('appearance')}
            />
            <SidebarItem
              icon={LayoutGrid}
              label="Default Views"
              active={activeSection === 'views'}
              onClick={() => setActiveSection('views')}
            />
            <SidebarItem
              icon={List}
              label="Issues"
              active={activeSection === 'issues'}
              onClick={() => setActiveSection('issues')}
            />
            <SidebarItem
              icon={Keyboard}
              label="Shortcuts"
              active={activeSection === 'shortcuts'}
              onClick={() => setActiveSection('shortcuts')}
            />
            <SidebarItem
              icon={Download}
              label="Data"
              active={activeSection === 'data'}
              onClick={() => setActiveSection('data')}
            />
            <SidebarItem
              icon={Info}
              label="About"
              active={activeSection === 'about'}
              onClick={() => setActiveSection('about')}
            />
          </nav>

          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={settings.resetToDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium capitalize">{activeSection}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'views' && <ViewsSettings />}
            {activeSection === 'issues' && <IssuesSettings />}
            {activeSection === 'shortcuts' && <ShortcutsSettings />}
            {activeSection === 'data' && <DataSettings />}
            {activeSection === 'about' && <AboutSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({
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
        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
        active ? 'bg-background shadow-sm' : 'hover:bg-background/50'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}

// ============ Appearance Settings ============
function AppearanceSettings() {
  const { theme, setTheme, accentColor, setAccentColor, compactMode, setCompactMode, sidebarDefaultExpanded, setSidebarDefaultExpanded, homeBackground, setHomeBackground } = useSettingsStore()

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please choose an image under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setHomeBackground(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-8">
      {/* Theme */}
      <SettingGroup title="Theme" description="Choose your preferred color scheme">
        <div className="flex gap-2">
          <ThemeButton
            icon={Sun}
            label="Light"
            active={theme === 'light'}
            onClick={() => setTheme('light')}
          />
          <ThemeButton
            icon={Moon}
            label="Dark"
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
          />
          <ThemeButton
            icon={Monitor}
            label="System"
            active={theme === 'system'}
            onClick={() => setTheme('system')}
          />
        </div>
      </SettingGroup>

      {/* Accent Color */}
      <SettingGroup title="Accent Color" description="Customize the primary accent color">
        <div className="flex gap-2">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => setAccentColor(color.id)}
              className={cn(
                'w-10 h-10 rounded-full transition-all',
                accentColor === color.id && 'ring-2 ring-offset-2 ring-offset-background'
              )}
              style={{ 
                backgroundColor: color.color,
                '--tw-ring-color': color.color,
              } as React.CSSProperties}
              title={color.label}
            >
              {accentColor === color.id && (
                <Check className="h-5 w-5 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      </SettingGroup>

      {/* Home Background */}
      <SettingGroup title="Home Background" description="Add a custom background image to the Home view">
        <div className="space-y-3">
          {homeBackground ? (
            <div className="relative w-full max-w-xs">
              <img 
                src={homeBackground} 
                alt="Home background preview" 
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setHomeBackground(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-xs h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
              <span className="text-sm text-muted-foreground">No background set</span>
            </div>
          )}
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {homeBackground ? 'Change Image' : 'Upload Image'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </SettingGroup>

      {/* Compact Mode */}
      <SettingGroup title="Compact Mode" description="Use a denser layout with smaller elements">
        <ToggleSwitch checked={compactMode} onChange={setCompactMode} />
      </SettingGroup>

      {/* Sidebar Default */}
      <SettingGroup title="Sidebar Expanded by Default" description="Start with the sidebar expanded">
        <ToggleSwitch checked={sidebarDefaultExpanded} onChange={setSidebarDefaultExpanded} />
      </SettingGroup>
    </div>
  )
}

function ThemeButton({
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
        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-w-[100px]',
        active ? 'border-primary bg-primary/5' : 'border-transparent bg-muted hover:bg-muted/80'
      )}
    >
      <Icon className={cn('h-6 w-6', active && 'text-primary')} />
      <span className={cn('text-sm', active && 'font-medium')}>{label}</span>
    </button>
  )
}

// ============ Views Settings ============
function ViewsSettings() {
  const {
    defaultView, setDefaultView,
    defaultGrouping, setDefaultGrouping,
    defaultSortField, setDefaultSortField,
    defaultSortOrder, setDefaultSortOrder,
    showCompletedIssues, setShowCompletedIssues,
  } = useSettingsStore()

  return (
    <div className="space-y-8">
      {/* Default View */}
      <SettingGroup title="Default View" description="The view shown when opening a project">
        <div className="flex gap-2">
          <ViewButton icon={LayoutGrid} label="Board" active={defaultView === 'board'} onClick={() => setDefaultView('board')} />
          <ViewButton icon={List} label="List" active={defaultView === 'list'} onClick={() => setDefaultView('list')} />
          <ViewButton icon={Calendar} label="Timeline" active={defaultView === 'timeline'} onClick={() => setDefaultView('timeline')} />
        </div>
      </SettingGroup>

      {/* Default Grouping */}
      <SettingGroup title="Default Grouping" description="How issues are grouped in list view">
        <SelectDropdown
          value={defaultGrouping}
          onChange={(v) => setDefaultGrouping(v as DefaultGrouping)}
          options={[
            { value: 'status', label: 'By Status' },
            { value: 'priority', label: 'By Priority' },
            { value: 'none', label: 'No Grouping' },
          ]}
        />
      </SettingGroup>

      {/* Default Sort */}
      <SettingGroup title="Default Sort" description="How issues are sorted">
        <div className="flex gap-2">
          <SelectDropdown
            value={defaultSortField}
            onChange={(v) => setDefaultSortField(v as any)}
            options={[
              { value: 'createdAt', label: 'Created Date' },
              { value: 'updatedAt', label: 'Updated Date' },
              { value: 'priority', label: 'Priority' },
              { value: 'title', label: 'Title' },
            ]}
          />
          <SelectDropdown
            value={defaultSortOrder}
            onChange={(v) => setDefaultSortOrder(v as 'asc' | 'desc')}
            options={[
              { value: 'desc', label: 'Descending' },
              { value: 'asc', label: 'Ascending' },
            ]}
          />
        </div>
      </SettingGroup>

      {/* Show Completed */}
      <SettingGroup title="Show Completed Issues" description="Display issues marked as done">
        <ToggleSwitch checked={showCompletedIssues} onChange={setShowCompletedIssues} />
      </SettingGroup>
    </div>
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
        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </button>
  )
}

// ============ Issues Settings ============
function IssuesSettings() {
  const {
    defaultProjectId, setDefaultProjectId,
    defaultPriority, setDefaultPriority,
    defaultIssueType, setDefaultIssueType,
    autoAssignToMe, setAutoAssignToMe,
    myName, setMyName,
  } = useSettingsStore()

  const { data: projectsData } = useProjects()
  const projects = projectsData?.data || []

  return (
    <div className="space-y-8">
      {/* Your Name */}
      <SettingGroup title="Your Name" description="Used for auto-assignment and filtering">
        <input
          type="text"
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full max-w-xs px-3 py-2 rounded-md border bg-background text-sm"
        />
      </SettingGroup>

      {/* Default Project */}
      <SettingGroup title="Default Project" description="Pre-selected project when creating issues">
        <SelectDropdown
          value={defaultProjectId || ''}
          onChange={(v) => setDefaultProjectId(v || null)}
          options={[
            { value: '', label: 'None' },
            ...projects.map((p) => ({ value: p.id, label: `${p.icon} ${p.name}` })),
          ]}
        />
      </SettingGroup>

      {/* Default Priority */}
      <SettingGroup title="Default Priority" description="Priority for new issues">
        <SelectDropdown
          value={defaultPriority}
          onChange={(v) => setDefaultPriority(v as DefaultPriority)}
          options={[
            { value: 'none', label: 'No Priority' },
            { value: 'low', label: '🔵 Low' },
            { value: 'medium', label: '🟡 Medium' },
            { value: 'high', label: '🟠 High' },
            { value: 'urgent', label: '🔴 Urgent' },
          ]}
        />
      </SettingGroup>

      {/* Default Type */}
      <SettingGroup title="Default Issue Type" description="Type for new issues">
        <SelectDropdown
          value={defaultIssueType}
          onChange={(v) => setDefaultIssueType(v as DefaultIssueType)}
          options={[
            { value: 'task', label: '✅ Task' },
            { value: 'bug', label: '🐛 Bug' },
            { value: 'feature', label: '✨ Feature' },
            { value: 'improvement', label: '🔧 Improvement' },
            { value: 'epic', label: '📦 Epic' },
          ]}
        />
      </SettingGroup>

      {/* Auto Assign */}
      <SettingGroup title="Auto-assign to Me" description="Automatically assign new issues to yourself">
        <ToggleSwitch checked={autoAssignToMe} onChange={setAutoAssignToMe} />
      </SettingGroup>
    </div>
  )
}

// ============ Shortcuts Settings ============
function ShortcutsSettings() {
  const { shortcutsEnabled, setShortcutsEnabled } = useSettingsStore()

  const shortcuts = [
    { keys: ['⌘', 'K'], description: 'Quick create issue' },
    { keys: ['⌘', '/'], description: 'Search' },
    { keys: ['Esc'], description: 'Close modal' },
    { keys: ['⌘', '1'], description: 'Switch to Board view' },
    { keys: ['⌘', '2'], description: 'Switch to List view' },
    { keys: ['⌘', '3'], description: 'Switch to Timeline view' },
    { keys: ['⌘', ','], description: 'Open Settings' },
  ]

  return (
    <div className="space-y-8">
      {/* Enable Shortcuts */}
      <SettingGroup title="Enable Keyboard Shortcuts" description="Use keyboard shortcuts throughout the app">
        <ToggleSwitch checked={shortcutsEnabled} onChange={setShortcutsEnabled} />
      </SettingGroup>

      {/* Shortcuts List */}
      <SettingGroup title="Available Shortcuts" description="Keyboard shortcuts you can use">
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-1 text-xs bg-muted rounded border font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingGroup>
    </div>
  )
}

// ============ Data Settings ============
function DataSettings() {
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setExportStatus('Exporting...')
      const response = await fetch('/api/issues?limit=1000')
      const issuesData = await response.json()
      
      const projectsResponse = await fetch('/api/projects')
      const projectsData = await projectsResponse.json()

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        projects: projectsData.data,
        issues: issuesData.data,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `point-a-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      setExportStatus('Export complete!')
      setTimeout(() => setExportStatus(null), 3000)
    } catch (error) {
      setExportStatus('Export failed')
      setTimeout(() => setExportStatus(null), 3000)
    }
  }

  return (
    <div className="space-y-8">
      {/* Export */}
      <SettingGroup title="Export Data" description="Download all your projects and issues as JSON">
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
          {exportStatus && (
            <span className="text-sm text-muted-foreground">{exportStatus}</span>
          )}
        </div>
      </SettingGroup>

      {/* Import */}
      <SettingGroup title="Import Data" description="Import projects and issues from a JSON file">
        <Button variant="outline" disabled>
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
      </SettingGroup>

      {/* Clear Data */}
      <SettingGroup title="Clear All Data" description="Permanently delete all projects and issues">
        <Button variant="destructive" disabled>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">This action cannot be undone</p>
      </SettingGroup>

      {/* Database Info */}
      <SettingGroup title="Database" description="Local SQLite database location">
        <code className="text-xs bg-muted px-2 py-1 rounded">~/.point-a/point-a.db</code>
      </SettingGroup>
    </div>
  )
}

// ============ About Settings ============
function AboutSettings() {
  return (
    <div className="space-y-8">
      {/* Logo & Version */}
      <div className="text-center py-6">
        <div className="mx-auto mb-4">
          <PointALogo size={80} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold">Point A</h2>
        <p className="text-muted-foreground">Version 0.1.0</p>
      </div>

      {/* Description */}
      <SettingGroup title="About" description="">
        <p className="text-sm text-muted-foreground">
          Point A is a local-first issue tracker with MCP integrations. 
          Built for developers who want Linear-like functionality without cloud dependency.
        </p>
      </SettingGroup>

      {/* Links */}
      <SettingGroup title="Links" description="">
        <div className="space-y-2">
          <a
            href="https://github.com/spencrmartin/point-a"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub Repository
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <Info className="h-4 w-4" />
            Documentation
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>
        </div>
      </SettingGroup>

      {/* Tech Stack */}
      <SettingGroup title="Built With" description="">
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Tailwind CSS', 'Hono', 'Drizzle', 'SQLite', 'MCP'].map((tech) => (
            <span key={tech} className="px-2 py-1 text-xs bg-muted rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </SettingGroup>

      {/* License */}
      <SettingGroup title="License" description="">
        <p className="text-sm text-muted-foreground">
          MIT License © {new Date().getFullYear()} Point A Contributors
        </p>
      </SettingGroup>
    </div>
  )
}

// ============ Shared Components ============
function SettingGroup({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="font-medium mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}
      {children}
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  )
}

function SelectDropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-md border bg-background text-sm min-w-[150px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
