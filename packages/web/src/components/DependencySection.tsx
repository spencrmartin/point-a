import { useState } from 'react'
import { useDependencies, useAddDependency, useRemoveDependency } from '@/hooks/useDependencies'
import { useIssues } from '@/hooks/useIssues'
import { useStore } from '@/stores/useStore'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import {
  Link2,
  Plus,
  X,
  Ban,
  ArrowRight,
  Copy,
  Link,
  CheckCircle2,
  Circle,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DependencyWithIssue, DependencyType } from '@point-a/shared'

interface DependencySectionProps {
  issueId: string
}

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-400',
  todo: 'bg-blue-400',
  in_progress: 'bg-yellow-500',
  in_review: 'bg-purple-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-400',
}

const statusIcons: Record<string, React.ElementType> = {
  backlog: Circle,
  todo: Circle,
  in_progress: Clock,
  in_review: Clock,
  done: CheckCircle2,
  cancelled: Circle,
}

export function DependencySection({ issueId }: DependencySectionProps) {
  const { data: dependenciesData, isLoading } = useDependencies(issueId)
  const [isAddingDependency, setIsAddingDependency] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    blockedBy: true,
    blocks: true,
    relatesTo: false,
    duplicates: false,
  })

  const dependencies = dependenciesData?.data

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          Dependencies
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const hasBlockedBy = dependencies?.blockedBy && dependencies.blockedBy.length > 0
  const hasBlocks = dependencies?.blocks && dependencies.blocks.length > 0
  const hasRelatesTo = dependencies?.relatesTo && dependencies.relatesTo.length > 0
  const hasDuplicates = dependencies?.duplicates && dependencies.duplicates.length > 0
  const hasDependencies = hasBlockedBy || hasBlocks || hasRelatesTo || hasDuplicates

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          Dependencies
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsAddingDependency(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {!hasDependencies && !isAddingDependency && (
        <p className="text-sm text-muted-foreground py-2">
          No dependencies yet
        </p>
      )}

      {/* Blocked By Section */}
      {hasBlockedBy && (
        <DependencyGroup
          title="Blocked by"
          icon={Ban}
          iconColor="text-red-500"
          items={dependencies!.blockedBy}
          expanded={expandedSections.blockedBy}
          onToggle={() => toggleSection('blockedBy')}
          issueId={issueId}
        />
      )}

      {/* Blocks Section */}
      {hasBlocks && (
        <DependencyGroup
          title="Blocks"
          icon={ArrowRight}
          iconColor="text-orange-500"
          items={dependencies!.blocks}
          expanded={expandedSections.blocks}
          onToggle={() => toggleSection('blocks')}
          issueId={issueId}
        />
      )}

      {/* Relates To Section */}
      {hasRelatesTo && (
        <DependencyGroup
          title="Related"
          icon={Link}
          iconColor="text-blue-500"
          items={dependencies!.relatesTo}
          expanded={expandedSections.relatesTo}
          onToggle={() => toggleSection('relatesTo')}
          issueId={issueId}
        />
      )}

      {/* Duplicates Section */}
      {hasDuplicates && (
        <DependencyGroup
          title="Duplicates"
          icon={Copy}
          iconColor="text-gray-500"
          items={dependencies!.duplicates}
          expanded={expandedSections.duplicates}
          onToggle={() => toggleSection('duplicates')}
          issueId={issueId}
        />
      )}

      {/* Add Dependency Modal */}
      {isAddingDependency && (
        <AddDependencyModal
          issueId={issueId}
          onClose={() => setIsAddingDependency(false)}
        />
      )}
    </div>
  )
}

interface DependencyGroupProps {
  title: string
  icon: React.ElementType
  iconColor: string
  items: DependencyWithIssue[]
  expanded: boolean
  onToggle: () => void
  issueId: string
}

function DependencyGroup({
  title,
  icon: Icon,
  iconColor,
  items,
  expanded,
  onToggle,
  issueId,
}: DependencyGroupProps) {
  const { setActiveIssueId } = useStore()
  const removeDependency = useRemoveDependency()

  const handleRemove = async (dependencyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await removeDependency.mutateAsync(dependencyId)
      toast.success('Dependency removed')
    } catch (err) {
      toast.error('Failed to remove dependency')
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">({items.length})</span>
      </button>

      {expanded && (
        <div className="border-t divide-y">
          {items.map((dep) => {
            const StatusIcon = statusIcons[dep.issue.status] || Circle
            return (
              <div
                key={dep.id}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
              >
                <div className={cn('w-2 h-2 rounded-full', statusColors[dep.issue.status])} />
                <button
                  onClick={() => setActiveIssueId(dep.issue.id)}
                  className="flex-1 text-left text-sm hover:text-primary transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {dep.issue.identifier}
                  </span>
                  <span className="truncate">{dep.issue.title}</span>
                </button>
                <button
                  onClick={(e) => handleRemove(dep.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface AddDependencyModalProps {
  issueId: string
  onClose: () => void
}

function AddDependencyModal({ issueId, onClose }: AddDependencyModalProps) {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<DependencyType>('blocks')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  
  const { data: issuesData } = useIssues({})
  const addDependency = useAddDependency()

  const issues = issuesData?.data || []
  
  // Filter issues based on search and exclude current issue
  const filteredIssues = issues.filter(issue => 
    issue.id !== issueId &&
    (issue.title.toLowerCase().includes(search.toLowerCase()) ||
     issue.identifier.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10)

  const handleAdd = async () => {
    if (!selectedIssueId) return

    try {
      await addDependency.mutateAsync({
        issueId,
        data: {
          targetIssueId: selectedIssueId,
          dependencyType: selectedType,
        },
      })
      toast.success('Dependency added')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add dependency')
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Add Dependency</h4>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Dependency Type */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Type</label>
        <div className="flex gap-2">
          <TypeButton
            type="blocks"
            label="Blocks"
            icon={ArrowRight}
            selected={selectedType === 'blocks'}
            onClick={() => setSelectedType('blocks')}
          />
          <TypeButton
            type="relates"
            label="Relates to"
            icon={Link}
            selected={selectedType === 'relates'}
            onClick={() => setSelectedType('relates')}
          />
          <TypeButton
            type="duplicates"
            label="Duplicates"
            icon={Copy}
            selected={selectedType === 'duplicates'}
            onClick={() => setSelectedType('duplicates')}
          />
        </div>
      </div>

      {/* Issue Search */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Issue</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background"
            autoFocus
          />
        </div>

        {/* Issue List */}
        <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors',
                  selectedIssueId === issue.id && 'bg-primary/10'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', statusColors[issue.status])} />
                <span className="font-mono text-xs text-muted-foreground">
                  {issue.identifier}
                </span>
                <span className="flex-1 truncate">{issue.title}</span>
                {selectedIssueId === issue.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              {search ? 'No issues found' : 'Type to search issues'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!selectedIssueId || addDependency.isPending}
        >
          {addDependency.isPending ? 'Adding...' : 'Add Dependency'}
        </Button>
      </div>
    </div>
  )
}

interface TypeButtonProps {
  type: DependencyType
  label: string
  icon: React.ElementType
  selected: boolean
  onClick: () => void
}

function TypeButton({ type, label, icon: Icon, selected, onClick }: TypeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'hover:bg-muted'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
