#!/usr/bin/env node
/**
 * Point A MCP Server
 * 
 * Exposes Point A's issue tracking capabilities through the Model Context Protocol.
 * Allows AI assistants to create, search, update, and triage issues.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { apiClient } from './api-client.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// MCP App constants
const MCP_APP_ISSUE_URI = 'ui://point-a/issue'
const MCP_APPS_MIME_TYPE = 'text/html;profile=mcp-app'

// Load HTML template for issue view
let issueViewTemplate = ''
try {
  issueViewTemplate = readFileSync(join(__dirname, '../views/issue_view.html'), 'utf-8')
} catch {
  // Template will be created below
}

// Create the MCP server
const server = new Server(
  {
    name: 'point-a',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'point-a://stats',
        name: 'Issue Tracker Statistics',
        description: 'Overall statistics about projects and issues',
        mimeType: 'application/json',
      },
      {
        uri: 'point-a://projects',
        name: 'All Projects',
        description: 'List of all projects',
        mimeType: 'application/json',
      },
      {
        uri: 'point-a://issues/recent',
        name: 'Recent Issues',
        description: 'Recently created or updated issues',
        mimeType: 'application/json',
      },
      {
        uri: MCP_APP_ISSUE_URI,
        name: 'Issue Details',
        description: 'View details of an issue (MCP App)',
        mimeType: MCP_APPS_MIME_TYPE,
      },
    ],
  }
})

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri

  if (uri === 'point-a://stats') {
    const stats = await apiClient.getStats()
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    }
  }

  if (uri === 'point-a://projects') {
    const projects = await apiClient.listProjects()
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    }
  }

  if (uri === 'point-a://issues/recent') {
    const issues = await apiClient.listIssues({ limit: 10 })
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(issues, null, 2),
        },
      ],
    }
  }

  if (uri === MCP_APP_ISSUE_URI) {
    return {
      contents: [
        {
          uri,
          mimeType: MCP_APPS_MIME_TYPE,
          text: issueViewTemplate,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
          },
        },
      ],
    }
  }

  throw new Error(`Unknown resource: ${uri}`)
})

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_projects',
        description: 'List all projects in Point A',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_project',
        description: 'Create a new project',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Short project key (2-10 chars, e.g., "PROJ")',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description (optional)',
            },
            color: {
              type: 'string',
              description: 'Hex color code (optional, e.g., "#6366f1")',
            },
            icon: {
              type: 'string',
              description: 'Emoji icon (optional, e.g., "📋")',
            },
          },
          required: ['key', 'name'],
        },
      },
      {
        name: 'search_issues',
        description: 'Search for issues by text, status, priority, or assignee',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search text (searches title and description)',
            },
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'],
              description: 'Filter by status',
            },
            priority: {
              type: 'string',
              enum: ['urgent', 'high', 'medium', 'low', 'none'],
              description: 'Filter by priority',
            },
            assignee: {
              type: 'string',
              description: 'Filter by assignee',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 20)',
            },
          },
        },
      },
      {
        name: 'get_issue',
        description: 'Get full details of an issue by ID or identifier (e.g., "PROJ-123")',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID or identifier',
            },
          },
          required: ['id'],
        },
        _meta: {
          ui: {
            resourceUri: MCP_APP_ISSUE_URI,
          },
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue in a project',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Issue title',
            },
            description: {
              type: 'string',
              description: 'Issue description (supports markdown)',
            },
            projectId: {
              type: 'string',
              description: 'Project ID to create the issue in',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'],
              description: 'Initial status (default: backlog)',
            },
            priority: {
              type: 'string',
              enum: ['urgent', 'high', 'medium', 'low', 'none'],
              description: 'Priority level (default: none)',
            },
            type: {
              type: 'string',
              enum: ['bug', 'feature', 'improvement', 'task', 'epic'],
              description: 'Issue type (default: task)',
            },
            assignee: {
              type: 'string',
              description: 'Assignee name',
            },
            dueDate: {
              type: 'string',
              description: 'Due date (ISO 8601 format)',
            },
          },
          required: ['title', 'projectId'],
        },
        _meta: {
          ui: {
            resourceUri: MCP_APP_ISSUE_URI,
          },
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID',
            },
            title: {
              type: 'string',
              description: 'New title',
            },
            description: {
              type: 'string',
              description: 'New description',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'],
              description: 'New status',
            },
            priority: {
              type: 'string',
              enum: ['urgent', 'high', 'medium', 'low', 'none'],
              description: 'New priority',
            },
            type: {
              type: 'string',
              enum: ['bug', 'feature', 'improvement', 'task', 'epic'],
              description: 'New type',
            },
            assignee: {
              type: 'string',
              description: 'New assignee',
            },
            dueDate: {
              type: 'string',
              description: 'New due date',
            },
          },
          required: ['id'],
        },
        _meta: {
          ui: {
            resourceUri: MCP_APP_ISSUE_URI,
          },
        },
      },
      {
        name: 'delete_issue',
        description: 'Delete an issue',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID to delete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'bulk_update_issues',
        description: 'Update multiple issues at once (useful for triage)',
        inputSchema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of issue IDs to update',
            },
            status: {
              type: 'string',
              enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'],
              description: 'New status for all issues',
            },
            priority: {
              type: 'string',
              enum: ['urgent', 'high', 'medium', 'low', 'none'],
              description: 'New priority for all issues',
            },
            assignee: {
              type: 'string',
              description: 'New assignee for all issues',
            },
          },
          required: ['ids'],
        },
      },
      {
        name: 'triage_issues',
        description: 'Get issues that need triage (backlog with no priority)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 20)',
            },
          },
        },
      },
      {
        name: 'list_labels',
        description: 'List all labels, optionally filtered by project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
          },
        },
      },
      {
        name: 'create_label',
        description: 'Create a new label',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Label name',
            },
            color: {
              type: 'string',
              description: 'Hex color code (e.g., "#ef4444")',
            },
            projectId: {
              type: 'string',
              description: 'Project ID (optional, null for global label)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_cycles',
        description: 'List all cycles/sprints, optionally filtered by project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
          },
        },
      },
      {
        name: 'create_cycle',
        description: 'Create a new cycle/sprint',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Cycle name (e.g., "Sprint 1")',
            },
            projectId: {
              type: 'string',
              description: 'Project ID',
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO 8601)',
            },
            endDate: {
              type: 'string',
              description: 'End date (ISO 8601)',
            },
          },
          required: ['name', 'projectId'],
        },
      },
      {
        name: 'get_stats',
        description: 'Get statistics about the issue tracker',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'list_projects': {
        const projects = await apiClient.listProjects()
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: projects.length, projects }, null, 2),
            },
          ],
        }
      }

      case 'create_project': {
        const { key, name: projectName, description, color, icon } = args as any
        
        // Check if key exists
        const existing = await apiClient.getProjectByKey(key)
        if (existing) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Project key "${key}" already exists` }) }],
            isError: true,
          }
        }

        const project = await apiClient.createProject({ key, name: projectName, description, color, icon })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, project }, null, 2),
            },
          ],
        }
      }

      case 'search_issues': {
        const { query, projectId, status, priority, assignee, limit } = args as any
        const issues = await apiClient.listIssues({
          search: query,
          projectId,
          status,
          priority,
          assignee,
          limit: limit || 20,
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: issues.length, issues }, null, 2),
            },
          ],
        }
      }

      case 'get_issue': {
        const { id } = args as any
        
        // API handles both ID and identifier
        const issue = await apiClient.getIssue(id)

        if (!issue) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Issue "${id}" not found` }) }],
            isError: true,
          }
        }

        // Get project info for the structured content
        const project = await apiClient.getProject(issue.projectId)

        return {
          content: [
            {
              type: 'text',
              text: 'Here is the issue.',
            },
          ],
          structuredContent: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            type: issue.type,
            assignee: issue.assignee,
            dueDate: issue.dueDate,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            labels: issue.labels || [],
            project: project ? { key: project.key, name: project.name } : null,
          },
        }
      }

      case 'create_issue': {
        const { title, description, projectId, status, priority, type, assignee, dueDate } = args as any
        
        // Verify project exists
        const project = await apiClient.getProject(projectId)
        if (!project) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Project "${projectId}" not found` }) }],
            isError: true,
          }
        }

        const issue = await apiClient.createIssue({
          title,
          description,
          projectId,
          status,
          priority,
          type,
          assignee,
          dueDate,
        })

        return {
          content: [
            {
              type: 'text',
              text: 'Successfully created the issue.',
            },
          ],
          structuredContent: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            type: issue.type,
            assignee: issue.assignee,
            dueDate: issue.dueDate,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            labels: [],
            project: { key: project.key, name: project.name },
          },
        }
      }

      case 'update_issue': {
        const { id, ...updates } = args as any
        
        const existing = await apiClient.getIssue(id)
        if (!existing) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Issue "${id}" not found` }) }],
            isError: true,
          }
        }

        const issue = await apiClient.updateIssue(id, updates)
        const project = await apiClient.getProject(issue.projectId)

        return {
          content: [
            {
              type: 'text',
              text: 'Successfully updated the issue.',
            },
          ],
          structuredContent: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            type: issue.type,
            assignee: issue.assignee,
            dueDate: issue.dueDate,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            labels: issue.labels || [],
            project: project ? { key: project.key, name: project.name } : null,
          },
        }
      }

      case 'delete_issue': {
        const { id } = args as any
        
        const existing = await apiClient.getIssue(id)
        if (!existing) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Issue "${id}" not found` }) }],
            isError: true,
          }
        }

        await apiClient.deleteIssue(id)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, deleted: id }),
            },
          ],
        }
      }

      case 'bulk_update_issues': {
        const { ids, status, priority, assignee } = args as any
        const result = await apiClient.bulkUpdateIssues(ids, { status, priority, assignee })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, ...result }),
            },
          ],
        }
      }

      case 'triage_issues': {
        const { projectId, limit } = args as any
        const issues = await apiClient.listIssues({
          projectId,
          status: 'backlog',
          priority: 'none',
          limit: limit || 20,
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: `Found ${issues.length} issues needing triage`,
                count: issues.length,
                issues,
              }, null, 2),
            },
          ],
        }
      }

      case 'list_labels': {
        const { projectId } = args as any
        const labels = await apiClient.listLabels(projectId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: labels.length, labels }, null, 2),
            },
          ],
        }
      }

      case 'create_label': {
        const { name: labelName, color, projectId } = args as any
        const label = await apiClient.createLabel({ name: labelName, color, projectId })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, label }, null, 2),
            },
          ],
        }
      }

      case 'list_cycles': {
        const { projectId } = args as any
        const cycles = await apiClient.listCycles(projectId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: cycles.length, cycles }, null, 2),
            },
          ],
        }
      }

      case 'create_cycle': {
        const { name: cycleName, projectId, startDate, endDate } = args as any
        
        const project = await apiClient.getProject(projectId)
        if (!project) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Project "${projectId}" not found` }) }],
            isError: true,
          }
        }

        const cycle = await apiClient.createCycle({ name: cycleName, projectId, startDate, endDate })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, cycle }, null, 2),
            },
          ],
        }
      }

      case 'get_stats': {
        const stats = await apiClient.getStats()
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
          isError: true,
        }
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: String(error) }),
        },
      ],
      isError: true,
    }
  }
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Point A MCP server running on stdio')
}

main().catch(console.error)
