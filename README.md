# noti-playground

Personal monorepo playground for learning frontend and backend development.

This repository intentionally starts with a bare folder scaffold. Frameworks,
package manager configuration, CI, databases, and deployment tooling will be
added later as the project grows.

## Structure

```text
noti-playground/
  apps/
    web/
    api/
  docs/
```

## Apps

- `apps/web`: future frontend application.
- `apps/api`: future backend application. The backend language and framework are
  intentionally undecided so this folder can evolve with future experiments.

## Notes

- Shared packages are not included yet. Add `packages/` later only when shared
  code, types, or schemas are needed by more than one app.
- `pnpm` is the preferred package manager when JavaScript or TypeScript
  workspace tooling is introduced.
- CI can be added later around the app boundaries in `apps/`.
