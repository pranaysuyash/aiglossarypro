"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resources = exports.datasets = exports.people = exports.companies = exports.insertDailyTermSelectionsSchema = exports.insertUserAchievementsSchema = exports.insertUserTermHistorySchema = exports.dailyTermSelections = exports.userAchievements = exports.userTermHistory = exports.userLearningProgress = exports.stepCompletions = exports.learningPaths = exports.learningPathSteps = exports.codeExampleVotes = exports.codeExamples = exports.codeExampleRuns = exports.insertModelContentVersionSchema = exports.insertSectionItemSchema = exports.insertSectionSchema = exports.insertTermRelationshipSchema = exports.insertInteractiveElementSchema = exports.insertEnhancedTermSchema = exports.insertTermSectionSchema = exports.contactSubmissions = exports.newsletterSubscriptions = exports.userSettings = exports.termViews = exports.userProgress = exports.favorites = exports.termSubcategories = exports.terms = exports.subcategories = exports.categories = exports.users = exports.sessions = exports.modelContentVersions = exports.sectionItems = exports.sections = exports.termVersions = exports.aiUsageAnalytics = exports.aiContentVerification = exports.aiContentFeedback = exports.contentAnalytics = exports.enhancedUserSettings = exports.displayConfigs = exports.termRelationships = exports.interactiveElements = exports.enhancedTerms = exports.termSections = void 0;
exports.abTests = exports.abTestMetrics = exports.abTestEvents = exports.insertApiKeySchema = exports.insertTeamMembershipSchema = exports.insertTeamSchema = exports.insertContributionSchema = exports.insertEntityLinkSchema = exports.insertResourceSchema = exports.insertDatasetSchema = exports.insertCompanySchema = exports.insertPersonSchema = exports.apiKeys = exports.teamMemberships = exports.teams = exports.userSubscriptions = exports.subscriptionPlans = exports.userReputation = exports.contributions = exports.entityLinks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
// Import original tables first to avoid reference issues
const schema_1 = require("./schema");
Object.defineProperty(exports, "categories", { enumerable: true, get: function () { return schema_1.categories; } });
Object.defineProperty(exports, "contactSubmissions", { enumerable: true, get: function () { return schema_1.contactSubmissions; } });
Object.defineProperty(exports, "favorites", { enumerable: true, get: function () { return schema_1.favorites; } });
Object.defineProperty(exports, "newsletterSubscriptions", { enumerable: true, get: function () { return schema_1.newsletterSubscriptions; } });
Object.defineProperty(exports, "sessions", { enumerable: true, get: function () { return schema_1.sessions; } });
Object.defineProperty(exports, "subcategories", { enumerable: true, get: function () { return schema_1.subcategories; } });
Object.defineProperty(exports, "termSubcategories", { enumerable: true, get: function () { return schema_1.termSubcategories; } });
Object.defineProperty(exports, "terms", { enumerable: true, get: function () { return schema_1.terms; } });
Object.defineProperty(exports, "termViews", { enumerable: true, get: function () { return schema_1.termViews; } });
Object.defineProperty(exports, "userProgress", { enumerable: true, get: function () { return schema_1.userProgress; } });
Object.defineProperty(exports, "userSettings", { enumerable: true, get: function () { return schema_1.userSettings; } });
Object.defineProperty(exports, "users", { enumerable: true, get: function () { return schema_1.users; } });
// Enhanced schema for complex term structure with 42 sections
// Content sections table - stores structured data from the 42 sections
exports.termSections = (0, pg_core_1.pgTable)('term_sections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: (0, pg_core_1.varchar)('section_name', { length: 100 }).notNull(), // e.g., 'Introduction', 'Prerequisites'
    sectionData: (0, pg_core_1.jsonb)('section_data').notNull(), // Structured JSON data for the section
    displayType: (0, pg_core_1.varchar)('display_type', { length: 20 }).notNull(), // 'card', 'sidebar', 'main', 'modal', 'metadata'
    priority: (0, pg_core_1.integer)('priority').default(5), // 1-10 for ordering
    isInteractive: (0, pg_core_1.boolean)('is_interactive').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termSectionIdx: (0, pg_core_1.index)('term_section_idx').on(table.termId, table.sectionName),
    displayTypeIdx: (0, pg_core_1.index)('display_type_idx').on(table.displayType),
}));
// Enhanced terms table with complex categorization
exports.enhancedTerms = (0, pg_core_1.pgTable)('enhanced_terms', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull().unique(),
    slug: (0, pg_core_1.varchar)('slug', { length: 250 }).notNull().unique(), // URL-friendly version
    // Core content
    shortDefinition: (0, pg_core_1.text)('short_definition'),
    fullDefinition: (0, pg_core_1.text)('full_definition').notNull(),
    // Categorization
    mainCategories: (0, pg_core_1.text)('main_categories').array().default([]), // AI-parsed main categories
    subCategories: (0, pg_core_1.text)('sub_categories').array().default([]), // AI-parsed subcategories
    relatedConcepts: (0, pg_core_1.text)('related_concepts').array().default([]), // Related terms
    applicationDomains: (0, pg_core_1.text)('application_domains').array().default([]), // Finance, Healthcare, etc.
    techniques: (0, pg_core_1.text)('techniques').array().default([]), // Algorithms, techniques
    // Metadata
    difficultyLevel: (0, pg_core_1.varchar)('difficulty_level', { length: 20 }), // Beginner, Intermediate, Advanced, Expert
    hasImplementation: (0, pg_core_1.boolean)('has_implementation').default(false),
    hasInteractiveElements: (0, pg_core_1.boolean)('has_interactive_elements').default(false),
    hasCaseStudies: (0, pg_core_1.boolean)('has_case_studies').default(false),
    hasCodeExamples: (0, pg_core_1.boolean)('has_code_examples').default(false),
    // Search and filtering
    searchText: (0, pg_core_1.text)('search_text'), // Pre-processed searchable text from all sections
    keywords: (0, pg_core_1.text)('keywords').array().default([]), // Extracted keywords for search
    // Analytics
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    lastViewed: (0, pg_core_1.timestamp)('last_viewed'),
    // Parsing metadata
    parseHash: (0, pg_core_1.varchar)('parse_hash', { length: 32 }), // Hash of original data to detect changes
    parseVersion: (0, pg_core_1.varchar)('parse_version', { length: 10 }).default('1.0'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('enhanced_terms_name_idx').on(table.name),
    slugIdx: (0, pg_core_1.index)('enhanced_terms_slug_idx').on(table.slug),
    difficultyIdx: (0, pg_core_1.index)('enhanced_terms_difficulty_idx').on(table.difficultyLevel),
    mainCategoriesIdx: (0, pg_core_1.index)('enhanced_terms_main_categories_idx').on(table.mainCategories),
    searchTextIdx: (0, pg_core_1.index)('enhanced_terms_search_text_idx').on(table.searchText),
}));
// Interactive elements table - stores references to interactive content
exports.interactiveElements = (0, pg_core_1.pgTable)('interactive_elements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: (0, pg_core_1.varchar)('section_name', { length: 100 }).notNull(),
    elementType: (0, pg_core_1.varchar)('element_type', { length: 50 }).notNull(), // 'mermaid', 'quiz', 'demo', 'code'
    elementData: (0, pg_core_1.jsonb)('element_data').notNull(), // Configuration and content
    displayOrder: (0, pg_core_1.integer)('display_order').default(0),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    termElementIdx: (0, pg_core_1.index)('interactive_elements_term_idx').on(table.termId),
    typeIdx: (0, pg_core_1.index)('interactive_elements_type_idx').on(table.elementType),
}));
// Term relationships - for related concepts and prerequisites
exports.termRelationships = (0, pg_core_1.pgTable)('term_relationships', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    fromTermId: (0, pg_core_1.uuid)('from_term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    toTermId: (0, pg_core_1.uuid)('to_term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    relationshipType: (0, pg_core_1.varchar)('relationship_type', { length: 50 }).notNull(), // 'prerequisite', 'related', 'extends', 'alternative'
    strength: (0, pg_core_1.integer)('strength').default(5), // 1-10 relationship strength
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    fromTermIdx: (0, pg_core_1.index)('term_relationships_from_idx').on(table.fromTermId),
    toTermIdx: (0, pg_core_1.index)('term_relationships_to_idx').on(table.toTermId),
    typeIdx: (0, pg_core_1.index)('term_relationships_type_idx').on(table.relationshipType),
}));
// Display configurations - customizable layouts per term
exports.displayConfigs = (0, pg_core_1.pgTable)('display_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    configType: (0, pg_core_1.varchar)('config_type', { length: 50 }).notNull(), // 'card', 'detail', 'mobile'
    layout: (0, pg_core_1.jsonb)('layout').notNull(), // Layout configuration
    isDefault: (0, pg_core_1.boolean)('is_default').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    termConfigIdx: (0, pg_core_1.index)('display_configs_term_idx').on(table.termId, table.configType),
}));
// User preferences for personalized display
exports.enhancedUserSettings = (0, pg_core_1.pgTable)('enhanced_user_settings', {
    userId: (0, pg_core_1.varchar)('user_id')
        .primaryKey()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    // Display preferences
    experienceLevel: (0, pg_core_1.varchar)('experience_level', { length: 20 }).default('intermediate'), // beginner, intermediate, advanced, expert
    preferredSections: (0, pg_core_1.text)('preferred_sections').array().default([]), // Sections to prioritize
    hiddenSections: (0, pg_core_1.text)('hidden_sections').array().default([]), // Sections to hide
    // Content preferences
    showMathematicalDetails: (0, pg_core_1.boolean)('show_mathematical_details').default(true),
    showCodeExamples: (0, pg_core_1.boolean)('show_code_examples').default(true),
    showInteractiveElements: (0, pg_core_1.boolean)('show_interactive_elements').default(true),
    // Personalization
    favoriteCategories: (0, pg_core_1.text)('favorite_categories').array().default([]),
    favoriteApplications: (0, pg_core_1.text)('favorite_applications').array().default([]),
    // UI preferences
    compactMode: (0, pg_core_1.boolean)('compact_mode').default(false),
    darkMode: (0, pg_core_1.boolean)('dark_mode').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// Analytics for content optimization
exports.contentAnalytics = (0, pg_core_1.pgTable)('content_analytics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: (0, pg_core_1.varchar)('section_name', { length: 100 }), // null for overall term analytics
    // Engagement metrics
    views: (0, pg_core_1.integer)('views').default(0),
    timeSpent: (0, pg_core_1.integer)('time_spent_seconds').default(0), // Total time spent
    interactionCount: (0, pg_core_1.integer)('interaction_count').default(0), // Clicks, expansions, etc.
    // Quality metrics
    userRating: (0, pg_core_1.integer)('user_rating'), // 1-5 stars
    helpfulnessVotes: (0, pg_core_1.integer)('helpfulness_votes').default(0),
    // Temporal data
    lastUpdated: (0, pg_core_1.timestamp)('last_updated').defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    termAnalyticsIdx: (0, pg_core_1.index)('content_analytics_term_idx').on(table.termId),
    sectionAnalyticsIdx: (0, pg_core_1.index)('content_analytics_section_idx').on(table.sectionName),
}));
// AI Content Feedback and Verification System
exports.aiContentFeedback = (0, pg_core_1.pgTable)('ai_content_feedback', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.varchar)('user_id').references(() => schema_1.users.id, { onDelete: 'cascade' }),
    // Feedback details
    feedbackType: (0, pg_core_1.varchar)('feedback_type', { length: 50 }).notNull(), // 'incorrect', 'incomplete', 'misleading', 'outdated', 'other'
    section: (0, pg_core_1.varchar)('section', { length: 100 }), // Which part of the content (definition, characteristics, etc.)
    description: (0, pg_core_1.text)('description').notNull(), // User's description of the issue
    severity: (0, pg_core_1.varchar)('severity', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'critical'
    // Status tracking
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'), // 'pending', 'reviewing', 'resolved', 'dismissed'
    reviewedBy: (0, pg_core_1.varchar)('reviewed_by').references(() => schema_1.users.id),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at'),
    reviewNotes: (0, pg_core_1.text)('review_notes'),
    // Metadata
    userAgent: (0, pg_core_1.text)('user_agent'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termFeedbackIdx: (0, pg_core_1.index)('ai_feedback_term_idx').on(table.termId),
    statusIdx: (0, pg_core_1.index)('ai_feedback_status_idx').on(table.status),
    userFeedbackIdx: (0, pg_core_1.index)('ai_feedback_user_idx').on(table.userId),
}));
// AI Content Verification Status
exports.aiContentVerification = (0, pg_core_1.pgTable)('ai_content_verification', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    // AI Generation tracking
    isAiGenerated: (0, pg_core_1.boolean)('is_ai_generated').default(false),
    aiModel: (0, pg_core_1.varchar)('ai_model', { length: 50 }), // 'gpt-4o-mini', 'gpt-3.5-turbo', etc.
    generatedAt: (0, pg_core_1.timestamp)('generated_at'),
    generatedBy: (0, pg_core_1.varchar)('generated_by').references(() => schema_1.users.id),
    // Verification status
    verificationStatus: (0, pg_core_1.varchar)('verification_status', { length: 20 }).default('unverified'),
    // 'unverified', 'verified', 'flagged', 'needs_review', 'expert_reviewed'
    verifiedBy: (0, pg_core_1.varchar)('verified_by').references(() => schema_1.users.id),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    // Quality metrics
    accuracyScore: (0, pg_core_1.integer)('accuracy_score'), // 1-100 if assessed
    completenessScore: (0, pg_core_1.integer)('completeness_score'), // 1-100 if assessed
    clarityScore: (0, pg_core_1.integer)('clarity_score'), // 1-100 if assessed
    // Expert review
    expertReviewRequired: (0, pg_core_1.boolean)('expert_review_required').default(false),
    expertReviewer: (0, pg_core_1.varchar)('expert_reviewer').references(() => schema_1.users.id),
    expertReviewNotes: (0, pg_core_1.text)('expert_review_notes'),
    expertReviewedAt: (0, pg_core_1.timestamp)('expert_reviewed_at'),
    // Confidence and reliability
    confidenceLevel: (0, pg_core_1.varchar)('confidence_level', { length: 20 }).default('medium'), // 'low', 'medium', 'high'
    lastReviewedAt: (0, pg_core_1.timestamp)('last_reviewed_at').defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termVerificationIdx: (0, pg_core_1.index)('ai_verification_term_idx').on(table.termId),
    statusVerificationIdx: (0, pg_core_1.index)('ai_verification_status_idx').on(table.verificationStatus),
    aiGeneratedIdx: (0, pg_core_1.index)('ai_verification_generated_idx').on(table.isAiGenerated),
}));
// AI Usage Analytics
exports.aiUsageAnalytics = (0, pg_core_1.pgTable)('ai_usage_analytics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Operation details
    operation: (0, pg_core_1.varchar)('operation', { length: 50 }).notNull(), // 'generate_definition', 'improve_definition', 'semantic_search', 'suggest_terms'
    model: (0, pg_core_1.varchar)('model', { length: 50 }).notNull(), // 'gpt-4o-mini', 'gpt-3.5-turbo'
    // Request details
    userId: (0, pg_core_1.varchar)('user_id').references(() => schema_1.users.id),
    termId: (0, pg_core_1.uuid)('term_id').references(() => exports.enhancedTerms.id),
    inputTokens: (0, pg_core_1.integer)('input_tokens'),
    outputTokens: (0, pg_core_1.integer)('output_tokens'),
    // Performance metrics
    latency: (0, pg_core_1.integer)('latency_ms'), // Response time in milliseconds
    cost: (0, pg_core_1.decimal)('cost', { precision: 10, scale: 6 }), // Cost in USD
    // Quality metrics
    success: (0, pg_core_1.boolean)('success').default(true),
    errorType: (0, pg_core_1.varchar)('error_type', { length: 100 }),
    errorMessage: (0, pg_core_1.text)('error_message'),
    // User feedback
    userAccepted: (0, pg_core_1.boolean)('user_accepted'), // Did user accept the AI output?
    userRating: (0, pg_core_1.integer)('user_rating'), // 1-5 if user rated the output
    // Metadata
    sessionId: (0, pg_core_1.varchar)('session_id', { length: 100 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    metadata: (0, pg_core_1.jsonb)('metadata'), // Additional structured metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    operationIdx: (0, pg_core_1.index)('ai_usage_operation_idx').on(table.operation),
    modelIdx: (0, pg_core_1.index)('ai_usage_model_idx').on(table.model),
    userUsageIdx: (0, pg_core_1.index)('ai_usage_user_idx').on(table.userId),
    dateIdx: (0, pg_core_1.index)('ai_usage_date_idx').on(table.createdAt),
}));
// Term Versions table - for AI-powered versioning system
exports.termVersions = (0, pg_core_1.pgTable)('term_versions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    version: (0, pg_core_1.varchar)('version', { length: 20 }).notNull(), // e.g., "1.0", "1.1", "2.0-review"
    // Content storage
    content: (0, pg_core_1.jsonb)('content').notNull(), // Full term content for this version
    // Quality metrics
    qualityMetrics: (0, pg_core_1.jsonb)('quality_metrics').notNull(), // ContentQualityMetrics JSON
    // Version status
    isActive: (0, pg_core_1.boolean)('is_active').default(false), // Only one active version per term
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').notNull(), // Processing metadata, decision info, etc.
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termVersionIdx: (0, pg_core_1.index)('term_version_term_idx').on(table.termId),
    activeVersionIdx: (0, pg_core_1.index)('term_version_active_idx').on(table.termId, table.isActive),
    versionIdx: (0, pg_core_1.index)('term_version_version_idx').on(table.version),
    createdAtIdx: (0, pg_core_1.index)('term_version_created_idx').on(table.createdAt),
}));
// Sections table - for the 42-section architecture
exports.sections = (0, pg_core_1.pgTable)('sections', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    displayOrder: (0, pg_core_1.integer)('display_order').notNull().default(0),
    isCompleted: (0, pg_core_1.boolean)('is_completed').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termNameUnique: (0, pg_core_1.unique)().on(table.termId, table.name),
    termIdIdx: (0, pg_core_1.index)('idx_sections_term_id').on(table.termId),
    nameIdx: (0, pg_core_1.index)('idx_sections_name').on(table.name),
    orderIdx: (0, pg_core_1.index)('idx_sections_order').on(table.termId, table.displayOrder),
}));
// Section items table - content within each section
exports.sectionItems = (0, pg_core_1.pgTable)('section_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    sectionId: (0, pg_core_1.integer)('section_id')
        .notNull()
        .references(() => exports.sections.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }), // Link to specific term for 295-column structure
    columnId: (0, pg_core_1.varchar)('column_id', { length: 100 }), // ID from 295-column structure
    label: (0, pg_core_1.varchar)('label', { length: 200 }).notNull(),
    content: (0, pg_core_1.text)('content'),
    contentType: (0, pg_core_1.varchar)('content_type', { length: 50 }).default('markdown'),
    displayOrder: (0, pg_core_1.integer)('display_order').notNull().default(0),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    isAiGenerated: (0, pg_core_1.boolean)('is_ai_generated').default(false),
    verificationStatus: (0, pg_core_1.varchar)('verification_status', { length: 20 }).default('unverified'),
    // Enhanced Quality Tracking fields
    evaluationScore: (0, pg_core_1.integer)('evaluation_score').default(0), // 1-10 quality score
    evaluationFeedback: (0, pg_core_1.text)('evaluation_feedback'), // AI evaluation feedback
    improvedContent: (0, pg_core_1.text)('improved_content'), // AI-improved version of content
    processingPhase: (0, pg_core_1.varchar)('processing_phase', { length: 20 }).default('generated'), // 'generated', 'evaluated', 'improved', 'final'
    promptVersion: (0, pg_core_1.varchar)('prompt_version', { length: 20 }).default('v1.0'), // Track prompt template version
    generationCost: (0, pg_core_1.decimal)('generation_cost', { precision: 10, scale: 6 }).default('0'), // Cost for generating this content
    qualityScore: (0, pg_core_1.integer)('quality_score').default(0), // Overall quality score for 295-column content
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    sectionIdIdx: (0, pg_core_1.index)('idx_section_items_section_id').on(table.sectionId),
    contentTypeIdx: (0, pg_core_1.index)('idx_section_items_content_type').on(table.contentType),
    orderIdx: (0, pg_core_1.index)('idx_section_items_order').on(table.sectionId, table.displayOrder),
    verificationIdx: (0, pg_core_1.index)('idx_section_items_verification').on(table.verificationStatus),
    evaluationScoreIdx: (0, pg_core_1.index)('idx_section_items_evaluation_score').on(table.evaluationScore),
    processingPhaseIdx: (0, pg_core_1.index)('idx_section_items_processing_phase').on(table.processingPhase),
    termColumnIdx: (0, pg_core_1.index)('idx_section_items_term_column').on(table.termId, table.columnId),
    termIdIdx: (0, pg_core_1.index)('idx_section_items_term_id').on(table.termId),
    columnIdIdx: (0, pg_core_1.index)('idx_section_items_column_id').on(table.columnId),
}));
// Model content versions table - stores different model outputs for comparison
exports.modelContentVersions = (0, pg_core_1.pgTable)('model_content_versions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    sectionName: (0, pg_core_1.varchar)('section_name', { length: 100 }).notNull(),
    // Model information
    model: (0, pg_core_1.varchar)('model', { length: 50 }).notNull(), // 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc.
    modelVersion: (0, pg_core_1.varchar)('model_version', { length: 50 }), // '4.0', '3.5-turbo-1106', etc.
    // Generation parameters
    temperature: (0, pg_core_1.decimal)('temperature', { precision: 3, scale: 2 }).default('0.7'),
    maxTokens: (0, pg_core_1.integer)('max_tokens').default(1000),
    templateId: (0, pg_core_1.varchar)('template_id', { length: 100 }),
    // Content
    content: (0, pg_core_1.text)('content').notNull(),
    // Metrics
    promptTokens: (0, pg_core_1.integer)('prompt_tokens').default(0),
    completionTokens: (0, pg_core_1.integer)('completion_tokens').default(0),
    totalTokens: (0, pg_core_1.integer)('total_tokens').default(0),
    cost: (0, pg_core_1.decimal)('cost', { precision: 10, scale: 6 }).default('0'),
    processingTime: (0, pg_core_1.integer)('processing_time_ms').default(0),
    // Quality metrics (if evaluated)
    qualityScore: (0, pg_core_1.decimal)('quality_score', { precision: 3, scale: 1 }), // 1-10 scale
    qualityMetrics: (0, pg_core_1.jsonb)('quality_metrics'), // Detailed quality breakdown
    // User interaction
    isSelected: (0, pg_core_1.boolean)('is_selected').default(false), // User's current choice
    userRating: (0, pg_core_1.integer)('user_rating'), // 1-5 stars from user
    userNotes: (0, pg_core_1.text)('user_notes'), // Admin notes about this version
    // Status
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('generated'), // 'generated', 'evaluated', 'selected', 'archived'
    // Metadata
    generatedBy: (0, pg_core_1.varchar)('generated_by').references(() => schema_1.users.id),
    metadata: (0, pg_core_1.jsonb)('metadata'), // Additional context, generation settings, etc.
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termSectionIdx: (0, pg_core_1.index)('idx_model_versions_term_section').on(table.termId, table.sectionName),
    modelIdx: (0, pg_core_1.index)('idx_model_versions_model').on(table.model),
    selectedIdx: (0, pg_core_1.index)('idx_model_versions_selected').on(table.isSelected),
    qualityIdx: (0, pg_core_1.index)('idx_model_versions_quality').on(table.qualityScore),
    statusIdx: (0, pg_core_1.index)('idx_model_versions_status').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('idx_model_versions_created').on(table.createdAt),
}));
// Enhanced schemas for validation
exports.insertTermSectionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.termSections).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertEnhancedTermSchema = (0, drizzle_zod_1.createInsertSchema)(exports.enhancedTerms).omit({
    id: true,
    viewCount: true,
    lastViewed: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertInteractiveElementSchema = (0, drizzle_zod_1.createInsertSchema)(exports.interactiveElements).omit({
    id: true,
    createdAt: true,
});
exports.insertTermRelationshipSchema = (0, drizzle_zod_1.createInsertSchema)(exports.termRelationships).omit({
    id: true,
    createdAt: true,
});
exports.insertSectionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sections).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertSectionItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sectionItems).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertModelContentVersionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.modelContentVersions).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Re-export Learning Paths and Code Examples tables
var schema_2 = require("./schema");
Object.defineProperty(exports, "codeExampleRuns", { enumerable: true, get: function () { return schema_2.codeExampleRuns; } });
Object.defineProperty(exports, "codeExamples", { enumerable: true, get: function () { return schema_2.codeExamples; } });
Object.defineProperty(exports, "codeExampleVotes", { enumerable: true, get: function () { return schema_2.codeExampleVotes; } });
Object.defineProperty(exports, "learningPathSteps", { enumerable: true, get: function () { return schema_2.learningPathSteps; } });
Object.defineProperty(exports, "learningPaths", { enumerable: true, get: function () { return schema_2.learningPaths; } });
Object.defineProperty(exports, "stepCompletions", { enumerable: true, get: function () { return schema_2.stepCompletions; } });
Object.defineProperty(exports, "userLearningProgress", { enumerable: true, get: function () { return schema_2.userLearningProgress; } });
// User Progress Tracking and Gamification Tables
// These tables support the "Smart Persistence with Natural Upgrade Pressure" strategy
// User Term History - tracks all term interactions (never deleted)
// This creates user investment by showing their learning journey
exports.userTermHistory = (0, pg_core_1.pgTable)('user_term_history', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    // Core tracking fields
    firstViewedAt: (0, pg_core_1.timestamp)('first_viewed_at').defaultNow(),
    lastAccessedAt: (0, pg_core_1.timestamp)('last_accessed_at').defaultNow(),
    viewCount: (0, pg_core_1.integer)('view_count').default(1),
    // Section engagement tracking
    sectionsViewed: (0, pg_core_1.text)('sections_viewed').array().default([]), // Array of section names viewed
    // Bookmarking functionality
    isBookmarked: (0, pg_core_1.boolean)('is_bookmarked').default(false),
    bookmarkDate: (0, pg_core_1.timestamp)('bookmark_date'),
    // Progress indicators
    timeSpentSeconds: (0, pg_core_1.integer)('time_spent_seconds').default(0),
    completionPercentage: (0, pg_core_1.integer)('completion_percentage').default(0), // 0-100
    // Metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userTermIdx: (0, pg_core_1.index)('user_term_history_user_term_idx').on(table.userId, table.termId),
    userIdx: (0, pg_core_1.index)('user_term_history_user_idx').on(table.userId),
    termIdx: (0, pg_core_1.index)('user_term_history_term_idx').on(table.termId),
    lastAccessedIdx: (0, pg_core_1.index)('user_term_history_last_accessed_idx').on(table.lastAccessedAt),
    bookmarkedIdx: (0, pg_core_1.index)('user_term_history_bookmarked_idx').on(table.isBookmarked),
    viewCountIdx: (0, pg_core_1.index)('user_term_history_view_count_idx').on(table.viewCount),
    // Unique constraint to prevent duplicate entries
    uniqueUserTerm: (0, pg_core_1.unique)('user_term_history_unique').on(table.userId, table.termId),
}));
// User Achievements - tracks streaks, milestones, badges
// This gamifies the experience and creates reasons to maintain engagement
exports.userAchievements = (0, pg_core_1.pgTable)('user_achievements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    // Achievement details
    achievementType: (0, pg_core_1.varchar)('achievement_type', { length: 50 }).notNull(),
    // Types: 'daily_streak', 'weekly_streak', 'monthly_streak', 'terms_viewed', 'sections_completed', 'bookmarks_created', 'categories_explored'
    achievementValue: (0, pg_core_1.integer)('achievement_value').notNull(), // The milestone value (e.g., 7 for 7-day streak)
    // Streak tracking
    currentStreak: (0, pg_core_1.integer)('current_streak').default(0),
    bestStreak: (0, pg_core_1.integer)('best_streak').default(0),
    lastStreakDate: (0, pg_core_1.timestamp)('last_streak_date'),
    // Achievement status
    isActive: (0, pg_core_1.boolean)('is_active').default(true), // For streak-based achievements
    unlockedAt: (0, pg_core_1.timestamp)('unlocked_at').defaultNow(),
    // Progress tracking
    progress: (0, pg_core_1.integer)('progress').default(0), // Current progress toward next milestone
    nextMilestone: (0, pg_core_1.integer)('next_milestone'), // Next achievement value to unlock
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata'), // Additional achievement-specific data
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userIdx: (0, pg_core_1.index)('user_achievements_user_idx').on(table.userId),
    typeIdx: (0, pg_core_1.index)('user_achievements_type_idx').on(table.achievementType),
    activeIdx: (0, pg_core_1.index)('user_achievements_active_idx').on(table.isActive),
    streakIdx: (0, pg_core_1.index)('user_achievements_streak_idx').on(table.currentStreak),
    unlockedIdx: (0, pg_core_1.index)('user_achievements_unlocked_idx').on(table.unlockedAt),
    // Unique constraint for each achievement type per user
    uniqueUserAchievement: (0, pg_core_1.unique)('user_achievements_unique').on(table.userId, table.achievementType),
}));
// Daily Term Selections - tracks daily algorithm selections
// This supports personalized content delivery and upgrade pressure through analytics
exports.dailyTermSelections = (0, pg_core_1.pgTable)('daily_term_selections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    // Selection details
    selectionDate: (0, pg_core_1.timestamp)('selection_date').defaultNow(),
    positionInDailyList: (0, pg_core_1.integer)('position_in_daily_list').notNull(), // 1-based position (1 = first)
    // Algorithm details
    algorithmReason: (0, pg_core_1.varchar)('algorithm_reason', { length: 100 }).notNull(),
    // Reasons: 'trending', 'personalized', 'difficulty_matched', 'category_preference', 'streak_motivation', 'random_discovery'
    // Engagement tracking
    wasViewed: (0, pg_core_1.boolean)('was_viewed').default(false),
    wasBookmarked: (0, pg_core_1.boolean)('was_bookmarked').default(false),
    timeSpentSeconds: (0, pg_core_1.integer)('time_spent_seconds').default(0),
    // User interaction
    userRating: (0, pg_core_1.integer)('user_rating'), // 1-5 stars if user rates the selection
    wasSkipped: (0, pg_core_1.boolean)('was_skipped').default(false),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata'), // Algorithm-specific data, user preferences at time of selection
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userDateIdx: (0, pg_core_1.index)('daily_term_selections_user_date_idx').on(table.userId, table.selectionDate),
    userIdx: (0, pg_core_1.index)('daily_term_selections_user_idx').on(table.userId),
    termIdx: (0, pg_core_1.index)('daily_term_selections_term_idx').on(table.termId),
    dateIdx: (0, pg_core_1.index)('daily_term_selections_date_idx').on(table.selectionDate),
    algorithmIdx: (0, pg_core_1.index)('daily_term_selections_algorithm_idx').on(table.algorithmReason),
    viewedIdx: (0, pg_core_1.index)('daily_term_selections_viewed_idx').on(table.wasViewed),
    positionIdx: (0, pg_core_1.index)('daily_term_selections_position_idx').on(table.positionInDailyList),
    // Unique constraint to prevent duplicate selections for same user/term/date
    uniqueUserTermDate: (0, pg_core_1.unique)('daily_term_selections_unique').on(table.userId, table.termId, table.selectionDate),
}));
// Insert schemas for gamification tables
exports.insertUserTermHistorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.userTermHistory).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertUserAchievementsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userAchievements).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertDailyTermSelectionsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyTermSelections).omit({
    id: true,
    createdAt: true,
});
// Companies in AI/ML space (from migration)
exports.companies = (0, pg_core_1.pgTable)('companies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    foundingYear: (0, pg_core_1.integer)('founding_year'),
    headquarters: (0, pg_core_1.varchar)('headquarters', { length: 200 }),
    companySize: (0, pg_core_1.varchar)('company_size', { length: 50 }),
    specializations: (0, pg_core_1.text)('specializations').array().default([]),
    websiteUrl: (0, pg_core_1.text)('website_url'),
    logoUrl: (0, pg_core_1.text)('logo_url'),
    fundingInfo: (0, pg_core_1.jsonb)('funding_info').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    specializationsIdx: (0, pg_core_1.index)('companies_specializations_idx').on(table.specializations),
    nameIdx: (0, pg_core_1.index)('companies_name_idx').on(table.name),
}));
// People in AI/ML space (from migration)
exports.people = (0, pg_core_1.pgTable)('people', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 200 }),
    bio: (0, pg_core_1.text)('bio'),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    areasOfExpertise: (0, pg_core_1.text)('areas_of_expertise').array().default([]),
    socialLinks: (0, pg_core_1.jsonb)('social_links').default({}),
    imageUrl: (0, pg_core_1.text)('image_url'),
    notableWorks: (0, pg_core_1.text)('notable_works').array().default([]),
    location: (0, pg_core_1.varchar)('location', { length: 200 }),
    websiteUrl: (0, pg_core_1.text)('website_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    companyIdx: (0, pg_core_1.index)('people_company_idx').on(table.companyId),
    expertiseIdx: (0, pg_core_1.index)('people_expertise_idx').on(table.areasOfExpertise),
    nameIdx: (0, pg_core_1.index)('people_name_idx').on(table.name),
}));
// Datasets (from migration)
exports.datasets = (0, pg_core_1.pgTable)('datasets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    sourceUrl: (0, pg_core_1.text)('source_url'),
    license: (0, pg_core_1.varchar)('license', { length: 100 }),
    sizeInfo: (0, pg_core_1.varchar)('size_info', { length: 100 }),
    format: (0, pg_core_1.varchar)('format', { length: 50 }),
    categories: (0, pg_core_1.text)('categories').array().default([]),
    downloadCount: (0, pg_core_1.integer)('download_count').default(0),
    lastUpdated: (0, pg_core_1.timestamp)('last_updated'),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    categoriesIdx: (0, pg_core_1.index)('datasets_categories_idx').on(table.categories),
    nameIdx: (0, pg_core_1.index)('datasets_name_idx').on(table.name),
}));
// Resources/tools/websites (from migration)
exports.resources = (0, pg_core_1.pgTable)('resources', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    url: (0, pg_core_1.text)('url').notNull(),
    description: (0, pg_core_1.text)('description'),
    resourceType: (0, pg_core_1.varchar)('resource_type', { length: 50 }), // 'tutorial', 'tool', 'documentation', 'blog'
    difficultyLevel: (0, pg_core_1.varchar)('difficulty_level', { length: 20 }), // 'beginner', 'intermediate', 'advanced'
    tags: (0, pg_core_1.text)('tags').array().default([]),
    rating: (0, pg_core_1.decimal)('rating', { precision: 3, scale: 2 }),
    reviewCount: (0, pg_core_1.integer)('review_count').default(0),
    lastChecked: (0, pg_core_1.timestamp)('last_checked'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    tagsIdx: (0, pg_core_1.index)('resources_tags_idx').on(table.tags),
    typeIdx: (0, pg_core_1.index)('resources_type_idx').on(table.resourceType),
    ratingIdx: (0, pg_core_1.index)('resources_rating_idx').on(table.rating),
}));
// Entity linking tables - connects terms to people, companies, datasets, resources
exports.entityLinks = (0, pg_core_1.pgTable)('entity_links', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    // Entity reference (one of these will be populated)
    personId: (0, pg_core_1.uuid)('person_id').references(() => exports.people.id, { onDelete: 'cascade' }),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id, { onDelete: 'cascade' }),
    datasetId: (0, pg_core_1.uuid)('dataset_id').references(() => exports.datasets.id, { onDelete: 'cascade' }),
    resourceId: (0, pg_core_1.uuid)('resource_id').references(() => exports.resources.id, { onDelete: 'cascade' }),
    // Link metadata
    linkType: (0, pg_core_1.varchar)('link_type', { length: 50 }).notNull(), // 'created_by', 'works_for', 'uses_dataset', 'recommends_resource', etc.
    relevanceScore: (0, pg_core_1.integer)('relevance_score').default(5), // 1-10 relevance rating
    description: (0, pg_core_1.text)('description'), // Optional description of the relationship
    // Admin tracking
    createdBy: (0, pg_core_1.varchar)('created_by').references(() => schema_1.users.id),
    verifiedBy: (0, pg_core_1.varchar)('verified_by').references(() => schema_1.users.id),
    verificationStatus: (0, pg_core_1.varchar)('verification_status', { length: 20 }).default('unverified'), // 'unverified', 'verified', 'flagged'
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termIdx: (0, pg_core_1.index)('entity_links_term_idx').on(table.termId),
    personIdx: (0, pg_core_1.index)('entity_links_person_idx').on(table.personId),
    companyIdx: (0, pg_core_1.index)('entity_links_company_idx').on(table.companyId),
    datasetIdx: (0, pg_core_1.index)('entity_links_dataset_idx').on(table.datasetId),
    resourceIdx: (0, pg_core_1.index)('entity_links_resource_idx').on(table.resourceId),
    typeIdx: (0, pg_core_1.index)('entity_links_type_idx').on(table.linkType),
    verificationIdx: (0, pg_core_1.index)('entity_links_verification_idx').on(table.verificationStatus),
}));
// Community contributions system
exports.contributions = (0, pg_core_1.pgTable)('contributions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    // Contribution type and target
    contributionType: (0, pg_core_1.varchar)('contribution_type', { length: 50 }).notNull(),
    // 'term_edit', 'new_person', 'new_company', 'new_dataset', 'new_resource', 'entity_link', 'content_correction'
    // Target entity (one of these will be populated)
    termId: (0, pg_core_1.uuid)('term_id').references(() => exports.enhancedTerms.id, { onDelete: 'cascade' }),
    personId: (0, pg_core_1.uuid)('person_id').references(() => exports.people.id, { onDelete: 'cascade' }),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id, { onDelete: 'cascade' }),
    datasetId: (0, pg_core_1.uuid)('dataset_id').references(() => exports.datasets.id, { onDelete: 'cascade' }),
    resourceId: (0, pg_core_1.uuid)('resource_id').references(() => exports.resources.id, { onDelete: 'cascade' }),
    // Contribution content
    originalData: (0, pg_core_1.jsonb)('original_data'), // Original entity data
    proposedData: (0, pg_core_1.jsonb)('proposed_data').notNull(), // User's proposed changes/additions
    changeDescription: (0, pg_core_1.text)('change_description').notNull(), // User's explanation
    // Moderation workflow
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected', 'needs_review'
    moderatedBy: (0, pg_core_1.varchar)('moderated_by').references(() => schema_1.users.id),
    moderatedAt: (0, pg_core_1.timestamp)('moderated_at'),
    moderationNotes: (0, pg_core_1.text)('moderation_notes'),
    // Quality tracking
    communityScore: (0, pg_core_1.integer)('community_score').default(0), // Community upvotes/downvotes
    qualityFlags: (0, pg_core_1.text)('quality_flags').array().default([]), // 'spam', 'inappropriate', 'inaccurate', etc.
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userIdx: (0, pg_core_1.index)('contributions_user_idx').on(table.userId),
    typeIdx: (0, pg_core_1.index)('contributions_type_idx').on(table.contributionType),
    statusIdx: (0, pg_core_1.index)('contributions_status_idx').on(table.status),
    termIdx: (0, pg_core_1.index)('contributions_term_idx').on(table.termId),
    scoreIdx: (0, pg_core_1.index)('contributions_score_idx').on(table.communityScore),
    createdAtIdx: (0, pg_core_1.index)('contributions_created_idx').on(table.createdAt),
}));
// User reputation and gamification for contributions
exports.userReputation = (0, pg_core_1.pgTable)('user_reputation', {
    userId: (0, pg_core_1.varchar)('user_id')
        .primaryKey()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    // Reputation scores
    totalScore: (0, pg_core_1.integer)('total_score').default(0),
    contributionScore: (0, pg_core_1.integer)('contribution_score').default(0), // From approved contributions
    moderationScore: (0, pg_core_1.integer)('moderation_score').default(0), // From moderation activities
    communityScore: (0, pg_core_1.integer)('community_score').default(0), // From community interactions
    // Achievement counters
    approvedContributions: (0, pg_core_1.integer)('approved_contributions').default(0),
    helpfulVotes: (0, pg_core_1.integer)('helpful_votes').default(0),
    moderationActions: (0, pg_core_1.integer)('moderation_actions').default(0),
    // Badges and levels
    badges: (0, pg_core_1.text)('badges').array().default([]), // Array of earned badge IDs
    reputationLevel: (0, pg_core_1.varchar)('reputation_level', { length: 20 }).default('novice'),
    // 'novice', 'contributor', 'expert', 'moderator', 'master'
    // Privileges
    canModerate: (0, pg_core_1.boolean)('can_moderate').default(false),
    canCreateDirectly: (0, pg_core_1.boolean)('can_create_directly').default(false), // Skip moderation for trusted users
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    totalScoreIdx: (0, pg_core_1.index)('user_reputation_total_score_idx').on(table.totalScore),
    levelIdx: (0, pg_core_1.index)('user_reputation_level_idx').on(table.reputationLevel),
    contributionScoreIdx: (0, pg_core_1.index)('user_reputation_contribution_idx').on(table.contributionScore),
}));
// Subscription plans (from migration)
exports.subscriptionPlans = (0, pg_core_1.pgTable)('subscription_plans', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    priceMonthly: (0, pg_core_1.decimal)('price_monthly', { precision: 10, scale: 2 }),
    priceYearly: (0, pg_core_1.decimal)('price_yearly', { precision: 10, scale: 2 }),
    features: (0, pg_core_1.jsonb)('features').notNull(),
    maxUsers: (0, pg_core_1.integer)('max_users'),
    stripePriceId: (0, pg_core_1.varchar)('stripe_price_id', { length: 100 }),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('subscription_plans_name_idx').on(table.name),
    activeIdx: (0, pg_core_1.index)('subscription_plans_active_idx').on(table.isActive),
}));
// User subscriptions (from migration)
exports.userSubscriptions = (0, pg_core_1.pgTable)('user_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    planId: (0, pg_core_1.uuid)('plan_id')
        .notNull()
        .references(() => exports.subscriptionPlans.id),
    stripeSubscriptionId: (0, pg_core_1.varchar)('stripe_subscription_id', { length: 100 }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(), // 'active', 'canceled', 'past_due'
    currentPeriodStart: (0, pg_core_1.timestamp)('current_period_start'),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userIdx: (0, pg_core_1.index)('user_subscriptions_user_idx').on(table.userId),
    statusIdx: (0, pg_core_1.index)('user_subscriptions_status_idx').on(table.status),
    planIdx: (0, pg_core_1.index)('user_subscriptions_plan_idx').on(table.planId),
}));
// Teams for enterprise features
exports.teams = (0, pg_core_1.pgTable)('teams', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    subscriptionId: (0, pg_core_1.uuid)('subscription_id').references(() => exports.userSubscriptions.id),
    // Team settings
    settings: (0, pg_core_1.jsonb)('settings').default({}),
    maxMembers: (0, pg_core_1.integer)('max_members').default(10),
    // Owner information
    ownerId: (0, pg_core_1.varchar)('owner_id')
        .notNull()
        .references(() => schema_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    ownerIdx: (0, pg_core_1.index)('teams_owner_idx').on(table.ownerId),
    nameIdx: (0, pg_core_1.index)('teams_name_idx').on(table.name),
}));
// Team memberships
exports.teamMemberships = (0, pg_core_1.pgTable)('team_memberships', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    teamId: (0, pg_core_1.uuid)('team_id')
        .notNull()
        .references(() => exports.teams.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => schema_1.users.id, { onDelete: 'cascade' }),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).default('member'), // 'member', 'admin', 'owner'
    permissions: (0, pg_core_1.text)('permissions').array().default([]), // Specific permissions
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow(),
    invitedBy: (0, pg_core_1.varchar)('invited_by').references(() => schema_1.users.id),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'), // 'active', 'invited', 'suspended'
}, table => ({
    teamIdx: (0, pg_core_1.index)('team_memberships_team_idx').on(table.teamId),
    userIdx: (0, pg_core_1.index)('team_memberships_user_idx').on(table.userId),
    roleIdx: (0, pg_core_1.index)('team_memberships_role_idx').on(table.role),
    statusIdx: (0, pg_core_1.index)('team_memberships_status_idx').on(table.status),
    uniqueTeamUser: (0, pg_core_1.unique)('team_memberships_unique').on(table.teamId, table.userId),
}));
// API keys for enterprise access
exports.apiKeys = (0, pg_core_1.pgTable)('api_keys', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    keyHash: (0, pg_core_1.varchar)('key_hash', { length: 256 }).notNull().unique(), // Hashed API key
    keyPrefix: (0, pg_core_1.varchar)('key_prefix', { length: 10 }).notNull(), // First few chars for identification
    // Ownership
    userId: (0, pg_core_1.varchar)('user_id').references(() => schema_1.users.id, { onDelete: 'cascade' }),
    teamId: (0, pg_core_1.uuid)('team_id').references(() => exports.teams.id, { onDelete: 'cascade' }),
    // Permissions and limits
    permissions: (0, pg_core_1.text)('permissions').array().default([]), // API endpoints allowed
    rateLimit: (0, pg_core_1.integer)('rate_limit').default(1000), // Requests per hour
    // Usage tracking
    totalRequests: (0, pg_core_1.integer)('total_requests').default(0),
    lastUsed: (0, pg_core_1.timestamp)('last_used'),
    // Status
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    keyHashIdx: (0, pg_core_1.index)('api_keys_hash_idx').on(table.keyHash),
    userIdx: (0, pg_core_1.index)('api_keys_user_idx').on(table.userId),
    teamIdx: (0, pg_core_1.index)('api_keys_team_idx').on(table.teamId),
    activeIdx: (0, pg_core_1.index)('api_keys_active_idx').on(table.isActive),
}));
// Insert schemas for new tables
exports.insertPersonSchema = (0, drizzle_zod_1.createInsertSchema)(exports.people).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertCompanySchema = (0, drizzle_zod_1.createInsertSchema)(exports.companies).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertDatasetSchema = (0, drizzle_zod_1.createInsertSchema)(exports.datasets).omit({
    id: true,
    createdAt: true,
});
exports.insertResourceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.resources).omit({
    id: true,
    createdAt: true,
});
exports.insertEntityLinkSchema = (0, drizzle_zod_1.createInsertSchema)(exports.entityLinks).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertContributionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contributions).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertTeamSchema = (0, drizzle_zod_1.createInsertSchema)(exports.teams).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertTeamMembershipSchema = (0, drizzle_zod_1.createInsertSchema)(exports.teamMemberships).omit({
    id: true,
    joinedAt: true,
});
exports.insertApiKeySchema = (0, drizzle_zod_1.createInsertSchema)(exports.apiKeys).omit({
    id: true,
    totalRequests: true,
    lastUsed: true,
    createdAt: true,
    updatedAt: true,
});
// Re-export A/B testing tables
var abTestingSchema_1 = require("./abTestingSchema");
Object.defineProperty(exports, "abTestEvents", { enumerable: true, get: function () { return abTestingSchema_1.abTestEvents; } });
Object.defineProperty(exports, "abTestMetrics", { enumerable: true, get: function () { return abTestingSchema_1.abTestMetrics; } });
Object.defineProperty(exports, "abTests", { enumerable: true, get: function () { return abTestingSchema_1.abTests; } });
//# sourceMappingURL=enhancedSchema.js.map