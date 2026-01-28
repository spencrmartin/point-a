import { Hono } from 'hono'
import { commentService } from '../services/comment.service.js'

const commentRoutes = new Hono()

// GET /api/issues/:issueId/comments - Get all comments for an issue
commentRoutes.get('/issues/:issueId/comments', async (c) => {
  try {
    const { issueId } = c.req.param()
    const comments = await commentService.getByIssueId(issueId)
    return c.json({ data: comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

// POST /api/issues/:issueId/comments - Create a new comment
commentRoutes.post('/issues/:issueId/comments', async (c) => {
  try {
    const { issueId } = c.req.param()
    const body = await c.req.json()
    
    if (!body.content || typeof body.content !== 'string') {
      return c.json({ error: 'Content is required' }, 400)
    }

    const comment = await commentService.create({
      issueId,
      content: body.content,
      author: body.author,
    })
    
    return c.json({ data: comment }, 201)
  } catch (error) {
    console.error('Error creating comment:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

// PATCH /api/comments/:id - Update a comment
commentRoutes.patch('/comments/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const body = await c.req.json()
    
    if (!body.content || typeof body.content !== 'string') {
      return c.json({ error: 'Content is required' }, 400)
    }

    const comment = await commentService.update(id, { content: body.content })
    return c.json({ data: comment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return c.json({ error: 'Failed to update comment' }, 500)
  }
})

// DELETE /api/comments/:id - Delete a comment
commentRoutes.delete('/comments/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await commentService.delete(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ error: 'Failed to delete comment' }, 500)
  }
})

export { commentRoutes }
