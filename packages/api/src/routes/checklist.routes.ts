import { Hono } from 'hono'
import { checklistService } from '../services/checklist.service.js'

const checklistRoutes = new Hono()

// GET /api/issues/:issueId/checklist - Get all checklist items for an issue
checklistRoutes.get('/issues/:issueId/checklist', async (c) => {
  try {
    const { issueId } = c.req.param()
    const items = await checklistService.getByIssueId(issueId)
    return c.json({ data: items })
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return c.json({ error: 'Failed to fetch checklist items' }, 500)
  }
})

// GET /api/issues/:issueId/checklist/progress - Get checklist progress
checklistRoutes.get('/issues/:issueId/checklist/progress', async (c) => {
  try {
    const { issueId } = c.req.param()
    const progress = await checklistService.getProgress(issueId)
    return c.json({ data: progress })
  } catch (error) {
    console.error('Error fetching checklist progress:', error)
    return c.json({ error: 'Failed to fetch checklist progress' }, 500)
  }
})

// POST /api/issues/:issueId/checklist - Create a new checklist item
checklistRoutes.post('/issues/:issueId/checklist', async (c) => {
  try {
    const { issueId } = c.req.param()
    const body = await c.req.json()
    
    if (!body.title || typeof body.title !== 'string') {
      return c.json({ error: 'Title is required' }, 400)
    }

    const item = await checklistService.create({
      issueId,
      title: body.title,
      completed: body.completed,
      sortOrder: body.sortOrder,
    })
    
    return c.json({ data: item }, 201)
  } catch (error) {
    console.error('Error creating checklist item:', error)
    return c.json({ error: 'Failed to create checklist item' }, 500)
  }
})

// PATCH /api/checklist/:id - Update a checklist item
checklistRoutes.patch('/checklist/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const body = await c.req.json()

    const item = await checklistService.update(id, {
      title: body.title,
      completed: body.completed,
      sortOrder: body.sortOrder,
    })
    return c.json({ data: item })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return c.json({ error: 'Failed to update checklist item' }, 500)
  }
})

// POST /api/checklist/:id/toggle - Toggle checklist item completion
checklistRoutes.post('/checklist/:id/toggle', async (c) => {
  try {
    const { id } = c.req.param()
    const item = await checklistService.toggle(id)
    return c.json({ data: item })
  } catch (error) {
    console.error('Error toggling checklist item:', error)
    return c.json({ error: 'Failed to toggle checklist item' }, 500)
  }
})

// DELETE /api/checklist/:id - Delete a checklist item
checklistRoutes.delete('/checklist/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await checklistService.delete(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    return c.json({ error: 'Failed to delete checklist item' }, 500)
  }
})

// POST /api/issues/:issueId/checklist/reorder - Reorder checklist items
checklistRoutes.post('/issues/:issueId/checklist/reorder', async (c) => {
  try {
    const { issueId } = c.req.param()
    const body = await c.req.json()
    
    if (!Array.isArray(body.itemIds)) {
      return c.json({ error: 'itemIds array is required' }, 400)
    }

    const items = await checklistService.reorder(issueId, body.itemIds)
    return c.json({ data: items })
  } catch (error) {
    console.error('Error reordering checklist items:', error)
    return c.json({ error: 'Failed to reorder checklist items' }, 500)
  }
})

export { checklistRoutes }
