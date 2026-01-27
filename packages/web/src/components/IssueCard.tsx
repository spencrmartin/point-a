import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'
import type { IssueWithRelations } from '@point-a/shared'
import { 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Bug,
  Sparkles,
  Wrench,
  CheckSquare,
  Layers
} from 'lucide-react'

interface IssueCardProps {
  issue: IssueWithRelations
  onClick?: () => void
}

const priorityConfig = {
  urgent: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { icon: ArrowUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: ArrowDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  none: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-400/10' },
}

const typeConfig = {
  bug: { icon: Bug, color: 'text-red-500' },
  feature: { icon: Sparkles, color: 'text-purple-500' },
  improvement: { icon: Wrench, color: 'text-blue-500' },
  task: { icon: CheckSquare, color: 'text-gray-500' },
  epic: { icon: Layers, color: 'text-indigo-500' },
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const { selectedIssueIds, toggleIssueSelection } = useStore()
  const isSelected = selectedIssueIds.has(issue.id)
  
  const priority = priorityConfig[issue.priority || 'none']
  const type = typeConfig[issue.type || 'task']
  const PriorityIcon = priority.icon
  const TypeIcon = type.icon

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-3 bg-card rounded-lg border cursor-pointer transition-all',
        'hover:border-primary/50 hover:shadow-sm',
        isSelected && 'border-primary ring-1 ring-primary'
      )}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          'absolute left-2 top-2 w-4 h-4 rounded border transition-opacity',
          'flex items-center justify-center',
          isSelected ? 'bg-primary border-primary opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        onClick={(e) => {
          e.stopPropagation()
          toggleIssueSelection(issue.id)
        }}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Header: Identifier + Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className={cn('w-4 h-4', type.color)} />
          <span className="text-xs font-medium text-muted-foreground">
            {issue.identifier}
          </span>
        </div>
        <div className={cn('p-1 rounded', priority.bg)}>
          <PriorityIcon className={cn('w-3 h-3', priority.color)} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium line-clamp-2 mb-2">
        {issue.title}
      </h3>

      {/* Footer: Labels + Assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          {issue.labels?.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 text-xs rounded-full"
              style={{ 
                backgroundColor: `${label.color}20`,
                color: label.color 
              }}
            >
              {label.name}
            </span>
          ))}
          {(issue.labels?.length || 0) > 2 && (
            <span className="text-xs text-muted-foreground">
              +{(issue.labels?.length || 0) - 2}
            </span>
          )}
        </div>
        
        {issue.assignee && (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {issue.assignee.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
