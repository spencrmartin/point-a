import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366f1'),
  icon: text('icon').notNull().default('📋'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// Issues table
export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
  }).notNull().default('backlog'),
  priority: text('priority', {
    enum: ['urgent', 'high', 'medium', 'low', 'none']
  }).notNull().default('none'),
  type: text('type', {
    enum: ['bug', 'feature', 'improvement', 'task', 'epic']
  }).notNull().default('task'),
  assignee: text('assignee'),
  estimate: real('estimate'),
  dueDate: text('due_date'),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  cycleId: text('cycle_id').references(() => cycles.id, { onDelete: 'set null' }),
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// Cycles (Sprints) table
export const cycles = sqliteTable('cycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// Labels table
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// Issue-Label junction table
export const issueLabels = sqliteTable('issue_labels', {
  issueId: text('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
})

// Project counters for generating identifiers
export const projectCounters = sqliteTable('project_counters', {
  projectId: text('project_id').primaryKey().references(() => projects.id, { onDelete: 'cascade' }),
  counter: integer('counter').default(0),
})

// Type exports for use in services
export type ProjectRow = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type IssueRow = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
export type CycleRow = typeof cycles.$inferSelect
export type NewCycle = typeof cycles.$inferInsert
export type LabelRow = typeof labels.$inferSelect
export type NewLabel = typeof labels.$inferInsert
