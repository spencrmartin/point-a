import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checklistApi } from '@/lib/api'
import type { CreateChecklistItem, UpdateChecklistItem } from '@point-a/shared'

// Query key factory
const checklistKeys = {
  all: ['checklist'] as const,
  byIssue: (issueId: string) => [...checklistKeys.all, 'issue', issueId] as const,
  progress: (issueId: string) => [...checklistKeys.all, 'progress', issueId] as const,
}

// Fetch checklist items for an issue
export function useChecklist(issueId: string | null) {
  return useQuery({
    queryKey: checklistKeys.byIssue(issueId || ''),
    queryFn: () => checklistApi.list(issueId!),
    enabled: !!issueId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Fetch checklist progress for an issue
export function useChecklistProgress(issueId: string | null) {
  return useQuery({
    queryKey: checklistKeys.progress(issueId || ''),
    queryFn: () => checklistApi.getProgress(issueId!),
    enabled: !!issueId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Create a checklist item
export function useCreateChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: CreateChecklistItem }) =>
      checklistApi.create(issueId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byIssue(variables.issueId) })
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(variables.issueId) })
    },
  })
}

// Update a checklist item
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, issueId }: { id: string; data: UpdateChecklistItem; issueId: string }) =>
      checklistApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byIssue(variables.issueId) })
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(variables.issueId) })
    },
  })
}

// Toggle a checklist item
export function useToggleChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, issueId }: { id: string; issueId: string }) =>
      checklistApi.toggle(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byIssue(variables.issueId) })
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(variables.issueId) })
    },
  })
}

// Delete a checklist item
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, issueId }: { id: string; issueId: string }) =>
      checklistApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byIssue(variables.issueId) })
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(variables.issueId) })
    },
  })
}

// Reorder checklist items
export function useReorderChecklist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, itemIds }: { issueId: string; itemIds: string[] }) =>
      checklistApi.reorder(issueId, itemIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byIssue(variables.issueId) })
    },
  })
}
