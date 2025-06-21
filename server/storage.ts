import {
  users,
  type User,
  type UpsertUser,
  terms,
  categories,
  subcategories,
  termSubcategories,
  favorites,
  userProgress,
  termViews,
  userSettings
} from "@shared/enhancedSchema";
import { db } from "./db";
import { eq, desc, sql, and, like, ilike, asc, gte, lte, not, isNull, inArray, or } from "drizzle-orm";
import { 
  createInsertSchema, 
  createSelectSchema
} from "drizzle-zod";
import { z } from "zod";
import { formatDistanceToNow, subDays, format, startOfDay, endOfDay } from "date-fns";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<any[]>;
  getCategoryById(id: string): Promise<any>;
  
  // Term operations
  getFeaturedTerms(): Promise<any[]>;
  getTermById(id: string): Promise<any>;
  getRecentlyViewedTerms(userId: string): Promise<any[]>;
  recordTermView(termId: string, userId: string | null): Promise<void>;
  searchTerms(query: string): Promise<any[]>;
  
  // Favorites operations
  getUserFavorites(userId: string): Promise<any[]>;
  isTermFavorite(userId: string, termId: string): Promise<boolean>;
  addFavorite(userId: string, termId: string): Promise<void>;
  removeFavorite(userId: string, termId: string): Promise<void>;
  
  // Progress operations
  getUserProgress(userId: string): Promise<any>;
  isTermLearned(userId: string, termId: string): Promise<boolean>;
  markTermAsLearned(userId: string, termId: string): Promise<void>;
  unmarkTermAsLearned(userId: string, termId: string): Promise<void>;
  
  // User activity operations
  getUserActivity(userId: string): Promise<any>;
  getUserStreak(userId: string): Promise<any>;
  
  // Recommendations
  getRecommendedTerms(userId: string): Promise<any[]>;
  getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<any[]>;
  
  // Settings
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<void>;
  
  // Analytics
  getAnalytics(): Promise<any>;
  
  // User data
  exportUserData(userId: string): Promise<any>;
  deleteUserData(userId: string): Promise<void>;
  
  // Admin operations
  getAdminStats(): Promise<any>;
  clearAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Category operations
  async getCategories(): Promise<any[]> {
    // Get all categories with term counts
    const categoriesWithCount = await db.select({
      id: categories.id,
      name: categories.name,
      termCount: sql<number>`count(${terms.id})`,
    })
    .from(categories)
    .leftJoin(terms, eq(categories.id, terms.categoryId))
    .groupBy(categories.id)
    .orderBy(categories.name);
    
    // For each category, get its subcategories
    const result = [];
    
    for (const category of categoriesWithCount) {
      const subcats = await db.select()
        .from(subcategories)
        .where(eq(subcategories.categoryId, category.id))
        .orderBy(subcategories.name);
      
      result.push({
        ...category,
        subcategories: subcats
      });
    }
    
    return result;
  }

  async getCategoryById(id: string): Promise<any> {
    // Get the category
    const [category] = await db.select()
      .from(categories)
      .where(eq(categories.id, id));
    
    if (!category) {
      return null;
    }
    
    // Get subcategories
    const subcats = await db.select()
      .from(subcategories)
      .where(eq(subcategories.categoryId, id))
      .orderBy(subcategories.name);
    
    // Get terms in this category
    const termsInCategory = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt,
      viewCount: terms.viewCount,
    })
    .from(terms)
    .where(eq(terms.categoryId, id))
    .orderBy(terms.name);
    
    return {
      ...category,
      subcategories: subcats,
      terms: termsInCategory
    };
  }
  
  // Term operations
  async getFeaturedTerms(): Promise<any[]> {
    // Get terms with high view counts or manually featured
    const featuredTerms = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      viewCount: terms.viewCount,
      category: categories.name,
      categoryId: categories.id,
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .orderBy(desc(terms.viewCount))
    .limit(6);
    
    // For each term, get its subcategories
    const result = [];
    
    for (const term of featuredTerms) {
      // Get subcategories for this term
      const termSubcats = await db.select({
        name: subcategories.name
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, term.id));
      
      result.push({
        ...term,
        subcategories: termSubcats.map(sc => sc.name)
      });
    }
    
    return result;
  }

  async getTermById(id: string): Promise<any> {
    // Get the term with category
    const [term] = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      definition: terms.definition,
      characteristics: terms.characteristics,
      visualUrl: terms.visualUrl,
      visualCaption: terms.visualCaption,
      mathFormulation: terms.mathFormulation,
      applications: terms.applications,
      references: terms.references,
      viewCount: terms.viewCount,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt,
      category: categories.name,
      categoryId: categories.id,
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(eq(terms.id, id));
    
    if (!term) {
      return null;
    }
    
    // Get subcategories for this term
    const termSubcats = await db.select({
      id: subcategories.id,
      name: subcategories.name
    })
    .from(termSubcategories)
    .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
    .where(eq(termSubcategories.termId, id));
    
    // Get related terms (simpler approach - terms in the same category)
    const relatedTerms = term.categoryId ? await db.select({
      id: terms.id,
      name: terms.name
    })
    .from(terms)
    .where(
      and(
        eq(terms.categoryId, term.categoryId),
        not(eq(terms.id, id))
      )
    )
    .limit(6) : [];
    
    // Format the date
    const formattedDate = term.updatedAt ? 
      format(term.updatedAt, 'MMMM d, yyyy') : 
      (term.createdAt ? format(term.createdAt, 'MMMM d, yyyy') : 'Unknown date');
    
    return {
      ...term,
      updatedAt: formattedDate,
      subcategories: termSubcats.map(sc => sc.name),
      relatedTerms
    };
  }

  async getRecentlyViewedTerms(userId: string): Promise<any[]> {
    // Get recently viewed terms with relative time
    const recentViews = await db.select({
      termId: termViews.termId,
      viewedAt: termViews.viewedAt,
      name: terms.name,
      category: categories.name,
    })
    .from(termViews)
    .innerJoin(terms, eq(termViews.termId, terms.id))
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(eq(termViews.userId, userId))
    .orderBy(desc(termViews.viewedAt))
    .limit(10);
    
    // Format the dates
    return recentViews.map(view => ({
      id: view.termId,
      name: view.name,
      category: view.category,
      viewedAt: view.viewedAt.toISOString(),
      relativeTime: formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })
    }));
  }

  async recordTermView(termId: string, userId: string | null): Promise<void> {
    // First, check if the term exists
    const [term] = await db.select({
      id: terms.id,
      viewCount: terms.viewCount
    })
    .from(terms)
    .where(eq(terms.id, termId));
    
    if (!term) {
      throw new Error("Term not found");
    }
    
    // Update view count on the term
    await db.update(terms)
      .set({ 
        viewCount: term.viewCount + 1,
        updatedAt: new Date()
      })
      .where(eq(terms.id, termId));
    
    // If user is authenticated, record this view
    if (userId) {
      // Insert the view
      await db.insert(termViews)
        .values({
          termId,
          userId,
          viewedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [termViews.termId, termViews.userId],
          set: { viewedAt: new Date() }
        });
    }
  }

  async searchTerms(query: string): Promise<any[]> {
    // Search for terms matching the query - simplified version
    const results = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      category: categories.name,
      categoryId: categories.id,
      viewCount: terms.viewCount,
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(ilike(terms.name, `%${query}%`))
    .orderBy(terms.name)
    .limit(20);
    
    // For each term, get its subcategories
    const resultWithSubcats = [];
    
    for (const term of results) {
      // Get subcategories for this term
      const termSubcats = await db.select({
        name: subcategories.name
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, term.id));
      
      resultWithSubcats.push({
        ...term,
        subcategories: termSubcats.map(sc => sc.name)
      });
    }
    
    return resultWithSubcats;
  }
  
  // Favorites operations
  async getUserFavorites(userId: string): Promise<any[]> {
    // Get user's favorite terms
    const userFavorites = await db.select({
      termId: favorites.termId,
      createdAt: favorites.createdAt,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      viewCount: terms.viewCount,
      category: categories.name,
      categoryId: categories.id,
    })
    .from(favorites)
    .innerJoin(terms, eq(favorites.termId, terms.id))
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
    
    // For each term, get its subcategories
    const result = [];
    
    for (const fav of userFavorites) {
      // Get subcategories for this term
      const termSubcats = await db.select({
        name: subcategories.name
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, fav.termId));
      
      result.push({
        id: fav.termId,
        name: fav.name,
        shortDefinition: fav.shortDefinition,
        viewCount: fav.viewCount,
        category: fav.category,
        categoryId: fav.categoryId,
        favoriteDate: fav.createdAt.toISOString(),
        subcategories: termSubcats.map(sc => sc.name)
      });
    }
    
    return result;
  }

  async isTermFavorite(userId: string, termId: string): Promise<boolean> {
    // Check if the term is in user's favorites
    const [favorite] = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.termId, termId)
        )
      );
    
    return !!favorite;
  }

  async addFavorite(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select()
      .from(terms)
      .where(eq(terms.id, termId));
    
    if (!term) {
      throw new Error("Term not found");
    }
    
    // Add to favorites
    await db.insert(favorites)
      .values({
        userId,
        termId,
        createdAt: new Date()
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, termId: string): Promise<void> {
    // Remove from favorites
    await db.delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.termId, termId)
        )
      );
  }
  
  // Progress operations
  async getUserProgress(userId: string): Promise<any> {
    // Get total terms count
    const [{ count: totalTerms }] = await db.select({
      count: sql<number>`count(${terms.id})`
    })
    .from(terms);
    
    // Get learned terms count
    const [{ count: termsLearned }] = await db.select({
      count: sql<number>`count(${userProgress.termId})`
    })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));
    
    // Get user activity for last week
    const lastWeekActivity = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);
      
      // Count views on this day
      const [{ count }] = await db.select({
        count: sql<number>`count(${termViews.id})`
      })
      .from(termViews)
      .where(
        and(
          eq(termViews.userId, userId),
          gte(termViews.viewedAt, startOfDayDate),
          lte(termViews.viewedAt, endOfDayDate)
        )
      );
      
      lastWeekActivity.push(count);
    }
    
    // Calculate streak
    // Get all days with activity, ordered by date
    const activeViews = await db.select({
      day: sql<string>`date_trunc('day', ${termViews.viewedAt})`
    })
    .from(termViews)
    .where(eq(termViews.userId, userId))
    .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
    .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));
    
    let streak = 0;
    if (activeViews.length > 0) {
      const now = new Date();
      const yesterday = startOfDay(subDays(now, 1));
      const lastActive = new Date(activeViews[0].day);
      
      // Check if user was active today or yesterday
      if (
        startOfDay(lastActive).getTime() === startOfDay(now).getTime() ||
        startOfDay(lastActive).getTime() === yesterday.getTime()
      ) {
        streak = 1;
        
        // Count consecutive days backwards
        for (let i = 1; i < activeViews.length; i++) {
          const currentDay = new Date(activeViews[i].day);
          const previousDay = new Date(activeViews[i - 1].day);
          
          // Check if days are consecutive
          const diffInDays = Math.round(
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diffInDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    return {
      termsLearned,
      totalTerms,
      streak,
      lastWeekActivity
    };
  }

  async isTermLearned(userId: string, termId: string): Promise<boolean> {
    // Check if the term is marked as learned
    const [progress] = await db.select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.termId, termId)
        )
      );
    
    return !!progress;
  }

  async markTermAsLearned(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select()
      .from(terms)
      .where(eq(terms.id, termId));
    
    if (!term) {
      throw new Error("Term not found");
    }
    
    // Mark as learned
    await db.insert(userProgress)
      .values({
        userId,
        termId,
        learnedAt: new Date()
      })
      .onConflictDoNothing();
  }

  async unmarkTermAsLearned(userId: string, termId: string): Promise<void> {
    // Unmark as learned
    await db.delete(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.termId, termId)
        )
      );
  }
  
  // User activity operations
  async getUserActivity(userId: string): Promise<any> {
    // Get view counts per day for last 14 days
    const viewsData = [];
    const learnedData = [];
    const labels = [];
    
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'MMM d');
      labels.push(dateStr);
      
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);
      
      // Count views on this day
      const [{ count: viewCount }] = await db.select({
        count: sql<number>`count(${termViews.id})`
      })
      .from(termViews)
      .where(
        and(
          eq(termViews.userId, userId),
          gte(termViews.viewedAt, startOfDayDate),
          lte(termViews.viewedAt, endOfDayDate)
        )
      );
      
      // Count terms learned on this day
      const [{ count: learnedCount }] = await db.select({
        count: sql<number>`count(${userProgress.termId})`
      })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          gte(userProgress.learnedAt, startOfDayDate),
          lte(userProgress.learnedAt, endOfDayDate)
        )
      );
      
      viewsData.push(viewCount);
      learnedData.push(learnedCount);
    }
    
    // Get total views
    const [{ count: totalViews }] = await db.select({
      count: sql<number>`count(${termViews.id})`
    })
    .from(termViews)
    .where(eq(termViews.userId, userId));
    
    // Get unique categories explored
    const exploreCounts = await db.select({
      categoryId: terms.categoryId
    })
    .from(termViews)
    .innerJoin(terms, eq(termViews.termId, terms.id))
    .where(eq(termViews.userId, userId))
    .groupBy(terms.categoryId);
    
    const categoriesExplored = exploreCounts.length;
    
    // Get last activity
    const [lastView] = await db.select({
      viewedAt: termViews.viewedAt
    })
    .from(termViews)
    .where(eq(termViews.userId, userId))
    .orderBy(desc(termViews.viewedAt))
    .limit(1);
    
    const lastActivity = lastView ? 
      formatDistanceToNow(new Date(lastView.viewedAt), { addSuffix: true }) : 
      'Never';
    
    return {
      labels,
      views: viewsData,
      learned: learnedData,
      totalViews,
      categoriesExplored,
      lastActivity
    };
  }

  async getUserStreak(userId: string): Promise<any> {
    // Get all days with activity, ordered by date
    const activeViews = await db.select({
      day: sql<string>`date_trunc('day', ${termViews.viewedAt})`
    })
    .from(termViews)
    .where(eq(termViews.userId, userId))
    .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
    .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));
    
    // Calculate current streak
    let currentStreak = 0;
    let bestStreak = 0;
    
    if (activeViews.length > 0) {
      const now = new Date();
      const yesterday = startOfDay(subDays(now, 1));
      const lastActive = new Date(activeViews[0].day);
      
      // Check if user was active today or yesterday
      if (
        startOfDay(lastActive).getTime() === startOfDay(now).getTime() ||
        startOfDay(lastActive).getTime() === yesterday.getTime()
      ) {
        currentStreak = 1;
        
        // Count consecutive days backwards
        for (let i = 1; i < activeViews.length; i++) {
          const currentDay = new Date(activeViews[i].day);
          const previousDay = new Date(activeViews[i - 1].day);
          
          // Check if days are consecutive
          const diffInDays = Math.round(
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diffInDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      // Calculate best streak
      bestStreak = currentStreak;
      let tempStreak = 0;
      
      for (let i = 0; i < activeViews.length - 1; i++) {
        const currentDay = new Date(activeViews[i].day);
        const nextDay = new Date(activeViews[i + 1].day);
        
        // Check if days are consecutive
        const diffInDays = Math.round(
          (startOfDay(currentDay).getTime() - startOfDay(nextDay).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diffInDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 0;
        }
        
        bestStreak = Math.max(bestStreak, tempStreak + 1);
      }
    }
    
    // Get activity for last week
    const lastWeek = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);
      
      // Check if user was active on this day
      const [{ count }] = await db.select({
        count: sql<number>`count(${termViews.id})`
      })
      .from(termViews)
      .where(
        and(
          eq(termViews.userId, userId),
          gte(termViews.viewedAt, startOfDayDate),
          lte(termViews.viewedAt, endOfDayDate)
        )
      );
      
      lastWeek.push(count > 0);
    }
    
    return {
      currentStreak,
      bestStreak,
      lastWeek
    };
  }
  
  // Recommendations
  async getRecommendedTerms(userId: string): Promise<any[]> {
    // Strategy:
    // 1. Find categories and subcategories from viewed/learned terms
    // 2. Find other terms in those categories that user hasn't viewed yet
    // 3. Add some popular terms as recommendations too
    
    // Get user's viewed terms
    const viewedTerms = await db.select({
      termId: termViews.termId
    })
    .from(termViews)
    .where(eq(termViews.userId, userId));
    
    const viewedTermIds = viewedTerms.map(v => v.termId);
    
    // Get categories from viewed terms
    const viewedCategories = await db.select({
      categoryId: terms.categoryId
    })
    .from(terms)
    .where(
      and(
        not(isNull(terms.categoryId)),
        sql`${terms.id} IN (${viewedTermIds.length > 0 ? viewedTermIds : ['00000000-0000-0000-0000-000000000000']})`
      )
    )
    .groupBy(terms.categoryId);
    
    const categoryIds = viewedCategories.map(c => c.categoryId);
    
    // Get related terms from the same categories, excluding already viewed
    const recommendedTerms = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      viewCount: terms.viewCount,
      category: categories.name,
      categoryId: categories.id,
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(
      and(
        ...(categoryIds.length > 0 ? [sql`${terms.categoryId} IN (${categoryIds})`] : []),
        viewedTermIds.length > 0 ? not(sql`${terms.id} IN (${viewedTermIds})`) : sql`1=1`
      )
    )
    .orderBy(desc(terms.viewCount))
    .limit(6);
    
    // If we don't have enough, add popular terms
    if (recommendedTerms.length < 6) {
      const popularTerms = await db.select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        viewedTermIds.length > 0 ? not(sql`${terms.id} IN (${viewedTermIds})`) : sql`1=1`
      )
      .orderBy(desc(terms.viewCount))
      .limit(6 - recommendedTerms.length);
      
      recommendedTerms.push(...popularTerms);
    }
    
    // Get subcategories for each term
    const result = [];
    
    for (const term of recommendedTerms) {
      // Check if this term is a favorite
      const [favorite] = await db.select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.termId, term.id)
          )
        );
      
      // Get subcategories for this term
      const termSubcats = await db.select({
        name: subcategories.name
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, term.id));
      
      result.push({
        ...term,
        isFavorite: !!favorite,
        subcategories: termSubcats.map(sc => sc.name)
      });
    }
    
    return result;
  }

  async getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<any[]> {
    // Simplified approach: Find terms in the same category
    
    try {
      // First check if the term exists
      const [term] = await db.select({
        categoryId: terms.categoryId
      })
      .from(terms)
      .where(eq(terms.id, termId));
      
      if (!term) {
        throw new Error("Term not found");
      }
      
      // Build WHERE conditions - always exclude the current term
      const whereConditions = [not(eq(terms.id, termId))];
      
      // If term has a category, add category filter
      if (term.categoryId) {
        whereConditions.push(eq(terms.categoryId, term.categoryId));
      }
      
      // Find terms with same category, excluding the current term
      const relatedTerms = await db.select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(terms.viewCount))
      .limit(3);
      
      // Get subcategories and favorite status for each term
      const result = [];
      
      for (const relTerm of relatedTerms) {
        // Check if this term is a favorite (if user is authenticated)
        let isFavorite = false;
        
        if (userId) {
          const [favorite] = await db.select()
            .from(favorites)
            .where(
              and(
                eq(favorites.userId, userId),
                eq(favorites.termId, relTerm.id)
              )
            );
          
          isFavorite = !!favorite;
        }
        
        // Get subcategories for this term
        const termSubcats = await db.select({
          name: subcategories.name
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, relTerm.id));
        
        result.push({
          ...relTerm,
          isFavorite,
          subcategories: termSubcats.map(sc => sc.name)
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error in getRecommendedTermsForTerm:", error);
      throw error;
    }
  }
  
  // Settings
  async getUserSettings(userId: string): Promise<any> {
    // Get user settings or create default
    const [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    
    if (settings) {
      return settings;
    }
    
    // Create default settings
    const defaultPreferences = {
      emailNotifications: true,
      progressTracking: true,
      shareActivity: false,
    };
    
    const [newSettings] = await db.insert(userSettings)
      .values({
        userId,
        preferences: defaultPreferences,
      })
      .returning();
    
    return newSettings;
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    // Update settings
    await db.insert(userSettings)
      .values({
        userId,
        ...settings,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date()
        }
      });
  }
  
  // Analytics
  async getAnalytics(): Promise<any> {
    // Get total users
    const [{ count: totalUsers }] = await db.select({
      count: sql<number>`count(${users.id})`
    })
    .from(users);
    
    // Get total terms
    const [{ count: totalTerms }] = await db.select({
      count: sql<number>`count(${terms.id})`
    })
    .from(terms);
    
    // Get total views
    const [{ count: totalViews }] = await db.select({
      count: sql<number>`count(${termViews.id})`
    })
    .from(termViews);
    
    // Get total favorites
    const [{ count: totalFavorites }] = await db.select({
      count: sql<number>`count(${favorites.id})`
    })
    .from(favorites);
    
    // Get top terms by views
    const topTerms = await db.select({
      name: terms.name,
      views: terms.viewCount
    })
    .from(terms)
    .orderBy(desc(terms.viewCount))
    .limit(10);
    
    // Get categories distribution
    const categoryDistribution = await db.select({
      name: categories.name,
      count: sql<number>`count(${terms.id})`
    })
    .from(categories)
    .leftJoin(terms, eq(categories.id, terms.categoryId))
    .groupBy(categories.id)
    .having(sql`count(${terms.id}) > 0`)
    .orderBy(desc(sql`count(${terms.id})`));
    
    // Get user activity over time (last 30 days)
    const userActivity = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'MMM d');
      
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);
      
      // Count views on this day
      const [{ count }] = await db.select({
        count: sql<number>`count(${termViews.id})`
      })
      .from(termViews)
      .where(
        and(
          gte(termViews.viewedAt, startOfDayDate),
          lte(termViews.viewedAt, endOfDayDate)
        )
      );
      
      userActivity.push({
        date: dateStr,
        count
      });
    }
    
    return {
      totalUsers,
      totalTerms,
      totalViews,
      totalFavorites,
      topTerms,
      categoriesDistribution: categoryDistribution,
      userActivity
    };
  }
  
  // User data export/delete
  async exportUserData(userId: string): Promise<any> {
    // Get user info
    const user = await this.getUser(userId);
    
    // Get user's favorites
    const favorites = await this.getUserFavorites(userId);
    
    // Get user's progress
    const learned = await db.select({
      termId: userProgress.termId,
      learnedAt: userProgress.learnedAt,
      name: terms.name
    })
    .from(userProgress)
    .innerJoin(terms, eq(userProgress.termId, terms.id))
    .where(eq(userProgress.userId, userId));
    
    // Get user's views
    const views = await db.select({
      termId: termViews.termId,
      viewedAt: termViews.viewedAt,
      name: terms.name
    })
    .from(termViews)
    .innerJoin(terms, eq(termViews.termId, terms.id))
    .where(eq(termViews.userId, userId));
    
    // Get user's settings
    const settings = await this.getUserSettings(userId);
    
    return {
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        createdAt: user?.createdAt
      },
      favorites,
      learned: learned.map(item => ({
        termId: item.termId,
        name: item.name,
        learnedAt: item.learnedAt.toISOString()
      })),
      views: views.map(item => ({
        termId: item.termId,
        name: item.name,
        viewedAt: item.viewedAt.toISOString()
      })),
      settings
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete user's data (but not the user account itself)
    await db.delete(favorites)
      .where(eq(favorites.userId, userId));
    
    await db.delete(userProgress)
      .where(eq(userProgress.userId, userId));
    
    await db.delete(termViews)
      .where(eq(termViews.userId, userId));
    
    await db.delete(userSettings)
      .where(eq(userSettings.userId, userId));
  }
  
  // Admin operations
  async getAdminStats(): Promise<any> {
    // Get total terms
    const [{ count: totalTerms }] = await db.select({
      count: sql<number>`count(${terms.id})`
    })
    .from(terms);
    
    // Get total categories
    const [{ count: totalCategories }] = await db.select({
      count: sql<number>`count(${categories.id})`
    })
    .from(categories);
    
    // Get total views
    const [{ count: totalViews }] = await db.select({
      count: sql<number>`count(${termViews.id})`
    })
    .from(termViews);
    
    // Get total users
    const [{ count: totalUsers }] = await db.select({
      count: sql<number>`count(${users.id})`
    })
    .from(users);
    
    // Get last updated date
    const [lastTerm] = await db.select({
      updatedAt: terms.updatedAt
    })
    .from(terms)
    .orderBy(desc(terms.updatedAt))
    .limit(1);
    
    const lastUpdated = lastTerm ? format(new Date(lastTerm.updatedAt), 'MMMM d, yyyy h:mm a') : null;
    
    return {
      totalTerms,
      totalCategories,
      totalViews,
      totalUsers,
      lastUpdated
    };
  }

  async clearAllData(): Promise<void> {
    // Clear all glossary data (terms, categories, etc.)
    await db.delete(termViews);
    await db.delete(favorites);
    await db.delete(userProgress);
    await db.delete(termSubcategories);
    await db.delete(terms);
    await db.delete(subcategories);
    await db.delete(categories);
  }

  // Additional methods needed for AI integration
  async getAllTermNames(): Promise<string[]> {
    const results = await db.select({
      name: terms.name
    })
    .from(terms)
    .orderBy(terms.name);
    
    return results.map(r => r.name);
  }

  async getAllTermsForSearch(): Promise<any[]> {
    const results = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      definition: terms.definition,
      category: categories.name,
      categoryId: terms.categoryId
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .orderBy(terms.updatedAt);
    
    return results.map(term => ({
      id: term.id,
      name: term.name,
      shortDefinition: term.shortDefinition || '',
      definition: term.definition,
      category: term.category || 'Uncategorized',
      categoryId: term.categoryId || ''
    }));
  }

  async getTermCount(): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`count(${terms.id})`
    })
    .from(terms);
    
    return result.count;
  }


  async updateTerm(termId: string, updates: any): Promise<any> {
    const [updatedTerm] = await db.update(terms)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(terms.id, termId))
      .returning();
    
    return updatedTerm;
  }

  async getAllTerms(options: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    searchTerm?: string;
  } = {}): Promise<any[]> {
    const { limit = 50, offset = 0, categoryId, searchTerm } = options;
    
    try {
      // Build the base query
      let query = db.select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        definition: terms.definition,
        viewCount: terms.viewCount,
        categoryId: terms.categoryId,
        category: categories.name
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id));
      
      // Build WHERE conditions
      const whereConditions = [];
      
      if (categoryId) {
        whereConditions.push(eq(terms.categoryId, categoryId));
      }
      
      if (searchTerm) {
        whereConditions.push(
          or(
            ilike(terms.name, `%${searchTerm}%`),
            ilike(terms.definition, `%${searchTerm}%`)
          )
        );
      }
      
      // Apply WHERE conditions if any exist
      if (whereConditions.length === 1) {
        query = query.where(whereConditions[0]);
      } else if (whereConditions.length > 1) {
        query = query.where(and(...whereConditions));
      }
      
      const result = await query
        .orderBy(asc(terms.name))
        .limit(limit)
        .offset(offset);

      return result.map(term => ({
        ...term,
        subcategories: [] // Simplified for now
      }));
    } catch (error) {
      console.error("Error in getAllTerms:", error);
      throw error;
    }
  }

  async getTrendingTerms(limit: number = 10): Promise<any[]> {
    const result = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      definition: terms.definition,
      viewCount: terms.viewCount,
      categoryId: categories.id,
      category: categories.name,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .orderBy(desc(terms.viewCount), desc(terms.updatedAt))
    .limit(limit);

    // Get subcategories for each term
    const enrichedTerms = [];
    for (const term of result) {
      const subcats = await db.select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId
      })
      .from(subcategories)
      .innerJoin(termSubcategories, eq(subcategories.id, termSubcategories.subcategoryId))
      .where(eq(termSubcategories.termId, term.id));
      
      enrichedTerms.push({
        ...term,
        subcategories: subcats
      });
    }
    
    return enrichedTerms;
  }

  async getRecentTerms(limit: number = 10): Promise<any[]> {
    const result = await db.select({
      id: terms.id,
      name: terms.name,
      shortDefinition: terms.shortDefinition,
      definition: terms.definition,
      viewCount: terms.viewCount,
      categoryId: categories.id,
      category: categories.name,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .orderBy(desc(terms.createdAt))
    .limit(limit);

    // Get subcategories for each term
    const enrichedTerms = [];
    for (const term of result) {
      const subcats = await db.select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId
      })
      .from(subcategories)
      .innerJoin(termSubcategories, eq(subcategories.id, termSubcategories.subcategoryId))
      .where(eq(termSubcategories.termId, term.id));
      
      enrichedTerms.push({
        ...term,
        subcategories: subcats
      });
    }
    
    return enrichedTerms;
  }
}

export const storage = new DatabaseStorage();
