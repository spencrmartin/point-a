# Contributing to Point A

Thank you for your interest in contributing to Point A! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/point-a.git
   cd point-a
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Set up the database**:
   ```bash
   pnpm --filter @point-a/api db:generate
   pnpm --filter @point-a/api db:migrate
   ```
5. **Start development**:
   ```bash
   pnpm dev
   ```

## Project Structure

```
point-a/
├── packages/
│   ├── api/          # Backend API (Hono + Drizzle)
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic
│   │   │   └── db/         # Database schema & client
│   │   └── package.json
│   │
│   ├── web/          # Frontend (React + Tailwind)
│   │   ├── src/
│   │   │   ├── components/ # React components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── stores/     # Zustand stores
│   │   │   └── lib/        # Utilities
│   │   └── package.json
│   │
│   └── shared/       # Shared types & schemas
│       └── src/
│           └── types/      # Zod schemas & TypeScript types
│
└── docker/           # Docker configuration
```

## Development Workflow

### Branching

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. Create a new branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Test your changes:
   ```bash
   pnpm lint
   pnpm build
   ```

4. Commit with a descriptive message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Pull Requests

1. Push your branch to your fork
2. Open a PR against `develop`
3. Fill out the PR template
4. Wait for review

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define types in `@point-a/shared` for reuse
- Use Zod schemas for validation

### React

- Functional components with hooks
- Use `@/` path alias for imports
- Keep components focused and small

### API

- RESTful endpoints
- Use Zod for request validation
- Return consistent response shapes

### CSS

- Use Tailwind CSS utility classes
- Follow the existing color scheme
- Use CSS variables for theming

## Adding New Features

### Adding a New API Endpoint

1. Define types in `packages/shared/src/types/`
2. Create service in `packages/api/src/services/`
3. Create route in `packages/api/src/routes/`
4. Register route in `packages/api/src/index.ts`

### Adding a New Component

1. Create component in `packages/web/src/components/`
2. Add hooks if needed in `packages/web/src/hooks/`
3. Update store if needed in `packages/web/src/stores/`

### Adding Database Changes

1. Update schema in `packages/api/src/db/schema.ts`
2. Generate migration:
   ```bash
   pnpm --filter @point-a/api db:generate
   ```
3. Run migration:
   ```bash
   pnpm --filter @point-a/api db:migrate
   ```

## Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @point-a/api test
pnpm --filter @point-a/web test
```

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Join our Discord (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
