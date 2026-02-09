import { Hono } from 'hono'
import { dependencyService } from '../services/dependency.service.js'

export const dependencyRoutes = new Hono()

// Get dependencies for an issue
dependencyRoutes.get('/issues/:id/dependencies', async (c) => {
  try {
    const id = c.req.param('id')
    const dependencies = await dependencyService.getDependencies(id)
    return c.json({ data: dependencies })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Add a dependency
dependencyRoutes.post('/issues/:id/dependencies', async (c) => {
  try {
    const sourceIssueId = c.req.param('id')
    const body = await c.req.json()
    const { targetIssueId, dependencyType } = body

    if (!targetIssueId || !dependencyType) {
      return c.json({ error: 'targetIssueId and dependencyType are required' }, 400)
    }

    if (!['blocks', 'relates', 'duplicates'].includes(dependencyType)) {
      return c.json({ error: 'Invalid dependencyType. Must be: blocks, relates, or duplicates' }, 400)
    }

    const result = await dependencyService.addDependency(sourceIssueId, targetIssueId, dependencyType)
    return c.json({ data: result }, 201)
  } catch (error: any) {
    if (error.message.includes('circular') || error.message.includes('already exists') || error.message.includes('self')) {
      return c.json({ error: error.message }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})

// Remove a dependency
dependencyRoutes.delete('/dependencies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await dependencyService.removeDependency(id)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Get blocked issues
dependencyRoutes.get('/issues/blocked', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const blockedIssues = await dependencyService.getBlockedIssues(projectId)
    return c.json({ data: blockedIssues })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Get actionable issues (not blocked)
dependencyRoutes.get('/issues/actionable', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const status = c.req.query('status')
    const actionableIssues = await dependencyService.getActionableIssues(projectId, status)
    return c.json({ data: actionableIssues })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Get critical path for a project
dependencyRoutes.get('/projects/:id/critical-path', async (c) => {
  try {
    const projectId = c.req.param('id')
    const criticalPath = await dependencyService.getCriticalPath(projectId)
    return c.json({ data: criticalPath })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// Check if an issue is blocked
dependencyRoutes.get('/issues/:id/is-blocked', async (c) => {
  try {
    const id = c.req.param('id')
    const isBlocked = await dependencyService.isBlocked(id)
    return c.json({ data: { isBlocked } })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
