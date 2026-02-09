import { db } from '../db/client.js'
import { issueDependencies, issues, projects } from '../db/schema.js'
import { eq, and, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export type DependencyType = 'blocks' | 'relates' | 'duplicates'

export interface DependencyWithIssue {
  id: string
  dependencyType: DependencyType
  issue: {
    id: string
    identifier: string
    title: string
    status: string
    priority: string
  }
}

export interface IssueDependencies {
  blocks: DependencyWithIssue[]
  blockedBy: DependencyWithIssue[]
  relatesTo: DependencyWithIssue[]
  duplicates: DependencyWithIssue[]
}

export const dependencyService = {
  /**
   * Get all dependencies for an issue
   */
  async getDependencies(issueId: string): Promise<IssueDependencies> {
    // Get dependencies where this issue is the source (this issue blocks/relates to/duplicates others)
    const outgoing = await db
      .select({
        id: issueDependencies.id,
        dependencyType: issueDependencies.dependencyType,
        targetIssueId: issueDependencies.targetIssueId,
        issueId: issues.id,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
      })
      .from(issueDependencies)
      .innerJoin(issues, eq(issues.id, issueDependencies.targetIssueId))
      .where(eq(issueDependencies.sourceIssueId, issueId))

    // Get dependencies where this issue is the target (this issue is blocked by/related to/duplicated by others)
    const incoming = await db
      .select({
        id: issueDependencies.id,
        dependencyType: issueDependencies.dependencyType,
        sourceIssueId: issueDependencies.sourceIssueId,
        issueId: issues.id,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
      })
      .from(issueDependencies)
      .innerJoin(issues, eq(issues.id, issueDependencies.sourceIssueId))
      .where(eq(issueDependencies.targetIssueId, issueId))

    const result: IssueDependencies = {
      blocks: [],
      blockedBy: [],
      relatesTo: [],
      duplicates: [],
    }

    // Process outgoing dependencies
    for (const dep of outgoing) {
      const item: DependencyWithIssue = {
        id: dep.id,
        dependencyType: dep.dependencyType as DependencyType,
        issue: {
          id: dep.issueId,
          identifier: dep.identifier,
          title: dep.title,
          status: dep.status,
          priority: dep.priority,
        },
      }

      if (dep.dependencyType === 'blocks') {
        result.blocks.push(item)
      } else if (dep.dependencyType === 'relates') {
        result.relatesTo.push(item)
      } else if (dep.dependencyType === 'duplicates') {
        result.duplicates.push(item)
      }
    }

    // Process incoming dependencies
    for (const dep of incoming) {
      const item: DependencyWithIssue = {
        id: dep.id,
        dependencyType: dep.dependencyType as DependencyType,
        issue: {
          id: dep.issueId,
          identifier: dep.identifier,
          title: dep.title,
          status: dep.status,
          priority: dep.priority,
        },
      }

      if (dep.dependencyType === 'blocks') {
        // If another issue blocks this one, this issue is "blocked by" that issue
        result.blockedBy.push(item)
      } else if (dep.dependencyType === 'relates') {
        // Relations are bidirectional
        result.relatesTo.push(item)
      } else if (dep.dependencyType === 'duplicates') {
        // Duplicates are bidirectional
        result.duplicates.push(item)
      }
    }

    return result
  },

  /**
   * Add a dependency between two issues
   * @throws Error if dependency would create a cycle
   */
  async addDependency(
    sourceIssueId: string,
    targetIssueId: string,
    dependencyType: DependencyType
  ): Promise<{ id: string }> {
    // Prevent self-referencing
    if (sourceIssueId === targetIssueId) {
      throw new Error('Cannot create dependency to self')
    }

    // Check for cycles if this is a "blocks" dependency
    if (dependencyType === 'blocks') {
      const wouldCycle = await this.wouldCreateCycle(sourceIssueId, targetIssueId)
      if (wouldCycle) {
        throw new Error('Cannot create dependency: would create a circular dependency')
      }
    }

    // Check if dependency already exists
    const existing = await db
      .select()
      .from(issueDependencies)
      .where(
        and(
          eq(issueDependencies.sourceIssueId, sourceIssueId),
          eq(issueDependencies.targetIssueId, targetIssueId),
          eq(issueDependencies.dependencyType, dependencyType)
        )
      )

    if (existing.length > 0) {
      throw new Error('Dependency already exists')
    }

    const id = nanoid()
    const now = new Date().toISOString()

    await db.insert(issueDependencies).values({
      id,
      sourceIssueId,
      targetIssueId,
      dependencyType,
      createdAt: now,
    })

    return { id }
  },

  /**
   * Remove a dependency
   */
  async removeDependency(id: string): Promise<void> {
    await db.delete(issueDependencies).where(eq(issueDependencies.id, id))
  },

  /**
   * Check if adding a "blocks" dependency would create a cycle
   * Uses DFS to check if we can reach sourceIssueId from targetIssueId
   */
  async wouldCreateCycle(sourceIssueId: string, targetIssueId: string): Promise<boolean> {
    const visited = new Set<string>()
    const stack = [targetIssueId]

    while (stack.length > 0) {
      const current = stack.pop()!
      
      if (current === sourceIssueId) {
        return true // Found a cycle
      }
      
      if (visited.has(current)) {
        continue
      }
      
      visited.add(current)

      // Get all issues that the current issue blocks
      const blocking = await db
        .select({ targetId: issueDependencies.targetIssueId })
        .from(issueDependencies)
        .where(
          and(
            eq(issueDependencies.sourceIssueId, current),
            eq(issueDependencies.dependencyType, 'blocks')
          )
        )

      for (const dep of blocking) {
        if (!visited.has(dep.targetId)) {
          stack.push(dep.targetId)
        }
      }
    }

    return false
  },

  /**
   * Get all blocked issues (issues that have unresolved blockers)
   */
  async getBlockedIssues(projectId?: string): Promise<Array<{
    issue: { id: string; identifier: string; title: string; status: string; priority: string }
    blockedBy: Array<{ identifier: string; title: string; status: string }>
  }>> {
    // Get all "blocks" dependencies where the blocking issue is not done
    let query = db
      .select({
        blockedIssueId: issueDependencies.targetIssueId,
        blockedIdentifier: sql<string>`blocked.identifier`,
        blockedTitle: sql<string>`blocked.title`,
        blockedStatus: sql<string>`blocked.status`,
        blockedPriority: sql<string>`blocked.priority`,
        blockedProjectId: sql<string>`blocked.project_id`,
        blockerIdentifier: sql<string>`blocker.identifier`,
        blockerTitle: sql<string>`blocker.title`,
        blockerStatus: sql<string>`blocker.status`,
      })
      .from(issueDependencies)
      .innerJoin(
        sql`${issues} as blocked`,
        sql`blocked.id = ${issueDependencies.targetIssueId}`
      )
      .innerJoin(
        sql`${issues} as blocker`,
        sql`blocker.id = ${issueDependencies.sourceIssueId}`
      )
      .where(
        and(
          eq(issueDependencies.dependencyType, 'blocks'),
          sql`blocker.status NOT IN ('done', 'cancelled')`,
          sql`blocked.status NOT IN ('done', 'cancelled')`
        )
      )

    const results = await query

    // Filter by project if specified
    const filtered = projectId 
      ? results.filter(r => r.blockedProjectId === projectId)
      : results

    // Group by blocked issue
    const grouped = new Map<string, {
      issue: { id: string; identifier: string; title: string; status: string; priority: string }
      blockedBy: Array<{ identifier: string; title: string; status: string }>
    }>()

    for (const row of filtered) {
      if (!grouped.has(row.blockedIssueId)) {
        grouped.set(row.blockedIssueId, {
          issue: {
            id: row.blockedIssueId,
            identifier: row.blockedIdentifier,
            title: row.blockedTitle,
            status: row.blockedStatus,
            priority: row.blockedPriority,
          },
          blockedBy: [],
        })
      }
      grouped.get(row.blockedIssueId)!.blockedBy.push({
        identifier: row.blockerIdentifier,
        title: row.blockerTitle,
        status: row.blockerStatus,
      })
    }

    return Array.from(grouped.values())
  },

  /**
   * Get actionable issues (not blocked, not done)
   */
  async getActionableIssues(projectId?: string, status?: string): Promise<Array<{
    id: string
    identifier: string
    title: string
    status: string
    priority: string
    projectId: string
  }>> {
    // Get all blocked issue IDs
    const blockedIssueIds = await db
      .select({ id: issueDependencies.targetIssueId })
      .from(issueDependencies)
      .innerJoin(
        sql`${issues} as blocker`,
        sql`blocker.id = ${issueDependencies.sourceIssueId}`
      )
      .where(
        and(
          eq(issueDependencies.dependencyType, 'blocks'),
          sql`blocker.status NOT IN ('done', 'cancelled')`
        )
      )

    const blockedIds = new Set(blockedIssueIds.map(b => b.id))

    // Build conditions
    const conditions = [
      sql`${issues.status} NOT IN ('done', 'cancelled')`,
    ]

    if (projectId) {
      conditions.push(eq(issues.projectId, projectId))
    }

    if (status) {
      conditions.push(eq(issues.status, status as any))
    }

    // Get all issues that match criteria
    const allIssues = await db
      .select({
        id: issues.id,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        priority: issues.priority,
        projectId: issues.projectId,
      })
      .from(issues)
      .where(and(...conditions))

    // Filter out blocked issues
    return allIssues.filter(issue => !blockedIds.has(issue.id))
  },

  /**
   * Get the critical path for a project (longest dependency chain)
   */
  async getCriticalPath(projectId: string): Promise<{
    path: string[]
    issues: Array<{ id: string; identifier: string; title: string; status: string; estimate: number | null }>
  }> {
    // Get all issues in the project
    const projectIssues = await db
      .select({
        id: issues.id,
        identifier: issues.identifier,
        title: issues.title,
        status: issues.status,
        estimate: issues.estimate,
      })
      .from(issues)
      .where(
        and(
          eq(issues.projectId, projectId),
          sql`${issues.status} NOT IN ('done', 'cancelled')`
        )
      )

    const issueMap = new Map(projectIssues.map(i => [i.id, i]))

    // Get all "blocks" dependencies within this project
    const deps = await db
      .select({
        sourceId: issueDependencies.sourceIssueId,
        targetId: issueDependencies.targetIssueId,
      })
      .from(issueDependencies)
      .where(eq(issueDependencies.dependencyType, 'blocks'))

    // Filter to only include dependencies between project issues
    const projectDeps = deps.filter(
      d => issueMap.has(d.sourceId) && issueMap.has(d.targetId)
    )

    // Build adjacency list (source -> targets it blocks)
    const adjList = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    for (const issue of projectIssues) {
      adjList.set(issue.id, [])
      inDegree.set(issue.id, 0)
    }

    for (const dep of projectDeps) {
      adjList.get(dep.sourceId)?.push(dep.targetId)
      inDegree.set(dep.targetId, (inDegree.get(dep.targetId) || 0) + 1)
    }

    // Find longest path using dynamic programming
    // First, topological sort
    const sorted: string[] = []
    const queue = Array.from(inDegree.entries())
      .filter(([_, deg]) => deg === 0)
      .map(([id]) => id)

    while (queue.length > 0) {
      const current = queue.shift()!
      sorted.push(current)

      for (const neighbor of adjList.get(current) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) {
          queue.push(neighbor)
        }
      }
    }

    // Find longest path
    const dist = new Map<string, number>()
    const prev = new Map<string, string | null>()

    for (const id of sorted) {
      dist.set(id, 0)
      prev.set(id, null)
    }

    for (const u of sorted) {
      for (const v of adjList.get(u) || []) {
        if ((dist.get(v) || 0) < (dist.get(u) || 0) + 1) {
          dist.set(v, (dist.get(u) || 0) + 1)
          prev.set(v, u)
        }
      }
    }

    // Find the end of the longest path
    let maxDist = 0
    let endNode: string | null = null
    for (const [id, d] of dist.entries()) {
      if (d >= maxDist) {
        maxDist = d
        endNode = id
      }
    }

    // Reconstruct path
    const path: string[] = []
    let current = endNode
    while (current) {
      path.unshift(current)
      current = prev.get(current) || null
    }

    // Get issue details for path
    const pathIssues = path.map(id => issueMap.get(id)!).filter(Boolean)

    return {
      path: pathIssues.map(i => i.identifier),
      issues: pathIssues,
    }
  },

  /**
   * Check if an issue is blocked
   */
  async isBlocked(issueId: string): Promise<boolean> {
    const blockers = await db
      .select({ id: issueDependencies.id })
      .from(issueDependencies)
      .innerJoin(
        sql`${issues} as blocker`,
        sql`blocker.id = ${issueDependencies.sourceIssueId}`
      )
      .where(
        and(
          eq(issueDependencies.targetIssueId, issueId),
          eq(issueDependencies.dependencyType, 'blocks'),
          sql`blocker.status NOT IN ('done', 'cancelled')`
        )
      )
      .limit(1)

    return blockers.length > 0
  },
}
