import { z } from 'zod'

// Enums
export const IssueStatus = z.enum([
  'backlog',
  'todo', 
  'in_progress',
  'in_review',
  'done',
  'cancelled'
])
export type IssueStatus = z.infer<typeof IssueStatus>

export const IssuePriority = z.enum([
  'urgent',
  'high',
  'medium', 
  'low',
  'none'
])
export type IssuePriority = z.infer<typeof IssuePriority>

export const IssueType = z.enum([
  'bug',
  'feature',
  'improvement',
  'task',
  'epic'
])
export type IssueType = z.infer<typeof IssueType>

// Base Issue schema
export const issueSchema = z.object({
  id: z.string().min(1), // nanoid format
  identifier: z.string(), // e.g., "PROJ-123"
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  status: IssueStatus.default('backlog'),
  priority: IssuePriority.default('none'),
  type: IssueType.default('task'),
  assignee: z.string().nullable(),
  estimate: z.number().nullable(),
  dueDate: z.string().nullable(),
  projectId: z.string().min(1),
  cycleId: z.string().nullable(),
  parentId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
})

export type Issue = z.infer<typeof issueSchema>

// Create Issue - what clients send
export const createIssueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: IssueStatus.optional(),
  priority: IssuePriority.optional(),
  type: IssueType.optional(),
  assignee: z.string().optional(),
  estimate: z.number().optional(),
  dueDate: z.string().optional(),
  projectId: z.string().min(1),
  cycleId: z.string().optional(),
  parentId: z.string().optional(),
  labels: z.array(z.string()).optional(),
})

export type CreateIssue = z.infer<typeof createIssueSchema>

// Update Issue - partial updates
export const updateIssueSchema = createIssueSchema.partial()

export type UpdateIssue = z.infer<typeof updateIssueSchema>

// Issue with relations
export const issueWithRelationsSchema = issueSchema.extend({
  project: z.object({
    id: z.string().min(1),
    key: z.string(),
    name: z.string(),
    color: z.string(),
  }).optional(),
  labels: z.array(z.object({
    id: z.string().min(1),
    name: z.string(),
    color: z.string(),
  })).optional(),
  subIssues: z.array(issueSchema).optional(),
})

export type IssueWithRelations = z.infer<typeof issueWithRelationsSchema>

// List query params
export const issueListQuerySchema = z.object({
  status: IssueStatus.optional(),
  priority: IssuePriority.optional(),
  type: IssueType.optional(),
  projectId: z.string().optional(),
  cycleId: z.string().optional(),
  assignee: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.enum(['createdAt', 'updatedAt', 'priority', 'dueDate']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type IssueListQuery = z.infer<typeof issueListQuerySchema>
