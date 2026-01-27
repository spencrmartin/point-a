import { z } from 'zod'

// Label schema
export const labelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6b7280'),
  projectId: z.string().uuid().nullable(), // null = global label
  createdAt: z.string().datetime(),
})

export type Label = z.infer<typeof labelSchema>

// Create Label
export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  projectId: z.string().uuid().optional(),
})

export type CreateLabel = z.infer<typeof createLabelSchema>

// Update Label
export const updateLabelSchema = createLabelSchema.partial()

export type UpdateLabel = z.infer<typeof updateLabelSchema>
