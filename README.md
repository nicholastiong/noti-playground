# noti-playground

Personal monorepo playground for learning frontend and backend development.

This repository is a pnpm workspace with separate frontend and backend apps.
The first stack keeps frontend setup conventional so backend system design work
can stay focused on service boundaries, API contracts, and operational concerns.

## Structure

```text
noti-playground/
  apps/
    web/   # Next.js frontend
    api/   # Fastify TypeScript backend
  docs/
```

## Apps

- `apps/web`: Next.js frontend using TypeScript, App Router, Tailwind, ESLint,
  and Turbopack.
- `apps/api`: Fastify backend using TypeScript, Zod, and Vitest.

## Development

Use `fnm` from the repository root to select the Node.js version:

```bash
fnm use
```

Install dependencies:

```bash
pnpm install
```

Run both apps:

```bash
pnpm dev
```

Run an app individually:

```bash
pnpm dev:web
pnpm dev:api
```

Default local ports:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Notes

- Shared packages are not included yet. Add `packages/` later only when shared
  code, types, or schemas are needed by more than one app.
- The frontend talks to the backend through an API base URL environment
  variable. Next.js route rewrites are intentionally not used for now.
- CI, databases, Docker, and deployment tooling can be added later around the
  app boundaries in `apps/`.
