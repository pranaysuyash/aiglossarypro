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

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  
  // Firebase authentication fields
  firebaseUid: varchar("firebase_uid").unique(),
  authProvider: varchar("auth_provider", { length: 50 }).default("firebase"),
  
  // NEW MONETIZATION FIELDS
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"),
  lifetimeAccess: boolean("lifetime_access").default(false),
  purchaseDate: timestamp("purchase_date"),
  dailyViews: integer("daily_views").default(0),
  lastViewReset: timestamp("last_view_reset").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// NEW PURCHASES TABLE for Gumroad integration
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  gumroadOrderId: varchar("gumroad_order_id").unique().notNull(),
  amount: integer("amount"), // in cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status").default("completed"),
  purchaseData: jsonb("purchase_data"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("purchases_user_idx").on(table.userId),
  orderIdx: index("purchases_order_idx").on(table.gumroadOrderId),
  statusIdx: index("purchases_status_idx").on(table.status),
}));

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("categories_name_idx").on(table.name),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
} as const);

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    nameIdIdx: index("subcategory_name_category_id_idx").on(table.name, table.categoryId),
  };
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
} as const);

export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;

// Terms table
export const terms = pgTable("terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  shortDefinition: text("short_definition"),
  definition: text("definition").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  characteristics: text("characteristics").array(),
  visualUrl: text("visual_url"),
  visualCaption: text("visual_caption"),
  mathFormulation: text("math_formulation"),
  applications: jsonb("applications"),
  references: text("references").array(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("terms_name_idx").on(table.name),
  categoryIdx: index("terms_category_idx").on(table.categoryId),
  viewCountIdx: index("terms_view_count_idx").on(table.viewCount),
  createdAtIdx: index("terms_created_at_idx").on(table.createdAt),
  updatedAtIdx: index("terms_updated_at_idx").on(table.updatedAt),
  nameSearchIdx: index("terms_name_search_idx").on(table.name),
  definitionSearchIdx: index("terms_definition_search_idx").on(table.definition),
}));

export const insertTermSchema = createInsertSchema(terms).omit({ 
  id: true, 
  viewCount: true,
  createdAt: true,
  updatedAt: true 
} as const);

export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof terms.$inferSelect;

// Term-Subcategory relation table
export const termSubcategories = pgTable("term_subcategories", {
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  subcategoryId: uuid("subcategory_id").notNull().references(() => subcategories.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey(table.termId, table.subcategoryId),
  termIdx: index("term_subcategories_term_idx").on(table.termId),
  subcategoryIdx: index("term_subcategories_subcategory_idx").on(table.subcategoryId),
}));

// User favorites table
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userTermIdx: index("favorites_user_term_idx").on(table.userId, table.termId),
}));

// User progress table
export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  learnedAt: timestamp("learned_at").defaultNow(),
}, (table) => ({
  userTermIdx: index("progress_user_term_idx").on(table.userId, table.termId),
}));

// Term views table
export const termViews = pgTable("term_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => ({
  userTermIdx: index("views_user_term_idx").on(table.userId, table.termId),
  viewedAtIdx: index("views_viewed_at_idx").on(table.viewedAt),
}));

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter subscriptions table
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, unsubscribed
  language: varchar("language", { length: 10 }).default("en"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }), // Hashed IP for privacy
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
}, (table) => ({
  emailIdx: index("newsletter_email_idx").on(table.email),
  statusIdx: index("newsletter_status_idx").on(table.status),
  createdAtIdx: index("newsletter_created_at_idx").on(table.createdAt),
  utmSourceIdx: index("newsletter_utm_source_idx").on(table.utmSource),
}));

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({
  id: true,
  createdAt: true,
  unsubscribedAt: true,
} as const);

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

// Contact form submissions table
export const contactSubmissions = pgTable("contact_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, in_progress, resolved
  language: varchar("language", { length: 10 }).default("en"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }), // Hashed IP for privacy
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("contact_email_idx").on(table.email),
  statusIdx: index("contact_status_idx").on(table.status),
  createdAtIdx: index("contact_created_at_idx").on(table.createdAt),
  utmSourceIdx: index("contact_utm_source_idx").on(table.utmSource),
}));

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Early bird customers table for First 500 Customers promotion
export const earlyBirdCustomers = pgTable("early_bird_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  purchaseOrderId: varchar("purchase_order_id", { length: 255 }).unique(), // Gumroad order ID
  status: varchar("status", { length: 20 }).notNull().default("registered"), // registered, purchased, expired
  discountAmount: integer("discount_amount").notNull().default(70), // $70 discount
  originalPrice: integer("original_price").notNull().default(24900), // $249 in cents
  discountedPrice: integer("discounted_price").notNull().default(17900), // $179 in cents
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  purchasedAt: timestamp("purchased_at"),
  expiresAt: timestamp("expires_at").notNull(), // 30 days from registration
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  countryCode: varchar("country_code", { length: 2 }),
  ipAddress: varchar("ip_address", { length: 64 }), // Hashed IP for privacy
}, (table) => ({
  emailIdx: index("early_bird_customers_email_idx").on(table.email),
  statusIdx: index("early_bird_customers_status_idx").on(table.status),
  registeredAtIdx: index("early_bird_customers_registered_at_idx").on(table.registeredAt),
  purchasedAtIdx: index("early_bird_customers_purchased_at_idx").on(table.purchasedAt),
  utmSourceIdx: index("early_bird_customers_utm_source_idx").on(table.utmSource),
}));

export const insertEarlyBirdCustomerSchema = createInsertSchema(earlyBirdCustomers).omit({
  id: true,
  registeredAt: true,
} as const);

export type EarlyBirdCustomer = typeof earlyBirdCustomers.$inferSelect;
export type InsertEarlyBirdCustomer = z.infer<typeof insertEarlyBirdCustomerSchema>;

// Early bird status tracking table
export const earlyBirdStatus = pgTable("early_bird_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  totalRegistered: integer("total_registered").notNull().default(0),
  totalPurchased: integer("total_purchased").notNull().default(0),
  maxEarlyBirdSlots: integer("max_early_bird_slots").notNull().default(500),
  earlyBirdActive: boolean("early_bird_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EarlyBirdStatus = typeof earlyBirdStatus.$inferSelect;
export type InsertEarlyBirdStatus = typeof earlyBirdStatus.$inferInsert;

// Cache metrics table for performance monitoring
export const cacheMetrics = pgTable("cache_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").notNull(),
  cacheType: varchar("cache_type", { length: 50 }).notNull(), // query, search, user
  hitCount: integer("hit_count").notNull().default(0),
  missCount: integer("miss_count").notNull().default(0),
  evictionCount: integer("eviction_count").notNull().default(0),
  hitRate: integer("hit_rate").notNull(), // Stored as percentage * 100 (e.g., 85.5% = 8550)
  avgResponseTime: integer("avg_response_time"), // in microseconds
  cacheSize: integer("cache_size").notNull(),
  memoryUsage: integer("memory_usage"), // in bytes
  metadata: jsonb("metadata"), // Additional metrics like hot keys, cold keys, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  timestampIdx: index("cache_metrics_timestamp_idx").on(table.timestamp),
  cacheTypeIdx: index("cache_metrics_cache_type_idx").on(table.cacheType),
  createdAtIdx: index("cache_metrics_created_at_idx").on(table.createdAt),
}));

export type CacheMetric = typeof cacheMetrics.$inferSelect;
export type InsertCacheMetric = typeof cacheMetrics.$inferInsert;
