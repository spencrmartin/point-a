import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCycleSchema, updateCycleSchema } from '@point-a/shared'
import { cycleService, projectService } from '../services'
import { z } from 'zod'

const app = new Hono()

// GET /cycles - List cycles (optionally filtered by project)
app.get('/', async (c) => {
  const projectId = c.req.query('projectId')
  const cycles = await cycleService.list(projectId)
  return c.json({ data: cycles })
})

// GET /cycles/:id - Get cycle by ID
app.get('/:id', async (c) => {
  const cycle = await cycleService.getById(c.req.param('id'))
  if (!cycle) {
    return c.json({ error: 'Not found', message: 'Cycle not found' }, 404)
  }
  return c.json({ data: cycle })
})

// POST /cycles - Create cycle
app.post('/', zValidator('json', createCycleSchema), async (c) => {
  const data = c.req.valid('json')
  
  // Verify project exists
  const project = await projectService.getById(data.projectId)
  if (!project) {
    return c.json({ error: 'Bad Request', message: 'Project not found' }, 400)
  }
  
  const cycle = await cycleService.create(data)
  return c.json({ data: cycle }, 201)
})

// PATCH /cycles/:id - Update cycle
app.patch('/:id', zValidator('json', updateCycleSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await cycleService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Cycle not found' }, 404)
  }
  
  const cycle = await cycleService.update(id, data)
  return c.json({ data: cycle })
})

// DELETE /cycles/:id - Delete cycle
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  const existing = await cycleService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Cycle not found' }, 404)
  }
  
  await cycleService.delete(id)
  return c.json({ success: true })
})

export default app
