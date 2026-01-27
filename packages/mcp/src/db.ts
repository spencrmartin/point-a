/**
 * Database connection for MCP server
 * Uses the same schema as the API but connects directly
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Default to ~/.point-a/point-a.db for MCP server
const DEFAULT_DB_PATH = join(homedir(), '.point-a', 'point-a.db')

export function createDb(dbPath?: string) {
  // Check POINTA_DB_PATH first (set by Goose extension config), then DATABASE_URL, then default
  const path = dbPath || process.env.POINTA_DB_PATH || process.env.DATABASE_URL || DEFAULT_DB_PATH
  
  if (!existsSync(path)) {
    console.error(`Database not found at ${path}`)
    console.error('Please run the Point A API first to initialize the database.')
    process.exit(1)
  }

  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>
