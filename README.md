# Point A 🎯

A local-first issue tracker with MCP integration for AI assistants. Built for developers who want Linear-like functionality without the cloud dependency.

<img width="1553" height="926" alt="Screenshot 2026-01-27 at 2 35 58 PM" src="https://github.com/user-attachments/assets/5817dda9-ebae-4a7c-97e6-e3c8943c700a" />
<img width="1552" height="926" alt="Screenshot 2026-01-27 at 2 36 13 PM" src="https://github.com/user-attachments/assets/256e66a4-c068-40eb-a6bc-a082cfdf0474" />

## Features

- **Local-first** - Your data stays on your machine (SQLite at `~/.point-a/`)
- **Fast** - Instant search, drag-and-drop, keyboard shortcuts
- **AI-powered** - MCP integration for Goose, Claude, and other AI assistants
- **MCP Apps** - Rich HTML rendering of issues within AI assistants
- **Timeline View** - Visualize task durations with start-to-completion spans
- **Open Source** - MIT licensed, contributions welcome

## Quick Start

### One-Command Setup

```bash
git clone https://github.com/spencrmartin/point-a.git
cd point-a
./setup.sh
```

This will:
1. Install all dependencies (pnpm)
2. Build all packages
3. Run database migrations
4. Configure the Goose MCP extension (if Goose is installed)
5. Create startup scripts

### Start Point A

**Development mode** (with hot reload):
```bash
./dev.sh
```
- Frontend: http://localhost:3000
- API: http://localhost:3001

**Production mode**:
```bash
./start.sh
```
- Frontend: http://localhost:4173
- API: http://localhost:3001

**Stop Point A**:
```bash
./stop.sh
```

## Project Structure

```
point-a/
├── packages/
│   ├── api/          # Hono + Drizzle backend
│   ├── web/          # React + Tailwind frontend
│   ├── mcp/          # MCP server for AI assistants
│   └── shared/       # Shared types & schemas
├── setup.sh          # One-command setup
├── dev.sh            # Development startup
├── start.sh          # Production startup
└── stop.sh           # Stop all services
```

## Data Storage

Point A stores all data locally:

| Item | Location |
|------|----------|
| Database | `~/.point-a/point-a.db` |
| Config | Managed by Goose at `~/.config/goose/config.yaml` |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Hono, Drizzle ORM, better-sqlite3 |
| Validation | Zod |
| State | Zustand, TanStack Query |
| Build | Turborepo, pnpm, Vite |

## MCP Integration

Point A includes an MCP (Model Context Protocol) server that allows AI assistants to interact with your issues.

### Automatic Setup (Goose)

The `setup.sh` script automatically configures Point A as a Goose extension. Just restart Goose after running setup.

### Manual Setup

Add to your AI assistant's MCP configuration:

```yaml
# ~/.config/goose/config.yaml
extensions:
  point-a:
    enabled: true
    type: stdio
    name: Point A
    description: Local-first issue tracker with AI integration
    cmd: node
    args:
      - /path/to/point-a/packages/mcp/dist/index.js
    envs:
      POINTA_DB_PATH: ~/.point-a/point-a.db
    timeout: 300
```

### MCP Apps (Rich Issue Display)

When using Point A with Goose, issues are rendered as rich HTML cards instead of raw JSON:

- **Status badges** with color coding
- **Priority indicators** with icons
- **Type badges** with emojis
- **Due dates** with overdue highlighting
- **Labels** with custom colors
- **Light/dark theme** support

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `create_project` | Create a new project |
| `search_issues` | Search issues by text, status, priority, assignee |
| `get_issue` | Get full issue details (renders as MCP App) |
| `create_issue` | Create a new issue (renders as MCP App) |
| `update_issue` | Update issue fields (renders as MCP App) |
| `delete_issue` | Delete an issue |
| `bulk_update_issues` | Update multiple issues at once |
| `triage_issues` | Get issues needing triage (backlog, no priority) |
| `list_labels` | List all labels |
| `create_label` | Create a new label |
| `list_cycles` | List all cycles/sprints |
| `create_cycle` | Create a new cycle/sprint |
| `get_stats` | Get issue tracker statistics |

## Views

### Board View
Kanban-style board with drag-and-drop between status columns.

### List View
Traditional list view with sorting and filtering.

### Timeline View
Calendar view showing task durations:
- **Duration spans** - Dots showing when tasks were created and completed
- **Color coding** - Status-based colors for quick scanning
- **Multi-week spans** - Tasks spanning multiple weeks are properly visualized

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

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + K` | Quick create issue |
| `⌘ + /` | Search |
| `Esc` | Close modal |

## Troubleshooting

### Issues not loading
If you see "no such column: completed_at" error, run:
```bash
./setup.sh
```
This will run migrations to add any missing columns.

### Port already in use
```bash
./stop.sh
# Then restart
./dev.sh
```

### MCP extension not working
1. Ensure Point A is running (`./dev.sh` or `./start.sh`)
2. Restart Goose to reload extensions
3. Check `~/.config/goose/config.yaml` has the point-a extension

## Development

### Manual Setup (without setup.sh)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run database migrations
pnpm --filter @point-a/api db:migrate

# Start development servers
pnpm dev
```

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Generate New Migration

After modifying `packages/api/src/db/schema.ts`:

```bash
pnpm --filter @point-a/api db:generate
```

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

## License

MIT © Point A Contributors
