import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createServer } from 'net'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { projects, issues, cycles, labels } from './routes/index.js'
import { commentRoutes } from './routes/comment.routes.js'
import { checklistRoutes } from './routes/checklist.routes.js'
import { dependencyRoutes } from './routes/dependency.routes.js'

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
app.route('/api', checklistRoutes)
app.route('/api', dependencyRoutes)

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found', message: 'Route not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

// Find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(startPort, () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : startPort
      server.close(() => resolve(port))
    })
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port in use, try next one
        resolve(findAvailablePort(startPort + 1))
      } else {
        reject(err)
      }
    })
  })
}

// Write port to file so other processes can discover it
function writePortFile(port: number) {
  const portFilePath = join(homedir(), '.point-a', 'api.port')
  writeFileSync(portFilePath, String(port))
}

async function start() {
  const preferredPort = parseInt(process.env.PORT || '3001')
  const port = await findAvailablePort(preferredPort)
  
  // Write port file for discovery
  writePortFile(port)

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
}

start().catch(console.error)

export default app
