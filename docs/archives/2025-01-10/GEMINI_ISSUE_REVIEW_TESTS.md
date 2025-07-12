# Gemini Issue Review: Test Configuration

**Date**: June 26, 2025
**Issue**: Test suite configuration mismatch - CRITICAL MISTAKE IDENTIFIED

## Summary
The test configuration in `vitest.config.ts` is set up to run Storybook tests in browser mode, which prevents regular unit tests from running. This is NOT because Storybook stories don't exist - they DO exist.

## CRITICAL FINDINGS

### ✅ Storybook Stories EXIST (6 files found):
- `./stories/Button.stories.ts`
- `./stories/Page.stories.ts`
- `./stories/Header.stories.ts`
- `./client/src/components/ui/card.stories.tsx`
- `./client/src/components/ui/button.stories.tsx`
- `./client/src/components/TermCard.stories.tsx`

### ✅ Storybook Configuration is VALID:
- `.storybook/main.ts` - Properly configured
- `.storybook/preview.tsx` - Set up correctly
- `.storybook/vitest.setup.ts` - Test setup exists
- Storybook runs successfully on port 6006

### ❌ The ACTUAL Problem:
1. **vitest.config.ts** is configured ONLY for Storybook browser tests
2. Regular unit tests (api.test.ts, auth.test.ts, etc.) cannot run with this configuration
3. The configuration uses browser mode with Playwright, not suitable for Node.js unit tests
4. Unit tests have missing dependencies (e.g., `supertest` not installed)

## Root Cause
The vitest configuration was set up exclusively for Storybook component testing in browser mode, which blocks regular unit/integration tests from running.

## Solution
Need separate test configurations:
1. **vitest.config.ts** - Keep for Storybook browser tests
2. **vitest.unit.config.ts** - Create for unit/integration tests (already created)
3. Install missing test dependencies like `supertest`

## Verification
- Application is working correctly (verified via health check endpoint)
- CLAUDE.md successfully optimized from 73.2k to 5.9k characters (92% reduction)
- Storybook runs successfully
- Story files are present and valid

## Action Items
1. Update package.json test scripts to use appropriate configs
2. Install missing test dependencies
3. Ensure both Storybook and unit tests can run independently