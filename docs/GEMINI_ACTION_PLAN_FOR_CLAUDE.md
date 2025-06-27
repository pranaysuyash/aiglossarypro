# AIGlossaryPro - Go-Live Readiness Action Plan

**To:** Claude & Development Team
**From:** Gemini
**Date:** June 26, 2025
**Subject:** Detailed Task Breakdown to Address Pre-Launch Blockers

## 1. Introduction

This document outlines a detailed action plan to address the critical, blocking, and high-risk issues identified in the recent ChatGPT review. The objective is to systematically resolve all impediments to make AIGlossaryPro production-ready.

You are to address each major area of work in a **separate Git branch** as specified. Each task should be treated as a distinct unit of work.

---

## 2. Area 1: Data Loading & Content Availability (CRITICAL BLOCKER)

*   **Branch Name:** `fix/data-loading-pipeline`
*   **Objective:** Resolve the core issue preventing glossary content from being loaded into the application. The application is currently empty and non-functional.

### Task 1.1: Fix Invalid Cache Detection and Force Reprocessing

*   **Problem:** The system incorrectly identifies an empty or invalid cache as "valid," skipping the essential Excel data processing step. This results in zero terms being loaded into the database.
*   **Actionable Steps:**
    1.  **Locate Cache Logic:** Identify the "smart" loader module in the backend codebase that handles cache validation.
    2.  **Implement Robust Validation:** Modify the cache check. It must validate the integrity of the cache (e.g., check for a metadata file or ensure a `term_count` property within the cache is greater than zero).
    3.  **Create a Force Reprocess Endpoint:** Implement a secure admin API endpoint (e.g., `POST /api/admin/import/force-reprocess`) that explicitly deletes the existing cache and re-triggers the entire Excel processing pipeline.
    4.  **Document:** Add internal documentation explaining how to use the new endpoint.
*   **Files to Investigate:** Search for cache-related logic in `server/`, `chunked_excel_processor.ts`, and any related import scripts.

### Task 1.2: Stabilize and Add Logging to Excel Processing

*   **Problem:** The 286MB Excel file is not being processed correctly, leading to 0 terms being imported. The process is opaque and fails silently.
*   **Actionable Steps:**
    1.  **Audit the Processor:** Review the entire data processing flow, from the initial file detection in `/data` to the Python helper script (`python_excel_processor.py`) and the database insertion logic.
    2.  **Add Granular Logging:** Instrument the entire pipeline with detailed logs for each major step: file found, chunk created, chunk processed, data mapped, data inserted.
    3.  **Verify Data Mapping:** Ensure the data extracted from the Excel sheet correctly maps to the Drizzle ORM schema defined in `shared/schema.ts`.
*   **Files to Investigate:** `python_excel_processor.py`, `chunked_excel_processor.ts`, `streaming_excel_processor.ts`.

### Task 1.3: Ensure Database Readiness and Migrations

*   **Problem:** The application will fail to start in a production environment without a configured database and the correct schema.
*   **Actionable Steps:**
    1.  **Update Documentation:** Create a clear section in `README.md` or a new `DEPLOYMENT.md` that lists `DATABASE_URL` as a mandatory environment variable.
    2.  **Document Migration Process:** Provide explicit instructions on how to run database migrations using the `drizzle-kit push` command.
    3.  **Create a Verification Script:** Write a simple script (`check_db_status.ts`) that connects to the database and verifies that the required tables exist.
*   **Files to Investigate:** `drizzle.config.ts`, `shared/schema.ts`, `package.json`.

---

## 3. Area 2: Compilation, Stability, and Refactoring

*   **Branch Name:** `refactor/code-stability`
*   **Objective:** Eliminate build-breaking errors, resolve all TypeScript issues, and complete the unfinished refactoring of the storage layer.

### Task 2.1: Resolve All TypeScript Compilation Errors

*   **Problem:** The codebase has a large number of TypeScript errors ("561 errors" mentioned), with specific blocking errors in admin routes.
*   **Actionable Steps:**
    1.  Run `npx tsc --noEmit` to get a complete list of all current TypeScript errors.
    2.  Prioritize and fix the blocking errors in `server/routes/admin.ts`.
    3.  Work through the remaining errors until `tsc --noEmit` passes cleanly.
    4.  Consolidate the refactored admin routes and remove any old, unused definitions.
*   **Files to Investigate:** `server/routes/admin.ts`, `tsconfig.json`, and new admin route files.

### Task 2.2: Complete and Integrate "EnhancedStorage" Layer

*   **Problem:** The new `enhancedStorage` layer is incomplete and not fully integrated, leaving features non-functional.
*   **Actionable Steps:**
    1.  **Audit Storage Usage:** Identify every instance where `optimizedStorage` and `enhancedStorage` are used.
    2.  **Implement Missing Methods:** Fully implement placeholder methods in `enhancedStorage`, including `getRecentlyViewedTerms` and `getAdminStats`.
    3.  **Refactor API Routes:** Update all relevant API routes to call `enhancedStorage` methods.
    4.  **Verify Feature Functionality:** Test the features that depend on `enhancedStorage`.
*   **Files to Investigate:** Files defining `enhancedStorage` and `optimizedStorage`, and all API route handlers in `server/routes/`.

### Task 2.3: Correct Production Build Configuration

*   **Problem:** A misconfiguration between the Vite build output (`dist/public`) and the Express server's static asset path (`server/public`) will break the frontend in production.
*   **Actionable Steps:**
    1.  Align the output path in `vite.config.ts` and the `express.static()` middleware path in the server setup.
*   **Files to Investigate:** `vite.config.ts`, the main server entry file.

---

## 4. Area 3: Authentication, Security, and Environment

*   **Branch Name:** `feature/production-auth`
*   **Objective:** Harden the authentication system, implement proper role-based access control, and document all required environment variables.

### Task 3.1: Test and Productionize Replit OAuth

*   **Problem:** The primary Replit OIDC authentication is untested and bypassed by a mock auth system.
*   **Actionable Steps:**
    1.  **Document Environment Variables:** Add all Replit-related auth variables to `.env.example`.
    2.  **End-to-End Test Plan:** Create and execute a test plan for the entire OAuth flow.
    3.  **Remove Mock Auth in Production:** Ensure the mock user system is completely disabled when `NODE_ENV=production`.
*   **Files to Investigate:** The auth setup module and session-related middleware.

### Task 3.2: Implement True Admin Role-Based Access Control (RBAC)

*   **Problem:** The admin panel is currently accessible to any authenticated user, a critical security vulnerability.
*   **Actionable Steps:**
    1.  **Backend Enforcement:** Ensure the `requireAdmin` middleware is correctly implemented and applied to all admin API endpoints.
    2.  **Frontend Enforcement:** Modify the `AdminPage` component to determine `hasAccess` based on a verifiable admin role, not just `isAuthenticated`.
    3.  **Testing:** Write tests to confirm that non-admin users receive a 403 Forbidden error on admin routes.
*   **Files to Investigate:** `AdminPage` frontend component, `requireAdmin` backend middleware.

### Task 3.3: Finalize and Document All Production Environment Variables

*   **Problem:** Several required production environment variables are not fully documented.
*   **Actionable Steps:**
    1.  **Audit Codebase:** Scan the code for all `process.env` references.
    2.  **Create Definitive `.env.example`:** Update `.env.example` to include every required and optional variable.
    3.  **Update Host Binding:** Change the server host binding from `127.0.0.1` to `0.0.0.0` for production builds.
*   **Files to Investigate:** `.env.example`, the main server startup file.

---

## 5. Area 4: Frontend and User Interface Readiness

*   **Branch Name:** `fix/frontend-readiness`
*   **Objective:** Ensure the UI is functional, connected to real data, and provides a polished user experience.

### Task 4.1: Connect UI to Data and Add Polish

*   **Problem:** The UI's functionality with real data is unknown. It needs to be verified and polished with proper loading/error states.
*   **Actionable Steps:**
    1.  **Post-Data-Fix Audit:** Once data loading is fixed, conduct a full audit of the application.
    2.  **Verify Data Display:** Check that all pages correctly fetch and render data from the API.
    3.  **Implement Loading/Error States:** Use React Query's `isLoading` and `isError` states to implement loading spinners and user-friendly error messages.
    4.  **Responsive Design QA:** Test the application on various screen sizes and fix any responsive design issues.
*   **Files to Investigate:** The entire `client/src` directory.

### Task 4.2: Implement Missing Backend for Admin UI Features

*   **Problem:** The admin UI has controls (e.g., "Process File" button) that are not connected to any working backend endpoint.
*   **Actionable Steps:**
    1.  **Identify Unimplemented Controls:** Review the `AdminPage` to list all UI elements that lack a functional backend.
    2.  **Implement `local-file` Endpoint:** Prioritize implementing the `POST /api/process/local-file` endpoint to accept a file upload and trigger the import pipeline.
    3.  **Connect and Test:** Connect the frontend button to the new endpoint and test the flow end-to-end.
*   **Files to Investigate:** `AdminPage` component, `server/routes/` directory.
