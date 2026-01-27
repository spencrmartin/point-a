# Point A MCP Server

Model Context Protocol server for Point A issue tracker. Enables AI assistants to create, search, update, and triage issues.

## Installation

```bash
# From the monorepo root
pnpm install
pnpm --filter @point-a/mcp build
```

## Usage

### With Goose

Add to your Goose config (`~/.config/goose/config.yaml`):

```yaml
extensions:
  point-a:
    type: stdio
    cmd: node
    args:
      - /path/to/point-a/packages/mcp/dist/index.js
    env:
      DATABASE_URL: ~/.point-a/point-a.db
```

### With Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "point-a": {
      "command": "node",
      "args": ["/path/to/point-a/packages/mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "~/.point-a/point-a.db"
      }
    }
  }
}
```

## Available Tools

### Project Management

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `create_project` | Create a new project with key, name, color, icon |

### Issue Management

| Tool | Description |
|------|-------------|
| `search_issues` | Search by text, status, priority, assignee |
| `get_issue` | Get issue details by ID or identifier (e.g., "PROJ-123") |
| `create_issue` | Create a new issue |
| `update_issue` | Update issue fields |
| `delete_issue` | Delete an issue |
| `bulk_update_issues` | Update multiple issues at once |
| `triage_issues` | Get backlog issues needing triage |

### Labels & Cycles

| Tool | Description |
|------|-------------|
| `list_labels` | List all labels |
| `create_label` | Create a new label |
| `list_cycles` | List all cycles/sprints |
| `create_cycle` | Create a new cycle |

### Statistics

| Tool | Description |
|------|-------------|
| `get_stats` | Get tracker statistics |

## Resources

| URI | Description |
|-----|-------------|
| `point-a://stats` | Overall statistics |
| `point-a://projects` | All projects |
| `point-a://issues/recent` | Recent issues |
| `ui://point-a/issue` | Issue details MCP App |

## Example Prompts

```
"Create a new project called 'Backend API' with key 'API'"

"Create a bug: Login button not working on mobile"

"Show me all urgent issues"

"Move PROJ-123 to in progress and assign to Alice"

"What issues need triage?"

"Bulk update issues PROJ-1, PROJ-2, PROJ-3 to done"
```

## Development

```bash
# Run in development mode
pnpm --filter @point-a/mcp dev

# Build
pnpm --filter @point-a/mcp build
```
