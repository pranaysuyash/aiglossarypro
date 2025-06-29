# Visual Audit Analysis Request

Please analyze the screenshots in this directory and identify UI/UX issues.

## Screenshots Overview

1. **01-homepage-desktop.png** - Desktop homepage (1920x1080)
2. **02-terms-desktop.png** - Terms listing page desktop
3. **03-categories-desktop.png** - Categories page desktop
4. **04-dashboard-desktop.png** - User dashboard desktop
5. **05-homepage-mobile.png** - Mobile homepage (375x812)
6. **06-terms-mobile.png** - Terms listing mobile
7. **07-homepage-tablet.png** - Tablet homepage (768x1024)
8. **08-search-active.png** - Search functionality with results
9. **09-mobile-menu-open.png** - Mobile navigation menu

## Analysis Guidelines

For each screenshot, please identify:

### 1. Visual Hierarchy Issues
- Is the most important content prominently displayed?
- Are CTAs (Call-to-Actions) clearly visible?
- Is there proper visual flow?

### 2. Color & Contrast
- Are there any contrast issues (WCAG AA compliance)?
- Is the color scheme consistent?
- Are interactive elements clearly distinguishable?

### 3. Typography
- Is text readable at all sizes?
- Are font sizes appropriate for the device?
- Is there consistent typography hierarchy?

### 4. Layout & Spacing
- Are elements properly aligned?
- Is spacing consistent throughout?
- Are there any overlapping elements?

### 5. Responsive Design
- Do mobile/tablet views work properly?
- Is content appropriately reorganized for smaller screens?
- Are touch targets large enough (44x44px minimum)?

### 6. Accessibility Concerns
- Are interactive elements clearly labeled?
- Is there sufficient color contrast?
- Are focus states visible?

### 7. Consistency Issues
- Are UI patterns consistent across pages?
- Is the design language cohesive?
- Are interactions predictable?

## Output Format

Please provide your analysis in this format:

### [Screenshot Name]

**Issues Found:**
1. **[SEVERITY: Critical/High/Medium/Low]** - Issue description
   - **Impact**: How this affects users
   - **Fix**: Specific recommendation

**Positive Observations:**
- What's working well

---

After analyzing all screenshots, please provide:

## Summary & Prioritized Action Items

1. **Critical Issues** (Must fix immediately)
2. **High Priority** (Should fix soon)
3. **Medium Priority** (Plan to fix)
4. **Low Priority** (Nice to have)

## How to Use This Prompt

1. Navigate to the screenshot directory:
   ```bash
   cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/visual-audits/2025-06-29
   ```

2. Use the Claude CLI to analyze all screenshots:
   ```bash
   claude -p "@./ Analyze these UI screenshots following the guidelines in claude-analysis-prompt.md"
   ```

3. Or manually review each screenshot and document findings in visual-audit-report.md
