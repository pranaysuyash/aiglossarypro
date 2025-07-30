"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketAttachments = exports.ticketMessages = exports.supportTickets = exports.TICKET_TYPES = exports.TICKET_STATUSES = exports.TICKET_PRIORITIES = exports.cacheMetrics = exports.codeExampleVotes = exports.surpriseMetrics = exports.discoveryPreferences = exports.discoverySessions = exports.contentRecommendationCache = exports.personalizationMetrics = exports.userLearningProfile = exports.userRecommendations = exports.userInteractionPatterns = exports.userBehaviorEvents = exports.codeExampleRuns = exports.codeExamples = exports.stepCompletions = exports.userLearningProgress = exports.learningPathSteps = exports.learningPaths = exports.earlyBirdStatus = exports.insertUserProfileSchema = exports.userProfiles = exports.insertTermAnalyticsSchema = exports.termAnalytics = exports.insertUserInteractionSchema = exports.userInteractions = exports.insertEarlyBirdCustomerSchema = exports.earlyBirdCustomers = exports.insertContactSubmissionSchema = exports.contactSubmissions = exports.insertNewsletterSubscriptionSchema = exports.newsletterSubscriptions = exports.userSettings = exports.termViews = exports.userProgress = exports.favorites = exports.termSubcategories = exports.insertTermSchema = exports.terms = exports.insertSubcategorySchema = exports.subcategories = exports.insertCategorySchema = exports.categories = exports.purchases = exports.users = exports.sessions = void 0;
exports.insertReferralClickSchema = exports.insertReferralLinkSchema = exports.insertReferralPayoutSchema = exports.referralClicks = exports.referralLinks = exports.referralPayouts = exports.insertCustomerFeedbackSchema = exports.insertRefundRequestSchema = exports.insertKnowledgeBaseArticleSchema = exports.insertTicketMessageSchema = exports.insertSupportTicketSchema = exports.customerFeedback = exports.customerServiceMetrics = exports.refundRequests = exports.responseTemplates = exports.knowledgeBaseArticles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Session storage table for authentication
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    sid: (0, pg_core_1.varchar)('sid').primaryKey(),
    sess: (0, pg_core_1.jsonb)('sess').notNull(),
    expire: (0, pg_core_1.timestamp)('expire').notNull(),
}, table => [(0, pg_core_1.index)('IDX_session_expire').on(table.expire)]);
// User storage table for authentication
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.varchar)('id').primaryKey().notNull(),
    email: (0, pg_core_1.varchar)('email').unique(),
    firstName: (0, pg_core_1.varchar)('first_name'),
    lastName: (0, pg_core_1.varchar)('last_name'),
    profileImageUrl: (0, pg_core_1.varchar)('profile_image_url'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
    // Firebase authentication fields
    firebaseUid: (0, pg_core_1.varchar)('firebase_uid').unique(),
    authProvider: (0, pg_core_1.varchar)('auth_provider', { length: 50 }).default('firebase'),
    // NEW MONETIZATION FIELDS
    subscriptionTier: (0, pg_core_1.varchar)('subscription_tier', { length: 20 }).default('free'),
    lifetimeAccess: (0, pg_core_1.boolean)('lifetime_access').default(false),
    purchaseDate: (0, pg_core_1.timestamp)('purchase_date'),
    dailyViews: (0, pg_core_1.integer)('daily_views').default(0),
    lastViewReset: (0, pg_core_1.timestamp)('last_view_reset').defaultNow(),
    // REFERRAL SYSTEM
    referrerId: (0, pg_core_1.varchar)('referrer_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// NEW PURCHASES TABLE for Gumroad integration
exports.purchases = (0, pg_core_1.pgTable)('purchases', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id),
    gumroadOrderId: (0, pg_core_1.varchar)('gumroad_order_id').unique().notNull(),
    amount: (0, pg_core_1.integer)('amount'), // in cents
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).default('USD'),
    status: (0, pg_core_1.varchar)('status').default('completed'),
    purchaseData: (0, pg_core_1.jsonb)('purchase_data'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userIdx: (0, pg_core_1.index)('purchases_user_idx').on(table.userId),
    orderIdx: (0, pg_core_1.index)('purchases_order_idx').on(table.gumroadOrderId),
    statusIdx: (0, pg_core_1.index)('purchases_status_idx').on(table.status),
}));
// Categories table
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('categories_name_idx').on(table.name),
}));
exports.insertCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.categories).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Subcategories table
exports.subcategories = (0, pg_core_1.pgTable)('subcategories', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    categoryId: (0, pg_core_1.uuid)('category_id')
        .notNull()
        .references(() => exports.categories.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => {
    return {
        nameIdIdx: (0, pg_core_1.index)('subcategory_name_category_id_idx').on(table.name, table.categoryId),
    };
});
exports.insertSubcategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.subcategories).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Terms table
exports.terms = (0, pg_core_1.pgTable)('terms', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull().unique(),
    shortDefinition: (0, pg_core_1.text)('short_definition'),
    definition: (0, pg_core_1.text)('definition').notNull(),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => exports.categories.id, { onDelete: 'set null' }),
    characteristics: (0, pg_core_1.text)('characteristics').array(),
    visualUrl: (0, pg_core_1.text)('visual_url'),
    visualCaption: (0, pg_core_1.text)('visual_caption'),
    mathFormulation: (0, pg_core_1.text)('math_formulation'),
    applications: (0, pg_core_1.jsonb)('applications'),
    references: (0, pg_core_1.text)('references').array(),
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('terms_name_idx').on(table.name),
    categoryIdx: (0, pg_core_1.index)('terms_category_idx').on(table.categoryId),
    viewCountIdx: (0, pg_core_1.index)('terms_view_count_idx').on(table.viewCount),
    createdAtIdx: (0, pg_core_1.index)('terms_created_at_idx').on(table.createdAt),
    updatedAtIdx: (0, pg_core_1.index)('terms_updated_at_idx').on(table.updatedAt),
    nameSearchIdx: (0, pg_core_1.index)('terms_name_search_idx').on(table.name),
    definitionSearchIdx: (0, pg_core_1.index)('terms_definition_search_idx').on(table.definition),
}));
exports.insertTermSchema = (0, drizzle_zod_1.createInsertSchema)(exports.terms).omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
});
// Term-Subcategory relation table
exports.termSubcategories = (0, pg_core_1.pgTable)('term_subcategories', {
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    subcategoryId: (0, pg_core_1.uuid)('subcategory_id')
        .notNull()
        .references(() => exports.subcategories.id, { onDelete: 'cascade' }),
}, table => ({
    pk: (0, pg_core_1.primaryKey)(table.termId, table.subcategoryId),
    termIdx: (0, pg_core_1.index)('term_subcategories_term_idx').on(table.termId),
    subcategoryIdx: (0, pg_core_1.index)('term_subcategories_subcategory_idx').on(table.subcategoryId),
}));
// User favorites table
exports.favorites = (0, pg_core_1.pgTable)('favorites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userTermIdx: (0, pg_core_1.index)('favorites_user_term_idx').on(table.userId, table.termId),
}));
// User progress table
exports.userProgress = (0, pg_core_1.pgTable)('user_progress', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    learnedAt: (0, pg_core_1.timestamp)('learned_at').defaultNow(),
}, table => ({
    userTermIdx: (0, pg_core_1.index)('progress_user_term_idx').on(table.userId, table.termId),
}));
// Term views table
exports.termViews = (0, pg_core_1.pgTable)('term_views', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    viewedAt: (0, pg_core_1.timestamp)('viewed_at').defaultNow(),
}, table => ({
    userTermIdx: (0, pg_core_1.index)('views_user_term_idx').on(table.userId, table.termId),
    viewedAtIdx: (0, pg_core_1.index)('views_viewed_at_idx').on(table.viewedAt),
}));
// User settings table
exports.userSettings = (0, pg_core_1.pgTable)('user_settings', {
    userId: (0, pg_core_1.varchar)('user_id')
        .primaryKey()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    preferences: (0, pg_core_1.jsonb)('preferences').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// Newsletter subscriptions table
exports.newsletterSubscriptions = (0, pg_core_1.pgTable)('newsletter_subscriptions', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('active'), // active, unsubscribed
    language: (0, pg_core_1.varchar)('language', { length: 10 }).default('en'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }), // Hashed IP for privacy
    utmSource: (0, pg_core_1.varchar)('utm_source', { length: 100 }),
    utmMedium: (0, pg_core_1.varchar)('utm_medium', { length: 100 }),
    utmCampaign: (0, pg_core_1.varchar)('utm_campaign', { length: 100 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    unsubscribedAt: (0, pg_core_1.timestamp)('unsubscribed_at'),
}, table => ({
    emailIdx: (0, pg_core_1.index)('newsletter_email_idx').on(table.email),
    statusIdx: (0, pg_core_1.index)('newsletter_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('newsletter_created_at_idx').on(table.createdAt),
    utmSourceIdx: (0, pg_core_1.index)('newsletter_utm_source_idx').on(table.utmSource),
}));
exports.insertNewsletterSubscriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.newsletterSubscriptions, {
    unsubscribedAt: zod_1.z.date().optional(),
}).pick({
    email: true,
    status: true,
    language: true,
    userAgent: true,
    ipAddress: true,
    utmSource: true,
    utmMedium: true,
    utmCampaign: true,
    unsubscribedAt: true,
});
// Contact form submissions table
exports.contactSubmissions = (0, pg_core_1.pgTable)('contact_submissions', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    subject: (0, pg_core_1.varchar)('subject', { length: 200 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('new'), // new, in_progress, resolved
    language: (0, pg_core_1.varchar)('language', { length: 10 }).default('en'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }), // Hashed IP for privacy
    utmSource: (0, pg_core_1.varchar)('utm_source', { length: 100 }),
    utmMedium: (0, pg_core_1.varchar)('utm_medium', { length: 100 }),
    utmCampaign: (0, pg_core_1.varchar)('utm_campaign', { length: 100 }),
    notes: (0, pg_core_1.text)('notes'), // Admin notes
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    emailIdx: (0, pg_core_1.index)('contact_email_idx').on(table.email),
    statusIdx: (0, pg_core_1.index)('contact_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('contact_created_at_idx').on(table.createdAt),
    utmSourceIdx: (0, pg_core_1.index)('contact_utm_source_idx').on(table.utmSource),
}));
exports.insertContactSubmissionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contactSubmissions, {
    updatedAt: zod_1.z.date().optional(),
}).pick({
    name: true,
    email: true,
    subject: true,
    message: true,
    status: true,
    language: true,
    userAgent: true,
    ipAddress: true,
    utmSource: true,
    utmMedium: true,
    utmCampaign: true,
    notes: true,
    updatedAt: true,
});
// Early bird customers table for First 500 Customers promotion
exports.earlyBirdCustomers = (0, pg_core_1.pgTable)('early_bird_customers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    purchaseOrderId: (0, pg_core_1.varchar)('purchase_order_id', { length: 255 }).unique(), // Gumroad order ID
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('registered'), // registered, purchased, expired
    discountAmount: (0, pg_core_1.integer)('discount_amount').notNull().default(70), // $70 discount
    originalPrice: (0, pg_core_1.integer)('original_price').notNull().default(24900), // $249 in cents
    discountedPrice: (0, pg_core_1.integer)('discounted_price').notNull().default(17900), // $179 in cents
    registeredAt: (0, pg_core_1.timestamp)('registered_at').defaultNow().notNull(),
    purchasedAt: (0, pg_core_1.timestamp)('purchased_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(), // 30 days from registration
    utmSource: (0, pg_core_1.varchar)('utm_source', { length: 100 }),
    utmMedium: (0, pg_core_1.varchar)('utm_medium', { length: 100 }),
    utmCampaign: (0, pg_core_1.varchar)('utm_campaign', { length: 100 }),
    countryCode: (0, pg_core_1.varchar)('country_code', { length: 2 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }), // Hashed IP for privacy
}, table => ({
    emailIdx: (0, pg_core_1.index)('early_bird_customers_email_idx').on(table.email),
    statusIdx: (0, pg_core_1.index)('early_bird_customers_status_idx').on(table.status),
    registeredAtIdx: (0, pg_core_1.index)('early_bird_customers_registered_at_idx').on(table.registeredAt),
    purchasedAtIdx: (0, pg_core_1.index)('early_bird_customers_purchased_at_idx').on(table.purchasedAt),
    utmSourceIdx: (0, pg_core_1.index)('early_bird_customers_utm_source_idx').on(table.utmSource),
}));
exports.insertEarlyBirdCustomerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.earlyBirdCustomers).omit({
    id: true,
    registeredAt: true,
});
// User interactions table for trending analytics
exports.userInteractions = (0, pg_core_1.pgTable)('user_interactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    termId: (0, pg_core_1.uuid)('term_id').references(() => exports.terms.id, { onDelete: 'cascade' }),
    interactionType: (0, pg_core_1.varchar)('interaction_type', { length: 50 }).notNull(), // view, share, bookmark, search
    duration: (0, pg_core_1.integer)('duration'), // Time spent in seconds
    metadata: (0, pg_core_1.jsonb)('metadata').default({}), // Additional interaction data
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow().notNull(),
}, table => ({
    userIdIdx: (0, pg_core_1.index)('user_interactions_user_id_idx').on(table.userId),
    termIdIdx: (0, pg_core_1.index)('user_interactions_term_id_idx').on(table.termId),
    interactionTypeIdx: (0, pg_core_1.index)('user_interactions_type_idx').on(table.interactionType),
    timestampIdx: (0, pg_core_1.index)('user_interactions_timestamp_idx').on(table.timestamp),
    userTermIdx: (0, pg_core_1.index)('user_interactions_user_term_idx').on(table.userId, table.termId),
}));
exports.insertUserInteractionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userInteractions).omit({
    id: true,
    timestamp: true,
});
// Term analytics table for caching trending data
exports.termAnalytics = (0, pg_core_1.pgTable)('term_analytics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    termId: (0, pg_core_1.uuid)('term_id')
        .references(() => exports.terms.id, { onDelete: 'cascade' })
        .unique(),
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    shareCount: (0, pg_core_1.integer)('share_count').default(0),
    bookmarkCount: (0, pg_core_1.integer)('bookmark_count').default(0),
    searchCount: (0, pg_core_1.integer)('search_count').default(0),
    averageTimeSpent: (0, pg_core_1.integer)('average_time_spent').default(0), // in seconds
    lastCalculated: (0, pg_core_1.timestamp)('last_calculated').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termIdIdx: (0, pg_core_1.index)('term_analytics_term_id_idx').on(table.termId),
    viewCountIdx: (0, pg_core_1.index)('term_analytics_view_count_idx').on(table.viewCount),
    lastCalculatedIdx: (0, pg_core_1.index)('term_analytics_last_calculated_idx').on(table.lastCalculated),
}));
exports.insertTermAnalyticsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.termAnalytics).omit({
    id: true,
    lastCalculated: true,
    updatedAt: true,
});
// User profiles table for AI-powered personalization
exports.userProfiles = (0, pg_core_1.pgTable)('user_profiles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .references(() => exports.users.id, { onDelete: 'cascade' })
        .unique(),
    skillLevel: (0, pg_core_1.varchar)('skill_level', { length: 20 }).default('beginner'), // beginner, intermediate, advanced, expert
    learningStyle: (0, pg_core_1.varchar)('learning_style', { length: 20 }).default('mixed'), // visual, theoretical, practical, mixed
    activityLevel: (0, pg_core_1.varchar)('activity_level', { length: 20 }).default('moderate'), // low, moderate, high
    interests: (0, pg_core_1.jsonb)('interests').default([]), // Array of category interests with scores
    preferredContentTypes: (0, pg_core_1.jsonb)('preferred_content_types').default([]), // Array of preferred interaction types
    recentTopics: (0, pg_core_1.jsonb)('recent_topics').default([]), // Array of recent topic names
    engagementScore: (0, pg_core_1.integer)('engagement_score').default(0), // 0-100 engagement score
    personalityVector: (0, pg_core_1.jsonb)('personality_vector').default([]), // ML vector for recommendations
    lastCalculated: (0, pg_core_1.timestamp)('last_calculated').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userIdIdx: (0, pg_core_1.index)('user_profiles_user_id_idx').on(table.userId),
    skillLevelIdx: (0, pg_core_1.index)('user_profiles_skill_level_idx').on(table.skillLevel),
    engagementScoreIdx: (0, pg_core_1.index)('user_profiles_engagement_score_idx').on(table.engagementScore),
    lastCalculatedIdx: (0, pg_core_1.index)('user_profiles_last_calculated_idx').on(table.lastCalculated),
}));
exports.insertUserProfileSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userProfiles).omit({
    id: true,
    lastCalculated: true,
    updatedAt: true,
});
// Early bird status tracking table
exports.earlyBirdStatus = (0, pg_core_1.pgTable)('early_bird_status', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    totalRegistered: (0, pg_core_1.integer)('total_registered').notNull().default(0),
    totalPurchased: (0, pg_core_1.integer)('total_purchased').notNull().default(0),
    maxEarlyBirdSlots: (0, pg_core_1.integer)('max_early_bird_slots').notNull().default(500),
    earlyBirdActive: (0, pg_core_1.boolean)('early_bird_active').notNull().default(true),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Learning Paths system tables
exports.learningPaths = (0, pg_core_1.pgTable)('learning_paths', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    difficulty_level: (0, pg_core_1.varchar)('difficulty_level', { length: 20 }).default('beginner'), // beginner, intermediate, advanced
    estimated_duration: (0, pg_core_1.integer)('estimated_duration'), // in minutes
    category_id: (0, pg_core_1.uuid)('category_id').references(() => exports.categories.id),
    prerequisites: (0, pg_core_1.text)('prerequisites').array(), // array of prerequisite concept names
    learning_objectives: (0, pg_core_1.text)('learning_objectives').array(),
    created_by: (0, pg_core_1.varchar)('created_by').references(() => exports.users.id),
    is_official: (0, pg_core_1.boolean)('is_official').default(false),
    is_published: (0, pg_core_1.boolean)('is_published').default(false),
    view_count: (0, pg_core_1.integer)('view_count').default(0),
    completion_count: (0, pg_core_1.integer)('completion_count').default(0),
    rating: (0, pg_core_1.integer)('rating'), // Stored as percentage * 100 (e.g., 4.5 = 450)
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('learning_paths_name_idx').on(table.name),
    categoryIdx: (0, pg_core_1.index)('learning_paths_category_idx').on(table.category_id),
    difficultyIdx: (0, pg_core_1.index)('learning_paths_difficulty_idx').on(table.difficulty_level),
    publishedIdx: (0, pg_core_1.index)('learning_paths_published_idx').on(table.is_published),
}));
exports.learningPathSteps = (0, pg_core_1.pgTable)('learning_path_steps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    learning_path_id: (0, pg_core_1.uuid)('learning_path_id')
        .notNull()
        .references(() => exports.learningPaths.id, { onDelete: 'cascade' }),
    term_id: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    step_order: (0, pg_core_1.integer)('step_order').notNull(),
    is_optional: (0, pg_core_1.boolean)('is_optional').default(false),
    estimated_time: (0, pg_core_1.integer)('estimated_time'), // in minutes
    step_type: (0, pg_core_1.varchar)('step_type', { length: 20 }).default('concept'), // concept, practice, assessment
    content: (0, pg_core_1.jsonb)('content'), // additional step-specific content
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    pathIdx: (0, pg_core_1.index)('learning_path_steps_path_idx').on(table.learning_path_id),
    orderIdx: (0, pg_core_1.index)('learning_path_steps_order_idx').on(table.learning_path_id, table.step_order),
}));
exports.userLearningProgress = (0, pg_core_1.pgTable)('user_learning_progress', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    learning_path_id: (0, pg_core_1.uuid)('learning_path_id')
        .notNull()
        .references(() => exports.learningPaths.id, { onDelete: 'cascade' }),
    current_step_id: (0, pg_core_1.uuid)('current_step_id').references(() => exports.learningPathSteps.id),
    started_at: (0, pg_core_1.timestamp)('started_at').defaultNow(),
    completed_at: (0, pg_core_1.timestamp)('completed_at'),
    completion_percentage: (0, pg_core_1.integer)('completion_percentage').default(0), // 0-100
    last_accessed_at: (0, pg_core_1.timestamp)('last_accessed_at').defaultNow(),
    time_spent: (0, pg_core_1.integer)('time_spent').default(0), // in minutes
}, table => ({
    userPathIdx: (0, pg_core_1.index)('user_learning_progress_user_path_idx').on(table.user_id, table.learning_path_id),
    userIdx: (0, pg_core_1.index)('user_learning_progress_user_idx').on(table.user_id),
    uniqueUserPath: (0, pg_core_1.index)('user_learning_progress_unique').on(table.user_id, table.learning_path_id),
}));
exports.stepCompletions = (0, pg_core_1.pgTable)('step_completions', {
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    step_id: (0, pg_core_1.uuid)('step_id')
        .notNull()
        .references(() => exports.learningPathSteps.id, { onDelete: 'cascade' }),
    completed_at: (0, pg_core_1.timestamp)('completed_at').defaultNow(),
    time_spent: (0, pg_core_1.integer)('time_spent'), // in minutes
    notes: (0, pg_core_1.text)('notes'), // user notes for this step
}, table => ({
    pk: (0, pg_core_1.primaryKey)(table.user_id, table.step_id),
    userIdx: (0, pg_core_1.index)('step_completions_user_idx').on(table.user_id),
    stepIdx: (0, pg_core_1.index)('step_completions_step_idx').on(table.step_id),
}));
// Code Examples system tables
exports.codeExamples = (0, pg_core_1.pgTable)('code_examples', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    term_id: (0, pg_core_1.uuid)('term_id').references(() => exports.terms.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    language: (0, pg_core_1.varchar)('language', { length: 50 }).notNull(), // python, r, sql, javascript, etc.
    code: (0, pg_core_1.text)('code').notNull(),
    expected_output: (0, pg_core_1.text)('expected_output'),
    libraries: (0, pg_core_1.jsonb)('libraries'), // required libraries/dependencies
    difficulty_level: (0, pg_core_1.varchar)('difficulty_level', { length: 20 }).default('beginner'),
    example_type: (0, pg_core_1.varchar)('example_type', { length: 30 }).default('implementation'), // implementation, visualization, exercise
    is_runnable: (0, pg_core_1.boolean)('is_runnable').default(false),
    external_url: (0, pg_core_1.text)('external_url'), // Colab, Jupyter nbviewer, etc.
    created_by: (0, pg_core_1.varchar)('created_by').references(() => exports.users.id),
    is_verified: (0, pg_core_1.boolean)('is_verified').default(false),
    upvotes: (0, pg_core_1.integer)('upvotes').default(0),
    downvotes: (0, pg_core_1.integer)('downvotes').default(0),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termIdx: (0, pg_core_1.index)('code_examples_term_idx').on(table.term_id),
    languageIdx: (0, pg_core_1.index)('code_examples_language_idx').on(table.language),
    difficultyIdx: (0, pg_core_1.index)('code_examples_difficulty_idx').on(table.difficulty_level),
    verifiedIdx: (0, pg_core_1.index)('code_examples_verified_idx').on(table.is_verified),
}));
exports.codeExampleRuns = (0, pg_core_1.pgTable)('code_example_runs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    example_id: (0, pg_core_1.uuid)('example_id')
        .notNull()
        .references(() => exports.codeExamples.id, { onDelete: 'cascade' }),
    user_id: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id),
    execution_time: (0, pg_core_1.integer)('execution_time'), // in milliseconds
    success: (0, pg_core_1.boolean)('success'),
    output: (0, pg_core_1.text)('output'),
    error_message: (0, pg_core_1.text)('error_message'),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow(),
}, table => ({
    exampleIdx: (0, pg_core_1.index)('code_example_runs_example_idx').on(table.example_id),
    userIdx: (0, pg_core_1.index)('code_example_runs_user_idx').on(table.user_id),
    timestampIdx: (0, pg_core_1.index)('code_example_runs_timestamp_idx').on(table.timestamp),
}));
// User Behavior Tracking Tables for Personalization
exports.userBehaviorEvents = (0, pg_core_1.pgTable)('user_behavior_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    event_type: (0, pg_core_1.varchar)('event_type', { length: 50 }).notNull(), // view, search, favorite, share, download, etc.
    entity_type: (0, pg_core_1.varchar)('entity_type', { length: 50 }).notNull(), // term, category, learning_path, etc.
    entity_id: (0, pg_core_1.varchar)('entity_id', { length: 255 }).notNull(),
    context: (0, pg_core_1.jsonb)('context'), // Additional context like search query, referrer, etc.
    session_id: (0, pg_core_1.varchar)('session_id', { length: 255 }),
    user_agent: (0, pg_core_1.text)('user_agent'),
    ip_address: (0, pg_core_1.varchar)('ip_address', { length: 64 }), // Hashed for privacy
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userEventIdx: (0, pg_core_1.index)('user_behavior_events_user_idx').on(table.user_id),
    eventTypeIdx: (0, pg_core_1.index)('user_behavior_events_event_type_idx').on(table.event_type),
    entityIdx: (0, pg_core_1.index)('user_behavior_events_entity_idx').on(table.entity_type, table.entity_id),
    sessionIdx: (0, pg_core_1.index)('user_behavior_events_session_idx').on(table.session_id),
    createdAtIdx: (0, pg_core_1.index)('user_behavior_events_created_at_idx').on(table.created_at),
}));
exports.userInteractionPatterns = (0, pg_core_1.pgTable)('user_interaction_patterns', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    pattern_type: (0, pg_core_1.varchar)('pattern_type', { length: 50 }).notNull(), // learning_style, content_preference, time_pattern, etc.
    pattern_data: (0, pg_core_1.jsonb)('pattern_data').notNull(), // Structured pattern data
    confidence_score: (0, pg_core_1.integer)('confidence_score'), // 0-100, confidence in this pattern
    last_updated: (0, pg_core_1.timestamp)('last_updated').defaultNow(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userPatternIdx: (0, pg_core_1.index)('user_interaction_patterns_user_idx').on(table.user_id),
    patternTypeIdx: (0, pg_core_1.index)('user_interaction_patterns_type_idx').on(table.pattern_type),
    confidenceIdx: (0, pg_core_1.index)('user_interaction_patterns_confidence_idx').on(table.confidence_score),
    lastUpdatedIdx: (0, pg_core_1.index)('user_interaction_patterns_updated_idx').on(table.last_updated),
}));
exports.userRecommendations = (0, pg_core_1.pgTable)('user_recommendations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    recommendation_type: (0, pg_core_1.varchar)('recommendation_type', { length: 50 }).notNull(), // term, category, learning_path, content_section
    entity_id: (0, pg_core_1.varchar)('entity_id', { length: 255 }).notNull(),
    score: (0, pg_core_1.integer)('score').notNull(), // 0-100, recommendation strength
    reasoning: (0, pg_core_1.jsonb)('reasoning'), // Why this was recommended
    algorithm_version: (0, pg_core_1.varchar)('algorithm_version', { length: 50 }), // Track which version generated this
    shown_at: (0, pg_core_1.timestamp)('shown_at'),
    clicked_at: (0, pg_core_1.timestamp)('clicked_at'),
    dismissed_at: (0, pg_core_1.timestamp)('dismissed_at'),
    feedback_score: (0, pg_core_1.integer)('feedback_score'), // User feedback: -1 (negative), 0 (neutral), 1 (positive)
    expires_at: (0, pg_core_1.timestamp)('expires_at'), // When this recommendation expires
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userRecommendationIdx: (0, pg_core_1.index)('user_recommendations_user_idx').on(table.user_id),
    typeIdx: (0, pg_core_1.index)('user_recommendations_type_idx').on(table.recommendation_type),
    scoreIdx: (0, pg_core_1.index)('user_recommendations_score_idx').on(table.score),
    shownIdx: (0, pg_core_1.index)('user_recommendations_shown_idx').on(table.shown_at),
    expiresIdx: (0, pg_core_1.index)('user_recommendations_expires_idx').on(table.expires_at),
    createdAtIdx: (0, pg_core_1.index)('user_recommendations_created_at_idx').on(table.created_at),
}));
exports.userLearningProfile = (0, pg_core_1.pgTable)('user_learning_profile', {
    user_id: (0, pg_core_1.varchar)('user_id')
        .primaryKey()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    learning_style: (0, pg_core_1.varchar)('learning_style', { length: 50 }), // visual, auditory, kinesthetic, reading_writing
    preferred_complexity: (0, pg_core_1.varchar)('preferred_complexity', { length: 20 }), // beginner, intermediate, advanced, expert
    preferred_content_types: (0, pg_core_1.text)('preferred_content_types').array(), // ["mathematical", "practical", "theoretical", "examples"]
    active_learning_goals: (0, pg_core_1.jsonb)('active_learning_goals'), // Current learning objectives
    skill_assessments: (0, pg_core_1.jsonb)('skill_assessments'), // Self-assessed or system-assessed skill levels
    engagement_patterns: (0, pg_core_1.jsonb)('engagement_patterns'), // Time of day, session length, content preferences
    personalization_consent: (0, pg_core_1.boolean)('personalization_consent').default(true),
    last_profile_update: (0, pg_core_1.timestamp)('last_profile_update').defaultNow(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    learningStyleIdx: (0, pg_core_1.index)('user_learning_profile_style_idx').on(table.learning_style),
    complexityIdx: (0, pg_core_1.index)('user_learning_profile_complexity_idx').on(table.preferred_complexity),
    updatedIdx: (0, pg_core_1.index)('user_learning_profile_updated_idx').on(table.updated_at),
}));
exports.personalizationMetrics = (0, pg_core_1.pgTable)('personalization_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    metric_type: (0, pg_core_1.varchar)('metric_type', { length: 50 }).notNull(), // engagement_score, satisfaction_score, learning_velocity
    metric_value: (0, pg_core_1.integer)('metric_value').notNull(), // Normalized to 0-100 scale
    context: (0, pg_core_1.jsonb)('context'), // Additional context for the metric
    measurement_period: (0, pg_core_1.varchar)('measurement_period', { length: 20 }), // daily, weekly, monthly
    algorithm_version: (0, pg_core_1.varchar)('algorithm_version', { length: 50 }),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userMetricIdx: (0, pg_core_1.index)('personalization_metrics_user_idx').on(table.user_id),
    metricTypeIdx: (0, pg_core_1.index)('personalization_metrics_type_idx').on(table.metric_type),
    createdAtIdx: (0, pg_core_1.index)('personalization_metrics_created_at_idx').on(table.created_at),
    periodIdx: (0, pg_core_1.index)('personalization_metrics_period_idx').on(table.measurement_period),
}));
exports.contentRecommendationCache = (0, pg_core_1.pgTable)('content_recommendation_cache', {
    cache_key: (0, pg_core_1.varchar)('cache_key', { length: 255 }).primaryKey(),
    user_id: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    recommendation_data: (0, pg_core_1.jsonb)('recommendation_data').notNull(),
    algorithm_version: (0, pg_core_1.varchar)('algorithm_version', { length: 50 }),
    cache_created_at: (0, pg_core_1.timestamp)('cache_created_at').defaultNow(),
    expires_at: (0, pg_core_1.timestamp)('expires_at').notNull(),
    hit_count: (0, pg_core_1.integer)('hit_count').default(0),
}, table => ({
    userCacheIdx: (0, pg_core_1.index)('content_recommendation_cache_user_idx').on(table.user_id),
    expiresIdx: (0, pg_core_1.index)('content_recommendation_cache_expires_idx').on(table.expires_at),
    hitCountIdx: (0, pg_core_1.index)('content_recommendation_cache_hits_idx').on(table.hit_count),
}));
// Discovery sessions table for tracking surprise me analytics
exports.discoverySessions = (0, pg_core_1.pgTable)('discovery_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    session_id: (0, pg_core_1.varchar)('session_id', { length: 255 }).notNull(),
    discovery_mode: (0, pg_core_1.varchar)('discovery_mode', { length: 50 }).notNull(), // random_adventure, guided_discovery, challenge_mode, connection_quest
    term_id: (0, pg_core_1.uuid)('term_id').references(() => exports.terms.id, { onDelete: 'cascade' }),
    algorithm_version: (0, pg_core_1.varchar)('algorithm_version', { length: 50 }),
    discovery_context: (0, pg_core_1.jsonb)('discovery_context'), // User's current interests, recent views, etc.
    user_engagement: (0, pg_core_1.jsonb)('user_engagement'), // Time spent, actions taken, feedback
    surprise_rating: (0, pg_core_1.integer)('surprise_rating'), // 1-5 scale for how surprising the discovery was
    relevance_rating: (0, pg_core_1.integer)('relevance_rating'), // 1-5 scale for how relevant the discovery was
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    userSessionIdx: (0, pg_core_1.index)('discovery_sessions_user_idx').on(table.user_id),
    sessionIdx: (0, pg_core_1.index)('discovery_sessions_session_idx').on(table.session_id),
    modeIdx: (0, pg_core_1.index)('discovery_sessions_mode_idx').on(table.discovery_mode),
    termIdx: (0, pg_core_1.index)('discovery_sessions_term_idx').on(table.term_id),
    createdAtIdx: (0, pg_core_1.index)('discovery_sessions_created_at_idx').on(table.created_at),
}));
exports.discoveryPreferences = (0, pg_core_1.pgTable)('discovery_preferences', {
    user_id: (0, pg_core_1.varchar)('user_id')
        .primaryKey()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    preferred_modes: (0, pg_core_1.text)('preferred_modes').array(), // Preferred discovery modes
    excluded_categories: (0, pg_core_1.text)('excluded_categories').array(), // Categories to avoid
    difficulty_preference: (0, pg_core_1.varchar)('difficulty_preference', { length: 20 }), // beginner, intermediate, advanced, adaptive
    exploration_frequency: (0, pg_core_1.varchar)('exploration_frequency', { length: 20 }), // conservative, moderate, adventurous
    feedback_enabled: (0, pg_core_1.boolean)('feedback_enabled').default(true),
    surprise_tolerance: (0, pg_core_1.integer)('surprise_tolerance').default(50), // 0-100 scale
    personalization_level: (0, pg_core_1.varchar)('personalization_level', { length: 20 }).default('medium'), // low, medium, high
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    difficultyIdx: (0, pg_core_1.index)('discovery_preferences_difficulty_idx').on(table.difficulty_preference),
    frequencyIdx: (0, pg_core_1.index)('discovery_preferences_frequency_idx').on(table.exploration_frequency),
    updatedIdx: (0, pg_core_1.index)('discovery_preferences_updated_idx').on(table.updated_at),
}));
exports.surpriseMetrics = (0, pg_core_1.pgTable)('surprise_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    term_id: (0, pg_core_1.uuid)('term_id')
        .notNull()
        .references(() => exports.terms.id, { onDelete: 'cascade' }),
    discovery_count: (0, pg_core_1.integer)('discovery_count').default(0),
    average_surprise_rating: (0, pg_core_1.integer)('average_surprise_rating'), // Stored as rating * 100 (e.g., 4.5 = 450)
    average_relevance_rating: (0, pg_core_1.integer)('average_relevance_rating'), // Stored as rating * 100
    connection_strength: (0, pg_core_1.jsonb)('connection_strength'), // Connections to other terms with weights
    serendipity_score: (0, pg_core_1.integer)('serendipity_score'), // Algorithm-calculated surprise potential
    last_discovery: (0, pg_core_1.timestamp)('last_discovery'),
    popularity_trend: (0, pg_core_1.varchar)('popularity_trend', { length: 20 }), // trending_up, stable, trending_down
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    termIdx: (0, pg_core_1.index)('surprise_metrics_term_idx').on(table.term_id),
    discoveryCountIdx: (0, pg_core_1.index)('surprise_metrics_discovery_count_idx').on(table.discovery_count),
    serendipityIdx: (0, pg_core_1.index)('surprise_metrics_serendipity_idx').on(table.serendipity_score),
    lastDiscoveryIdx: (0, pg_core_1.index)('surprise_metrics_last_discovery_idx').on(table.last_discovery),
    updatedIdx: (0, pg_core_1.index)('surprise_metrics_updated_idx').on(table.updated_at),
}));
// Code example votes table for tracking user votes
exports.codeExampleVotes = (0, pg_core_1.pgTable)('code_example_votes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    code_example_id: (0, pg_core_1.uuid)('code_example_id')
        .notNull()
        .references(() => exports.codeExamples.id, { onDelete: 'cascade' }),
    vote_type: (0, pg_core_1.varchar)('vote_type', { length: 10 }).notNull(), // 'up' or 'down'
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userExampleIdx: (0, pg_core_1.index)('code_example_votes_user_example_idx').on(table.user_id, table.code_example_id),
    uniqueUserExample: (0, pg_core_1.unique)('unique_user_code_example_vote').on(table.user_id, table.code_example_id),
    createdAtIdx: (0, pg_core_1.index)('code_example_votes_created_at_idx').on(table.created_at),
}));
// Cache metrics table for performance monitoring
exports.cacheMetrics = (0, pg_core_1.pgTable)('cache_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').notNull(),
    cacheType: (0, pg_core_1.varchar)('cache_type', { length: 50 }).notNull(), // query, search, user
    hitCount: (0, pg_core_1.integer)('hit_count').notNull().default(0),
    missCount: (0, pg_core_1.integer)('miss_count').notNull().default(0),
    evictionCount: (0, pg_core_1.integer)('eviction_count').notNull().default(0),
    hitRate: (0, pg_core_1.integer)('hit_rate').notNull(), // Stored as percentage * 100 (e.g., 85.5% = 8550)
    avgResponseTime: (0, pg_core_1.integer)('avg_response_time'), // in microseconds
    cacheSize: (0, pg_core_1.integer)('cache_size').notNull(),
    memoryUsage: (0, pg_core_1.integer)('memory_usage'), // in bytes
    metadata: (0, pg_core_1.jsonb)('metadata'), // Additional metrics like hot keys, cold keys, etc.
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    timestampIdx: (0, pg_core_1.index)('cache_metrics_timestamp_idx').on(table.timestamp),
    cacheTypeIdx: (0, pg_core_1.index)('cache_metrics_cache_type_idx').on(table.cacheType),
    createdAtIdx: (0, pg_core_1.index)('cache_metrics_created_at_idx').on(table.createdAt),
}));
// ============================
// CUSTOMER SERVICE SYSTEM
// ============================
// Support ticket priorities and statuses
exports.TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
exports.TICKET_STATUSES = [
    'open',
    'in_progress',
    'waiting_for_customer',
    'resolved',
    'closed',
];
exports.TICKET_TYPES = [
    'general',
    'technical',
    'billing',
    'refund',
    'feature_request',
    'bug_report',
];
// Support tickets table
exports.supportTickets = (0, pg_core_1.pgTable)('support_tickets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketNumber: (0, pg_core_1.varchar)('ticket_number', { length: 20 }).unique().notNull(), // e.g., "TICK-2025-001"
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    assignedToId: (0, pg_core_1.varchar)('assigned_to_id').references(() => exports.users.id, { onDelete: 'set null' }),
    // Customer information (in case ticket created without user account)
    customerEmail: (0, pg_core_1.varchar)('customer_email', { length: 255 }).notNull(),
    customerName: (0, pg_core_1.varchar)('customer_name', { length: 100 }),
    // Ticket details
    subject: (0, pg_core_1.varchar)('subject', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull().default('general'), // TICKET_TYPES
    priority: (0, pg_core_1.varchar)('priority', { length: 10 }).notNull().default('medium'), // TICKET_PRIORITIES
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('open'), // TICKET_STATUSES
    // Related information
    purchaseId: (0, pg_core_1.uuid)('purchase_id').references(() => exports.purchases.id, { onDelete: 'set null' }),
    gumroadOrderId: (0, pg_core_1.varchar)('gumroad_order_id'), // For linking to Gumroad orders
    // Metadata
    tags: (0, pg_core_1.text)('tags').array(), // searchable tags
    metadata: (0, pg_core_1.jsonb)('metadata').default({}), // Additional context data
    customerContext: (0, pg_core_1.jsonb)('customer_context').default({}), // Browser, OS, etc.
    // Timestamps
    firstResponseAt: (0, pg_core_1.timestamp)('first_response_at'),
    lastResponseAt: (0, pg_core_1.timestamp)('last_response_at'),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at'),
    closedAt: (0, pg_core_1.timestamp)('closed_at'),
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    ticketNumberIdx: (0, pg_core_1.index)('support_tickets_ticket_number_idx').on(table.ticketNumber),
    userIdIdx: (0, pg_core_1.index)('support_tickets_user_id_idx').on(table.userId),
    assignedToIdx: (0, pg_core_1.index)('support_tickets_assigned_to_idx').on(table.assignedToId),
    customerEmailIdx: (0, pg_core_1.index)('support_tickets_customer_email_idx').on(table.customerEmail),
    statusIdx: (0, pg_core_1.index)('support_tickets_status_idx').on(table.status),
    priorityIdx: (0, pg_core_1.index)('support_tickets_priority_idx').on(table.priority),
    typeIdx: (0, pg_core_1.index)('support_tickets_type_idx').on(table.type),
    purchaseIdIdx: (0, pg_core_1.index)('support_tickets_purchase_id_idx').on(table.purchaseId),
    createdAtIdx: (0, pg_core_1.index)('support_tickets_created_at_idx').on(table.createdAt),
    dueDateIdx: (0, pg_core_1.index)('support_tickets_due_date_idx').on(table.dueDate),
}));
// Ticket messages table (for conversation thread)
exports.ticketMessages = (0, pg_core_1.pgTable)('ticket_messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketId: (0, pg_core_1.uuid)('ticket_id')
        .notNull()
        .references(() => exports.supportTickets.id, { onDelete: 'cascade' }),
    senderId: (0, pg_core_1.varchar)('sender_id').references(() => exports.users.id, { onDelete: 'set null' }),
    senderType: (0, pg_core_1.varchar)('sender_type', { length: 20 }).notNull(), // 'customer', 'agent', 'system'
    senderEmail: (0, pg_core_1.varchar)('sender_email', { length: 255 }),
    senderName: (0, pg_core_1.varchar)('sender_name', { length: 100 }),
    content: (0, pg_core_1.text)('content').notNull(),
    contentType: (0, pg_core_1.varchar)('content_type', { length: 20 }).default('text'), // text, html, markdown
    isInternal: (0, pg_core_1.boolean)('is_internal').default(false), // Internal notes only visible to agents
    isAutoResponse: (0, pg_core_1.boolean)('is_auto_response').default(false),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    ticketIdIdx: (0, pg_core_1.index)('ticket_messages_ticket_id_idx').on(table.ticketId),
    senderIdIdx: (0, pg_core_1.index)('ticket_messages_sender_id_idx').on(table.senderId),
    senderTypeIdx: (0, pg_core_1.index)('ticket_messages_sender_type_idx').on(table.senderType),
    createdAtIdx: (0, pg_core_1.index)('ticket_messages_created_at_idx').on(table.createdAt),
    isInternalIdx: (0, pg_core_1.index)('ticket_messages_is_internal_idx').on(table.isInternal),
}));
// Ticket attachments table
exports.ticketAttachments = (0, pg_core_1.pgTable)('ticket_attachments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketId: (0, pg_core_1.uuid)('ticket_id')
        .notNull()
        .references(() => exports.supportTickets.id, { onDelete: 'cascade' }),
    messageId: (0, pg_core_1.uuid)('message_id').references(() => exports.ticketMessages.id, { onDelete: 'cascade' }),
    fileName: (0, pg_core_1.varchar)('file_name', { length: 255 }).notNull(),
    originalFileName: (0, pg_core_1.varchar)('original_file_name', { length: 255 }).notNull(),
    fileSize: (0, pg_core_1.integer)('file_size').notNull(), // in bytes
    mimeType: (0, pg_core_1.varchar)('mime_type', { length: 100 }).notNull(),
    fileUrl: (0, pg_core_1.text)('file_url').notNull(), // S3 or other storage URL
    uploadedById: (0, pg_core_1.varchar)('uploaded_by_id').references(() => exports.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    ticketIdIdx: (0, pg_core_1.index)('ticket_attachments_ticket_id_idx').on(table.ticketId),
    messageIdIdx: (0, pg_core_1.index)('ticket_attachments_message_id_idx').on(table.messageId),
    uploadedByIdx: (0, pg_core_1.index)('ticket_attachments_uploaded_by_idx').on(table.uploadedById),
    createdAtIdx: (0, pg_core_1.index)('ticket_attachments_created_at_idx').on(table.createdAt),
}));
// Knowledge base articles table
exports.knowledgeBaseArticles = (0, pg_core_1.pgTable)('knowledge_base_articles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.varchar)('slug', { length: 255 }).unique().notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    excerpt: (0, pg_core_1.text)('excerpt'),
    // Organization
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => exports.categories.id, { onDelete: 'set null' }),
    tags: (0, pg_core_1.text)('tags').array(),
    // Publishing
    isPublished: (0, pg_core_1.boolean)('is_published').default(false),
    publishedAt: (0, pg_core_1.timestamp)('published_at'),
    authorId: (0, pg_core_1.varchar)('author_id').references(() => exports.users.id, { onDelete: 'set null' }),
    // Analytics
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    helpfulVotes: (0, pg_core_1.integer)('helpful_votes').default(0),
    notHelpfulVotes: (0, pg_core_1.integer)('not_helpful_votes').default(0),
    // SEO
    metaTitle: (0, pg_core_1.varchar)('meta_title', { length: 255 }),
    metaDescription: (0, pg_core_1.text)('meta_description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    slugIdx: (0, pg_core_1.index)('knowledge_base_articles_slug_idx').on(table.slug),
    titleIdx: (0, pg_core_1.index)('knowledge_base_articles_title_idx').on(table.title),
    categoryIdIdx: (0, pg_core_1.index)('knowledge_base_articles_category_id_idx').on(table.categoryId),
    isPublishedIdx: (0, pg_core_1.index)('knowledge_base_articles_is_published_idx').on(table.isPublished),
    authorIdIdx: (0, pg_core_1.index)('knowledge_base_articles_author_id_idx').on(table.authorId),
    viewCountIdx: (0, pg_core_1.index)('knowledge_base_articles_view_count_idx').on(table.viewCount),
    createdAtIdx: (0, pg_core_1.index)('knowledge_base_articles_created_at_idx').on(table.createdAt),
}));
// Automated response templates table
exports.responseTemplates = (0, pg_core_1.pgTable)('response_templates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    subject: (0, pg_core_1.varchar)('subject', { length: 255 }),
    content: (0, pg_core_1.text)('content').notNull(),
    // Trigger conditions
    triggerType: (0, pg_core_1.varchar)('trigger_type', { length: 50 }).notNull(), // 'ticket_created', 'status_changed', 'manual'
    triggerConditions: (0, pg_core_1.jsonb)('trigger_conditions').default({}), // JSON conditions for auto-triggers
    // Configuration
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    isAutoResponse: (0, pg_core_1.boolean)('is_auto_response').default(false),
    ticketTypes: (0, pg_core_1.text)('ticket_types').array(), // Which ticket types this applies to
    // Metadata
    createdById: (0, pg_core_1.varchar)('created_by_id').references(() => exports.users.id, { onDelete: 'set null' }),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    nameIdx: (0, pg_core_1.index)('response_templates_name_idx').on(table.name),
    triggerTypeIdx: (0, pg_core_1.index)('response_templates_trigger_type_idx').on(table.triggerType),
    isActiveIdx: (0, pg_core_1.index)('response_templates_is_active_idx').on(table.isActive),
    createdByIdx: (0, pg_core_1.index)('response_templates_created_by_idx').on(table.createdById),
}));
// Refund requests table (integrated with Gumroad)
exports.refundRequests = (0, pg_core_1.pgTable)('refund_requests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketId: (0, pg_core_1.uuid)('ticket_id').references(() => exports.supportTickets.id, { onDelete: 'cascade' }),
    purchaseId: (0, pg_core_1.uuid)('purchase_id').references(() => exports.purchases.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    // Gumroad integration
    gumroadOrderId: (0, pg_core_1.varchar)('gumroad_order_id').notNull(),
    gumroadRefundId: (0, pg_core_1.varchar)('gumroad_refund_id'), // Set when processed
    // Request details
    reason: (0, pg_core_1.text)('reason').notNull(),
    refundType: (0, pg_core_1.varchar)('refund_type', { length: 20 }).notNull(), // 'full', 'partial'
    requestedAmount: (0, pg_core_1.integer)('requested_amount').notNull(), // in cents
    refundedAmount: (0, pg_core_1.integer)('refunded_amount'), // actual refunded amount
    // Status tracking
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, processed, failed
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    customerNotification: (0, pg_core_1.text)('customer_notification'),
    // Timestamps
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    approvedAt: (0, pg_core_1.timestamp)('approved_at'),
    rejectedAt: (0, pg_core_1.timestamp)('rejected_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    ticketIdIdx: (0, pg_core_1.index)('refund_requests_ticket_id_idx').on(table.ticketId),
    purchaseIdIdx: (0, pg_core_1.index)('refund_requests_purchase_id_idx').on(table.purchaseId),
    userIdIdx: (0, pg_core_1.index)('refund_requests_user_id_idx').on(table.userId),
    gumroadOrderIdIdx: (0, pg_core_1.index)('refund_requests_gumroad_order_id_idx').on(table.gumroadOrderId),
    statusIdx: (0, pg_core_1.index)('refund_requests_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('refund_requests_created_at_idx').on(table.createdAt),
}));
// Customer service metrics table
exports.customerServiceMetrics = (0, pg_core_1.pgTable)('customer_service_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    metricType: (0, pg_core_1.varchar)('metric_type', { length: 50 }).notNull(), // 'response_time', 'resolution_time', 'satisfaction', 'volume'
    metricPeriod: (0, pg_core_1.varchar)('metric_period', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
    metricDate: (0, pg_core_1.timestamp)('metric_date').notNull(),
    // Metric values
    totalTickets: (0, pg_core_1.integer)('total_tickets').default(0),
    openTickets: (0, pg_core_1.integer)('open_tickets').default(0),
    resolvedTickets: (0, pg_core_1.integer)('resolved_tickets').default(0),
    avgResponseTimeHours: (0, pg_core_1.integer)('avg_response_time_hours'), // in hours
    avgResolutionTimeHours: (0, pg_core_1.integer)('avg_resolution_time_hours'), // in hours
    firstResponseSla: (0, pg_core_1.integer)('first_response_sla'), // percentage met
    resolutionSla: (0, pg_core_1.integer)('resolution_sla'), // percentage met
    customerSatisfaction: (0, pg_core_1.integer)('customer_satisfaction'), // average rating * 100
    // Agent performance
    agentId: (0, pg_core_1.varchar)('agent_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    agentTicketsHandled: (0, pg_core_1.integer)('agent_tickets_handled').default(0),
    agentAvgResponseTime: (0, pg_core_1.integer)('agent_avg_response_time'), // in hours
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    metricTypeIdx: (0, pg_core_1.index)('customer_service_metrics_type_idx').on(table.metricType),
    metricPeriodIdx: (0, pg_core_1.index)('customer_service_metrics_period_idx').on(table.metricPeriod),
    metricDateIdx: (0, pg_core_1.index)('customer_service_metrics_date_idx').on(table.metricDate),
    agentIdIdx: (0, pg_core_1.index)('customer_service_metrics_agent_id_idx').on(table.agentId),
    createdAtIdx: (0, pg_core_1.index)('customer_service_metrics_created_at_idx').on(table.createdAt),
}));
// Customer satisfaction feedback table
exports.customerFeedback = (0, pg_core_1.pgTable)('customer_feedback', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ticketId: (0, pg_core_1.uuid)('ticket_id')
        .notNull()
        .references(() => exports.supportTickets.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.varchar)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    // Feedback details
    rating: (0, pg_core_1.integer)('rating').notNull(), // 1-5 scale
    comment: (0, pg_core_1.text)('comment'),
    feedbackType: (0, pg_core_1.varchar)('feedback_type', { length: 20 }).default('resolution'), // resolution, response_time, agent_quality
    // Context
    agentId: (0, pg_core_1.varchar)('agent_id').references(() => exports.users.id, { onDelete: 'set null' }),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    ticketIdIdx: (0, pg_core_1.index)('customer_feedback_ticket_id_idx').on(table.ticketId),
    userIdIdx: (0, pg_core_1.index)('customer_feedback_user_id_idx').on(table.userId),
    ratingIdx: (0, pg_core_1.index)('customer_feedback_rating_idx').on(table.rating),
    agentIdIdx: (0, pg_core_1.index)('customer_feedback_agent_id_idx').on(table.agentId),
    feedbackTypeIdx: (0, pg_core_1.index)('customer_feedback_feedback_type_idx').on(table.feedbackType),
    createdAtIdx: (0, pg_core_1.index)('customer_feedback_created_at_idx').on(table.createdAt),
}));
// Customer service schemas for validation
exports.insertSupportTicketSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supportTickets).omit({
    id: true,
    ticketNumber: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertTicketMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.ticketMessages).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertKnowledgeBaseArticleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.knowledgeBaseArticles).omit({
    id: true,
    viewCount: true,
    helpfulVotes: true,
    notHelpfulVotes: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertRefundRequestSchema = (0, drizzle_zod_1.createInsertSchema)(exports.refundRequests).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertCustomerFeedbackSchema = (0, drizzle_zod_1.createInsertSchema)(exports.customerFeedback).omit({
    id: true,
    createdAt: true,
});
// ============================
// REFERRAL SYSTEM
// ============================
// Referral payouts table for tracking Gumroad commission payouts
exports.referralPayouts = (0, pg_core_1.pgTable)('referral_payouts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    referrerId: (0, pg_core_1.varchar)('referrer_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    referredUserId: (0, pg_core_1.varchar)('referred_user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    gumroadOrderId: (0, pg_core_1.varchar)('gumroad_order_id').notNull(),
    purchaseAmountCents: (0, pg_core_1.integer)('purchase_amount_cents').notNull(),
    referralPercentage: (0, pg_core_1.integer)('referral_percentage').notNull().default(30),
    payoutAmountCents: (0, pg_core_1.integer)('payout_amount_cents').notNull(),
    gumroadPayoutId: (0, pg_core_1.varchar)('gumroad_payout_id'), // Set when Gumroad processes the payout
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('pending'), // pending, processed, failed
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    errorMessage: (0, pg_core_1.text)('error_message'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    referrerIdx: (0, pg_core_1.index)('referral_payouts_referrer_idx').on(table.referrerId),
    referredUserIdx: (0, pg_core_1.index)('referral_payouts_referred_user_idx').on(table.referredUserId),
    gumroadOrderIdx: (0, pg_core_1.index)('referral_payouts_gumroad_order_idx').on(table.gumroadOrderId),
    statusIdx: (0, pg_core_1.index)('referral_payouts_status_idx').on(table.status),
}));
// Referral links table for tracking referral campaigns and click analytics
exports.referralLinks = (0, pg_core_1.pgTable)('referral_links', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.varchar)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    referralCode: (0, pg_core_1.varchar)('referral_code', { length: 20 }).notNull().unique(),
    campaignName: (0, pg_core_1.varchar)('campaign_name', { length: 100 }),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    clickCount: (0, pg_core_1.integer)('click_count').default(0),
    conversionCount: (0, pg_core_1.integer)('conversion_count').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    userIdx: (0, pg_core_1.index)('referral_links_user_idx').on(table.userId),
    codeIdx: (0, pg_core_1.index)('referral_links_code_idx').on(table.referralCode),
    activeIdx: (0, pg_core_1.index)('referral_links_active_idx').on(table.isActive),
}));
// Referral clicks table for tracking click analytics
exports.referralClicks = (0, pg_core_1.pgTable)('referral_clicks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    referralLinkId: (0, pg_core_1.uuid)('referral_link_id')
        .notNull()
        .references(() => exports.referralLinks.id, { onDelete: 'cascade' }),
    referralCode: (0, pg_core_1.varchar)('referral_code', { length: 20 }).notNull(),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }), // Hashed IP for privacy
    userAgent: (0, pg_core_1.text)('user_agent'),
    referer: (0, pg_core_1.text)('referer'),
    countryCode: (0, pg_core_1.varchar)('country_code', { length: 2 }),
    utm: (0, pg_core_1.jsonb)('utm'), // UTM parameters
    sessionId: (0, pg_core_1.varchar)('session_id', { length: 255 }),
    converted: (0, pg_core_1.boolean)('converted').default(false),
    convertedAt: (0, pg_core_1.timestamp)('converted_at'),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    linkIdx: (0, pg_core_1.index)('referral_clicks_link_idx').on(table.referralLinkId),
    codeIdx: (0, pg_core_1.index)('referral_clicks_code_idx').on(table.referralCode),
    convertedIdx: (0, pg_core_1.index)('referral_clicks_converted_idx').on(table.converted),
    createdAtIdx: (0, pg_core_1.index)('referral_clicks_created_at_idx').on(table.createdAt),
}));
// Validation schemas for referral system
exports.insertReferralPayoutSchema = (0, drizzle_zod_1.createInsertSchema)(exports.referralPayouts).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertReferralLinkSchema = (0, drizzle_zod_1.createInsertSchema)(exports.referralLinks).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertReferralClickSchema = (0, drizzle_zod_1.createInsertSchema)(exports.referralClicks).omit({
    id: true,
    createdAt: true,
});
