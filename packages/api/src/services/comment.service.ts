import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { comments, type CommentRow, type NewComment } from '../db/schema.js'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

export const commentService = {
  // Get all comments for an issue
  async getByIssueId(issueId: string): Promise<CommentRow[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.issueId, issueId))
      .orderBy(desc(comments.createdAt))
  },

  // Get a single comment by ID
  async getById(id: string): Promise<CommentRow | undefined> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)
    return result[0]
  },

  // Create a new comment
  async create(data: { issueId: string; content: string; author?: string }): Promise<CommentRow> {
    const id = generateId()
    const now = new Date().toISOString()
    
    const newComment: NewComment = {
      id,
      issueId: data.issueId,
      content: data.content,
      author: data.author || null,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(comments).values(newComment)
    
    const created = await this.getById(id)
    if (!created) throw new Error('Failed to create comment')
    return created
  },

  // Update a comment
  async update(id: string, data: { content: string }): Promise<CommentRow> {
    const now = new Date().toISOString()
    
    await db
      .update(comments)
      .set({
        content: data.content,
        updatedAt: now,
      })
      .where(eq(comments.id, id))

    const updated = await this.getById(id)
    if (!updated) throw new Error('Comment not found')
    return updated
  },

  // Delete a comment
  async delete(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id))
  },

  // Get comment count for an issue
  async getCountByIssueId(issueId: string): Promise<number> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.issueId, issueId))
    return result.length
  },
}
