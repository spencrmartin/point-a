import { z } from 'zod'

// Dependency type enum
export const DependencyType = z.enum(['blocks', 'relates', 'duplicates'])
export type DependencyType = z.infer<typeof DependencyType>

// A dependency with the linked issue info
export const dependencyWithIssueSchema = z.object({
  id: z.string(),
  dependencyType: DependencyType,
  issue: z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    status: z.string(),
    priority: z.string(),
  }),
})

export type DependencyWithIssue = z.infer<typeof dependencyWithIssueSchema>

// All dependencies for an issue
export const issueDependenciesSchema = z.object({
  blocks: z.array(dependencyWithIssueSchema),
  blockedBy: z.array(dependencyWithIssueSchema),
  relatesTo: z.array(dependencyWithIssueSchema),
  duplicates: z.array(dependencyWithIssueSchema),
})

export type IssueDependencies = z.infer<typeof issueDependenciesSchema>

// Create dependency request
export const createDependencySchema = z.object({
  targetIssueId: z.string().min(1),
  dependencyType: DependencyType,
})

export type CreateDependency = z.infer<typeof createDependencySchema>

// Blocked issue with blockers
export const blockedIssueSchema = z.object({
  issue: z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    status: z.string(),
    priority: z.string(),
  }),
  blockedBy: z.array(z.object({
    identifier: z.string(),
    title: z.string(),
    status: z.string(),
  })),
})

export type BlockedIssue = z.infer<typeof blockedIssueSchema>

// Actionable issue (not blocked)
export const actionableIssueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
  projectId: z.string(),
})

export type ActionableIssue = z.infer<typeof actionableIssueSchema>

// Critical path result
export const criticalPathSchema = z.object({
  path: z.array(z.string()), // Array of identifiers
  issues: z.array(z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    status: z.string(),
    estimate: z.number().nullable(),
  })),
})

export type CriticalPath = z.infer<typeof criticalPathSchema>
