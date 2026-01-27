# Point A 🎯

A local-first issue tracker with MCP integrations. Built for developers who want Linear-like functionality without the cloud dependency.

## Features

- **Local-first** - Your data stays on your machine (SQLite)
- **Fast** - Instant search, drag-and-drop, keyboard shortcuts
- **Extensible** - MCP integrations for AI, GitHub, and more
- **Open Source** - MIT licensed, contributions welcome

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate database migrations
pnpm --filter @point-a/api db:generate

# Run migrations
pnpm --filter @point-a/api db:migrate

# Start development servers
pnpm dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

## Project Structure

```
point-a/
├── packages/
│   ├── api/          # Hono + Drizzle backend
│   ├── web/          # React + Tailwind frontend
│   ├── mcp/          # MCP server for AI assistants
│   └── shared/       # Shared types & schemas
├── docker/           # Docker configuration
└── turbo.json        # Turborepo config
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Hono, Drizzle ORM, better-sqlite3 |
| Validation | Zod |
| State | Zustand, TanStack Query |
| Build | Turborepo, pnpm, Vite |

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Issues
- `GET /api/issues` - List issues (with filters)
- `POST /api/issues` - Create issue
- `GET /api/issues/:id` - Get issue by ID or identifier
- `PATCH /api/issues/:id` - Update issue
- `PATCH /api/issues/:id/status` - Quick status update
- `DELETE /api/issues/:id` - Delete issue
- `POST /api/issues/bulk` - Bulk update

### Cycles
- `GET /api/cycles` - List cycles
- `POST /api/cycles` - Create cycle
- `GET /api/cycles/:id` - Get cycle
- `PATCH /api/cycles/:id` - Update cycle
- `DELETE /api/cycles/:id` - Delete cycle

### Labels
- `GET /api/labels` - List labels
- `POST /api/labels` - Create label
- `GET /api/labels/:id` - Get label
- `PATCH /api/labels/:id` - Update label
- `DELETE /api/labels/:id` - Delete label

## MCP Integration

Point A includes an MCP (Model Context Protocol) server that allows AI assistants like Goose or Claude to interact with your issues.

### Setup with Goose

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  point-a:
    type: stdio
    cmd: node
    args:
      - /path/to/point-a/packages/mcp/dist/index.js
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `search_issues` | Search issues by text, status, priority |
| `create_issue` | Create a new issue |
| `update_issue` | Update issue fields |
| `bulk_update_issues` | Update multiple issues |
| `triage_issues` | Get issues needing triage |
| `list_projects` | List all projects |
| `create_project` | Create a new project |

See [packages/mcp/README.md](packages/mcp/README.md) for full documentation.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + K` | Quick create issue |
| `⌘ + /` | Search |
| `Esc` | Close modal |

## Docker

```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t point-a .
docker run -p 3000:3000 -v point-a-data:/app/data point-a
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development

```bash
# Run in development mode
pnpm dev

# Run linting
pnpm lint

# Build for production
pnpm build
```

## License

MIT © Point A Contributors
