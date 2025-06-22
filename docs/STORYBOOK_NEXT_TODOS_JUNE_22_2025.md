# Storybook Next Steps & TODOs (as of June 22, 2025)

This document outlines the next actionable TODOs and recommendations following the successful setup, migration, and stabilization of Storybook for visual testing in the AIMLGlossary/AIGlossaryPro project.

---

## 1. Expand Story Coverage
- [ ] **Write Stories for All Key Components**
  - Ensure every reusable UI component (especially in `client/src/components/` and `client/src/components/sections/`) has at least one Storybook story.
  - Prioritize complex, interactive, or business-critical components (e.g., `EnhancedTermCard`, `SectionContentRenderer`, `AIAdminDashboard`).
- [ ] **Add Edge Case & State Stories**
  - For each component, add stories for loading, error, empty, and edge-case states.
  - Include stories for mobile/responsive layouts using Storybook’s built-in viewports.

## 2. Visual Regression Testing
- [ ] **Integrate Visual Regression Testing**
  - Set up a tool like Chromatic or Storybook’s built-in test runner for automated visual regression checks.
  - Document the workflow for running and reviewing visual diffs.

## 3. Accessibility (a11y) Audits
- [ ] **Enable Storybook Accessibility Addon**
  - Ensure the a11y panel is enabled and used to audit components for accessibility issues.
  - Add accessibility acceptance criteria to component stories.

## 4. Documentation & Developer Experience
- [ ] **Enrich Storybook Docs**
  - Use Storybook’s MDX/DocsPage to add usage examples, prop tables, and design guidelines for each component.
  - Link to relevant design files or Figma specs if available.
- [ ] **Update CONTRIBUTING.md**
  - Add a section on how to write, run, and maintain stories.
  - Document the visual testing workflow and troubleshooting steps.

## 5. CI/CD Integration
- [ ] **Add Storybook Build to CI Pipeline**
  - Ensure Storybook builds (and optionally deploys as a static site) on every PR/merge.
  - Optionally, set up Chromatic or Netlify/Vercel preview deployments for visual review.

## 6. Test Coverage & Quality
- [ ] **Audit and Increase Test Coverage**
  - Review which components lack unit/visual tests and add as needed.
  - Ensure all stories are covered by at least basic snapshot or interaction tests.

## 7. Refactor/Optimize Stories
- [ ] **Deduplicate and Refactor Stories**
  - Remove redundant stories, consolidate similar ones, and ensure stories are DRY and easy to maintain.

## 8. Ongoing Maintenance
- [ ] **Regularly Update Storybook & Addons**
  - Monitor for new Storybook releases and migration guides.
  - Schedule periodic reviews to keep stories and documentation up to date.

---

### Assumptions & Open Questions
- **Assumption:** All deprecated addon issues are resolved and Storybook is stable.
- **Assumption:** No major refactors are planned for the component structure in the near term.
- **Open Question:** Is there a design system or Figma file to align stories with?
- **Open Question:** Should visual regression be enforced as a blocking check in CI, or just as a review tool?

---

### Relevant Files to Update
- `client/src/components/**/*.tsx` (stories for each component)
- `.storybook/` (config, preview, addons)
- `docs/STORYBOOK_GUIDE.md` (expand with new workflows)
- `CONTRIBUTING.md` (add Storybook/testing section)
- CI config files (e.g., `.github/workflows/`, if integrating Storybook build/test)

---

**Last updated:** Sun Jun 22 22:18:30 IST 2025
