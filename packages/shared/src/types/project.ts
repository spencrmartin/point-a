import { z } from 'zod'

// Project schema
export const projectSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(2).max(10).toUpperCase(), // e.g., "PROJ"
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  icon: z.string().default('📋'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Project = z.infer<typeof projectSchema>

// Create Project
export const createProjectSchema = z.object({
  key: z.string().min(2).max(10).transform(s => s.toUpperCase()),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
})

export type CreateProject = z.infer<typeof createProjectSchema>

// Update Project
export const updateProjectSchema = createProjectSchema.partial()

export type UpdateProject = z.infer<typeof updateProjectSchema>

// Project with stats
export const projectWithStatsSchema = projectSchema.extend({
  issueCount: z.number(),
  openIssueCount: z.number(),
  completedIssueCount: z.number(),
})

export type ProjectWithStats = z.infer<typeof projectWithStatsSchema>
