import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'

// Read API port from port file (written by API server)
function getApiPort(): number {
  const portFile = path.join(homedir(), '.point-a', 'api.port')
  if (existsSync(portFile)) {
    const port = parseInt(readFileSync(portFile, 'utf-8').trim())
    if (!isNaN(port)) {
      return port
    }
  }
  // Fallback to env var or default
  return parseInt(process.env.VITE_API_PORT || '3001')
}

const apiPort = getApiPort()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        timeout: 30000, // 30 second timeout for slow API startup
        proxyTimeout: 30000,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
      },
    },
  },
})
