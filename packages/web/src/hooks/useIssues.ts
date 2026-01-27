import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { issuesApi } from '@/lib/api'
import type { CreateIssue, UpdateIssue, IssueListQuery } from '@point-a/shared'

export function useIssues(query?: Partial<IssueListQuery>) {
  return useQuery({
    queryKey: ['issues', query],
    queryFn: () => issuesApi.list(query),
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching
  })
}

export function useIssue(id: string | null) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => (id ? issuesApi.get(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}

export function useCreateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIssue) => issuesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssue }) =>
      issuesApi.update(id, data),
    // Optimistic update for instant feedback
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] })
      
      const previousIssues = queryClient.getQueryData(['issues', undefined])
      
      queryClient.setQueriesData({ queryKey: ['issues'] }, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((issue: any) =>
            issue.id === id ? { ...issue, ...data } : issue
          ),
        }
      })
      
      return { previousIssues }
    },
    onError: (err, variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(['issues', undefined], context.previousIssues)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      issuesApi.updateStatus(id, status),
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] })
      
      const previousIssues = queryClient.getQueryData(['issues', undefined])
      
      queryClient.setQueriesData({ queryKey: ['issues'] }, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((issue: any) =>
            issue.id === id ? { ...issue, status } : issue
          ),
        }
      })
      
      return { previousIssues }
    },
    onError: (err, variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(['issues', undefined], context.previousIssues)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useDeleteIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => issuesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useBulkUpdateIssues() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, update }: { ids: string[]; update: UpdateIssue }) =>
      issuesApi.bulkUpdate(ids, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}
