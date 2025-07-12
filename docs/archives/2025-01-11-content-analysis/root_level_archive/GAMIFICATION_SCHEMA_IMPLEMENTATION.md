# Gamification Schema Implementation

## Overview
This document outlines the implementation of database schema for user progress tracking and gamification system that supports the "Smart Persistence with Natural Upgrade Pressure" strategy.

## Implementation Details

### Files Modified
- **`shared/enhancedSchema.ts`** - Added three new tables for gamification and progress tracking

### New Tables Added

#### 1. `user_term_history`
**Purpose**: Track all term interactions (never deleted) to create user investment by showing their learning journey.

**Key Fields**:
- `id` - Primary key (UUID)
- `userId` - References users.id
- `termId` - References enhanced_terms.id
- `firstViewedAt` - When user first viewed this term
- `lastAccessedAt` - Most recent access timestamp
- `viewCount` - Number of times viewed
- `sectionsViewed` - Array of section names viewed
- `isBookmarked` - Whether term is bookmarked
- `bookmarkDate` - When bookmark was created
- `timeSpentSeconds` - Total time spent on term
- `completionPercentage` - Progress percentage (0-100)

**Indexes**: Optimized for user queries, term lookups, and bookmark filtering

#### 2. `user_achievements`
**Purpose**: Track streaks, milestones, and badges to gamify the experience and create reasons to maintain engagement.

**Key Fields**:
- `id` - Primary key (UUID)
- `userId` - References users.id
- `achievementType` - Type of achievement (daily_streak, weekly_streak, terms_viewed, etc.)
- `achievementValue` - Milestone value (e.g., 7 for 7-day streak)
- `currentStreak` - Current streak count
- `bestStreak` - Best streak achieved
- `lastStreakDate` - Last streak activity date
- `isActive` - Whether achievement is currently active
- `progress` - Current progress toward next milestone
- `nextMilestone` - Next achievement value to unlock
- `metadata` - Additional achievement-specific data (JSONB)

**Indexes**: Optimized for user queries, achievement type filtering, and streak tracking

#### 3. `daily_term_selections`
**Purpose**: Track daily algorithm selections to support personalized content delivery and create upgrade pressure through analytics.

**Key Fields**:
- `id` - Primary key (UUID)
- `userId` - References users.id
- `termId` - References enhanced_terms.id
- `selectionDate` - Date of selection
- `positionInDailyList` - Position in daily list (1-based)
- `algorithmReason` - Why term was selected (trending, personalized, etc.)
- `wasViewed` - Whether user viewed the term
- `wasBookmarked` - Whether user bookmarked the term
- `timeSpentSeconds` - Time spent on selected term
- `userRating` - User rating (1-5 stars)
- `wasSkipped` - Whether user skipped the term
- `metadata` - Algorithm-specific data (JSONB)

**Indexes**: Optimized for user/date queries, algorithm analysis, and engagement tracking

## Schema Features

### Data Integrity
- **Foreign Key Constraints**: All tables properly reference users and enhanced_terms
- **Unique Constraints**: Prevent duplicate entries where appropriate
- **Proper Indexes**: Optimized for expected query patterns

### Performance Optimizations
- **Composite Indexes**: For common query patterns (user + term, user + date)
- **Selective Indexes**: For boolean fields and specific value filtering
- **Array Support**: PostgreSQL array fields for sections_viewed

### Gamification Support
- **Achievement Types**: Flexible system supporting various achievement types
- **Streak Tracking**: Current and best streak tracking
- **Progress Indicators**: Completion percentages and milestone tracking
- **Never Delete Policy**: Term history preserved to maintain user investment

## Strategic Alignment

This implementation directly supports the "Smart Persistence with Natural Upgrade Pressure" strategy by:

1. **Creating User Investment**: 
   - Never-deleted term history shows users their learning journey
   - Achievement tracking creates sense of progress and accomplishment
   - Bookmarking and progress tracking make users feel their data is valuable

2. **Enabling Natural Upgrade Pressure**:
   - Daily term selections provide personalization data
   - Analytics show users their engagement patterns
   - Achievement progress creates desire to maintain streaks (premium feature)

3. **Supporting Retention**:
   - Gamification elements increase engagement
   - Progress tracking encourages continued usage
   - Streak maintenance creates habit formation

## Types and Validation

- **Insert Schemas**: Proper Zod validation schemas for all tables
- **TypeScript Types**: Full type safety for all table operations
- **Drizzle ORM**: Consistent with existing codebase patterns

## Usage Examples

The schema enables features like:
- Daily learning streak tracking
- Personalized term recommendations
- Progress visualization
- Achievement badges
- Bookmark management
- Time-based analytics
- Engagement scoring

## Next Steps

1. Implement service layer functions for gamification logic
2. Create API endpoints for progress tracking
3. Build frontend components for achievement display
4. Add analytics dashboards for user engagement
5. Implement upgrade pressure triggers based on usage patterns