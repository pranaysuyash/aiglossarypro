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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

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
});

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
});

export const insertTermSchema = createInsertSchema(terms).omit({ 
  id: true, 
  viewCount: true,
  createdAt: true,
  updatedAt: true 
});

export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof terms.$inferSelect;

// Term-Subcategory relation table
export const termSubcategories = pgTable("term_subcategories", {
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  subcategoryId: uuid("subcategory_id").notNull().references(() => subcategories.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey(table.termId, table.subcategoryId),
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
