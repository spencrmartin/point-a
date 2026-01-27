import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createProjectSchema, updateProjectSchema } from '@point-a/shared'
import { projectService } from '../services'

const app = new Hono()

// GET /projects - List all projects
app.get('/', async (c) => {
  const projects = await projectService.list()
  return c.json({ data: projects })
})

// GET /projects/:id - Get project by ID
app.get('/:id', async (c) => {
  const project = await projectService.getById(c.req.param('id'))
  if (!project) {
    return c.json({ error: 'Not found', message: 'Project not found' }, 404)
  }
  return c.json({ data: project })
})

// POST /projects - Create project
app.post('/', zValidator('json', createProjectSchema), async (c) => {
  const data = c.req.valid('json')
  
  // Check if key already exists
  const existing = await projectService.getByKey(data.key)
  if (existing) {
    return c.json({ error: 'Conflict', message: 'Project key already exists' }, 409)
  }
  
  const project = await projectService.create(data)
  return c.json({ data: project }, 201)
})

// PATCH /projects/:id - Update project
app.patch('/:id', zValidator('json', updateProjectSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await projectService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Project not found' }, 404)
  }
  
  // Check if new key conflicts
  if (data.key && data.key.toUpperCase() !== existing.key) {
    const keyExists = await projectService.getByKey(data.key)
    if (keyExists) {
      return c.json({ error: 'Conflict', message: 'Project key already exists' }, 409)
    }
  }
  
  const project = await projectService.update(id, data)
  return c.json({ data: project })
})

// DELETE /projects/:id - Delete project
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  const existing = await projectService.getById(id)
  if (!existing) {
    return c.json({ error: 'Not found', message: 'Project not found' }, 404)
  }
  
  await projectService.delete(id)
  return c.json({ success: true })
})

export default app
