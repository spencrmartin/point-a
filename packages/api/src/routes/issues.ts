import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createIssueSchema, updateIssueSchema, issueListQuerySchema } from '@point-a/shared'
import { issueService, projectService } from '../services/index.js'
import { z } from 'zod'

const app = new Hono()

// GET /issues - List issues with filters
app.get('/', zValidator('query', issueListQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const { issues, total } = await issueService.list(query)
  
  return c.json({
    data: issues,
    meta: {
      total,
      limit: query.limit,
      offset: query.offset,
    }
  })
})

// GET /issues/:id - Get issue by ID or identifier
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  
  // Check if it's an identifier (contains dash like PROJ-123)
  const issue = id.includes('-')
    ? await issueService.getByIdentifier(id)
    : await issueService.getById(id)
  
  if (!issue) {
    return c.json({ error: 'Not found', message: 'Issue not found' }, 404)
  }
  
  return c.json({ data: issue })
})

// POST /issues - Create issue
app.post('/', zValidator('json', createIssueSchema), async (c) => {
  const data = c.req.valid('json')
  
  // Verify project exists
  const project = await projectService.getById(data.projectId)
  if (!project) {
    return c.json({ error: 'Bad Request', message: 'Project not found' }, 400)
  }
  
  const issue = await issueService.create(data)
  return c.json({ data: issue }, 201)
})

// PATCH /issues/:id - Update issue
app.patch('/:id', zValidator('json', updateIssueSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await issueService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Issue not found' }, 404)
  }
  
  const issue = await issueService.update(id, data)
  return c.json({ data: issue })
})

// DELETE /issues/:id - Delete issue
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  const existing = await issueService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Issue not found' }, 404)
  }
  
  await issueService.delete(id)
  return c.json({ success: true })
})

// POST /issues/bulk - Bulk update issues
const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  update: updateIssueSchema,
})

app.post('/bulk', zValidator('json', bulkUpdateSchema), async (c) => {
  const { ids, update } = c.req.valid('json')
  const result = await issueService.bulkUpdate(ids, update)
  return c.json({ data: result })
})

// PATCH /issues/:id/status - Quick status update
const statusUpdateSchema = z.object({
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']),
})

app.patch('/:id/status', zValidator('json', statusUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const { status } = c.req.valid('json')
  
  const existing = await issueService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Issue not found' }, 404)
  }
  
  const issue = await issueService.updateStatus(id, status)
  return c.json({ data: issue })
})

export default app
