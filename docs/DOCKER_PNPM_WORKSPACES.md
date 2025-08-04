# Docker × pnpm workspaces – production pattern
_AIGlossaryPro – August 2025_

---

## 1  Why the runtime image could not find **@aiglossarypro/database**

| Phase | What really happened |
|-------|----------------------|
| **Builder** | `pnpm install` created **workspace links** (`node_modules/@aiglossarypro/database → ../../packages/database`) and we ran `pnpm run -r build`, so `packages/database/dist` existed. |
| **Runtime stage** | We **did not copy** the workspace root files (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`). When we ran `pnpm install --prod`, pnpm treated `apps/api` as a **stand‑alone project**, recreated its own `node_modules`, and replaced the original link with a plain folder that **does not contain `dist/`**. `node` thus crashed at startup. |

---

## 2  Two production‑grade ways to package a single workspace app

### Option A (recommended, smallest image) – `pnpm deploy`

pnpm v8+ ships a purpose‑built command that *materialises* one workspace project together with all of its prod‑only deps.

```Dockerfile
# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /repo
COPY . .
RUN corepack enable && \
    pnpm install --frozen-lockfile && \
    pnpm -r run build                       # builds every workspace package
# create a self‑contained folder for the API
RUN pnpm deploy --filter=./apps/api --prod /tmp/api
# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /tmp/api .              # contains dist/ and node_modules/
ENV NODE_ENV=production
CMD ["node","dist/index-minimal.js"]
```

*Reference – pnpm docs "Working with Docker / Example 2: Build multiple images in a monorepo"* ([pnpm][1])

Result: no workspace links, no post‑install scripts, ~85 MB compressed.

---

### Option B (heavier but familiar) – keep links, copy the whole workspace

If you prefer `pnpm install --prod`:

```Dockerfile
FROM node:20-alpine AS builder
WORKDIR /repo
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm -r run build

FROM node:20-alpine
WORKDIR /repo
# 1. copy **everything the links rely on**
COPY --from=builder /repo/pnpm-workspace.yaml .
COPY --from=builder /repo/pnpm-lock.yaml .
COPY --from=builder /repo/package.json .
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api ./apps/api
# 2. re‑install _only prod deps_ with links intact
RUN corepack enable && pnpm install --prod --frozen-lockfile
WORKDIR /repo/apps/api
CMD ["node","dist/index-minimal.js"]
```

Add `RUN pnpm prune --prod` after install if you want to shave a few megabytes.

---

## 3  Guardrail – make sure CI never ships a stray workspace link

```yaml
# .github/workflows/deploy.yml  (frontend or API job)
- name: Assert node_modules has no dangling links
  run: |
    broken=$(find node_modules -xtype l | wc -l)
    if [ "$broken" -ne 0 ]; then
      echo "::error ::$broken broken symlinks detected"; exit 1
    fi
```

---

## 4  FAQ

| Question                                                                             | Answer                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Can I publish `@aiglossarypro/database` and install it like an external package?** | Yes – set `"publishConfig": { "access": "public" }` (or private registry) and run `pnpm install --config.link-workspace-packages=false`. No links, but you must push a new package version for every change. |
| **Does `pnpm deploy` copy `dist/`?**                                                 | Yes. It copies each workspace package after the `build` script runs, so your compiled JS is included.                                                                                                        |
| **What about devDependencies?**                                                      | `--prod` flag in `pnpm deploy` (or `pnpm install`) prunes them automatically.                                                                                                                                |
| **Why not run `pnpm install` inside `apps/api` only?**                               | You'd still need a registry‑published copy of every internal workspace package, or links will break.                                                                                                         |

---

*Document last updated: 4 Aug 2025 (commit `6c2064b0`).*

[1]: https://pnpm.io/docker "Working with Docker | pnpm"