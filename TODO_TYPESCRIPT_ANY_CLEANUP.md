# TypeScript 'any' Type Cleanup TODO

## Overview
This file tracks the removal of TypeScript 'any' types from the codebase to improve type safety.

Last updated: 2025-07-23

## Top 10 Files with Most 'any' Types

### 1. `/server/enhancedStorage.ts` - 156 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (52), `as any` (49), `<any>` (53), `any[]` (16)
- Status: Not started

### 2. `/server/optimizedStorage.ts` - 105 occurrences  
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (45), `<any>` (48), `any[]` (36)
- Status: Not started

### 3. `/server/storage.ts` - 96 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (19), `<any>` (51), `any[]` (33)
- Status: Not started

### 4. `/client/src/components/FirebaseLoginPage.stories.tsx` - 36 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (36)
- Status: Not started

### 5. `/server/routes/user.ts` - 32 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (8), `as any` (24)
- Status: Not started

### 6. `/server/jobs/processors/analyticsAggregateProcessor.ts` - 31 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (6), `<any>` (13), `any[]` (10)
- Status: Not started

### 7. `/server/routes/admin.ts` - 29 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (29), `any[]` (5)
- Status: Not started

### 8. `/server/services/batchAnalyticsService.ts` - 28 occurrences
- [ ] Review and add proper types for all occurrences
- [ ] Focus on: `: any` (23), `any[]` (14)
- Status: Not started

### 9. `/scripts/comprehensive-audit-suite.ts` - 23 occurrences
- [ ] Review and add proper types for all occurrences
- Status: Not started

### 10. `/server/routes/seo.ts` - 18 occurrences
- [ ] Review and add proper types for all occurrences
- Status: Not started

## Common Patterns to Fix

1. **Generic types without parameters**: `<any>` → `<T>` or specific type
2. **Function parameters**: `: any` → Define proper interfaces/types
3. **Type assertions**: `as any` → Remove or use proper type assertion
4. **Arrays**: `any[]` → Define proper array types
5. **Catch blocks**: `catch (error: any)` → `catch (error: unknown)` or `Error`
6. **Record types**: `Record<string, any>` → Define proper object structure

## Progress Tracking

- Total files identified: 10
- Total occurrences to fix: ~654
- Files completed: 0/10
- Occurrences fixed: 0/654

## Notes

- Prioritize files with the highest occurrence count
- Test thoroughly after each file is updated
- Consider creating shared type definitions for common patterns
- Update unit tests as needed when types change