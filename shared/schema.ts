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

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  
  // Firebase authentication fields
  firebaseUid: varchar("firebase_uid").unique(),
  authProvider: varchar("auth_provider", { length: 50 }).default("replit"),
  
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
