import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createLabelSchema, updateLabelSchema } from '@point-a/shared'
import { labelService } from '../services'

const app = new Hono()

// GET /labels - List labels (optionally filtered by project)
app.get('/', async (c) => {
  const projectId = c.req.query('projectId')
  const labels = await labelService.list(projectId)
  return c.json({ data: labels })
})

// GET /labels/:id - Get label by ID
app.get('/:id', async (c) => {
  const label = await labelService.getById(c.req.param('id'))
  if (!label) {
    return c.json({ error: 'Not found', message: 'Label not found' }, 404)
  }
  return c.json({ data: label })
})

// POST /labels - Create label
app.post('/', zValidator('json', createLabelSchema), async (c) => {
  const data = c.req.valid('json')
  const label = await labelService.create(data)
  return c.json({ data: label }, 201)
})

// PATCH /labels/:id - Update label
app.patch('/:id', zValidator('json', updateLabelSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await labelService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Label not found' }, 404)
  }
  
  const label = await labelService.update(id, data)
  return c.json({ data: label })
})

// DELETE /labels/:id - Delete label
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  const existing = await labelService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Label not found' }, 404)
  }
  
  await labelService.delete(id)
  return c.json({ success: true })
})

export default app
