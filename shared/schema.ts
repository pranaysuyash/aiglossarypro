import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table for authentication
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table for authentication
export const users = pgTable('users', {
  id: varchar('id').primaryKey().notNull(),
  email: varchar('email').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  isAdmin: boolean('is_admin').default(false),

  // Firebase authentication fields
  firebaseUid: varchar('firebase_uid').unique(),
  authProvider: varchar('auth_provider', { length: 50 }).default('firebase'),

  // NEW MONETIZATION FIELDS
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
  lifetimeAccess: boolean('lifetime_access').default(false),
  purchaseDate: timestamp('purchase_date'),
  dailyViews: integer('daily_views').default(0),
  lastViewReset: timestamp('last_view_reset').defaultNow(),

  // REFERRAL SYSTEM
  referrerId: varchar('referrer_id'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// NEW PURCHASES TABLE for Gumroad integration
export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id').references(() => users.id),
    gumroadOrderId: varchar('gumroad_order_id').unique().notNull(),
    amount: integer('amount'), // in cents
    currency: varchar('currency', { length: 3 }).default('USD'),
    status: varchar('status').default('completed'),
    purchaseData: jsonb('purchase_data'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('purchases_user_idx').on(table.userId),
    orderIdx: index('purchases_order_idx').on(table.gumroadOrderId),
    statusIdx: index('purchases_status_idx').on(table.status),
  })
);

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// Categories table
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('categories_name_idx').on(table.name),
  })
);

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Subcategories table
export const subcategories = pgTable(
  'subcategories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      nameIdIdx: index('subcategory_name_category_id_idx').on(table.name, table.categoryId),
    };
  }
);

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;

// Terms table
export const terms = pgTable(
  'terms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull().unique(),
    shortDefinition: text('short_definition'),
    definition: text('definition').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    characteristics: text('characteristics').array(),
    visualUrl: text('visual_url'),
    visualCaption: text('visual_caption'),
    mathFormulation: text('math_formulation'),
    applications: jsonb('applications'),
    references: text('references').array(),
    viewCount: integer('view_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('terms_name_idx').on(table.name),
    categoryIdx: index('terms_category_idx').on(table.categoryId),
    viewCountIdx: index('terms_view_count_idx').on(table.viewCount),
    createdAtIdx: index('terms_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('terms_updated_at_idx').on(table.updatedAt),
    nameSearchIdx: index('terms_name_search_idx').on(table.name),
    definitionSearchIdx: index('terms_definition_search_idx').on(table.definition),
  })
);

export const insertTermSchema = createInsertSchema(terms).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
} as const);

export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof terms.$inferSelect;

// Term-Subcategory relation table
export const termSubcategories = pgTable(
  'term_subcategories',
  {
    termId: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    subcategoryId: uuid('subcategory_id')
      .notNull()
      .references(() => subcategories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey(table.termId, table.subcategoryId),
    termIdx: index('term_subcategories_term_idx').on(table.termId),
    subcategoryIdx: index('term_subcategories_subcategory_idx').on(table.subcategoryId),
  })
);

// User favorites table
export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userTermIdx: index('favorites_user_term_idx').on(table.userId, table.termId),
  })
);

// User progress table
export const userProgress = pgTable(
  'user_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    learnedAt: timestamp('learned_at').defaultNow(),
  },
  (table) => ({
    userTermIdx: index('progress_user_term_idx').on(table.userId, table.termId),
  })
);

// Term views table
export const termViews = pgTable(
  'term_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at').defaultNow(),
  },
  (table) => ({
    userTermIdx: index('views_user_term_idx').on(table.userId, table.termId),
    viewedAtIdx: index('views_viewed_at_idx').on(table.viewedAt),
  })
);

// User settings table
export const userSettings = pgTable('user_settings', {
  userId: varchar('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Newsletter subscriptions table
export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active, unsubscribed
    language: varchar('language', { length: 10 }).default('en'),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }), // Hashed IP for privacy
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at'),
  },
  (table) => ({
    emailIdx: index('newsletter_email_idx').on(table.email),
    statusIdx: index('newsletter_status_idx').on(table.status),
    createdAtIdx: index('newsletter_created_at_idx').on(table.createdAt),
    utmSourceIdx: index('newsletter_utm_source_idx').on(table.utmSource),
  })
);

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions, {
  unsubscribedAt: z.date().optional(),
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

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

// Contact form submissions table
export const contactSubmissions = pgTable(
  'contact_submissions',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 200 }).notNull(),
    message: text('message').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('new'), // new, in_progress, resolved
    language: varchar('language', { length: 10 }).default('en'),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }), // Hashed IP for privacy
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    notes: text('notes'), // Admin notes
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIdx: index('contact_email_idx').on(table.email),
    statusIdx: index('contact_status_idx').on(table.status),
    createdAtIdx: index('contact_created_at_idx').on(table.createdAt),
    utmSourceIdx: index('contact_utm_source_idx').on(table.utmSource),
  })
);

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions, {
  updatedAt: z.date().optional(),
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

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Early bird customers table for First 500 Customers promotion
export const earlyBirdCustomers = pgTable(
  'early_bird_customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    purchaseOrderId: varchar('purchase_order_id', { length: 255 }).unique(), // Gumroad order ID
    status: varchar('status', { length: 20 }).notNull().default('registered'), // registered, purchased, expired
    discountAmount: integer('discount_amount').notNull().default(70), // $70 discount
    originalPrice: integer('original_price').notNull().default(24900), // $249 in cents
    discountedPrice: integer('discounted_price').notNull().default(17900), // $179 in cents
    registeredAt: timestamp('registered_at').defaultNow().notNull(),
    purchasedAt: timestamp('purchased_at'),
    expiresAt: timestamp('expires_at').notNull(), // 30 days from registration
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    countryCode: varchar('country_code', { length: 2 }),
    ipAddress: varchar('ip_address', { length: 64 }), // Hashed IP for privacy
  },
  (table) => ({
    emailIdx: index('early_bird_customers_email_idx').on(table.email),
    statusIdx: index('early_bird_customers_status_idx').on(table.status),
    registeredAtIdx: index('early_bird_customers_registered_at_idx').on(table.registeredAt),
    purchasedAtIdx: index('early_bird_customers_purchased_at_idx').on(table.purchasedAt),
    utmSourceIdx: index('early_bird_customers_utm_source_idx').on(table.utmSource),
  })
);

export const insertEarlyBirdCustomerSchema = createInsertSchema(earlyBirdCustomers).omit({
  id: true,
  registeredAt: true,
} as const);

export type EarlyBirdCustomer = typeof earlyBirdCustomers.$inferSelect;
export type InsertEarlyBirdCustomer = z.infer<typeof insertEarlyBirdCustomerSchema>;

// User interactions table for trending analytics
export const userInteractions = pgTable(
  'user_interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    termId: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
    interactionType: varchar('interaction_type', { length: 50 }).notNull(), // view, share, bookmark, search
    duration: integer('duration'), // Time spent in seconds
    metadata: jsonb('metadata').default({}), // Additional interaction data
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_interactions_user_id_idx').on(table.userId),
    termIdIdx: index('user_interactions_term_id_idx').on(table.termId),
    interactionTypeIdx: index('user_interactions_type_idx').on(table.interactionType),
    timestampIdx: index('user_interactions_timestamp_idx').on(table.timestamp),
    userTermIdx: index('user_interactions_user_term_idx').on(table.userId, table.termId),
  })
);

export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  timestamp: true,
} as const);

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

// Term analytics table for caching trending data
export const termAnalytics = pgTable(
  'term_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .references(() => terms.id, { onDelete: 'cascade' })
      .unique(),
    viewCount: integer('view_count').default(0),
    shareCount: integer('share_count').default(0),
    bookmarkCount: integer('bookmark_count').default(0),
    searchCount: integer('search_count').default(0),
    averageTimeSpent: integer('average_time_spent').default(0), // in seconds
    lastCalculated: timestamp('last_calculated').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    termIdIdx: index('term_analytics_term_id_idx').on(table.termId),
    viewCountIdx: index('term_analytics_view_count_idx').on(table.viewCount),
    lastCalculatedIdx: index('term_analytics_last_calculated_idx').on(table.lastCalculated),
  })
);

export const insertTermAnalyticsSchema = createInsertSchema(termAnalytics).omit({
  id: true,
  lastCalculated: true,
  updatedAt: true,
} as const);

export type TermAnalytics = typeof termAnalytics.$inferSelect;
export type InsertTermAnalytics = z.infer<typeof insertTermAnalyticsSchema>;

// User profiles table for AI-powered personalization
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    skillLevel: varchar('skill_level', { length: 20 }).default('beginner'), // beginner, intermediate, advanced, expert
    learningStyle: varchar('learning_style', { length: 20 }).default('mixed'), // visual, theoretical, practical, mixed
    activityLevel: varchar('activity_level', { length: 20 }).default('moderate'), // low, moderate, high
    interests: jsonb('interests').default([]), // Array of category interests with scores
    preferredContentTypes: jsonb('preferred_content_types').default([]), // Array of preferred interaction types
    recentTopics: jsonb('recent_topics').default([]), // Array of recent topic names
    engagementScore: integer('engagement_score').default(0), // 0-100 engagement score
    personalityVector: jsonb('personality_vector').default([]), // ML vector for recommendations
    lastCalculated: timestamp('last_calculated').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('user_profiles_user_id_idx').on(table.userId),
    skillLevelIdx: index('user_profiles_skill_level_idx').on(table.skillLevel),
    engagementScoreIdx: index('user_profiles_engagement_score_idx').on(table.engagementScore),
    lastCalculatedIdx: index('user_profiles_last_calculated_idx').on(table.lastCalculated),
  })
);

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  lastCalculated: true,
  updatedAt: true,
} as const);

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// Early bird status tracking table
export const earlyBirdStatus = pgTable('early_bird_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  totalRegistered: integer('total_registered').notNull().default(0),
  totalPurchased: integer('total_purchased').notNull().default(0),
  maxEarlyBirdSlots: integer('max_early_bird_slots').notNull().default(500),
  earlyBirdActive: boolean('early_bird_active').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type EarlyBirdStatus = typeof earlyBirdStatus.$inferSelect;
export type InsertEarlyBirdStatus = typeof earlyBirdStatus.$inferInsert;

// Learning Paths system tables
export const learningPaths = pgTable(
  'learning_paths',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    difficulty_level: varchar('difficulty_level', { length: 20 }).default('beginner'), // beginner, intermediate, advanced
    estimated_duration: integer('estimated_duration'), // in minutes
    category_id: uuid('category_id').references(() => categories.id),
    prerequisites: text('prerequisites').array(), // array of prerequisite concept names
    learning_objectives: text('learning_objectives').array(),
    created_by: varchar('created_by').references(() => users.id),
    is_official: boolean('is_official').default(false),
    is_published: boolean('is_published').default(false),
    view_count: integer('view_count').default(0),
    completion_count: integer('completion_count').default(0),
    rating: integer('rating'), // Stored as percentage * 100 (e.g., 4.5 = 450)
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('learning_paths_name_idx').on(table.name),
    categoryIdx: index('learning_paths_category_idx').on(table.category_id),
    difficultyIdx: index('learning_paths_difficulty_idx').on(table.difficulty_level),
    publishedIdx: index('learning_paths_published_idx').on(table.is_published),
  })
);

export const learningPathSteps = pgTable(
  'learning_path_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    learning_path_id: uuid('learning_path_id')
      .notNull()
      .references(() => learningPaths.id, { onDelete: 'cascade' }),
    term_id: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    step_order: integer('step_order').notNull(),
    is_optional: boolean('is_optional').default(false),
    estimated_time: integer('estimated_time'), // in minutes
    step_type: varchar('step_type', { length: 20 }).default('concept'), // concept, practice, assessment
    content: jsonb('content'), // additional step-specific content
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pathIdx: index('learning_path_steps_path_idx').on(table.learning_path_id),
    orderIdx: index('learning_path_steps_order_idx').on(table.learning_path_id, table.step_order),
  })
);

export const userLearningProgress = pgTable(
  'user_learning_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    learning_path_id: uuid('learning_path_id')
      .notNull()
      .references(() => learningPaths.id, { onDelete: 'cascade' }),
    current_step_id: uuid('current_step_id').references(() => learningPathSteps.id),
    started_at: timestamp('started_at').defaultNow(),
    completed_at: timestamp('completed_at'),
    completion_percentage: integer('completion_percentage').default(0), // 0-100
    last_accessed_at: timestamp('last_accessed_at').defaultNow(),
    time_spent: integer('time_spent').default(0), // in minutes
  },
  (table) => ({
    userPathIdx: index('user_learning_progress_user_path_idx').on(
      table.user_id,
      table.learning_path_id
    ),
    userIdx: index('user_learning_progress_user_idx').on(table.user_id),
    uniqueUserPath: index('user_learning_progress_unique').on(
      table.user_id,
      table.learning_path_id
    ),
  })
);

export const stepCompletions = pgTable(
  'step_completions',
  {
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    step_id: uuid('step_id')
      .notNull()
      .references(() => learningPathSteps.id, { onDelete: 'cascade' }),
    completed_at: timestamp('completed_at').defaultNow(),
    time_spent: integer('time_spent'), // in minutes
    notes: text('notes'), // user notes for this step
  },
  (table) => ({
    pk: primaryKey(table.user_id, table.step_id),
    userIdx: index('step_completions_user_idx').on(table.user_id),
    stepIdx: index('step_completions_step_idx').on(table.step_id),
  })
);

// Code Examples system tables
export const codeExamples = pgTable(
  'code_examples',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term_id: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    language: varchar('language', { length: 50 }).notNull(), // python, r, sql, javascript, etc.
    code: text('code').notNull(),
    expected_output: text('expected_output'),
    libraries: jsonb('libraries'), // required libraries/dependencies
    difficulty_level: varchar('difficulty_level', { length: 20 }).default('beginner'),
    example_type: varchar('example_type', { length: 30 }).default('implementation'), // implementation, visualization, exercise
    is_runnable: boolean('is_runnable').default(false),
    external_url: text('external_url'), // Colab, Jupyter nbviewer, etc.
    created_by: varchar('created_by').references(() => users.id),
    is_verified: boolean('is_verified').default(false),
    upvotes: integer('upvotes').default(0),
    downvotes: integer('downvotes').default(0),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    termIdx: index('code_examples_term_idx').on(table.term_id),
    languageIdx: index('code_examples_language_idx').on(table.language),
    difficultyIdx: index('code_examples_difficulty_idx').on(table.difficulty_level),
    verifiedIdx: index('code_examples_verified_idx').on(table.is_verified),
  })
);

export const codeExampleRuns = pgTable(
  'code_example_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    example_id: uuid('example_id')
      .notNull()
      .references(() => codeExamples.id, { onDelete: 'cascade' }),
    user_id: varchar('user_id').references(() => users.id),
    execution_time: integer('execution_time'), // in milliseconds
    success: boolean('success'),
    output: text('output'),
    error_message: text('error_message'),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => ({
    exampleIdx: index('code_example_runs_example_idx').on(table.example_id),
    userIdx: index('code_example_runs_user_idx').on(table.user_id),
    timestampIdx: index('code_example_runs_timestamp_idx').on(table.timestamp),
  })
);

// Type exports for Learning Paths
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = typeof learningPaths.$inferInsert;
export type LearningPathStep = typeof learningPathSteps.$inferSelect;
export type InsertLearningPathStep = typeof learningPathSteps.$inferInsert;
export type UserLearningProgress = typeof userLearningProgress.$inferSelect;
export type InsertUserLearningProgress = typeof userLearningProgress.$inferInsert;
export type StepCompletion = typeof stepCompletions.$inferSelect;
export type InsertStepCompletion = typeof stepCompletions.$inferInsert;

// Type exports for Code Examples
export type CodeExample = typeof codeExamples.$inferSelect;
export type InsertCodeExample = typeof codeExamples.$inferInsert;
export type CodeExampleRun = typeof codeExampleRuns.$inferSelect;
export type InsertCodeExampleRun = typeof codeExampleRuns.$inferInsert;

// User Behavior Tracking Tables for Personalization
export const userBehaviorEvents = pgTable(
  'user_behavior_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    event_type: varchar('event_type', { length: 50 }).notNull(), // view, search, favorite, share, download, etc.
    entity_type: varchar('entity_type', { length: 50 }).notNull(), // term, category, learning_path, etc.
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    context: jsonb('context'), // Additional context like search query, referrer, etc.
    session_id: varchar('session_id', { length: 255 }),
    user_agent: text('user_agent'),
    ip_address: varchar('ip_address', { length: 64 }), // Hashed for privacy
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userEventIdx: index('user_behavior_events_user_idx').on(table.user_id),
    eventTypeIdx: index('user_behavior_events_event_type_idx').on(table.event_type),
    entityIdx: index('user_behavior_events_entity_idx').on(table.entity_type, table.entity_id),
    sessionIdx: index('user_behavior_events_session_idx').on(table.session_id),
    createdAtIdx: index('user_behavior_events_created_at_idx').on(table.created_at),
  })
);

export const userInteractionPatterns = pgTable(
  'user_interaction_patterns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pattern_type: varchar('pattern_type', { length: 50 }).notNull(), // learning_style, content_preference, time_pattern, etc.
    pattern_data: jsonb('pattern_data').notNull(), // Structured pattern data
    confidence_score: integer('confidence_score'), // 0-100, confidence in this pattern
    last_updated: timestamp('last_updated').defaultNow(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userPatternIdx: index('user_interaction_patterns_user_idx').on(table.user_id),
    patternTypeIdx: index('user_interaction_patterns_type_idx').on(table.pattern_type),
    confidenceIdx: index('user_interaction_patterns_confidence_idx').on(table.confidence_score),
    lastUpdatedIdx: index('user_interaction_patterns_updated_idx').on(table.last_updated),
  })
);

export const userRecommendations = pgTable(
  'user_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recommendation_type: varchar('recommendation_type', { length: 50 }).notNull(), // term, category, learning_path, content_section
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    score: integer('score').notNull(), // 0-100, recommendation strength
    reasoning: jsonb('reasoning'), // Why this was recommended
    algorithm_version: varchar('algorithm_version', { length: 50 }), // Track which version generated this
    shown_at: timestamp('shown_at'),
    clicked_at: timestamp('clicked_at'),
    dismissed_at: timestamp('dismissed_at'),
    feedback_score: integer('feedback_score'), // User feedback: -1 (negative), 0 (neutral), 1 (positive)
    expires_at: timestamp('expires_at'), // When this recommendation expires
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userRecommendationIdx: index('user_recommendations_user_idx').on(table.user_id),
    typeIdx: index('user_recommendations_type_idx').on(table.recommendation_type),
    scoreIdx: index('user_recommendations_score_idx').on(table.score),
    shownIdx: index('user_recommendations_shown_idx').on(table.shown_at),
    expiresIdx: index('user_recommendations_expires_idx').on(table.expires_at),
    createdAtIdx: index('user_recommendations_created_at_idx').on(table.created_at),
  })
);

export const userLearningProfile = pgTable(
  'user_learning_profile',
  {
    user_id: varchar('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    learning_style: varchar('learning_style', { length: 50 }), // visual, auditory, kinesthetic, reading_writing
    preferred_complexity: varchar('preferred_complexity', { length: 20 }), // beginner, intermediate, advanced, expert
    preferred_content_types: text('preferred_content_types').array(), // ["mathematical", "practical", "theoretical", "examples"]
    active_learning_goals: jsonb('active_learning_goals'), // Current learning objectives
    skill_assessments: jsonb('skill_assessments'), // Self-assessed or system-assessed skill levels
    engagement_patterns: jsonb('engagement_patterns'), // Time of day, session length, content preferences
    personalization_consent: boolean('personalization_consent').default(true),
    last_profile_update: timestamp('last_profile_update').defaultNow(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    learningStyleIdx: index('user_learning_profile_style_idx').on(table.learning_style),
    complexityIdx: index('user_learning_profile_complexity_idx').on(table.preferred_complexity),
    updatedIdx: index('user_learning_profile_updated_idx').on(table.updated_at),
  })
);

export const personalizationMetrics = pgTable(
  'personalization_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    metric_type: varchar('metric_type', { length: 50 }).notNull(), // engagement_score, satisfaction_score, learning_velocity
    metric_value: integer('metric_value').notNull(), // Normalized to 0-100 scale
    context: jsonb('context'), // Additional context for the metric
    measurement_period: varchar('measurement_period', { length: 20 }), // daily, weekly, monthly
    algorithm_version: varchar('algorithm_version', { length: 50 }),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userMetricIdx: index('personalization_metrics_user_idx').on(table.user_id),
    metricTypeIdx: index('personalization_metrics_type_idx').on(table.metric_type),
    createdAtIdx: index('personalization_metrics_created_at_idx').on(table.created_at),
    periodIdx: index('personalization_metrics_period_idx').on(table.measurement_period),
  })
);

export const contentRecommendationCache = pgTable(
  'content_recommendation_cache',
  {
    cache_key: varchar('cache_key', { length: 255 }).primaryKey(),
    user_id: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    recommendation_data: jsonb('recommendation_data').notNull(),
    algorithm_version: varchar('algorithm_version', { length: 50 }),
    cache_created_at: timestamp('cache_created_at').defaultNow(),
    expires_at: timestamp('expires_at').notNull(),
    hit_count: integer('hit_count').default(0),
  },
  (table) => ({
    userCacheIdx: index('content_recommendation_cache_user_idx').on(table.user_id),
    expiresIdx: index('content_recommendation_cache_expires_idx').on(table.expires_at),
    hitCountIdx: index('content_recommendation_cache_hits_idx').on(table.hit_count),
  })
);

// Type exports for User Behavior and Personalization
export type UserBehaviorEvent = typeof userBehaviorEvents.$inferSelect;
export type InsertUserBehaviorEvent = typeof userBehaviorEvents.$inferInsert;
export type UserInteractionPattern = typeof userInteractionPatterns.$inferSelect;
export type InsertUserInteractionPattern = typeof userInteractionPatterns.$inferInsert;
export type UserRecommendation = typeof userRecommendations.$inferSelect;
export type InsertUserRecommendation = typeof userRecommendations.$inferInsert;
export type UserLearningProfile = typeof userLearningProfile.$inferSelect;
export type InsertUserLearningProfile = typeof userLearningProfile.$inferInsert;
export type PersonalizationMetric = typeof personalizationMetrics.$inferSelect;
export type InsertPersonalizationMetric = typeof personalizationMetrics.$inferInsert;
export type ContentRecommendationCache = typeof contentRecommendationCache.$inferSelect;
export type InsertContentRecommendationCache = typeof contentRecommendationCache.$inferInsert;

// Discovery sessions table for tracking surprise me analytics
export const discoverySessions = pgTable(
  'discovery_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    session_id: varchar('session_id', { length: 255 }).notNull(),
    discovery_mode: varchar('discovery_mode', { length: 50 }).notNull(), // random_adventure, guided_discovery, challenge_mode, connection_quest
    term_id: uuid('term_id').references(() => terms.id, { onDelete: 'cascade' }),
    algorithm_version: varchar('algorithm_version', { length: 50 }),
    discovery_context: jsonb('discovery_context'), // User's current interests, recent views, etc.
    user_engagement: jsonb('user_engagement'), // Time spent, actions taken, feedback
    surprise_rating: integer('surprise_rating'), // 1-5 scale for how surprising the discovery was
    relevance_rating: integer('relevance_rating'), // 1-5 scale for how relevant the discovery was
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userSessionIdx: index('discovery_sessions_user_idx').on(table.user_id),
    sessionIdx: index('discovery_sessions_session_idx').on(table.session_id),
    modeIdx: index('discovery_sessions_mode_idx').on(table.discovery_mode),
    termIdx: index('discovery_sessions_term_idx').on(table.term_id),
    createdAtIdx: index('discovery_sessions_created_at_idx').on(table.created_at),
  })
);

export const discoveryPreferences = pgTable(
  'discovery_preferences',
  {
    user_id: varchar('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    preferred_modes: text('preferred_modes').array(), // Preferred discovery modes
    excluded_categories: text('excluded_categories').array(), // Categories to avoid
    difficulty_preference: varchar('difficulty_preference', { length: 20 }), // beginner, intermediate, advanced, adaptive
    exploration_frequency: varchar('exploration_frequency', { length: 20 }), // conservative, moderate, adventurous
    feedback_enabled: boolean('feedback_enabled').default(true),
    surprise_tolerance: integer('surprise_tolerance').default(50), // 0-100 scale
    personalization_level: varchar('personalization_level', { length: 20 }).default('medium'), // low, medium, high
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    difficultyIdx: index('discovery_preferences_difficulty_idx').on(table.difficulty_preference),
    frequencyIdx: index('discovery_preferences_frequency_idx').on(table.exploration_frequency),
    updatedIdx: index('discovery_preferences_updated_idx').on(table.updated_at),
  })
);

export const surpriseMetrics = pgTable(
  'surprise_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term_id: uuid('term_id')
      .notNull()
      .references(() => terms.id, { onDelete: 'cascade' }),
    discovery_count: integer('discovery_count').default(0),
    average_surprise_rating: integer('average_surprise_rating'), // Stored as rating * 100 (e.g., 4.5 = 450)
    average_relevance_rating: integer('average_relevance_rating'), // Stored as rating * 100
    connection_strength: jsonb('connection_strength'), // Connections to other terms with weights
    serendipity_score: integer('serendipity_score'), // Algorithm-calculated surprise potential
    last_discovery: timestamp('last_discovery'),
    popularity_trend: varchar('popularity_trend', { length: 20 }), // trending_up, stable, trending_down
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    termIdx: index('surprise_metrics_term_idx').on(table.term_id),
    discoveryCountIdx: index('surprise_metrics_discovery_count_idx').on(table.discovery_count),
    serendipityIdx: index('surprise_metrics_serendipity_idx').on(table.serendipity_score),
    lastDiscoveryIdx: index('surprise_metrics_last_discovery_idx').on(table.last_discovery),
    updatedIdx: index('surprise_metrics_updated_idx').on(table.updated_at),
  })
);

// Type exports for Discovery and Surprise Me
export type DiscoverySession = typeof discoverySessions.$inferSelect;
export type InsertDiscoverySession = typeof discoverySessions.$inferInsert;
export type DiscoveryPreferences = typeof discoveryPreferences.$inferSelect;
export type InsertDiscoveryPreferences = typeof discoveryPreferences.$inferInsert;
export type SurpriseMetrics = typeof surpriseMetrics.$inferSelect;
export type InsertSurpriseMetrics = typeof surpriseMetrics.$inferInsert;

// Code example votes table for tracking user votes
export const codeExampleVotes = pgTable(
  'code_example_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code_example_id: uuid('code_example_id')
      .notNull()
      .references(() => codeExamples.id, { onDelete: 'cascade' }),
    vote_type: varchar('vote_type', { length: 10 }).notNull(), // 'up' or 'down'
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userExampleIdx: index('code_example_votes_user_example_idx').on(
      table.user_id,
      table.code_example_id
    ),
    uniqueUserExample: unique('unique_user_code_example_vote').on(
      table.user_id,
      table.code_example_id
    ),
    createdAtIdx: index('code_example_votes_created_at_idx').on(table.created_at),
  })
);

export type CodeExampleVote = typeof codeExampleVotes.$inferSelect;
export type InsertCodeExampleVote = typeof codeExampleVotes.$inferInsert;

// Cache metrics table for performance monitoring
export const cacheMetrics = pgTable(
  'cache_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').notNull(),
    cacheType: varchar('cache_type', { length: 50 }).notNull(), // query, search, user
    hitCount: integer('hit_count').notNull().default(0),
    missCount: integer('miss_count').notNull().default(0),
    evictionCount: integer('eviction_count').notNull().default(0),
    hitRate: integer('hit_rate').notNull(), // Stored as percentage * 100 (e.g., 85.5% = 8550)
    avgResponseTime: integer('avg_response_time'), // in microseconds
    cacheSize: integer('cache_size').notNull(),
    memoryUsage: integer('memory_usage'), // in bytes
    metadata: jsonb('metadata'), // Additional metrics like hot keys, cold keys, etc.
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timestampIdx: index('cache_metrics_timestamp_idx').on(table.timestamp),
    cacheTypeIdx: index('cache_metrics_cache_type_idx').on(table.cacheType),
    createdAtIdx: index('cache_metrics_created_at_idx').on(table.createdAt),
  })
);

export type CacheMetric = typeof cacheMetrics.$inferSelect;
export type InsertCacheMetric = typeof cacheMetrics.$inferInsert;

// ============================
// CUSTOMER SERVICE SYSTEM
// ============================

// Support ticket priorities and statuses
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TICKET_STATUSES = ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'] as const;
export const TICKET_TYPES = ['general', 'technical', 'billing', 'refund', 'feature_request', 'bug_report'] as const;

// Support tickets table
export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketNumber: varchar('ticket_number', { length: 20 }).unique().notNull(), // e.g., "TICK-2025-001"
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    assignedToId: varchar('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Customer information (in case ticket created without user account)
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerName: varchar('customer_name', { length: 100 }),
    
    // Ticket details
    subject: varchar('subject', { length: 255 }).notNull(),
    description: text('description').notNull(),
    type: varchar('type', { length: 20 }).notNull().default('general'), // TICKET_TYPES
    priority: varchar('priority', { length: 10 }).notNull().default('medium'), // TICKET_PRIORITIES
    status: varchar('status', { length: 20 }).notNull().default('open'), // TICKET_STATUSES
    
    // Related information
    purchaseId: uuid('purchase_id').references(() => purchases.id, { onDelete: 'set null' }),
    gumroadOrderId: varchar('gumroad_order_id'), // For linking to Gumroad orders
    
    // Metadata
    tags: text('tags').array(), // searchable tags
    metadata: jsonb('metadata').default({}), // Additional context data
    customerContext: jsonb('customer_context').default({}), // Browser, OS, etc.
    
    // Timestamps
    firstResponseAt: timestamp('first_response_at'),
    lastResponseAt: timestamp('last_response_at'),
    resolvedAt: timestamp('resolved_at'),
    closedAt: timestamp('closed_at'),
    dueDate: timestamp('due_date'),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    ticketNumberIdx: index('support_tickets_ticket_number_idx').on(table.ticketNumber),
    userIdIdx: index('support_tickets_user_id_idx').on(table.userId),
    assignedToIdx: index('support_tickets_assigned_to_idx').on(table.assignedToId),
    customerEmailIdx: index('support_tickets_customer_email_idx').on(table.customerEmail),
    statusIdx: index('support_tickets_status_idx').on(table.status),
    priorityIdx: index('support_tickets_priority_idx').on(table.priority),
    typeIdx: index('support_tickets_type_idx').on(table.type),
    purchaseIdIdx: index('support_tickets_purchase_id_idx').on(table.purchaseId),
    createdAtIdx: index('support_tickets_created_at_idx').on(table.createdAt),
    dueDateIdx: index('support_tickets_due_date_idx').on(table.dueDate),
  })
);

// Ticket messages table (for conversation thread)
export const ticketMessages = pgTable(
  'ticket_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    senderId: varchar('sender_id').references(() => users.id, { onDelete: 'set null' }),
    senderType: varchar('sender_type', { length: 20 }).notNull(), // 'customer', 'agent', 'system'
    senderEmail: varchar('sender_email', { length: 255 }),
    senderName: varchar('sender_name', { length: 100 }),
    
    content: text('content').notNull(),
    contentType: varchar('content_type', { length: 20 }).default('text'), // text, html, markdown
    isInternal: boolean('is_internal').default(false), // Internal notes only visible to agents
    isAutoResponse: boolean('is_auto_response').default(false),
    
    // Metadata
    metadata: jsonb('metadata').default({}),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('ticket_messages_ticket_id_idx').on(table.ticketId),
    senderIdIdx: index('ticket_messages_sender_id_idx').on(table.senderId),
    senderTypeIdx: index('ticket_messages_sender_type_idx').on(table.senderType),
    createdAtIdx: index('ticket_messages_created_at_idx').on(table.createdAt),
    isInternalIdx: index('ticket_messages_is_internal_idx').on(table.isInternal),
  })
);

// Ticket attachments table
export const ticketAttachments = pgTable(
  'ticket_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id').references(() => ticketMessages.id, { onDelete: 'cascade' }),
    
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(), // in bytes
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileUrl: text('file_url').notNull(), // S3 or other storage URL
    
    uploadedById: varchar('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('ticket_attachments_ticket_id_idx').on(table.ticketId),
    messageIdIdx: index('ticket_attachments_message_id_idx').on(table.messageId),
    uploadedByIdx: index('ticket_attachments_uploaded_by_idx').on(table.uploadedById),
    createdAtIdx: index('ticket_attachments_created_at_idx').on(table.createdAt),
  })
);

// Knowledge base articles table
export const knowledgeBaseArticles = pgTable(
  'knowledge_base_articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    
    // Organization
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    tags: text('tags').array(),
    
    // Publishing
    isPublished: boolean('is_published').default(false),
    publishedAt: timestamp('published_at'),
    authorId: varchar('author_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Analytics
    viewCount: integer('view_count').default(0),
    helpfulVotes: integer('helpful_votes').default(0),
    notHelpfulVotes: integer('not_helpful_votes').default(0),
    
    // SEO
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    slugIdx: index('knowledge_base_articles_slug_idx').on(table.slug),
    titleIdx: index('knowledge_base_articles_title_idx').on(table.title),
    categoryIdIdx: index('knowledge_base_articles_category_id_idx').on(table.categoryId),
    isPublishedIdx: index('knowledge_base_articles_is_published_idx').on(table.isPublished),
    authorIdIdx: index('knowledge_base_articles_author_id_idx').on(table.authorId),
    viewCountIdx: index('knowledge_base_articles_view_count_idx').on(table.viewCount),
    createdAtIdx: index('knowledge_base_articles_created_at_idx').on(table.createdAt),
  })
);

// Automated response templates table
export const responseTemplates = pgTable(
  'response_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }),
    content: text('content').notNull(),
    
    // Trigger conditions
    triggerType: varchar('trigger_type', { length: 50 }).notNull(), // 'ticket_created', 'status_changed', 'manual'
    triggerConditions: jsonb('trigger_conditions').default({}), // JSON conditions for auto-triggers
    
    // Configuration
    isActive: boolean('is_active').default(true),
    isAutoResponse: boolean('is_auto_response').default(false),
    ticketTypes: text('ticket_types').array(), // Which ticket types this applies to
    
    // Metadata
    createdById: varchar('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    usageCount: integer('usage_count').default(0),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('response_templates_name_idx').on(table.name),
    triggerTypeIdx: index('response_templates_trigger_type_idx').on(table.triggerType),
    isActiveIdx: index('response_templates_is_active_idx').on(table.isActive),
    createdByIdx: index('response_templates_created_by_idx').on(table.createdById),
  })
);

// Refund requests table (integrated with Gumroad)
export const refundRequests = pgTable(
  'refund_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }),
    purchaseId: uuid('purchase_id').references(() => purchases.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
    
    // Gumroad integration
    gumroadOrderId: varchar('gumroad_order_id').notNull(),
    gumroadRefundId: varchar('gumroad_refund_id'), // Set when processed
    
    // Request details
    reason: text('reason').notNull(),
    refundType: varchar('refund_type', { length: 20 }).notNull(), // 'full', 'partial'
    requestedAmount: integer('requested_amount').notNull(), // in cents
    refundedAmount: integer('refunded_amount'), // actual refunded amount
    
    // Status tracking
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, processed, failed
    adminNotes: text('admin_notes'),
    customerNotification: text('customer_notification'),
    
    // Timestamps
    processedAt: timestamp('processed_at'),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('refund_requests_ticket_id_idx').on(table.ticketId),
    purchaseIdIdx: index('refund_requests_purchase_id_idx').on(table.purchaseId),
    userIdIdx: index('refund_requests_user_id_idx').on(table.userId),
    gumroadOrderIdIdx: index('refund_requests_gumroad_order_id_idx').on(table.gumroadOrderId),
    statusIdx: index('refund_requests_status_idx').on(table.status),
    createdAtIdx: index('refund_requests_created_at_idx').on(table.createdAt),
  })
);

// Customer service metrics table
export const customerServiceMetrics = pgTable(
  'customer_service_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    metricType: varchar('metric_type', { length: 50 }).notNull(), // 'response_time', 'resolution_time', 'satisfaction', 'volume'
    metricPeriod: varchar('metric_period', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
    metricDate: timestamp('metric_date').notNull(),
    
    // Metric values
    totalTickets: integer('total_tickets').default(0),
    openTickets: integer('open_tickets').default(0),
    resolvedTickets: integer('resolved_tickets').default(0),
    avgResponseTimeHours: integer('avg_response_time_hours'), // in hours
    avgResolutionTimeHours: integer('avg_resolution_time_hours'), // in hours
    firstResponseSla: integer('first_response_sla'), // percentage met
    resolutionSla: integer('resolution_sla'), // percentage met
    customerSatisfaction: integer('customer_satisfaction'), // average rating * 100
    
    // Agent performance
    agentId: varchar('agent_id').references(() => users.id, { onDelete: 'cascade' }),
    agentTicketsHandled: integer('agent_tickets_handled').default(0),
    agentAvgResponseTime: integer('agent_avg_response_time'), // in hours
    
    metadata: jsonb('metadata').default({}),
    
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    metricTypeIdx: index('customer_service_metrics_type_idx').on(table.metricType),
    metricPeriodIdx: index('customer_service_metrics_period_idx').on(table.metricPeriod),
    metricDateIdx: index('customer_service_metrics_date_idx').on(table.metricDate),
    agentIdIdx: index('customer_service_metrics_agent_id_idx').on(table.agentId),
    createdAtIdx: index('customer_service_metrics_created_at_idx').on(table.createdAt),
  })
);

// Customer satisfaction feedback table
export const customerFeedback = pgTable(
  'customer_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Feedback details
    rating: integer('rating').notNull(), // 1-5 scale
    comment: text('comment'),
    feedbackType: varchar('feedback_type', { length: 20 }).default('resolution'), // resolution, response_time, agent_quality
    
    // Context
    agentId: varchar('agent_id').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('customer_feedback_ticket_id_idx').on(table.ticketId),
    userIdIdx: index('customer_feedback_user_id_idx').on(table.userId),
    ratingIdx: index('customer_feedback_rating_idx').on(table.rating),
    agentIdIdx: index('customer_feedback_agent_id_idx').on(table.agentId),
    feedbackTypeIdx: index('customer_feedback_feedback_type_idx').on(table.feedbackType),
    createdAtIdx: index('customer_feedback_created_at_idx').on(table.createdAt),
  })
);

// Customer service schemas for validation
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertKnowledgeBaseArticleSchema = createInsertSchema(knowledgeBaseArticles).omit({
  id: true,
  viewCount: true,
  helpfulVotes: true,
  notHelpfulVotes: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({
  id: true,
  createdAt: true,
} as const);

// Type exports for customer service system
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;
export type KnowledgeBaseArticle = typeof knowledgeBaseArticles.$inferSelect;
export type InsertKnowledgeBaseArticle = z.infer<typeof insertKnowledgeBaseArticleSchema>;
export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type CustomerServiceMetric = typeof customerServiceMetrics.$inferSelect;
export type InsertCustomerServiceMetric = typeof customerServiceMetrics.$inferInsert;
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;

// ============================
// REFERRAL SYSTEM
// ============================

// Referral payouts table for tracking Gumroad commission payouts
export const referralPayouts = pgTable(
  'referral_payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerId: varchar('referrer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredUserId: varchar('referred_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gumroadOrderId: varchar('gumroad_order_id').notNull(),
    purchaseAmountCents: integer('purchase_amount_cents').notNull(),
    referralPercentage: integer('referral_percentage').notNull().default(30),
    payoutAmountCents: integer('payout_amount_cents').notNull(),
    gumroadPayoutId: varchar('gumroad_payout_id'), // Set when Gumroad processes the payout
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processed, failed
    processedAt: timestamp('processed_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    referrerIdx: index('referral_payouts_referrer_idx').on(table.referrerId),
    referredUserIdx: index('referral_payouts_referred_user_idx').on(table.referredUserId),
    gumroadOrderIdx: index('referral_payouts_gumroad_order_idx').on(table.gumroadOrderId),
    statusIdx: index('referral_payouts_status_idx').on(table.status),
  })
);

// Referral links table for tracking referral campaigns and click analytics
export const referralLinks = pgTable(
  'referral_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
    campaignName: varchar('campaign_name', { length: 100 }),
    isActive: boolean('is_active').default(true),
    clickCount: integer('click_count').default(0),
    conversionCount: integer('conversion_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('referral_links_user_idx').on(table.userId),
    codeIdx: index('referral_links_code_idx').on(table.referralCode),
    activeIdx: index('referral_links_active_idx').on(table.isActive),
  })
);

// Referral clicks table for tracking click analytics
export const referralClicks = pgTable(
  'referral_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referralLinkId: uuid('referral_link_id')
      .notNull()
      .references(() => referralLinks.id, { onDelete: 'cascade' }),
    referralCode: varchar('referral_code', { length: 20 }).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }), // Hashed IP for privacy
    userAgent: text('user_agent'),
    referer: text('referer'),
    countryCode: varchar('country_code', { length: 2 }),
    utm: jsonb('utm'), // UTM parameters
    sessionId: varchar('session_id', { length: 255 }),
    converted: boolean('converted').default(false),
    convertedAt: timestamp('converted_at'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    linkIdx: index('referral_clicks_link_idx').on(table.referralLinkId),
    codeIdx: index('referral_clicks_code_idx').on(table.referralCode),
    convertedIdx: index('referral_clicks_converted_idx').on(table.converted),
    createdAtIdx: index('referral_clicks_created_at_idx').on(table.createdAt),
  })
);

// Validation schemas for referral system
export const insertReferralPayoutSchema = createInsertSchema(referralPayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertReferralLinkSchema = createInsertSchema(referralLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertReferralClickSchema = createInsertSchema(referralClicks).omit({
  id: true,
  createdAt: true,
} as const);

// Type exports for referral system
export type ReferralPayout = typeof referralPayouts.$inferSelect;
export type InsertReferralPayout = z.infer<typeof insertReferralPayoutSchema>;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type InsertReferralLink = z.infer<typeof insertReferralLinkSchema>;
export type ReferralClick = typeof referralClicks.$inferSelect;
export type InsertReferralClick = z.infer<typeof insertReferralClickSchema>;
