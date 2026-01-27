import { db } from '../db/client'
import { labels } from '../db/schema'
import { eq, isNull, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { CreateLabel, UpdateLabel } from '@point-a/shared'

export const labelService = {
  async list(projectId?: string) {
    if (projectId) {
      // Get project-specific labels and global labels
      return db.select().from(labels).where(
        or(eq(labels.projectId, projectId), isNull(labels.projectId))
      )
    }
    return db.select().from(labels)
  },

  async getById(id: string) {
    const [label] = await db.select().from(labels).where(eq(labels.id, id))
    return label || null
  },

  async create(data: CreateLabel) {
    const id = nanoid()
    const now = new Date().toISOString()
    
    const [label] = await db.insert(labels).values({
      id,
      name: data.name,
      color: data.color || '#6b7280',
      projectId: data.projectId || null,
      createdAt: now,
    }).returning()

    return label
  },

  async update(id: string, data: UpdateLabel) {
    const [label] = await db.update(labels)
      .set(data)
      .where(eq(labels.id, id))
      .returning()

    return label
  },

  async delete(id: string) {
    await db.delete(labels).where(eq(labels.id, id))
  },
}
