import { db } from '../db/client.js'
import { cycles, issues } from '../db/schema.js'
import { eq, sql, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { CreateCycle, UpdateCycle, CycleWithStats } from '@point-a/shared'

export const cycleService = {
  async list(projectId?: string): Promise<CycleWithStats[]> {
    const query = projectId 
      ? db.select().from(cycles).where(eq(cycles.projectId, projectId))
      : db.select().from(cycles)
    
    const cycleList = await query

    // Get stats for each cycle
    const cyclesWithStats = await Promise.all(
      cycleList.map(async (cycle) => {
        const stats = await db
          .select({
            total: count(),
            completed: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
          })
          .from(issues)
          .where(eq(issues.cycleId, cycle.id))
        
        const total = stats[0]?.total || 0
        const completed = stats[0]?.completed || 0
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          ...cycle,
          createdAt: cycle.createdAt!,
          updatedAt: cycle.updatedAt!,
          issueCount: total,
          completedCount: completed,
          progress,
        }
      })
    )
    
    return cyclesWithStats
  },

  async getById(id: string): Promise<CycleWithStats | null> {
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, id))
    if (!cycle) return null

    const stats = await db
      .select({
        total: count(),
        completed: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
      })
      .from(issues)
      .where(eq(issues.cycleId, cycle.id))
    
    const total = stats[0]?.total || 0
    const completed = stats[0]?.completed || 0
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      ...cycle,
      createdAt: cycle.createdAt!,
      updatedAt: cycle.updatedAt!,
      issueCount: total,
      completedCount: completed,
      progress,
    }
  },

  async create(data: CreateCycle) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [cycle] = await db.insert(cycles).values({
      id,
      name: data.name,
      description: data.description || null,
      projectId: data.projectId,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return this.getById(id)
  },

  async update(id: string, data: UpdateCycle) {
    const now = new Date().toISOString()
    
    await db.update(cycles)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(cycles.id, id))

    return this.getById(id)
  },

  async delete(id: string) {
    // Unassign issues from this cycle first
    await db.update(issues)
      .set({ cycleId: null })
      .where(eq(issues.cycleId, id))
    
    await db.delete(cycles).where(eq(cycles.id, id))
  },
}
