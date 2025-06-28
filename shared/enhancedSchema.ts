import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  integer,
  boolean,
  primaryKey,
  decimal,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import original tables first to avoid reference issues
import {
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
} from './schema';

// Enhanced schema for complex term structure with 42 sections

// Content sections table - stores structured data from the 42 sections
export const termSections = pgTable("term_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  sectionName: varchar("section_name", { length: 100 }).notNull(), // e.g., 'Introduction', 'Prerequisites'
  sectionData: jsonb("section_data").notNull(), // Structured JSON data for the section
  displayType: varchar("display_type", { length: 20 }).notNull(), // 'card', 'sidebar', 'main', 'modal', 'metadata'
  priority: integer("priority").default(5), // 1-10 for ordering
  isInteractive: boolean("is_interactive").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  termSectionIdx: index("term_section_idx").on(table.termId, table.sectionName),
  displayTypeIdx: index("display_type_idx").on(table.displayType),
}));

// Enhanced terms table with complex categorization
export const enhancedTerms = pgTable("enhanced_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 250 }).notNull().unique(), // URL-friendly version
  
  // Core content
  shortDefinition: text("short_definition"),
  fullDefinition: text("full_definition").notNull(),
  
  // Categorization
  mainCategories: text("main_categories").array().default([]), // AI-parsed main categories
  subCategories: text("sub_categories").array().default([]), // AI-parsed subcategories
  relatedConcepts: text("related_concepts").array().default([]), // Related terms
  applicationDomains: text("application_domains").array().default([]), // Finance, Healthcare, etc.
  techniques: text("techniques").array().default([]), // Algorithms, techniques
  
  // Metadata
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // Beginner, Intermediate, Advanced, Expert
  hasImplementation: boolean("has_implementation").default(false),
  hasInteractiveElements: boolean("has_interactive_elements").default(false),
  hasCaseStudies: boolean("has_case_studies").default(false),
  hasCodeExamples: boolean("has_code_examples").default(false),
  
  // Search and filtering
  searchText: text("search_text"), // Pre-processed searchable text from all sections
  keywords: text("keywords").array().default([]), // Extracted keywords for search
  
  // Analytics
  viewCount: integer("view_count").default(0),
  lastViewed: timestamp("last_viewed"),
  
  // Parsing metadata
  parseHash: varchar("parse_hash", { length: 32 }), // Hash of original data to detect changes
  parseVersion: varchar("parse_version", { length: 10 }).default("1.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("enhanced_terms_name_idx").on(table.name),
  slugIdx: index("enhanced_terms_slug_idx").on(table.slug),
  difficultyIdx: index("enhanced_terms_difficulty_idx").on(table.difficultyLevel),
  mainCategoriesIdx: index("enhanced_terms_main_categories_idx").on(table.mainCategories),
  searchTextIdx: index("enhanced_terms_search_text_idx").on(table.searchText),
}));

// Interactive elements table - stores references to interactive content
export const interactiveElements = pgTable("interactive_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  sectionName: varchar("section_name", { length: 100 }).notNull(),
  elementType: varchar("element_type", { length: 50 }).notNull(), // 'mermaid', 'quiz', 'demo', 'code'
  elementData: jsonb("element_data").notNull(), // Configuration and content
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  termElementIdx: index("interactive_elements_term_idx").on(table.termId),
  typeIdx: index("interactive_elements_type_idx").on(table.elementType),
}));

// Term relationships - for related concepts and prerequisites
export const termRelationships = pgTable("term_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromTermId: uuid("from_term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  toTermId: uuid("to_term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // 'prerequisite', 'related', 'extends', 'alternative'
  strength: integer("strength").default(5), // 1-10 relationship strength
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  fromTermIdx: index("term_relationships_from_idx").on(table.fromTermId),
  toTermIdx: index("term_relationships_to_idx").on(table.toTermId),
  typeIdx: index("term_relationships_type_idx").on(table.relationshipType),
}));

// Display configurations - customizable layouts per term
export const displayConfigs = pgTable("display_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  configType: varchar("config_type", { length: 50 }).notNull(), // 'card', 'detail', 'mobile'
  layout: jsonb("layout").notNull(), // Layout configuration
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  termConfigIdx: index("display_configs_term_idx").on(table.termId, table.configType),
}));

// User preferences for personalized display
export const enhancedUserSettings = pgTable("enhanced_user_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  
  // Display preferences
  experienceLevel: varchar("experience_level", { length: 20 }).default("intermediate"), // beginner, intermediate, advanced, expert
  preferredSections: text("preferred_sections").array().default([]), // Sections to prioritize
  hiddenSections: text("hidden_sections").array().default([]), // Sections to hide
  
  // Content preferences
  showMathematicalDetails: boolean("show_mathematical_details").default(true),
  showCodeExamples: boolean("show_code_examples").default(true),
  showInteractiveElements: boolean("show_interactive_elements").default(true),
  
  // Personalization
  favoriteCategories: text("favorite_categories").array().default([]),
  favoriteApplications: text("favorite_applications").array().default([]),
  
  // UI preferences
  compactMode: boolean("compact_mode").default(false),
  darkMode: boolean("dark_mode").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics for content optimization
export const contentAnalytics = pgTable("content_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  sectionName: varchar("section_name", { length: 100 }), // null for overall term analytics
  
  // Engagement metrics
  views: integer("views").default(0),
  timeSpent: integer("time_spent_seconds").default(0), // Total time spent
  interactionCount: integer("interaction_count").default(0), // Clicks, expansions, etc.
  
  // Quality metrics
  userRating: integer("user_rating"), // 1-5 stars
  helpfulnessVotes: integer("helpfulness_votes").default(0),
  
  // Temporal data
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  termAnalyticsIdx: index("content_analytics_term_idx").on(table.termId),
  sectionAnalyticsIdx: index("content_analytics_section_idx").on(table.sectionName),
}));

// AI Content Feedback and Verification System
export const aiContentFeedback = pgTable("ai_content_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Feedback details
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // 'incorrect', 'incomplete', 'misleading', 'outdated', 'other'
  section: varchar("section", { length: 100 }), // Which part of the content (definition, characteristics, etc.)
  description: text("description").notNull(), // User's description of the issue
  severity: varchar("severity", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'critical'
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'reviewing', 'resolved', 'dismissed'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Metadata
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  termFeedbackIdx: index("ai_feedback_term_idx").on(table.termId),
  statusIdx: index("ai_feedback_status_idx").on(table.status),
  userFeedbackIdx: index("ai_feedback_user_idx").on(table.userId),
}));

// AI Content Verification Status
export const aiContentVerification = pgTable("ai_content_verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  
  // AI Generation tracking
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiModel: varchar("ai_model", { length: 50 }), // 'gpt-4o-mini', 'gpt-3.5-turbo', etc.
  generatedAt: timestamp("generated_at"),
  generatedBy: varchar("generated_by").references(() => users.id),
  
  // Verification status
  verificationStatus: varchar("verification_status", { length: 20 }).default("unverified"), 
  // 'unverified', 'verified', 'flagged', 'needs_review', 'expert_reviewed'
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  
  // Quality metrics
  accuracyScore: integer("accuracy_score"), // 1-100 if assessed
  completenessScore: integer("completeness_score"), // 1-100 if assessed
  clarityScore: integer("clarity_score"), // 1-100 if assessed
  
  // Expert review
  expertReviewRequired: boolean("expert_review_required").default(false),
  expertReviewer: varchar("expert_reviewer").references(() => users.id),
  expertReviewNotes: text("expert_review_notes"),
  expertReviewedAt: timestamp("expert_reviewed_at"),
  
  // Confidence and reliability
  confidenceLevel: varchar("confidence_level", { length: 20 }).default("medium"), // 'low', 'medium', 'high'
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  termVerificationIdx: index("ai_verification_term_idx").on(table.termId),
  statusVerificationIdx: index("ai_verification_status_idx").on(table.verificationStatus),
  aiGeneratedIdx: index("ai_verification_generated_idx").on(table.isAiGenerated),
}));

// AI Usage Analytics
export const aiUsageAnalytics = pgTable("ai_usage_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Operation details
  operation: varchar("operation", { length: 50 }).notNull(), // 'generate_definition', 'improve_definition', 'semantic_search', 'suggest_terms'
  model: varchar("model", { length: 50 }).notNull(), // 'gpt-4o-mini', 'gpt-3.5-turbo'
  
  // Request details
  userId: varchar("user_id").references(() => users.id),
  termId: uuid("term_id").references(() => enhancedTerms.id),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  
  // Performance metrics
  latency: integer("latency_ms"), // Response time in milliseconds
  cost: decimal("cost", { precision: 10, scale: 6 }), // Cost in USD
  
  // Quality metrics
  success: boolean("success").default(true),
  errorType: varchar("error_type", { length: 100 }),
  errorMessage: text("error_message"),
  
  // User feedback
  userAccepted: boolean("user_accepted"), // Did user accept the AI output?
  userRating: integer("user_rating"), // 1-5 if user rated the output
  
  // Metadata
  sessionId: varchar("session_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  operationIdx: index("ai_usage_operation_idx").on(table.operation),
  modelIdx: index("ai_usage_model_idx").on(table.model),
  userUsageIdx: index("ai_usage_user_idx").on(table.userId),
  dateIdx: index("ai_usage_date_idx").on(table.createdAt),
}));

// Sections table - for the 42-section architecture
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  termId: uuid("term_id").notNull().references(() => enhancedTerms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  termNameUnique: unique().on(table.termId, table.name),
  termIdIdx: index("idx_sections_term_id").on(table.termId),
  nameIdx: index("idx_sections_name").on(table.name),
  orderIdx: index("idx_sections_order").on(table.termId, table.displayOrder),
}));

// Section items table - content within each section
export const sectionItems = pgTable("section_items", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 200 }).notNull(),
  content: text("content"),
  contentType: varchar("content_type", { length: 50 }).default("markdown"),
  displayOrder: integer("display_order").notNull().default(0),
  metadata: jsonb("metadata"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  verificationStatus: varchar("verification_status", { length: 20 }).default("unverified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sectionIdIdx: index("idx_section_items_section_id").on(table.sectionId),
  contentTypeIdx: index("idx_section_items_content_type").on(table.contentType),
  orderIdx: index("idx_section_items_order").on(table.sectionId, table.displayOrder),
  verificationIdx: index("idx_section_items_verification").on(table.verificationStatus),
}));

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