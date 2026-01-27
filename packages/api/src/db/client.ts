import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { homedir } from 'os'

// Default to ~/.point-a/point-a.db for consistent location
const DEFAULT_DB_PATH = join(homedir(), '.point-a', 'point-a.db')
const DATABASE_URL = process.env.POINTA_DB_PATH || process.env.DATABASE_URL || DEFAULT_DB_PATH

// Ensure data directory exists
const dbDir = dirname(DATABASE_URL)
if (dbDir && dbDir !== '.' && !existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

// Create SQLite connection
export const sqlite: DatabaseType = new Database(DATABASE_URL)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema })
