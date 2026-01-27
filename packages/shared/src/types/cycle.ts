import { z } from 'zod'

// Cycle (Sprint) schema
export const cycleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  projectId: z.string().uuid(),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Cycle = z.infer<typeof cycleSchema>

// Create Cycle
export const createCycleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
