# AI-Driven End-to-End Audit Workflow

## 1. Objective

To establish a single, comprehensive audit workflow that simulates a complete user journey, tests all interactive components, and captures detailed visual artifacts (screenshots and videos). These artifacts will then be analyzed by an AI to produce a structured report of UI/UX issues, visual bugs, and functional inconsistencies, which can then be used by an AI agent to implement fixes.

This workflow unifies the project's existing functional, component, and AI-analysis capabilities into one powerful, end-to-end process.

## 2. Prerequisite: Enforcing Full Storybook Coverage

Before the end-to-end audit can be considered truly comprehensive, we must first ensure that all UI components are represented in Storybook. Without a story, a component is invisible to our component-level visual testing tools.

To address this, we will implement an automated **Storybook Coverage Validation** script.

### Storybook Coverage Validation Script (`scripts/validate-storybook-coverage.ts`)

This script will perform the following actions:

1.  **Scan for Components:** Recursively scan the `client/src/components` directory to build a list of all component files (e.g., `Button.tsx`, `Card.tsx`).
2.  **Scan for Stories:** Recursively scan the project for all story files (e.g., `*.stories.tsx`).
3.  **Compare and Report:** Compare the two lists and generate a report of any components that are missing a corresponding Storybook file.
4.  **CI/CD Integration:** This script must be added to the CI/CD pipeline and configured to fail the build if any component is found to be missing a story, thus enforcing 100% Storybook coverage for all components.

This validation step guarantees that our visual testing has no blind spots and provides a solid foundation for all subsequent testing phases.

## 3. Proposed Workflow

This workflow will be orchestrated by a new script, for example `scripts/run-ai-driven-audit.ts`.

### Step 1: Execute Deep Functional & Interaction Tests

*   **Action:** The orchestrator will execute an enhanced version of the `comprehensive-functional-audit.ts` script.
*   **Enhancements:**
    *   **Capture Everything:** The script will be modified to capture a screenshot after **every significant user action** (e.g., a `click`, `fill`, `press`, or `selectOption` call). This ensures a visual record of the application's state before and after each key event.
    *   **Record Video:** Playwright's video recording feature will be enabled to capture a complete video of each user flow (e.g., the entire admin login, search/filter process, and content generation journey).
    *   **Test All Components In-Context:** The script will be extended to not only navigate pages but also to systematically interact with every major component it finds on a page. This includes, but is not limited to:
        *   Clicking every button.
        *   Opening every dropdown/modal.
        *   Applying all search and filter options.
        *   Filling out and submitting all forms.
        *   Scrolling through entire pages and sections to test for lazy-loading and layout shifts.
    *   **Run Accessibility Scans:** At each key interaction step, an `axe-core` accessibility scan will be executed to catch violations as they appear, directly fulfilling Pillar 2 of the PRD.
    *   **Cover All User Flows:** This explicitly includes executing the complete authentication and usage flows for each test user type (`free`, `premium`, and `admin`) as a prerequisite for testing role-specific features.
*   **Output:** A rich set of screenshots, videos, and accessibility scan results from realistic user journeys, stored in a timestamped directory.

### Step 2: Consolidate Artifacts

*   **Action:** All visual artifacts (screenshots, videos) from Step 1 are collected and organized in a single directory: `reports/ai-driven-audit/{timestamp}/`.
*   **Output:** A complete, organized collection of visual evidence ready for analysis.

### Step 3: Generate AI Analysis Prompt

*   **Action:** A master analysis prompt (`claude-analysis-prompt.md`) will be dynamically generated. This prompt will instruct an AI (like Claude) to act as an expert QA engineer and UI/UX designer.
*   **Prompt Content:** The prompt will instruct the AI to:
    *   Review all screenshots and videos.
    *   Identify visual bugs, layout inconsistencies, and responsive design issues.
    *   Analyze for UX anti-patterns and suggest improvements.
    *   Check for accessibility issues visible in the captures (e.g., poor contrast, missing focus states).
    *   Cross-reference the visual evidence with the functional test logs to identify discrepancies.
*   **Output:** A comprehensive, context-rich prompt ready for the AI.

### Step 4: Execute AI Analysis

*   **Action:** The orchestrator script will programmatically send the prompt and the collection of artifacts to a powerful multimodal AI model.
*   **Output:** The AI's raw analysis.

### Step 5: Generate Structured Audit Report

*   **Action:** The AI's raw analysis will be parsed and structured into a final, actionable JSON or Markdown report (`audit-findings.json`).
*   **Report Structure:** For each identified issue, the report will contain:
    *   `issueID`: A unique identifier.
    *   `description`: A clear description of the problem.
    *   `severity`: (e.g., "Critical", "High", "Medium", "Low").
    *   `file_path`: The component or page where the issue was found.
    *   `evidence`: The path to the screenshot or video showing the issue.
    *   `recommendation`: The AI's suggested fix.
    *   `status`: "pending".
*   **Output:** A machine-readable audit report.

### Step 6: Automated Remediation (Future Goal)

*   **Action:** The structured `audit-findings.json` report from Step 5 becomes the direct input for a separate AI agent. This agent's task is to read the report, and for each issue, attempt to generate and apply a code fix.
*   **Justification:** This closes the loop, moving from automated detection to automated remediation, fulfilling the ultimate vision of a self-healing quality assurance process.

## 4. Required Enhancements to Existing Scripts

*   **`comprehensive-functional-audit.ts`:**
    *   Add a `--capture-all` flag to enable step-by-step screenshots.
    *   Add a `--record-video` flag to enable video recording.
    *   Add logic to systematically interact with a predefined list of common component selectors on each page.
*   **New Orchestrator Script (`scripts/run-ai-driven-audit.ts`):**
    *   This new script will be created to execute the workflow steps in the correct order.

## 5. Technical Implementation Details

To ensure the AI agent can implement this workflow correctly and consistently with the existing project architecture, the following technologies **must** be used:

*   **Orchestration & Browser Automation:** **Playwright** will be used to drive the browser, perform all user actions, and capture screenshots and videos. The new orchestrator script (`scripts/run-ai-driven-audit.ts`) and the enhanced functional test script will be written in **TypeScript** and executed with `tsx`.
*   **Accessibility Scanning:** The **`@axe-core/playwright`** library will be integrated to perform the accessibility scans at each step.
*   **AI Analysis:** The final analysis will be designed to be sent to a powerful multimodal AI model like **Claude 3 Opus** or **GPT-4o**, which can process both text and images.
*   **Reporting:** The final structured report will be generated in **JSON** for machine readability, with a potential secondary conversion to **Markdown** for human review.

This approach provides a clear, actionable plan to achieve your vision of a deeply integrated, AI-powered testing and analysis workflow. 