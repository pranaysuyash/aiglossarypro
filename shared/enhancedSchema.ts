import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod';

// Import original tables first to avoid reference issues
import {
  categories,
  contactSubmissions,
  favorites,
  newsletterSubscriptions,
  sessions,
  subcategories,
  termSubcategories,
  terms,
  termViews,
  userProgress,
  userSettings,
  users,
} from './schema';

// Enhanced schema for complex term structure with 42 sections

// Content sections table - stores structured data from the 42 sections
export const termSections = pgTable(
  'term_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: varchar('section_name', { length: 100 }).notNull(), // e.g., 'Introduction', 'Prerequisites'
    sectionData: jsonb('section_data').notNull(), // Structured JSON data for the section
    displayType: varchar('display_type', { length: 20 }).notNull(), // 'card', 'sidebar', 'main', 'modal', 'metadata'
    priority: integer('priority').default(5), // 1-10 for ordering
    isInteractive: boolean('is_interactive').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termSectionIdx: index('term_section_idx').on(table.termId, table.sectionName),
    displayTypeIdx: index('display_type_idx').on(table.displayType),
  })
);

// Enhanced terms table with complex categorization
export const enhancedTerms = pgTable(
  'enhanced_terms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull().unique(),
    slug: varchar('slug', { length: 250 }).notNull().unique(), // URL-friendly version

    // Core content
    shortDefinition: text('short_definition'),
    fullDefinition: text('full_definition').notNull(),

    // Categorization
    mainCategories: text('main_categories').array().default([]), // AI-parsed main categories
    subCategories: text('sub_categories').array().default([]), // AI-parsed subcategories
    relatedConcepts: text('related_concepts').array().default([]), // Related terms
    applicationDomains: text('application_domains').array().default([]), // Finance, Healthcare, etc.
    techniques: text('techniques').array().default([]), // Algorithms, techniques

    // Metadata
    difficultyLevel: varchar('difficulty_level', { length: 20 }), // Beginner, Intermediate, Advanced, Expert
    hasImplementation: boolean('has_implementation').default(false),
    hasInteractiveElements: boolean('has_interactive_elements').default(false),
    hasCaseStudies: boolean('has_case_studies').default(false),
    hasCodeExamples: boolean('has_code_examples').default(false),

    // Search and filtering
    searchText: text('search_text'), // Pre-processed searchable text from all sections
    keywords: text('keywords').array().default([]), // Extracted keywords for search

    // Analytics
    viewCount: integer('view_count').default(0),
    lastViewed: timestamp('last_viewed'),

    // Parsing metadata
    parseHash: varchar('parse_hash', { length: 32 }), // Hash of original data to detect changes
    parseVersion: varchar('parse_version', { length: 10 }).default('1.0'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    nameIdx: index('enhanced_terms_name_idx').on(table.name),
    slugIdx: index('enhanced_terms_slug_idx').on(table.slug),
    difficultyIdx: index('enhanced_terms_difficulty_idx').on(table.difficultyLevel),
    mainCategoriesIdx: index('enhanced_terms_main_categories_idx').on(table.mainCategories),
    searchTextIdx: index('enhanced_terms_search_text_idx').on(table.searchText),
  })
);

// Interactive elements table - stores references to interactive content
export const interactiveElements = pgTable(
  'interactive_elements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: varchar('section_name', { length: 100 }).notNull(),
    elementType: varchar('element_type', { length: 50 }).notNull(), // 'mermaid', 'quiz', 'demo', 'code'
    elementData: jsonb('element_data').notNull(), // Configuration and content
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    termElementIdx: index('interactive_elements_term_idx').on(table.termId),
    typeIdx: index('interactive_elements_type_idx').on(table.elementType),
  })
);

// Term relationships - for related concepts and prerequisites
export const termRelationships = pgTable(
  'term_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromTermId: uuid('from_term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    toTermId: uuid('to_term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    relationshipType: varchar('relationship_type', { length: 50 }).notNull(), // 'prerequisite', 'related', 'extends', 'alternative'
    strength: integer('strength').default(5), // 1-10 relationship strength
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    fromTermIdx: index('term_relationships_from_idx').on(table.fromTermId),
    toTermIdx: index('term_relationships_to_idx').on(table.toTermId),
    typeIdx: index('term_relationships_type_idx').on(table.relationshipType),
  })
);

// Display configurations - customizable layouts per term
export const displayConfigs = pgTable(
  'display_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    configType: varchar('config_type', { length: 50 }).notNull(), // 'card', 'detail', 'mobile'
    layout: jsonb('layout').notNull(), // Layout configuration
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    termConfigIdx: index('display_configs_term_idx').on(table.termId, table.configType),
  })
);

// User preferences for personalized display
export const enhancedUserSettings = pgTable('enhanced_user_settings', {
  userId: varchar('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Display preferences
  experienceLevel: varchar('experience_level', { length: 20 }).default('intermediate'), // beginner, intermediate, advanced, expert
  preferredSections: text('preferred_sections').array().default([]), // Sections to prioritize
  hiddenSections: text('hidden_sections').array().default([]), // Sections to hide

  // Content preferences
  showMathematicalDetails: boolean('show_mathematical_details').default(true),
  showCodeExamples: boolean('show_code_examples').default(true),
  showInteractiveElements: boolean('show_interactive_elements').default(true),

  // Personalization
  favoriteCategories: text('favorite_categories').array().default([]),
  favoriteApplications: text('favorite_applications').array().default([]),

  // UI preferences
  compactMode: boolean('compact_mode').default(false),
  darkMode: boolean('dark_mode').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Analytics for content optimization
export const contentAnalytics = pgTable(
  'content_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: varchar('section_name', { length: 100 }), // null for overall term analytics

    // Engagement metrics
    views: integer('views').default(0),
    timeSpent: integer('time_spent_seconds').default(0), // Total time spent
    interactionCount: integer('interaction_count').default(0), // Clicks, expansions, etc.

    // Quality metrics
    userRating: integer('user_rating'), // 1-5 stars
    helpfulnessVotes: integer('helpfulness_votes').default(0),

    // Temporal data
    lastUpdated: timestamp('last_updated').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    termAnalyticsIdx: index('content_analytics_term_idx').on(table.termId),
    sectionAnalyticsIdx: index('content_analytics_section_idx').on(table.sectionName),
  })
);

// AI Content Feedback and Verification System
export const aiContentFeedback = pgTable(
  'ai_content_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Feedback details
    feedbackType: varchar('feedback_type', { length: 50 }).notNull(), // 'incorrect', 'incomplete', 'misleading', 'outdated', 'other'
    section: varchar('section', { length: 100 }), // Which part of the content (definition, characteristics, etc.)
    description: text('description').notNull(), // User's description of the issue
    severity: varchar('severity', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'critical'

    // Status tracking
    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'reviewing', 'resolved', 'dismissed'
    reviewedBy: varchar('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),

    // Metadata
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termFeedbackIdx: index('ai_feedback_term_idx').on(table.termId),
    statusIdx: index('ai_feedback_status_idx').on(table.status),
    userFeedbackIdx: index('ai_feedback_user_idx').on(table.userId),
  })
);

// AI Content Verification Status
export const aiContentVerification = pgTable(
  'ai_content_verification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),

    // AI Generation tracking
    isAiGenerated: boolean('is_ai_generated').default(false),
    aiModel: varchar('ai_model', { length: 50 }), // 'gpt-4o-mini', 'gpt-3.5-turbo', etc.
    generatedAt: timestamp('generated_at'),
    generatedBy: varchar('generated_by').references(() => users.id),

    // Verification status
    verificationStatus: varchar('verification_status', { length: 20 }).default('unverified'),
    // 'unverified', 'verified', 'flagged', 'needs_review', 'expert_reviewed'
    verifiedBy: varchar('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at'),

    // Quality metrics
    accuracyScore: integer('accuracy_score'), // 1-100 if assessed
    completenessScore: integer('completeness_score'), // 1-100 if assessed
    clarityScore: integer('clarity_score'), // 1-100 if assessed

    // Expert review
    expertReviewRequired: boolean('expert_review_required').default(false),
    expertReviewer: varchar('expert_reviewer').references(() => users.id),
    expertReviewNotes: text('expert_review_notes'),
    expertReviewedAt: timestamp('expert_reviewed_at'),

    // Confidence and reliability
    confidenceLevel: varchar('confidence_level', { length: 20 }).default('medium'), // 'low', 'medium', 'high'
    lastReviewedAt: timestamp('last_reviewed_at').defaultNow(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termVerificationIdx: index('ai_verification_term_idx').on(table.termId),
    statusVerificationIdx: index('ai_verification_status_idx').on(table.verificationStatus),
    aiGeneratedIdx: index('ai_verification_generated_idx').on(table.isAiGenerated),
  })
);

// AI Usage Analytics
export const aiUsageAnalytics = pgTable(
  'ai_usage_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Operation details
    operation: varchar('operation', { length: 50 }).notNull(), // 'generate_definition', 'improve_definition', 'semantic_search', 'suggest_terms'
    model: varchar('model', { length: 50 }).notNull(), // 'gpt-4o-mini', 'gpt-3.5-turbo'

    // Request details
    userId: varchar('user_id').references(() => users.id),
    termId: uuid('term_id').references(() => enhancedTerms.id),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),

    // Performance metrics
    latency: integer('latency_ms'), // Response time in milliseconds
    cost: decimal('cost', { precision: 10, scale: 6 }), // Cost in USD

    // Quality metrics
    success: boolean('success').default(true),
    errorType: varchar('error_type', { length: 100 }),
    errorMessage: text('error_message'),

    // User feedback
    userAccepted: boolean('user_accepted'), // Did user accept the AI output?
    userRating: integer('user_rating'), // 1-5 if user rated the output

    // Metadata
    sessionId: varchar('session_id', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'), // Additional structured metadata

    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    operationIdx: index('ai_usage_operation_idx').on(table.operation),
    modelIdx: index('ai_usage_model_idx').on(table.model),
    userUsageIdx: index('ai_usage_user_idx').on(table.userId),
    dateIdx: index('ai_usage_date_idx').on(table.createdAt),
  })
);

// Term Versions table - for AI-powered versioning system
export const termVersions = pgTable(
  'term_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 20 }).notNull(), // e.g., "1.0", "1.1", "2.0-review"

    // Content storage
    content: jsonb('content').notNull(), // Full term content for this version

    // Quality metrics
    qualityMetrics: jsonb('quality_metrics').notNull(), // ContentQualityMetrics JSON

    // Version status
    isActive: boolean('is_active').default(false), // Only one active version per term

    // Metadata
    metadata: jsonb('metadata').notNull(), // Processing metadata, decision info, etc.

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termVersionIdx: index('term_version_term_idx').on(table.termId),
    activeVersionIdx: index('term_version_active_idx').on(table.termId, table.isActive),
    versionIdx: index('term_version_version_idx').on(table.version),
    createdAtIdx: index('term_version_created_idx').on(table.createdAt),
  })
);

// Sections table - for the 42-section architecture
export const sections = pgTable(
  'sections',
  {
    id: serial('id').primaryKey(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    isCompleted: boolean('is_completed').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termNameUnique: unique().on(table.termId, table.name),
    termIdIdx: index('idx_sections_term_id').on(table.termId),
    nameIdx: index('idx_sections_name').on(table.name),
    orderIdx: index('idx_sections_order').on(table.termId, table.displayOrder),
  })
);

// Section items table - content within each section
export const sectionItems = pgTable(
  'section_items',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }), // Link to specific term for 295-column structure
    columnId: varchar('column_id', { length: 100 }), // ID from 295-column structure
    label: varchar('label', { length: 200 }).notNull(),
    content: text('content'),
    contentType: varchar('content_type', { length: 50 }).default('markdown'),
    displayOrder: integer('display_order').notNull().default(0),
    metadata: jsonb('metadata'),
    isAiGenerated: boolean('is_ai_generated').default(false),
    verificationStatus: varchar('verification_status', { length: 20 }).default('unverified'),

    // Enhanced Quality Tracking fields
    evaluationScore: integer('evaluation_score').default(0), // 1-10 quality score
    evaluationFeedback: text('evaluation_feedback'), // AI evaluation feedback
    improvedContent: text('improved_content'), // AI-improved version of content
    processingPhase: varchar('processing_phase', { length: 20 }).default('generated'), // 'generated', 'evaluated', 'improved', 'final'
    promptVersion: varchar('prompt_version', { length: 20 }).default('v1.0'), // Track prompt template version
    generationCost: decimal('generation_cost', { precision: 10, scale: 6 }).default('0'), // Cost for generating this content
    qualityScore: integer('quality_score').default(0), // Overall quality score for 295-column content

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    sectionIdIdx: index('idx_section_items_section_id').on(table.sectionId),
    contentTypeIdx: index('idx_section_items_content_type').on(table.contentType),
    orderIdx: index('idx_section_items_order').on(table.sectionId, table.displayOrder),
    verificationIdx: index('idx_section_items_verification').on(table.verificationStatus),
    evaluationScoreIdx: index('idx_section_items_evaluation_score').on(table.evaluationScore),
    processingPhaseIdx: index('idx_section_items_processing_phase').on(table.processingPhase),
    termColumnIdx: index('idx_section_items_term_column').on(table.termId, table.columnId),
    termIdIdx: index('idx_section_items_term_id').on(table.termId),
    columnIdIdx: index('idx_section_items_column_id').on(table.columnId),
  })
);

// Model content versions table - stores different model outputs for comparison
export const modelContentVersions = pgTable(
  'model_content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: varchar('section_name', { length: 100 }).notNull(),

    // Model information
    model: varchar('model', { length: 50 }).notNull(), // 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc.
    modelVersion: varchar('model_version', { length: 50 }), // '4.0', '3.5-turbo-1106', etc.

    // Generation parameters
    temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
    maxTokens: integer('max_tokens').default(1000),
    templateId: varchar('template_id', { length: 100 }),

    // Content
    content: text('content').notNull(),

    // Metrics
    promptTokens: integer('prompt_tokens').default(0),
    completionTokens: integer('completion_tokens').default(0),
    totalTokens: integer('total_tokens').default(0),
    cost: decimal('cost', { precision: 10, scale: 6 }).default('0'),
    processingTime: integer('processing_time_ms').default(0),

    // Quality metrics (if evaluated)
    qualityScore: decimal('quality_score', { precision: 3, scale: 1 }), // 1-10 scale
    qualityMetrics: jsonb('quality_metrics'), // Detailed quality breakdown

    // User interaction
    isSelected: boolean('is_selected').default(false), // User's current choice
    userRating: integer('user_rating'), // 1-5 stars from user
    userNotes: text('user_notes'), // Admin notes about this version

    // Status
    status: varchar('status', { length: 20 }).default('generated'), // 'generated', 'evaluated', 'selected', 'archived'

    // Metadata
    generatedBy: varchar('generated_by').references(() => users.id),
    metadata: jsonb('metadata'), // Additional context, generation settings, etc.

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termSectionIdx: index('idx_model_versions_term_section').on(table.termId, table.sectionName),
    modelIdx: index('idx_model_versions_model').on(table.model),
    selectedIdx: index('idx_model_versions_selected').on(table.isSelected),
    qualityIdx: index('idx_model_versions_quality').on(table.qualityScore),
    statusIdx: index('idx_model_versions_status').on(table.status),
    createdAtIdx: index('idx_model_versions_created').on(table.createdAt),
  })
);

// Re-export original tables to maintain compatibility
export {
  sessions,
  users,
  categories,
  subcategories,
  terms,
  termSubcategories,
  favorites,
  userProgress,
  termViews,
  userSettings,
  newsletterSubscriptions,
  contactSubmissions,
};

// Enhanced schemas for validation
export const insertTermSectionSchema = createInsertSchema(termSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertEnhancedTermSchema = createInsertSchema(enhancedTerms).omit({
  id: true,
  viewCount: true,
  lastViewed: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertInteractiveElementSchema = createInsertSchema(interactiveElements).omit({
  id: true,
  createdAt: true,
} as const);

export const insertTermRelationshipSchema = createInsertSchema(termRelationships).omit({
  id: true,
  createdAt: true,
} as const);

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertSectionItemSchema = createInsertSchema(sectionItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertModelContentVersionSchema = createInsertSchema(modelContentVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

// Types
export type TermSection = typeof termSections.$inferSelect;
export type InsertTermSection = z.infer<typeof insertTermSectionSchema>;

export type EnhancedTerm = typeof enhancedTerms.$inferSelect;
export type InsertEnhancedTerm = z.infer<typeof insertEnhancedTermSchema>;

export type InteractiveElement = typeof interactiveElements.$inferSelect;
export type InsertInteractiveElement = z.infer<typeof insertInteractiveElementSchema>;

export type TermRelationship = typeof termRelationships.$inferSelect;
export type InsertTermRelationship = z.infer<typeof insertTermRelationshipSchema>;

export type EnhancedUserSettings = typeof enhancedUserSettings.$inferSelect;
export type ContentAnalytics = typeof contentAnalytics.$inferSelect;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type SectionItem = typeof sectionItems.$inferSelect;
export type InsertSectionItem = z.infer<typeof insertSectionItemSchema>;

export type ModelContentVersion = typeof modelContentVersions.$inferSelect;
export type InsertModelContentVersion = z.infer<typeof insertModelContentVersionSchema>;

// Types for gamification tables
export type UserTermHistory = typeof userTermHistory.$inferSelect;
export type InsertUserTermHistory = z.infer<typeof insertUserTermHistorySchema>;

export type UserAchievements = typeof userAchievements.$inferSelect;
export type InsertUserAchievements = z.infer<typeof insertUserAchievementsSchema>;

export type DailyTermSelections = typeof dailyTermSelections.$inferSelect;
export type InsertDailyTermSelections = z.infer<typeof insertDailyTermSelectionsSchema>;

// Re-export Learning Paths and Code Examples tables
export {
  codeExampleRuns,
  codeExamples,
  codeExampleVotes,
  learningPathSteps,
  learningPaths,
  stepCompletions,
  userLearningProgress,
} from './schema';

// User Progress Tracking and Gamification Tables
// These tables support the "Smart Persistence with Natural Upgrade Pressure" strategy

// User Term History - tracks all term interactions (never deleted)
// This creates user investment by showing their learning journey
export const userTermHistory = pgTable(
  'user_term_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),

    // Core tracking fields
    firstViewedAt: timestamp('first_viewed_at').defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
    viewCount: integer('view_count').default(1),

    // Section engagement tracking
    sectionsViewed: text('sections_viewed').array().default([]), // Array of section names viewed

    // Bookmarking functionality
    isBookmarked: boolean('is_bookmarked').default(false),
    bookmarkDate: timestamp('bookmark_date'),

    // Progress indicators
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    completionPercentage: integer('completion_percentage').default(0), // 0-100

    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    userTermIdx: index('user_term_history_user_term_idx').on(table.userId, table.termId),
    userIdx: index('user_term_history_user_idx').on(table.userId),
    termIdx: index('user_term_history_term_idx').on(table.termId),
    lastAccessedIdx: index('user_term_history_last_accessed_idx').on(table.lastAccessedAt),
    bookmarkedIdx: index('user_term_history_bookmarked_idx').on(table.isBookmarked),
    viewCountIdx: index('user_term_history_view_count_idx').on(table.viewCount),
    // Unique constraint to prevent duplicate entries
    uniqueUserTerm: unique('user_term_history_unique').on(table.userId, table.termId),
  })
);

// User Achievements - tracks streaks, milestones, badges
// This gamifies the experience and creates reasons to maintain engagement
export const userAchievements = pgTable(
  'user_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Achievement details
    achievementType: varchar('achievement_type', { length: 50 }).notNull(),
    // Types: 'daily_streak', 'weekly_streak', 'monthly_streak', 'terms_viewed', 'sections_completed', 'bookmarks_created', 'categories_explored'
    achievementValue: integer('achievement_value').notNull(), // The milestone value (e.g., 7 for 7-day streak)

    // Streak tracking
    currentStreak: integer('current_streak').default(0),
    bestStreak: integer('best_streak').default(0),
    lastStreakDate: timestamp('last_streak_date'),

    // Achievement status
    isActive: boolean('is_active').default(true), // For streak-based achievements
    unlockedAt: timestamp('unlocked_at').defaultNow(),

    // Progress tracking
    progress: integer('progress').default(0), // Current progress toward next milestone
    nextMilestone: integer('next_milestone'), // Next achievement value to unlock

    // Metadata
    metadata: jsonb('metadata'), // Additional achievement-specific data
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    userIdx: index('user_achievements_user_idx').on(table.userId),
    typeIdx: index('user_achievements_type_idx').on(table.achievementType),
    activeIdx: index('user_achievements_active_idx').on(table.isActive),
    streakIdx: index('user_achievements_streak_idx').on(table.currentStreak),
    unlockedIdx: index('user_achievements_unlocked_idx').on(table.unlockedAt),
    // Unique constraint for each achievement type per user
    uniqueUserAchievement: unique('user_achievements_unique').on(
      table.userId,
      table.achievementType
    ),
  })
);

// Daily Term Selections - tracks daily algorithm selections
// This supports personalized content delivery and upgrade pressure through analytics
export const dailyTermSelections = pgTable(
  'daily_term_selections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),

    // Selection details
    selectionDate: timestamp('selection_date').defaultNow(),
    positionInDailyList: integer('position_in_daily_list').notNull(), // 1-based position (1 = first)

    // Algorithm details
    algorithmReason: varchar('algorithm_reason', { length: 100 }).notNull(),
    // Reasons: 'trending', 'personalized', 'difficulty_matched', 'category_preference', 'streak_motivation', 'random_discovery'

    // Engagement tracking
    wasViewed: boolean('was_viewed').default(false),
    wasBookmarked: boolean('was_bookmarked').default(false),
    timeSpentSeconds: integer('time_spent_seconds').default(0),

    // User interaction
    userRating: integer('user_rating'), // 1-5 stars if user rates the selection
    wasSkipped: boolean('was_skipped').default(false),

    // Metadata
    metadata: jsonb('metadata'), // Algorithm-specific data, user preferences at time of selection
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    userDateIdx: index('daily_term_selections_user_date_idx').on(table.userId, table.selectionDate),
    userIdx: index('daily_term_selections_user_idx').on(table.userId),
    termIdx: index('daily_term_selections_term_idx').on(table.termId),
    dateIdx: index('daily_term_selections_date_idx').on(table.selectionDate),
    algorithmIdx: index('daily_term_selections_algorithm_idx').on(table.algorithmReason),
    viewedIdx: index('daily_term_selections_viewed_idx').on(table.wasViewed),
    positionIdx: index('daily_term_selections_position_idx').on(table.positionInDailyList),
    // Unique constraint to prevent duplicate selections for same user/term/date
    uniqueUserTermDate: unique('daily_term_selections_unique').on(
      table.userId,
      table.termId,
      table.selectionDate
    ),
  })
);

// Insert schemas for gamification tables
export const insertUserTermHistorySchema = createInsertSchema(userTermHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertUserAchievementsSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertDailyTermSelectionsSchema = createInsertSchema(dailyTermSelections).omit({
  id: true,
  createdAt: true,
} as const);

// Companies in AI/ML space (from migration)
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    foundingYear: integer('founding_year'),
    headquarters: varchar('headquarters', { length: 200 }),
    companySize: varchar('company_size', { length: 50 }),
    specializations: text('specializations').array().default([]),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    fundingInfo: jsonb('funding_info').default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    specializationsIdx: index('companies_specializations_idx').on(table.specializations),
    nameIdx: index('companies_name_idx').on(table.name),
  })
);

// People in AI/ML space (from migration)
export const people = pgTable(
  'people',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    title: varchar('title', { length: 200 }),
    bio: text('bio'),
    companyId: uuid('company_id').references(() => companies.id),
    areasOfExpertise: text('areas_of_expertise').array().default([]),
    socialLinks: jsonb('social_links').default({}),
    imageUrl: text('image_url'),
    notableWorks: text('notable_works').array().default([]),
    location: varchar('location', { length: 200 }),
    websiteUrl: text('website_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    companyIdx: index('people_company_idx').on(table.companyId),
    expertiseIdx: index('people_expertise_idx').on(table.areasOfExpertise),
    nameIdx: index('people_name_idx').on(table.name),
  })
);

// Datasets (from migration)
export const datasets = pgTable(
  'datasets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    sourceUrl: text('source_url'),
    license: varchar('license', { length: 100 }),
    sizeInfo: varchar('size_info', { length: 100 }),
    format: varchar('format', { length: 50 }),
    categories: text('categories').array().default([]),
    downloadCount: integer('download_count').default(0),
    lastUpdated: timestamp('last_updated'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    categoriesIdx: index('datasets_categories_idx').on(table.categories),
    nameIdx: index('datasets_name_idx').on(table.name),
  })
);

// Resources/tools/websites (from migration)
export const resources = pgTable(
  'resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    url: text('url').notNull(),
    description: text('description'),
    resourceType: varchar('resource_type', { length: 50 }), // 'tutorial', 'tool', 'documentation', 'blog'
    difficultyLevel: varchar('difficulty_level', { length: 20 }), // 'beginner', 'intermediate', 'advanced'
    tags: text('tags').array().default([]),
    rating: decimal('rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count').default(0),
    lastChecked: timestamp('last_checked'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    tagsIdx: index('resources_tags_idx').on(table.tags),
    typeIdx: index('resources_type_idx').on(table.resourceType),
    ratingIdx: index('resources_rating_idx').on(table.rating),
  })
);

// Entity linking tables - connects terms to people, companies, datasets, resources
export const entityLinks = pgTable(
  'entity_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => enhancedTerms.id, { onDelete: 'cascade' }),

    // Entity reference (one of these will be populated)
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    datasetId: uuid('dataset_id').references(() => datasets.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id').references(() => resources.id, { onDelete: 'cascade' }),

    // Link metadata
    linkType: varchar('link_type', { length: 50 }).notNull(), // 'created_by', 'works_for', 'uses_dataset', 'recommends_resource', etc.
    relevanceScore: integer('relevance_score').default(5), // 1-10 relevance rating
    description: text('description'), // Optional description of the relationship

    // Admin tracking
    createdBy: varchar('created_by').references(() => users.id),
    verifiedBy: varchar('verified_by').references(() => users.id),
    verificationStatus: varchar('verification_status', { length: 20 }).default('unverified'), // 'unverified', 'verified', 'flagged'

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    termIdx: index('entity_links_term_idx').on(table.termId),
    personIdx: index('entity_links_person_idx').on(table.personId),
    companyIdx: index('entity_links_company_idx').on(table.companyId),
    datasetIdx: index('entity_links_dataset_idx').on(table.datasetId),
    resourceIdx: index('entity_links_resource_idx').on(table.resourceId),
    typeIdx: index('entity_links_type_idx').on(table.linkType),
    verificationIdx: index('entity_links_verification_idx').on(table.verificationStatus),
  })
);

// Community contributions system
export const contributions = pgTable(
  'contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Contribution type and target
    contributionType: varchar('contribution_type', { length: 50 }).notNull(),
    // 'term_edit', 'new_person', 'new_company', 'new_dataset', 'new_resource', 'entity_link', 'content_correction'

    // Target entity (one of these will be populated)
    termId: uuid('term_id').references(() => enhancedTerms.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    datasetId: uuid('dataset_id').references(() => datasets.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id').references(() => resources.id, { onDelete: 'cascade' }),

    // Contribution content
    originalData: jsonb('original_data'), // Original entity data
    proposedData: jsonb('proposed_data').notNull(), // User's proposed changes/additions
    changeDescription: text('change_description').notNull(), // User's explanation

    // Moderation workflow
    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected', 'needs_review'
    moderatedBy: varchar('moderated_by').references(() => users.id),
    moderatedAt: timestamp('moderated_at'),
    moderationNotes: text('moderation_notes'),

    // Quality tracking
    communityScore: integer('community_score').default(0), // Community upvotes/downvotes
    qualityFlags: text('quality_flags').array().default([]), // 'spam', 'inappropriate', 'inaccurate', etc.

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    userIdx: index('contributions_user_idx').on(table.userId),
    typeIdx: index('contributions_type_idx').on(table.contributionType),
    statusIdx: index('contributions_status_idx').on(table.status),
    termIdx: index('contributions_term_idx').on(table.termId),
    scoreIdx: index('contributions_score_idx').on(table.communityScore),
    createdAtIdx: index('contributions_created_idx').on(table.createdAt),
  })
);

// User reputation and gamification for contributions
export const userReputation = pgTable(
  'user_reputation',
  {
    userId: varchar('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Reputation scores
    totalScore: integer('total_score').default(0),
    contributionScore: integer('contribution_score').default(0), // From approved contributions
    moderationScore: integer('moderation_score').default(0), // From moderation activities
    communityScore: integer('community_score').default(0), // From community interactions

    // Achievement counters
    approvedContributions: integer('approved_contributions').default(0),
    helpfulVotes: integer('helpful_votes').default(0),
    moderationActions: integer('moderation_actions').default(0),

    // Badges and levels
    badges: text('badges').array().default([]), // Array of earned badge IDs
    reputationLevel: varchar('reputation_level', { length: 20 }).default('novice'),
    // 'novice', 'contributor', 'expert', 'moderator', 'master'

    // Privileges
    canModerate: boolean('can_moderate').default(false),
    canCreateDirectly: boolean('can_create_directly').default(false), // Skip moderation for trusted users

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    totalScoreIdx: index('user_reputation_total_score_idx').on(table.totalScore),
    levelIdx: index('user_reputation_level_idx').on(table.reputationLevel),
    contributionScoreIdx: index('user_reputation_contribution_idx').on(table.contributionScore),
  })
);

// Subscription plans (from migration)
export const subscriptionPlans = pgTable(
  'subscription_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }),
    priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }),
    features: jsonb('features').notNull(),
    maxUsers: integer('max_users'),
    stripePriceId: varchar('stripe_price_id', { length: 100 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => ({
    nameIdx: index('subscription_plans_name_idx').on(table.name),
    activeIdx: index('subscription_plans_active_idx').on(table.isActive),
  })
);

// User subscriptions (from migration)
export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
    status: varchar('status', { length: 50 }).notNull(), // 'active', 'canceled', 'past_due'
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    userIdx: index('user_subscriptions_user_idx').on(table.userId),
    statusIdx: index('user_subscriptions_status_idx').on(table.status),
    planIdx: index('user_subscriptions_plan_idx').on(table.planId),
  })
);

// Teams for enterprise features
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),

    // Team settings
    settings: jsonb('settings').default({}),
    maxMembers: integer('max_members').default(10),

    // Owner information
    ownerId: varchar('owner_id')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    ownerIdx: index('teams_owner_idx').on(table.ownerId),
    nameIdx: index('teams_name_idx').on(table.name),
  })
);

// Team memberships
export const teamMemberships = pgTable(
  'team_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    role: varchar('role', { length: 20 }).default('member'), // 'member', 'admin', 'owner'
    permissions: text('permissions').array().default([]), // Specific permissions

    joinedAt: timestamp('joined_at').defaultNow(),
    invitedBy: varchar('invited_by').references(() => users.id),
    status: varchar('status', { length: 20 }).default('active'), // 'active', 'invited', 'suspended'
  },
  table => ({
    teamIdx: index('team_memberships_team_idx').on(table.teamId),
    userIdx: index('team_memberships_user_idx').on(table.userId),
    roleIdx: index('team_memberships_role_idx').on(table.role),
    statusIdx: index('team_memberships_status_idx').on(table.status),
    uniqueTeamUser: unique('team_memberships_unique').on(table.teamId, table.userId),
  })
);

// API keys for enterprise access
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    keyHash: varchar('key_hash', { length: 256 }).notNull().unique(), // Hashed API key
    keyPrefix: varchar('key_prefix', { length: 10 }).notNull(), // First few chars for identification

    // Ownership
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),

    // Permissions and limits
    permissions: text('permissions').array().default([]), // API endpoints allowed
    rateLimit: integer('rate_limit').default(1000), // Requests per hour

    // Usage tracking
    totalRequests: integer('total_requests').default(0),
    lastUsed: timestamp('last_used'),

    // Status
    isActive: boolean('is_active').default(true),
    expiresAt: timestamp('expires_at'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  table => ({
    keyHashIdx: index('api_keys_hash_idx').on(table.keyHash),
    userIdx: index('api_keys_user_idx').on(table.userId),
    teamIdx: index('api_keys_team_idx').on(table.teamId),
    activeIdx: index('api_keys_active_idx').on(table.isActive),
  })
);

// Insert schemas for new tables
export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  createdAt: true,
} as const);

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
} as const);

export const insertEntityLinkSchema = createInsertSchema(entityLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertTeamMembershipSchema = createInsertSchema(teamMemberships).omit({
  id: true,
  joinedAt: true,
} as const);

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  totalRequests: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
} as const);

// Types for new tables
export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type EntityLink = typeof entityLinks.$inferSelect;
export type InsertEntityLink = z.infer<typeof insertEntityLinkSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type UserReputation = typeof userReputation.$inferSelect;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMembership = typeof teamMemberships.$inferSelect;
export type InsertTeamMembership = z.infer<typeof insertTeamMembershipSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Re-export A/B testing tables
export {
  type ABTest,
  type ABTestEvent,
  type ABTestMetrics,
  abTestEvents,
  abTestMetrics,
  abTests,
} from './abTestingSchema';
