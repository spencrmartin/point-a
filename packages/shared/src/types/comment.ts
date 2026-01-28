import { z } from 'zod'

// Comment schema
export const CommentSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  author: z.string().nullable(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Comment = z.infer<typeof CommentSchema>

// Create comment input
export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  author: z.string().optional(),
})

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>

// Update comment input
export const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
})

export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>
