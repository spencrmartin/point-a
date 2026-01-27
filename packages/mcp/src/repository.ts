/**
 * Repository for database operations
 */
import { eq, like, or, sql, and, desc, asc, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { Db } from './db.js'
import * as schema from './schema.js'

export class Repository {
  constructor(private db: Db) {}

  // Projects
  async listProjects() {
    return this.db.select().from(schema.projects)
  }

  async getProject(id: string) {
    const [project] = await this.db.select().from(schema.projects).where(eq(schema.projects.id, id))
    return project || null
  }

  async getProjectByKey(key: string) {
    const [project] = await this.db.select().from(schema.projects).where(eq(schema.projects.key, key.toUpperCase()))
    return project || null
  }

  async createProject(data: { key: string; name: string; description?: string; color?: string; icon?: string }) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [project] = await this.db.insert(schema.projects).values({
      id,
      key: data.key.toUpperCase(),
      name: data.name,
      description: data.description || null,
      color: data.color || '#6366f1',
      icon: data.icon || '📋',
      createdAt: now,
      updatedAt: now,
    }).returning()

    await this.db.insert(schema.projectCounters).values({
      projectId: id,
      counter: 0,
    })

    return project
  }

  // Issues
  async listIssues(filters?: {
    projectId?: string
    status?: string
    priority?: string
    assignee?: string
    search?: string
    limit?: number
  }) {
    const conditions = []
    
    if (filters?.projectId) conditions.push(eq(schema.issues.projectId, filters.projectId))
    if (filters?.status) conditions.push(eq(schema.issues.status, filters.status as any))
    if (filters?.priority) conditions.push(eq(schema.issues.priority, filters.priority as any))
    if (filters?.assignee) conditions.push(eq(schema.issues.assignee, filters.assignee))
    if (filters?.search) {
      conditions.push(
        or(
          like(schema.issues.title, `%${filters.search}%`),
          like(schema.issues.description, `%${filters.search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    return this.db
      .select()
      .from(schema.issues)
      .where(whereClause)
      .orderBy(desc(schema.issues.createdAt))
      .limit(filters?.limit || 50)
  }

  async getIssue(id: string) {
    const [issue] = await this.db.select().from(schema.issues).where(eq(schema.issues.id, id))
    return issue || null
  }

  async getIssueByIdentifier(identifier: string) {
    const [issue] = await this.db.select().from(schema.issues).where(eq(schema.issues.identifier, identifier.toUpperCase()))
    return issue || null
  }

  async createIssue(data: {
    title: string
    description?: string
    projectId: string
    status?: string
    priority?: string
    type?: string
    assignee?: string
    dueDate?: string
    labels?: string[]
  }) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    // Get next identifier
    const project = await this.getProject(data.projectId)
    if (!project) throw new Error('Project not found')

    const [counter] = await this.db
      .update(schema.projectCounters)
      .set({ counter: sql`counter + 1` })
      .where(eq(schema.projectCounters.projectId, data.projectId))
      .returning()

    const identifier = `${project.key}-${counter.counter}`

    const [issue] = await this.db.insert(schema.issues).values({
      id,
      identifier,
      title: data.title,
      description: data.description || null,
      status: (data.status as any) || 'backlog',
      priority: (data.priority as any) || 'none',
      type: (data.type as any) || 'task',
      assignee: data.assignee || null,
      dueDate: data.dueDate || null,
      projectId: data.projectId,
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Add labels
    if (data.labels && data.labels.length > 0) {
      await this.db.insert(schema.issueLabels).values(
        data.labels.map(labelId => ({
          issueId: id,
          labelId,
        }))
      )
    }

    return issue
  }

  async updateIssue(id: string, data: {
    title?: string
    description?: string
    status?: string
    priority?: string
    type?: string
    assignee?: string
    dueDate?: string
  }) {
    const now = new Date().toISOString()
    
    const [issue] = await this.db.update(schema.issues)
      .set({
        ...data,
        status: data.status as any,
        priority: data.priority as any,
        type: data.type as any,
        updatedAt: now,
      })
      .where(eq(schema.issues.id, id))
      .returning()

    return issue
  }

  async deleteIssue(id: string) {
    await this.db.delete(schema.issues).where(eq(schema.issues.id, id))
  }

  async bulkUpdateIssues(ids: string[], data: { status?: string; priority?: string; assignee?: string }) {
    const now = new Date().toISOString()
    
    await this.db.update(schema.issues)
      .set({
        ...data,
        status: data.status as any,
        priority: data.priority as any,
        updatedAt: now,
      })
      .where(inArray(schema.issues.id, ids))

    return { updated: ids.length }
  }

  // Labels
  async listLabels(projectId?: string) {
    if (projectId) {
      return this.db.select().from(schema.labels).where(
        or(eq(schema.labels.projectId, projectId), sql`${schema.labels.projectId} IS NULL`)
      )
    }
    return this.db.select().from(schema.labels)
  }

  async createLabel(data: { name: string; color?: string; projectId?: string }) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [label] = await this.db.insert(schema.labels).values({
      id,
      name: data.name,
      color: data.color || '#6b7280',
      projectId: data.projectId || null,
      createdAt: now,
    }).returning()

    return label
  }

  // Cycles
  async listCycles(projectId?: string) {
    if (projectId) {
      return this.db.select().from(schema.cycles).where(eq(schema.cycles.projectId, projectId))
    }
    return this.db.select().from(schema.cycles)
  }

  async createCycle(data: { name: string; projectId: string; startDate?: string; endDate?: string }) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [cycle] = await this.db.insert(schema.cycles).values({
      id,
      name: data.name,
      projectId: data.projectId,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return cycle
  }

  // Stats
  async getStats() {
    const projects = await this.listProjects()
    const issues = await this.listIssues({ limit: 1000 })
    
    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    const byType: Record<string, number> = {}
    
    for (const issue of issues) {
      byStatus[issue.status || 'backlog'] = (byStatus[issue.status || 'backlog'] || 0) + 1
      byPriority[issue.priority || 'none'] = (byPriority[issue.priority || 'none'] || 0) + 1
      byType[issue.type || 'task'] = (byType[issue.type || 'task'] || 0) + 1
    }

    return {
      totalProjects: projects.length,
      totalIssues: issues.length,
      byStatus,
      byPriority,
      byType,
    }
  }

  // Get issue with labels
  async getIssueWithLabels(id: string) {
    const issue = await this.getIssue(id)
    if (!issue) return null

    const issueLabelsData = await this.db
      .select({ id: schema.labels.id, name: schema.labels.name, color: schema.labels.color })
      .from(schema.labels)
      .innerJoin(schema.issueLabels, eq(schema.labels.id, schema.issueLabels.labelId))
      .where(eq(schema.issueLabels.issueId, id))

    const project = await this.getProject(issue.projectId)

    return {
      ...issue,
      labels: issueLabelsData,
      project,
    }
  }
}
