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
});

export const insertEnhancedTermSchema = createInsertSchema(enhancedTerms).omit({
  id: true,
  viewCount: true,
  lastViewed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInteractiveElementSchema = createInsertSchema(interactiveElements).omit({
  id: true,
  createdAt: true,
});

export const insertTermRelationshipSchema = createInsertSchema(termRelationships).omit({
  id: true,
  createdAt: true,
});

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