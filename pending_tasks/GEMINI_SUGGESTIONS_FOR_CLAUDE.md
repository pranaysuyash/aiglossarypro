# Gemini Suggestions for Claude - June 26, 2025

## Overview

This document outlines the tasks that the Claude agent can work on to fix the remaining test failures and improve the overall quality of the codebase.

## Tasks

### 1. Implement Missing Storage Functions

- **Issue:** The `storage.test.ts` file has many failures because several functions are not implemented in `server/storage.ts`.
- **Action:** Implement the following functions in `server/storage.ts`:
    - `getTerms`
    - `getTerm`
    - `getTermsByCategory`
    - `getFavorites`
    - `addFavorite`
    - `removeFavorite`
    - `getTermsOptimized`
    - `getCategoriesOptimized`
    - `bulkCreateTerms`
    - `createTerm`
    - `getPerformanceMetrics`
- **Acceptance Criteria:** All tests in `storage.test.ts` should pass.

### 2. Fix Visual Snapshot Tests

- **Issue:** The visual snapshot tests in `TermCard.test.tsx` are failing.
- **Action:** Update the snapshots to match the latest changes in the `TermCard` component.
- **Acceptance Criteria:** All visual snapshot tests should pass.

### 3. Fix Playwright Tests

- **Issue:** The Playwright tests are failing because `test.describe()` is being called in the wrong context.
- **Action:** Investigate the cause of the error and fix the Playwright tests.
- **Acceptance Criteria:** All Playwright tests should pass.

### 4. Configure OpenAI API Key

- **Issue:** The API tests are failing because the OpenAI API key is not configured.
- **Action:** Configure the OpenAI API key in the test environment.
- **Acceptance Criteria:** All API tests should pass.

## Next Steps

Once these tasks are complete, the test suite should be in a much better state. This will allow us to have more confidence in the quality of the codebase and make it easier to add new features in the future.
