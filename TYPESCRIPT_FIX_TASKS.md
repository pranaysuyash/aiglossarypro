# TypeScript Fix Tasks for Parallel Agent

## Context
We're trying to deploy to AWS App Runner with Node 20 and ESM modules. The TypeScript compilation is revealing many type errors that were hidden by the bundler. We need these fixed properly while the main deployment continues with a workaround.

## Priority Order Tasks

### 1. Fix Duplicate Request/Response Types (CRITICAL)
**Files affected**: 
- `server/utils/validation.ts`
- `shared/featureFlags.ts`
- Any file importing Request/Response

**Issue**: Multiple definitions of Request/Response types causing conflicts
**Solution**: 
- Use `import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'`
- Remove any global Request/Response declarations
- Ensure only Express types are used

### 2. Fix Database Query Typing Issues
**Files affected**:
- `server/versioningService.ts` (currently has @ts-nocheck)
- Any file using `db()` calls

**Issue**: `db()` is being called as a function but it's not callable
**Solution**: 
- Import `getDb` function properly from `server/db.ts`
- Use `const db = getDb()` instead of `db()`

### 3. Fix Missing Type Declarations
**Files to update**:
- `server/types/missing.d.ts` (already created, needs more declarations)

**Add declarations for**:
- `vite` (if needed for dev)
- Any other missing modules shown in errors

### 4. Fix Type Errors in shared/errorManager.ts
**Issues**:
- `originalError: Error | undefined` not assignable to `Error`
- Unknown type issues

**Solution**: Update the type definition to allow undefined or fix the assignment

### 5. Fix Express Type Usage
**Files affected**:
- `server/utils/validation.ts`
- Any middleware files

**Issue**: Properties like `params`, `query`, `body`, `status` not found on Request/Response
**Solution**: Ensure proper Express types are imported and used

## Guidelines for the Agent

1. **DO NOT** modify these files as they're being worked on:
   - `package.json`
   - `tsconfig.server.json`
   - `Dockerfile*`
   - Any deployment configuration files

2. **DO** create a branch or work in a way that won't conflict with deployment

3. **Focus on** making the TypeScript compilation pass with proper types, not workarounds

4. **Test** each fix by running `npm run build:server` locally

5. **Document** any architectural decisions or type system changes

## Success Criteria
- `npm run build:server` completes without errors
- No `@ts-nocheck` comments remain
- All types are properly defined
- Code is type-safe and maintainable

## Notes
- The codebase uses Drizzle ORM with PostgreSQL
- Authentication can be Firebase or simple JWT
- The app serves both API and frontend (Vite in dev)
- We're targeting Node 20 with ESM modules