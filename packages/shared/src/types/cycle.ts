import { z } from 'zod'

// Cycle (Sprint) schema
export const cycleSchema = z.object({
  id: z.string().min(1), // nanoid format
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  projectId: z.string().min(1),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Cycle = z.infer<typeof cycleSchema>

// Create Cycle
export const createCycleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type CreateCycle = z.infer<typeof createCycleSchema>

// Update Cycle
export const updateCycleSchema = createCycleSchema.partial().omit({ projectId: true })

export type UpdateCycle = z.infer<typeof updateCycleSchema>

// Cycle with stats
export const cycleWithStatsSchema = cycleSchema.extend({
  issueCount: z.number(),
  completedCount: z.number(),
  progress: z.number().min(0).max(100), // percentage
})

export type CycleWithStats = z.infer<typeof cycleWithStatsSchema>
