import { db } from '../db/client'
import { projects, projectCounters, issues } from '../db/schema'
import { eq, sql, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { CreateProject, UpdateProject, ProjectWithStats } from '@point-a/shared'

export const projectService = {
  async list(): Promise<ProjectWithStats[]> {
    const projectList = await db.select().from(projects)
    
    // Get stats for each project
    const projectsWithStats = await Promise.all(
      projectList.map(async (project) => {
        const stats = await db
          .select({
            total: count(),
            open: sql<number>`SUM(CASE WHEN status NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END)`,
            completed: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
          })
          .from(issues)
          .where(eq(issues.projectId, project.id))
        
        return {
          ...project,
          createdAt: project.createdAt!,
          updatedAt: project.updatedAt!,
          issueCount: stats[0]?.total || 0,
          openIssueCount: stats[0]?.open || 0,
          completedIssueCount: stats[0]?.completed || 0,
        }
      })
    )
    
    return projectsWithStats
  },

  async getById(id: string) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id))
    return project || null
  },

  async getByKey(key: string) {
    const [project] = await db.select().from(projects).where(eq(projects.key, key.toUpperCase()))
    return project || null
  },

  async create(data: CreateProject) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [project] = await db.insert(projects).values({
      id,
      key: data.key.toUpperCase(),
      name: data.name,
      description: data.description || null,
      color: data.color || '#6366f1',
      icon: data.icon || '📋',
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Initialize counter for this project
    await db.insert(projectCounters).values({
      projectId: id,
      counter: 0,
    })

    return project
  },

  async update(id: string, data: UpdateProject) {
    const now = new Date().toISOString()
    
    const [project] = await db.update(projects)
      .set({
        ...data,
        key: data.key?.toUpperCase(),
        updatedAt: now,
      })
      .where(eq(projects.id, id))
      .returning()

    return project
  },

  async delete(id: string) {
    await db.delete(projects).where(eq(projects.id, id))
  },

  async getNextIdentifier(projectId: string): Promise<string> {
    const project = await this.getById(projectId)
    if (!project) throw new Error('Project not found')

    // Increment counter
    const [counter] = await db
      .update(projectCounters)
      .set({ counter: sql`counter + 1` })
      .where(eq(projectCounters.projectId, projectId))
      .returning()

    return `${project.key}-${counter.counter}`
  },
}
