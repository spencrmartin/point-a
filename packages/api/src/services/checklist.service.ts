import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { checklistItems, type ChecklistItemRow, type NewChecklistItem } from '../db/schema.js'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

export const checklistService = {
  // Get all checklist items for an issue
  async getByIssueId(issueId: string): Promise<ChecklistItemRow[]> {
    return db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.issueId, issueId))
      .orderBy(asc(checklistItems.sortOrder))
  },

  // Get a single checklist item by ID
  async getById(id: string): Promise<ChecklistItemRow | undefined> {
    const result = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.id, id))
      .limit(1)
    return result[0]
  },

  // Create a new checklist item
  async create(data: { issueId: string; title: string; completed?: boolean; sortOrder?: number }): Promise<ChecklistItemRow> {
    const id = generateId()
    const now = new Date().toISOString()
    
    // Get max sort order if not provided
    let sortOrder = data.sortOrder
    if (sortOrder === undefined) {
      const existing = await this.getByIssueId(data.issueId)
      sortOrder = existing.length > 0 ? Math.max(...existing.map(i => i.sortOrder)) + 1 : 0
    }
    
    const newItem: NewChecklistItem = {
      id,
      issueId: data.issueId,
      title: data.title,
      completed: data.completed ?? false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(checklistItems).values(newItem)
    
    const created = await this.getById(id)
    if (!created) throw new Error('Failed to create checklist item')
    return created
  },

  // Update a checklist item
  async update(id: string, data: { title?: string; completed?: boolean; sortOrder?: number }): Promise<ChecklistItemRow> {
    const now = new Date().toISOString()
    
    const updateData: Partial<NewChecklistItem> = {
      updatedAt: now,
    }
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.completed !== undefined) updateData.completed = data.completed
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    
    await db
      .update(checklistItems)
      .set(updateData)
      .where(eq(checklistItems.id, id))

    const updated = await this.getById(id)
    if (!updated) throw new Error('Checklist item not found')
    return updated
  },

  // Toggle completion status
  async toggle(id: string): Promise<ChecklistItemRow> {
    const item = await this.getById(id)
    if (!item) throw new Error('Checklist item not found')
    
    return this.update(id, { completed: !item.completed })
  },

  // Delete a checklist item
  async delete(id: string): Promise<void> {
    await db.delete(checklistItems).where(eq(checklistItems.id, id))
  },

  // Reorder checklist items
  async reorder(issueId: string, itemIds: string[]): Promise<ChecklistItemRow[]> {
    const now = new Date().toISOString()
    
    // Update sort order for each item
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(checklistItems)
        .set({ sortOrder: i, updatedAt: now })
        .where(eq(checklistItems.id, itemIds[i]))
    }
    
    return this.getByIssueId(issueId)
  },

  // Get progress for an issue (completed/total)
  async getProgress(issueId: string): Promise<{ completed: number; total: number }> {
    const items = await this.getByIssueId(issueId)
    const completed = items.filter(i => i.completed).length
    return { completed, total: items.length }
  },

  // Delete all checklist items for an issue
  async deleteByIssueId(issueId: string): Promise<void> {
    await db.delete(checklistItems).where(eq(checklistItems.issueId, issueId))
  },
}
