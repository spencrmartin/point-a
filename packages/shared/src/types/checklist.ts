import { z } from 'zod'

// Checklist item schema
export const checklistItemSchema = z.object({
  id: z.string().min(1),
  issueId: z.string().min(1),
  title: z.string().min(1).max(500),
  completed: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ChecklistItem = z.infer<typeof checklistItemSchema>

// Create checklist item
export const createChecklistItemSchema = z.object({
  title: z.string().min(1).max(500),
  completed: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export type CreateChecklistItem = z.infer<typeof createChecklistItemSchema>

// Update checklist item
export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>

// Reorder checklist items
export const reorderChecklistItemsSchema = z.object({
  itemIds: z.array(z.string()),
})

export type ReorderChecklistItems = z.infer<typeof reorderChecklistItemsSchema>
