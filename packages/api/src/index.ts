import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { projects, issues, cycles, labels } from './routes/index.js'
import { commentRoutes } from './routes/comment.routes.js'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
app.route('/api/projects', projects)
app.route('/api/issues', issues)
app.route('/api/cycles', cycles)
app.route('/api/labels', labels)
app.route('/api', commentRoutes)

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found', message: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

const port = parseInt(process.env.PORT || '3001')

console.log(`
  ____       _       _        _    
 |  _ \\ ___ (_)_ __ | |_     / \\   
 | |_) / _ \\| | '_ \\| __|   / _ \\  
 |  __/ (_) | | | | | |_   / ___ \\ 
 |_|   \\___/|_|_| |_|\\__| /_/   \\_\\
                                   
  🚀 Server running at http://localhost:${port}
  📚 API docs at http://localhost:${port}/api
`)

serve({
  fetch: app.fetch,
  port,
})

export default app
