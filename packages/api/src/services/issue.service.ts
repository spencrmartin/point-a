import { db } from '../db/client.js'
import { issues, issueLabels, labels, projects } from '../db/schema.js'
import { eq, and, like, desc, asc, sql, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { projectService } from './project.service.js'
import type { CreateIssue, UpdateIssue, IssueListQuery, IssueWithRelations } from '@point-a/shared'

export const issueService = {
  async list(query: IssueListQuery): Promise<{ issues: IssueWithRelations[]; total: number }> {
    const conditions = []
    
    if (query.status) conditions.push(eq(issues.status, query.status))
    if (query.priority) conditions.push(eq(issues.priority, query.priority))
    if (query.type) conditions.push(eq(issues.type, query.type))
    if (query.projectId) conditions.push(eq(issues.projectId, query.projectId))
    if (query.cycleId) conditions.push(eq(issues.cycleId, query.cycleId))
    if (query.assignee) conditions.push(eq(issues.assignee, query.assignee))
    if (query.search) {
      conditions.push(
        sql`(${issues.title} LIKE ${'%' + query.search + '%'} OR ${issues.description} LIKE ${'%' + query.search + '%'})`
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(issues)
      .where(whereClause)

    // Get paginated results with ordering
    const orderColumn = {
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      priority: issues.priority,
      dueDate: issues.dueDate,
    }[query.orderBy || 'createdAt']

    const orderFn = query.order === 'asc' ? asc : desc

    const issueList = await db
      .select()
      .from(issues)
      .where(whereClause)
      .orderBy(orderFn(orderColumn!))
      .limit(query.limit || 50)
      .offset(query.offset || 0)

    // Fetch relations for each issue
    const issuesWithRelations = await Promise.all(
      issueList.map(async (issue) => {
        const [project] = await db
          .select({ id: projects.id, key: projects.key, name: projects.name, color: projects.color })
          .from(projects)
          .where(eq(projects.id, issue.projectId))

        const issueLabelsData = await db
          .select({ id: labels.id, name: labels.name, color: labels.color })
          .from(labels)
          .innerJoin(issueLabels, eq(labels.id, issueLabels.labelId))
          .where(eq(issueLabels.issueId, issue.id))

        return {
          ...issue,
          createdAt: issue.createdAt!,
          updatedAt: issue.updatedAt!,
          project: project || undefined,
          labels: issueLabelsData,
        }
      })
    )

    return { issues: issuesWithRelations, total }
  },

  async getById(id: string): Promise<IssueWithRelations | null> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id))
    if (!issue) return null

    const [project] = await db
      .select({ id: projects.id, key: projects.key, name: projects.name, color: projects.color })
      .from(projects)
      .where(eq(projects.id, issue.projectId))

    const issueLabelsData = await db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(labels)
      .innerJoin(issueLabels, eq(labels.id, issueLabels.labelId))
      .where(eq(issueLabels.issueId, issue.id))

    // Get sub-issues
    const subIssues = await db
      .select()
      .from(issues)
      .where(eq(issues.parentId, id))

    return {
      ...issue,
      createdAt: issue.createdAt!,
      updatedAt: issue.updatedAt!,
      project: project || undefined,
      labels: issueLabelsData,
      subIssues: subIssues.map(s => ({
        ...s,
        createdAt: s.createdAt!,
        updatedAt: s.updatedAt!,
      })),
    }
  },

  async getByIdentifier(identifier: string): Promise<IssueWithRelations | null> {
    const [issue] = await db.select().from(issues).where(eq(issues.identifier, identifier.toUpperCase()))
    if (!issue) return null
    return this.getById(issue.id)
  },

  async create(data: CreateIssue) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    // Generate identifier
    const identifier = await projectService.getNextIdentifier(data.projectId)

    const [issue] = await db.insert(issues).values({
      id,
      identifier,
      title: data.title,
      description: data.description || null,
      status: data.status || 'backlog',
      priority: data.priority || 'none',
      type: data.type || 'task',
      assignee: data.assignee || null,
      estimate: data.estimate || null,
      dueDate: data.dueDate || null,
      projectId: data.projectId,
      cycleId: data.cycleId || null,
      parentId: data.parentId || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Add labels if provided
    if (data.labels && data.labels.length > 0) {
      await db.insert(issueLabels).values(
        data.labels.map(labelId => ({
          issueId: id,
          labelId,
        }))
      )
    }

    return this.getById(id)
  },

  async update(id: string, data: UpdateIssue) {
    const now = new Date().toISOString()
    
    // Auto-set completedAt when status changes to done/cancelled
    let completedAt: string | null | undefined = undefined
    if (data.status === 'done' || data.status === 'cancelled') {
      // Get current issue to check if already completed
      const [current] = await db.select().from(issues).where(eq(issues.id, id))
      if (current && !current.completedAt) {
        completedAt = now
      }
    } else if (data.status && data.status !== 'done' && data.status !== 'cancelled') {
      // Clear completedAt if moving back to an active status
      completedAt = null
    }
    
    const [issue] = await db.update(issues)
      .set({
        ...data,
        updatedAt: now,
        ...(completedAt !== undefined ? { completedAt } : {}),
      })
      .where(eq(issues.id, id))
      .returning()

    // Update labels if provided
    if (data.labels !== undefined) {
      // Remove existing labels
      await db.delete(issueLabels).where(eq(issueLabels.issueId, id))
      
      // Add new labels
      if (data.labels.length > 0) {
        await db.insert(issueLabels).values(
          data.labels.map(labelId => ({
            issueId: id,
            labelId,
          }))
        )
      }
    }

    return this.getById(id)
  },

  async delete(id: string) {
    await db.delete(issues).where(eq(issues.id, id))
  },

  async bulkUpdate(ids: string[], data: UpdateIssue) {
    const now = new Date().toISOString()
    
    // Auto-set completedAt for bulk status updates
    let completedAt: string | null | undefined = undefined
    if (data.status === 'done' || data.status === 'cancelled') {
      completedAt = now
    } else if (data.status && data.status !== 'done' && data.status !== 'cancelled') {
      completedAt = null
    }
    
    await db.update(issues)
      .set({
        ...data,
        updatedAt: now,
        ...(completedAt !== undefined ? { completedAt } : {}),
      })
      .where(inArray(issues.id, ids))

    return { updated: ids.length }
  },

  async updateStatus(id: string, status: string) {
    return this.update(id, { status: status as any })
  },
}
