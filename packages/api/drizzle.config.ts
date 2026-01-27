import { defineConfig } from 'drizzle-kit'
import { homedir } from 'os'
import { join } from 'path'

// Default to ~/.point-a/point-a.db for consistent location
const DEFAULT_DB_PATH = join(homedir(), '.point-a', 'point-a.db')

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.POINTA_DB_PATH || process.env.DATABASE_URL || DEFAULT_DB_PATH,
  },
})
