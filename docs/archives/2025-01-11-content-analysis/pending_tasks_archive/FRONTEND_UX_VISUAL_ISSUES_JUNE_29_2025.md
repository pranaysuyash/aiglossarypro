# Frontend UX & Visual Issues Analysis

Date: June 29, 2025

## Overview

This document captures the current user-experience (UX), visual, and accessibility issues identified while reviewing the AI Glossary Pro frontend (codebase & Storybook).  Each issue is accompanied by context and a suggested remediation path.  The goal is to tighten UI consistency, improve usability, and harden accessibility before production hardening.

> NOTE – the list focuses on **high-impact** observations.  Smaller nits (e.g. typo fixes) are tracked in the per-component TODO comments.

---

## 1 ▪ Architecture / Global Concerns

| # | Issue | Impact | Suggested Fix |
|---|---|---|---|
| A-1 | **Mixed routing libraries** – most components/pages use `wouter`, but pages such as `client/src/pages/Terms.tsx` import `react-router-dom` (`useNavigate`). | Broken navigation, nested router errors (already seen in Storybook). | Standardise on **one** router (recommend `wouter` for bundle size) and refactor out `react-router-dom` usage. |
| A-2 | **Duplicate router context in Storybook** – Global `<Router>` in `.storybook/preview.tsx` + per-story `<MemoryRouter>`. | Run-time error _"You cannot render a <Router> inside another <Router>"_. | Removed `MemoryRouter` in stories (commit …); ensure no re-introduction & add ESLint rule. |
| A-3 | **Inconsistent prop contracts** – Story files reveal prop mismatches (e.g. `CategoryCard` expects `onClick` but interface differs; `EnhancedTermCard` uses `onFavorite` which component doesn't expose). | TypeScript errors, broken controls in prod, Storybook build fails. | Align component prop interfaces & update stories; add automated type-check in CI. |
| A-4 | **MDX pattern mismatch** – Storybook logs _"No story files found for pattern client/src/components/**/*.mdx"_. | Docs pages not rendered; lost design system context. | Update `main.ts` Storybook config to include `stories/**/*.mdx` or move MDX docs under component folders. |

---

## 2 ▪ Navigation & Information Architecture

1. **Sidebar collapse on mobile** – `Sidebar.stories.tsx` shows overlay behaviour but there is no keyboard trap / focus lock → poor accessibility.
2. **Missing skip-to-content link on landing pages** – `components/accessibility/SkipLinks` exists yet is not mounted in `client/src/App.tsx`.
3. **Breadcrumbs absent** on deep pages (Term Detail, Category view) → users lose sense of place.

---

## 3 ▪ Responsiveness & Layout

| Component / Page | Issue | Viewport |
|---|---|---|
| Header | Search input overflows at < 320 px; icons overlap logo. | XS phones |
| Term Cards | Card grid jumps from 1 → 4 columns; no 2-col state causing cramped layout on ~900 px tablets. | SM / MD |
| Category Cards | Fixed width 384 px inside fluid grid – causes horizontal scroll on iPhone SE. | XS |
| Tables in Analytics dashboard | Use raw `<table>` without overflow wrapper → causes viewport scroll. | MD |

---

## 4 ▪ Theming & Dark-Mode

1. Components use Tailwind `dark` class but some nested children hard-code text colours (e.g. `text-gray-600`) resulting in low contrast in dark mode.
2. Dark-mode toggle not exposed in primary UI (only theme addon in Storybook).
3. Charts (LazyChart) use fixed palette not derived from CSS vars – illegible in dark theme.

---

## 5 ▪ Component-Level Observations

### 5.1 Header
- Avatar fallback uses initials via plain text inside circle but no `aria-label`.
- Mobile nav hamburger lacks `aria-controls` / `aria-expanded`.

### 5.2 SearchBar
- No debounce indicator – rapid typing triggers multiple fetches; can flood backend.
- Suggestion list lacks keyboard navigation (up/down, enter).

### 5.3 TermHeader
- Favourite / Share buttons have no tooltip; affordance unclear.
- Reading-time badge (`3 min read`) not visually prioritised – same style as tags.

### 5.4 Footer
- Social media icon buttons have empty `aria-label` attributes.
- Contrast of muted text (`text-gray-600`) on dark background fails WCAG AA.

### 5.5 Forms (Settings)
- Validation errors shown only by colour; no icon / text alternative (colour-blind issue).
- Inputs lack `autocomplete` attributes (name, email etc.).

---

## 6 ▪ Accessibility (a11y)

| Issue | Details |
|---|---|
| Colour contrast | Multiple grays (#6B7280 etc.) on white/dark fail WCAG ratio. Run `@storybook/addon-a11y` report. |
| Missing labels | Select components render custom divs without `aria-labelledby`. |
| Keyboard traps | Sidebar overlay, mobile nav. |
| Live regions | `LiveRegion.tsx` exists but not utilised for async actions (e.g. toast only). |

---

## 7 ▪ Performance

1. **Bundle size inflation** – Both `react-router-dom` & `wouter` shipped.
2. **Large icon set** – Lucide icons imported individually (✅) but some components import the entire package.
3. **Image optimisation** – Banner images unoptimised (missing `loading="lazy"`).
4. **Query overfetching** – SearchBar triggers fetch on every keystroke; add `debounce` + `cacheTime`.

---

## 8 ▪ Storybook-Specific

- Several stories still reference obsolete mock data → broken controls.
- Auto-docs generation fails for files missing default export metadata.
- Viewport addon only defines three breakpoints; add more (sm = 640 px, xl = 1280 px) for realism.

---

## 9 ▪ Recommended Next Steps

1. **Routing consolidation** – migrate remaining `react-router-dom` code to `wouter` or vice-versa.
2. **Introduce ESLint rule** for single router + a11y checks (e.g. `eslint-plugin-jsx-a11y`).
3. **Add visual regression tests** via Chromatic for critical flows.
4. **Run Lighthouse CI** on main pages; treat < 90 score as fail.
5. **Harden dark-mode** – refactor colours to reference CSS vars exclusively.
6. **Complete Storybook docs** – move MDX under each component & repair build.
7. **Implement SkipLinks & focus-lock** for overlays/modals.

---

### Appendix

- **Lint / Type Errors surfaced in stories** are tracked in `docs/STORYBOOK_IMPLEMENTATION_SUMMARY.md` – address them alongside the above fixes.

---

_Compiled by: Senior Frontend Engineer_ 