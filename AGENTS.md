# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed with `pnpm` workspaces.
- Apps: `apps/api` (Express/Node API), `apps/web` (React + Vite).
- Shared libs: `packages/*` (`shared`, `config`, `auth`, `database`).
- Tests live near code (e.g., `*.test.ts` or `__tests__/`) and in `tests/`.
- Assets/config: `config/`, `tools/`, `scripts/`, and environment files (`.env*`).

## Build, Test, and Development Commands
- Install: `pnpm install` (use Node per `packageManager` in `package.json`).
- Dev (API + Web): `pnpm dev`
  - Only API: `pnpm --filter api dev`
  - Only Web: `pnpm --filter web dev`
- Build all: `pnpm build` (builds packages, API, and Web in order).
- Test (recursive): `pnpm test`
- Coverage report: `pnpm test:coverage`
- E2E/visual tests: `pnpm test:e2e` or `pnpm test:visual`
- Start API from build: `pnpm --filter api start`

## Coding Style & Naming Conventions
- Language: TypeScript across apps and packages.
- Formatting/linting: Biome config (`biome.json`) with 2-space indents, single quotes, semicolons; ESLint used in `apps/web`.
- Suggested formatting: `npx @biomejs/biome check . --apply` (optional).
- Naming: `camelCase` for vars/functions, `PascalCase` for types/components, `kebab-case` for files; tests as `*.test.ts`.

## Testing Guidelines
- Framework: Vitest for unit/integration; Playwright for E2E/visual.
- Typical locations: alongside source (`__tests__` or `*.test.ts`).
- Coverage thresholds target 80% (see `vitest.*.config.*`).
- Run focused suites: `vitest --config vitest.unit.config.ts` or `vitest --ui`.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:` etc. (see `git log`).
- Commits: small, scoped, with imperative subject and brief body when needed.
- PRs: clear description, link related issues, include steps to test; add screenshots for UI changes and logs for API changes.
- Ensure CI tests/build pass before requesting review.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.example` as a template; keep `.env*` local.
- Validate production readiness: `pnpm verify:production` (analytics + config checks).
- For API changes, run `apps/api` dev and confirm key routes and middleware locally before pushing.
