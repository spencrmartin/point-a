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
} from './issue'
export type {
  Issue,
  CreateIssue,
  UpdateIssue,
  IssueWithRelations,
  IssueListQuery,
} from './issue'

// Project types
export {
  projectSchema,
  createProjectSchema,
  updateProjectSchema,
  projectWithStatsSchema,
} from './project'
export type {
  Project,
  CreateProject,
  UpdateProject,
  ProjectWithStats,
} from './project'

// Cycle types
export {
  cycleSchema,
  createCycleSchema,
  updateCycleSchema,
  cycleWithStatsSchema,
} from './cycle'
export type {
  Cycle,
  CreateCycle,
  UpdateCycle,
  CycleWithStats,
} from './cycle'

// Label types
export {
  labelSchema,
  createLabelSchema,
  updateLabelSchema,
} from './label'
export type {
  Label,
  CreateLabel,
  UpdateLabel,
} from './label'

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
