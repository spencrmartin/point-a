import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dependenciesApi } from '@/lib/api'
import type { CreateDependency } from '@point-a/shared'

// Get dependencies for an issue
export function useDependencies(issueId: string | null) {
  return useQuery({
    queryKey: ['dependencies', issueId],
    queryFn: () => dependenciesApi.get(issueId!),
    enabled: !!issueId,
  })
}

// Check if an issue is blocked
export function useIsBlocked(issueId: string | null) {
  return useQuery({
    queryKey: ['isBlocked', issueId],
    queryFn: () => dependenciesApi.isBlocked(issueId!),
    enabled: !!issueId,
  })
}

// Get blocked issues
export function useBlockedIssues(projectId?: string) {
  return useQuery({
    queryKey: ['blockedIssues', projectId],
    queryFn: () => dependenciesApi.getBlocked(projectId),
  })
}

// Get actionable issues
export function useActionableIssues(projectId?: string, status?: string) {
  return useQuery({
    queryKey: ['actionableIssues', projectId, status],
    queryFn: () => dependenciesApi.getActionable(projectId, status),
  })
}

// Get critical path for a project
export function useCriticalPath(projectId: string | null) {
  return useQuery({
    queryKey: ['criticalPath', projectId],
    queryFn: () => dependenciesApi.getCriticalPath(projectId!),
    enabled: !!projectId,
  })
}

// Add a dependency
export function useAddDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: CreateDependency }) =>
      dependenciesApi.add(issueId, data),
    onSuccess: (_, { issueId, data }) => {
      // Invalidate dependencies for both issues
      queryClient.invalidateQueries({ queryKey: ['dependencies', issueId] })
      queryClient.invalidateQueries({ queryKey: ['dependencies', data.targetIssueId] })
      // Invalidate blocked/actionable queries
      queryClient.invalidateQueries({ queryKey: ['blockedIssues'] })
      queryClient.invalidateQueries({ queryKey: ['actionableIssues'] })
      queryClient.invalidateQueries({ queryKey: ['isBlocked'] })
      queryClient.invalidateQueries({ queryKey: ['criticalPath'] })
    },
  })
}

// Remove a dependency
export function useRemoveDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dependencyId: string) => dependenciesApi.remove(dependencyId),
    onSuccess: () => {
      // Invalidate all dependency-related queries
      queryClient.invalidateQueries({ queryKey: ['dependencies'] })
      queryClient.invalidateQueries({ queryKey: ['blockedIssues'] })
      queryClient.invalidateQueries({ queryKey: ['actionableIssues'] })
      queryClient.invalidateQueries({ queryKey: ['isBlocked'] })
      queryClient.invalidateQueries({ queryKey: ['criticalPath'] })
    },
  })
}
