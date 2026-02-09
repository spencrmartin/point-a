import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '@/stores/useStore'
import { useIssues } from '@/hooks/useIssues'
import { useCriticalPath } from '@/hooks/useDependencies'
import { dependenciesApi } from '@/lib/api'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Route,
  Filter,
  X,
} from 'lucide-react'
import type { IssueWithRelations } from '@point-a/shared'

// Status colors for nodes
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  backlog: { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563' },
  todo: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  in_progress: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  in_review: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
  done: { bg: '#d1fae5', border: '#10b981', text: '#047857' },
  cancelled: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
}

// Priority indicators
const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  none: '#9ca3af',
}

// Custom node component
function IssueNode({ data }: { data: any }) {
  const { setActiveIssueId } = useStore()
  const colors = statusColors[data.status] || statusColors.backlog
  const priorityColor = priorityColors[data.priority] || priorityColors.none

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 shadow-sm cursor-pointer transition-all hover:shadow-md min-w-[180px] max-w-[220px]',
        data.isOnCriticalPath && 'ring-2 ring-red-500 ring-offset-2'
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      onClick={() => setActiveIssueId(data.id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: priorityColor }}
        />
        <span className="text-xs font-mono opacity-70">{data.identifier}</span>
      </div>
      
      <p
        className="text-sm font-medium truncate"
        style={{ color: colors.text }}
        title={data.title}
      >
        {data.title}
      </p>
      
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: colors.border + '20', color: colors.text }}
        >
          {data.status.replace('_', ' ')}
        </span>
        {data.isBlocked && (
          <span className="text-xs text-red-500">🔒 Blocked</span>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  )
}

const nodeTypes = {
  issue: IssueNode,
}

interface DependencyGraphViewProps {
  projectId?: string
}

export function DependencyGraphView({ projectId }: DependencyGraphViewProps) {
  const { currentProjectId, setActiveIssueId } = useStore()
  const effectiveProjectId = projectId || currentProjectId
  
  const { data: issuesData, isLoading: issuesLoading } = useIssues(
    effectiveProjectId ? { projectId: effectiveProjectId } : {}
  )
  const { data: criticalPathData } = useCriticalPath(effectiveProjectId)
  
  const [showCriticalPath, setShowCriticalPath] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [dependencyData, setDependencyData] = useState<Map<string, any>>(new Map())
  const [isLoadingDeps, setIsLoadingDeps] = useState(false)

  const issues = issuesData?.data || []
  const criticalPath = criticalPathData?.data?.path || []

  // Load dependencies for all issues
  const loadDependencies = useCallback(async () => {
    if (issues.length === 0) return
    
    setIsLoadingDeps(true)
    const depsMap = new Map<string, any>()
    
    try {
      await Promise.all(
        issues.map(async (issue) => {
          try {
            const deps = await dependenciesApi.get(issue.id)
            depsMap.set(issue.id, deps.data)
          } catch (e) {
            // Ignore errors for individual issues
          }
        })
      )
      setDependencyData(depsMap)
    } finally {
      setIsLoadingDeps(false)
    }
  }, [issues])

  // Load dependencies when issues change
  useMemo(() => {
    if (issues.length > 0 && dependencyData.size === 0) {
      loadDependencies()
    }
  }, [issues.length])

  // Build nodes and edges from issues and dependencies
  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = []
    const edgeList: Edge[] = []
    const criticalPathSet = new Set(criticalPath)

    // Filter issues
    let filteredIssues = issues
    if (hideCompleted) {
      filteredIssues = issues.filter(i => i.status !== 'done' && i.status !== 'cancelled')
    }

    // Calculate blocked status for each issue
    const blockedIssues = new Set<string>()
    dependencyData.forEach((deps, issueId) => {
      if (deps.blockedBy && deps.blockedBy.length > 0) {
        const hasActiveBlocker = deps.blockedBy.some(
          (b: any) => b.issue.status !== 'done' && b.issue.status !== 'cancelled'
        )
        if (hasActiveBlocker) {
          blockedIssues.add(issueId)
        }
      }
    })

    // Create nodes with hierarchical layout
    // First, build adjacency list for topological sort
    const inDegree = new Map<string, number>()
    const outEdges = new Map<string, string[]>()
    
    filteredIssues.forEach(issue => {
      inDegree.set(issue.id, 0)
      outEdges.set(issue.id, [])
    })

    // Count incoming edges (blocked by relationships)
    filteredIssues.forEach(issue => {
      const deps = dependencyData.get(issue.id)
      if (deps?.blockedBy) {
        deps.blockedBy.forEach((dep: any) => {
          if (filteredIssues.some(i => i.id === dep.issue.id)) {
            inDegree.set(issue.id, (inDegree.get(issue.id) || 0) + 1)
            const edges = outEdges.get(dep.issue.id) || []
            edges.push(issue.id)
            outEdges.set(dep.issue.id, edges)
          }
        })
      }
    })

    // Topological sort to determine levels
    const levels = new Map<string, number>()
    const queue: string[] = []
    
    filteredIssues.forEach(issue => {
      if ((inDegree.get(issue.id) || 0) === 0) {
        queue.push(issue.id)
        levels.set(issue.id, 0)
      }
    })

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentLevel = levels.get(current) || 0
      
      const neighbors = outEdges.get(current) || []
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        
        const newLevel = Math.max(levels.get(neighbor) || 0, currentLevel + 1)
        levels.set(neighbor, newLevel)
        
        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }

    // Handle cycles - assign remaining nodes to level 0
    filteredIssues.forEach(issue => {
      if (!levels.has(issue.id)) {
        levels.set(issue.id, 0)
      }
    })

    // Group by level for positioning
    const levelGroups = new Map<number, IssueWithRelations[]>()
    filteredIssues.forEach(issue => {
      const level = levels.get(issue.id) || 0
      const group = levelGroups.get(level) || []
      group.push(issue)
      levelGroups.set(level, group)
    })

    // Create nodes with positions
    const nodeSpacingX = 250
    const nodeSpacingY = 150

    levelGroups.forEach((levelIssues, level) => {
      const levelWidth = levelIssues.length * nodeSpacingX
      const startX = -levelWidth / 2 + nodeSpacingX / 2

      levelIssues.forEach((issue, index) => {
        const isOnCriticalPath = criticalPathSet.has(issue.identifier)
        
        nodeList.push({
          id: issue.id,
          type: 'issue',
          position: {
            x: startX + index * nodeSpacingX,
            y: level * nodeSpacingY,
          },
          data: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            isOnCriticalPath: showCriticalPath && isOnCriticalPath,
            isBlocked: blockedIssues.has(issue.id),
          },
        })
      })
    })

    // Create edges from dependencies
    filteredIssues.forEach(issue => {
      const deps = dependencyData.get(issue.id)
      if (!deps) return

      // "blocks" edges (source blocks target, so arrow goes source -> target)
      deps.blocks?.forEach((dep: any) => {
        if (filteredIssues.some(i => i.id === dep.issue.id)) {
          const isOnCriticalPath = showCriticalPath && 
            criticalPathSet.has(issue.identifier) && 
            criticalPathSet.has(dep.issue.identifier)

          edgeList.push({
            id: `${issue.id}-blocks-${dep.issue.id}`,
            source: issue.id,
            target: dep.issue.id,
            type: 'smoothstep',
            animated: isOnCriticalPath,
            style: {
              stroke: isOnCriticalPath ? '#ef4444' : '#94a3b8',
              strokeWidth: isOnCriticalPath ? 3 : 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isOnCriticalPath ? '#ef4444' : '#94a3b8',
            },
            label: 'blocks',
            labelStyle: { fontSize: 10, fill: '#64748b' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
          })
        }
      })

      // "relates" edges (bidirectional, so only add one direction)
      deps.relatesTo?.forEach((dep: any) => {
        // Only add edge if this issue's ID is less than the related issue's ID
        // This prevents duplicate edges
        if (issue.id < dep.issue.id && filteredIssues.some(i => i.id === dep.issue.id)) {
          edgeList.push({
            id: `${issue.id}-relates-${dep.issue.id}`,
            source: issue.id,
            target: dep.issue.id,
            type: 'smoothstep',
            style: {
              stroke: '#3b82f6',
              strokeWidth: 1,
              strokeDasharray: '5,5',
            },
            label: 'relates',
            labelStyle: { fontSize: 10, fill: '#3b82f6' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
          })
        }
      })
    })

    return { nodes: nodeList, edges: edgeList }
  }, [issues, dependencyData, criticalPath, showCriticalPath, hideCompleted])

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes)
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges)

  // Update nodes/edges when data changes
  useMemo(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  if (issuesLoading || isLoadingDeps) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dependency graph...</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-lg font-medium">No dependencies found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add dependencies between issues to see the graph
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button
          variant={showCriticalPath ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          className="gap-2"
        >
          <Route className="h-4 w-4" />
          Critical Path
        </Button>
        <Button
          variant={hideCompleted ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHideCompleted(!hideCompleted)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Hide Completed
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg border p-3 text-xs space-y-2">
        <p className="font-medium">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400" />
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500 border-dashed border-t" />
            <span>Relates</span>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" />
              <span>Critical Path</span>
            </div>
          )}
        </div>
        <div className="pt-2 border-t space-y-1">
          {Object.entries(statusColors).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              />
              <span className="capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph */}
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const colors = statusColors[node.data?.status as string] || statusColors.backlog
            return colors.border
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}
