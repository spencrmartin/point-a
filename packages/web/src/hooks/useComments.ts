import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '@/lib/api'
import type { Comment, CreateCommentInput, UpdateCommentInput } from '@point-a/shared'

// Query key factory
const commentKeys = {
  all: ['comments'] as const,
  byIssue: (issueId: string) => [...commentKeys.all, 'issue', issueId] as const,
}

// Fetch comments for an issue
export function useComments(issueId: string | null) {
  return useQuery({
    queryKey: commentKeys.byIssue(issueId || ''),
    queryFn: () => commentsApi.list(issueId!),
    enabled: !!issueId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Create a comment
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: CreateCommentInput }) =>
      commentsApi.create(issueId, data),
    onSuccess: (_, variables) => {
      // Invalidate comments for this issue
      queryClient.invalidateQueries({ queryKey: commentKeys.byIssue(variables.issueId) })
    },
  })
}

// Update a comment
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentInput }) =>
      commentsApi.update(id, data),
    onSuccess: () => {
      // Invalidate all comments (we don't know which issue)
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => {
      // Invalidate all comments
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}
