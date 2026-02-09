import { Hono } from 'hono'
import { dependencyService } from '../services/dependency.service.js'

export const dependencyRoutes = new Hono()

// Remove a dependency (not issue-specific, so kept here)
dependencyRoutes.delete('/dependencies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await dependencyService.removeDependency(id)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Get critical path for a project (project-specific, so kept here)
dependencyRoutes.get('/projects/:id/critical-path', async (c) => {
  try {
    const projectId = c.req.param('id')
    const criticalPath = await dependencyService.getCriticalPath(projectId)
    return c.json({ data: criticalPath })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
