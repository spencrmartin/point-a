// Issue types
export {
  IssueStatus,
  IssuePriority,
  IssueType,
  issueSchema,
  createIssueSchema,
  updateIssueSchema,
  issueWithRelationsSchema,
  issueListQuerySchema,
} from './issue.js'
export type {
  Issue,
  CreateIssue,
  UpdateIssue,
  IssueWithRelations,
  IssueListQuery,
} from './issue.js'

// Project types
export {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  projectWithStatsSchema,
} from './project.js'
export type {
  Project,
  CreateProject,
  UpdateProject,
  ProjectWithStats,
} from './project.js'

// Cycle types
export {
  cycleSchema,
  createCycleSchema,
  updateCycleSchema,
  cycleWithStatsSchema,
} from './cycle.js'
export type {
  Cycle,
  CreateCycle,
  UpdateCycle,
  CycleWithStats,
} from './cycle.js'

// Label types
export {
  labelSchema,
  createLabelSchema,
  updateLabelSchema,
} from './label.js'
export type {
  Label,
  CreateLabel,
  UpdateLabel,
} from './label.js'

// API Response types
export interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    limit?: number
    offset?: number
  }
}

export interface ApiError {
  error: string
  message: string
  details?: Record<string, string[]>
}
