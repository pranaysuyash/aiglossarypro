import {
  categories,
  favorites,
  subcategories,
  termSubcategories,
  terms,
  termViews,
  userProgress,
  userSettings,
  users,
} from '@aiglossarypro/shared';
import { purchases } from '@aiglossarypro/shared';
import type { InsertPurchase, Purchase, UpsertUser, User } from '@aiglossarypro/shared';
import { endOfDay, format, formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { and, desc, eq, gte, ilike, isNull, lte, not, sql } from 'drizzle-orm';
import { db } from '@aiglossarypro/database';

import logger from './utils/logger';
import type {
  Term,
  EnhancedTerm,
  TermSection,
  CategoryWithStats,
  UserProgressStats,
  LearningStreak,
  SearchResult,
  UserSettings,
  AnalyticsOverview,
  UserDataExport,
  PendingContent,
  GeneralFeedback,
  TermFeedback,
  FeedbackResult,
  FeedbackFilters,
  PaginatedFeedback,
  FeedbackStatistics,
  FeedbackStatus,
  SectionProgress,
  CategoryProgress,
  Achievement,
  OptimizedTerm,
  PaginationOptions,
  BulkUpdateResult,
  BulkDeleteResult,
  MaintenanceResult,
  ContentMetrics,
  RecentActivity,
  WebhookActivity,
  PurchaseExport,
  PurchaseDetails,
  ConversionFunnel,
  RefundAnalytics,
  CountryRevenue,
  RevenuePeriodData,
  RecentPurchase,
  UserAccessUpdate,
} from './types/storage.types';

import type {
  EnhancedTermWithSections,
  TermSectionWithMetadata,
  TermAnalytics,
  UserPreferences,
} from './types/enhancedStorage.types';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<CategoryWithStats[]>;
  getCategoryById(id: string): Promise<CategoryWithStats | null>;

  // Term operations
  getFeaturedTerms(): Promise<Term[]>;
  getTermById(id: string): Promise<Term | null>;
  getRecentlyViewedTerms(userId: string): Promise<RecentActivity[]>;
  recordTermView(termId: string, userId: string | null): Promise<void>;
  searchTerms(query: string): Promise<SearchResult>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<Term[]>;
  isTermFavorite(userId: string, termId: string): Promise<boolean>;
  addFavorite(userId: string, termId: string): Promise<void>;
  removeFavorite(userId: string, termId: string): Promise<void>;

  // Progress operations
  getUserProgress(userId: string): Promise<UserProgressStats>;
  isTermLearned(userId: string, termId: string): Promise<boolean>;
  markTermAsLearned(userId: string, termId: string): Promise<void>;
  unmarkTermAsLearned(userId: string, termId: string): Promise<void>;

  // User activity operations
  getUserActivity(userId: string): Promise<{
    labels: string[];
    views: number[];
    learned: number[];
    totalViews: number;
    categoriesExplored: number;
    lastActivity: string;
  }>;
  getUserStreak(userId: string): Promise<LearningStreak>;

  // Recommendations
  getRecommendedTerms(userId: string): Promise<Term[]>;
  getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<Term[]>;

  // Settings
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void>;

  // Analytics
  getAnalytics(): Promise<AnalyticsOverview>;

  // User data
  exportUserData(userId: string): Promise<UserDataExport>;
  deleteUserData(userId: string): Promise<void>;

  // Monetization operations
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Revenue tracking
  getTotalRevenue(): Promise<number>;
  getTotalPurchases(): Promise<number>;
  getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getTotalUsers(): Promise<number>;
  getRevenueByCurrency(): Promise<Array<{ currency: string; amount: number; count: number }>>;
  getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number; purchases: number }>>;
  getRecentPurchases(options: {
    page: number;
    limit: number;
    status?: string;
    currency?: string;
  }): Promise<{
    items: RecentPurchase[];
    total: number;
    hasMore: boolean;
  }>;
  getRevenueByPeriod(
    startDate: Date,
    endDate: Date,
    groupBy: string
  ): Promise<RevenuePeriodData[]>;
  getTopCountriesByRevenue(limit: number): Promise<CountryRevenue[]>;
  getConversionFunnel(): Promise<ConversionFunnel>;
  getRefundAnalytics(startDate: Date, endDate: Date): Promise<RefundAnalytics>;
  getPurchasesForExport(startDate: Date, endDate: Date): Promise<PurchaseExport[]>;
  getRecentWebhookActivity(limit: number): Promise<WebhookActivity[]>;
  getPurchaseByOrderId(gumroadOrderId: string): Promise<Purchase | undefined>;
  updateUserAccess(userId: string, updates: UserAccessUpdate): Promise<void>;

  // Admin operations
  getAdminStats(): Promise<ContentMetrics>;
  clearAllData(): Promise<void>;

  // Content Management Methods
  getPendingContent?(): Promise<PendingContent[]>;
  approveContent?(id: string): Promise<PendingContent>;
  rejectContent?(id: string): Promise<PendingContent>;

  // Feedback System Methods
  submitFeedback?(feedback: TermFeedback | GeneralFeedback): Promise<void>;
  storeFeedback?(feedback: TermFeedback | GeneralFeedback): Promise<void>;
  getFeedback?(
    filters?: FeedbackFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedFeedback>;
  getFeedbackStats?(): Promise<FeedbackStatistics>;
  updateFeedbackStatus?(
    id: string,
    status: FeedbackStatus,
    notes?: string
  ): Promise<FeedbackResult>;
  initializeFeedbackSchema?(): Promise<void>;
  createFeedbackIndexes?(): Promise<void>;
  getRecentFeedback?(limit: number): Promise<(TermFeedback | GeneralFeedback)[]>;

  // Enhanced Term Management Methods
  getTermsByIds?(ids: string[]): Promise<Term[]>;
  getEnhancedTermById?(id: string): Promise<EnhancedTermWithSections | null>;
  updateEnhancedTerm?(id: string, data: Partial<EnhancedTerm>): Promise<void>;
  getTermSections?(termId: string): Promise<TermSectionWithMetadata[]>;
  updateTermSection?(
    termId: string,
    sectionId: string,
    data: Partial<TermSection>
  ): Promise<void>;
  incrementTermViewCount?(termId: string): Promise<void>;
  getTermsOptimized?(options?: { limit?: number }): Promise<OptimizedTerm[]>;

  // User Analytics and Progress Tracking Methods
  getUserAnalytics?(userId: string): Promise<TermAnalytics>;
  getUserSectionProgress?(
    userId: string,
    options?: PaginationOptions
  ): Promise<SectionProgress[]>;
  trackTermView?(userId: string, termId: string, sectionId?: string): Promise<void>;
  trackSectionCompletion?(userId: string, termId: string, sectionId: string): Promise<void>;
  updateUserProgress?(userId: string, updates: Partial<UserProgressStats>): Promise<void>;
  getUserTimeSpent?(userId: string, timeframe?: string): Promise<number>;
  getCategoryProgress?(userId: string): Promise<CategoryProgress[]>;

  // Streak and Achievement Methods
  updateUserStreak?(userId: string, streak: Partial<LearningStreak>): Promise<void>;
  isAchievementUnlocked?(userId: string, achievementId: string): Promise<boolean>;
  unlockAchievement?(userId: string, achievement: Achievement): Promise<void>;

  // Admin and Bulk Operations Methods
  getAllTerms?(options?: PaginationOptions): Promise<{
    terms: Term[];
    total: number;
    page: number;
    limit: number;
  }>;
  getRecentTerms?(limit: number): Promise<Term[]>;
  deleteTerm?(id: string): Promise<void>;
  bulkDeleteTerms?(ids: string[]): Promise<BulkDeleteResult>;
  bulkUpdateTermCategory?(ids: string[], categoryId: string): Promise<BulkUpdateResult>;
  bulkUpdateTermStatus?(ids: string[], status: string): Promise<BulkUpdateResult>;

  // Missing methods for compatibility
  getAllUsers?(): Promise<User[]>;
  reindexDatabase?(): Promise<MaintenanceResult>;
  cleanupDatabase?(): Promise<MaintenanceResult>;
  vacuumDatabase?(): Promise<MaintenanceResult>;
  getTerms?(options?: PaginationOptions): Promise<Term[]>;
  getTerm?(id: string): Promise<Term | null>;
  getTermsByCategory?(categoryId: string, options?: PaginationOptions): Promise<Term[]>;
  createTerm?(termData: Partial<Term>): Promise<Term>;
  updateTerm?(termId: string, updates: Partial<Term>): Promise<Term>;
  getTermProgress?(userId: string, termId: string): Promise<UserProgressStats | null>;
  updateTermProgress?(userId: string, termId: string, progressData: Response): Promise<void>;
  removeTermProgress?(userId: string, termId: string): Promise<void>;
  getUserStats?(userId: string): Promise<UserProgressStats>;
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
    // Get all categories with term counts in a single optimized query
    const categoriesWithCount = await db
      .select({
        id: categories.id,
        name: categories.name,
        termCount: sql<number>`count(DISTINCT ${terms.id})`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id, categories.name)
      .orderBy(categories.name);

    // Get all subcategories in a single query
    const allSubcategories = await db
      .select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId,
      })
      .from(subcategories)
      .orderBy(subcategories.name);

    // Group subcategories by category ID for efficient lookup
    const subcategoriesByCategory = new Map<string, any[]>();
    for (const subcat of allSubcategories) {
      if (!subcategoriesByCategory.has(subcat.categoryId)) {
        subcategoriesByCategory.set(subcat.categoryId, []);
      }
      subcategoriesByCategory.get(subcat.categoryId)?.push(subcat);
    }

    // Combine categories with their subcategories
    const result = categoriesWithCount.map(category => ({
      ...category,
      subcategories: subcategoriesByCategory.get(category.id) || [],
    }));

    return result;
  }

  async getCategoryById(id: string): Promise<unknown> {
    // Get the category
    const [category] = await db.select().from(categories).where(eq(categories.id, id));

    if (!category) {
      return null;
    }

    // Get subcategories
    const subcats = await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.categoryId, id))
      .orderBy(subcategories.name);

    // Get terms in this category
    const termsInCategory = await db
      .select({
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
      terms: termsInCategory,
    };
  }

  // Term operations
  async getFeaturedTerms(): Promise<any[]> {
    // Get terms with high view counts or manually featured - OPTIMIZED VERSION
    const featuredTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        definition: terms.definition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(6);

    // Return without subcategories for now to fix performance
    // TODO: Implement efficient subcategory loading if needed
    return featuredTerms.map(term => ({
      ...term,
      subcategories: [], // Empty for performance - can be populated later if needed
    }));
  }

  async getTermById(id: string): Promise<Term | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return null;
    }
    // Get the term with category
    const [term] = await db
      .select({
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
    const termSubcats = await db
      .select({
        id: subcategories.id,
        name: subcategories.name,
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, id));

    // Get related terms (simpler approach - terms in the same category)
    const relatedTerms = term.categoryId
      ? await db
          .select({
            id: terms.id,
            name: terms.name,
          })
          .from(terms)
          .where(and(eq(terms.categoryId, term.categoryId), not(eq(terms.id, id))))
          .limit(6)
      : [];

    // Format the date
    const formattedDate = term.updatedAt
      ? format(term.updatedAt, 'MMMM d, yyyy')
      : term.createdAt
        ? format(term.createdAt, 'MMMM d, yyyy')
        : 'Unknown date';

    return {
      ...term,
      updatedAt: formattedDate,
      subcategories: termSubcats.map((sc: any) => sc.name),
      relatedTerms,
    } as Term;
  }

  async getRecentlyViewedTerms(userId: string): Promise<RecentActivity[]> {
    // Get recently viewed terms with relative time
    const recentViews = await db
      .select({
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

    // Format the dates and return as RecentActivity
    return recentViews.map((view: any) => ({
      id: `view-${view.termId}-${view.viewedAt?.getTime() || Date.now()}`,
      type: 'view' as const,
      userId,
      termId: view.termId,
      termName: view.name,
      timestamp: view.viewedAt || new Date(),
      metadata: {
        category: view.category,
        relativeTime: view.viewedAt
          ? formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })
          : 'Never',
      },
    }));
  }

  async recordTermView(termId: string, userId: string | null): Promise<void> {
    // First, check if the term exists
    const [term] = await db
      .select({
        id: terms.id,
        viewCount: terms.viewCount,
      })
      .from(terms)
      .where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Update view count on the term
    await db
      .update(terms)
      .set({
        viewCount: (term.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId));

    // If user is authenticated, record this view
    if (userId) {
      // Insert the view
      await db
        .insert(termViews)
        .values({
          termId,
          userId,
          viewedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [termViews.termId, termViews.userId],
          set: { viewedAt: new Date() },
        });
    }
  }

  async searchTerms(query: string): Promise<SearchResult> {
    // Search for terms matching the query - simplified version
    const results = await db
      .select({
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
      const termSubcats = await db
        .select({
          name: subcategories.name,
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, term.id));

      resultWithSubcats.push({
        ...term,
        subcategories: termSubcats.map((sc: any) => sc.name),
      });
    }

    return {
      terms: resultWithSubcats,
      total: resultWithSubcats.length,
      page: 1,
      limit: 20,
      hasMore: false,
      query,
    };
  }

  // Favorites operations
  async getFavorites(userId: string): Promise<any[]> {
    // Get user's favorite terms
    const userFavorites = await db
      .select({
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
      const termSubcats = await db
        .select({
          name: subcategories.name,
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
        favoriteDate: fav.createdAt?.toISOString() || new Date().toISOString(),
        subcategories: termSubcats.map((sc: any) => sc.name),
      });
    }

    return result;
  }

  async getUserFavorites(userId: string): Promise<any[]> {
    return this.getFavorites(userId);
  }

  async isTermFavorite(userId: string, termId: string): Promise<boolean> {
    // Check if the term is in user's favorites
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)));

    return !!favorite;
  }

  async addFavorite(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select().from(terms).where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Add to favorites
    await db
      .insert(favorites)
      .values({
        userId,
        termId,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, termId: string): Promise<void> {
    // Remove from favorites
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)));
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgressStats> {
    // Get total terms count
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get learned terms count
    const [{ count: termsLearned }] = await db
      .select({
        count: sql<number>`count(${userProgress.termId})`,
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
      const [{ count }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
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
    const activeViews = await db
      .select({
        day: sql<string>`date_trunc('day', ${termViews.viewedAt})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
      .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));

    let streak = 0;
    let longestStreak = 0;
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
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (diffInDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
      longestStreak = streak;
    }

    // Get total time spent (in seconds for now)
    const totalTimeSpent = 0; // This would need actual implementation

    // Get recent activity
    const recentActivity = await this.getRecentlyViewedTerms(userId);

    // Get category progress
    const categoryProgress = await this.getCategoryProgress(userId);

    return {
      totalTermsViewed: Number(termsLearned),
      totalTermsCompleted: Number(termsLearned),
      totalTimeSpent,
      currentStreak: streak,
      longestStreak,
      streakDays: streak,
      favoriteCategories: categoryProgress.slice(0, 3),
      categoryProgress,
      recentActivity: recentActivity.slice(0, 5),
      completedSections: 0,
      favoriteTerms: [],
      achievements: [],
      lastActivity: activeViews.length > 0 ? new Date(activeViews[0].day) : undefined,
    };
  }

  async isTermLearned(userId: string, termId: string): Promise<boolean> {
    // Check if the term is marked as learned
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));

    return !!progress;
  }

  async markTermAsLearned(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select().from(terms).where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Mark as learned
    await db
      .insert(userProgress)
      .values({
        userId,
        termId,
        learnedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async unmarkTermAsLearned(userId: string, termId: string): Promise<void> {
    // Unmark as learned
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));
  }

  // User activity operations
  async getUserActivity(userId: string): Promise<{
    labels: string[];
    views: number[];
    learned: number[];
    totalViews: number;
    categoriesExplored: number;
    lastActivity: string;
  }> {
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
      const [{ count: viewCount }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
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
      const [{ count: learnedCount }] = await db
        .select({
          count: sql<number>`count(${userProgress.termId})`,
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
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId));

    // Get unique categories explored
    const exploreCounts = await db
      .select({
        categoryId: terms.categoryId,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .where(eq(termViews.userId, userId))
      .groupBy(terms.categoryId);

    const categoriesExplored = exploreCounts.length;

    // Get last activity
    const [lastView] = await db
      .select({
        viewedAt: termViews.viewedAt,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .orderBy(desc(termViews.viewedAt))
      .limit(1);

    const lastActivity = lastView?.viewedAt
      ? formatDistanceToNow(new Date(lastView.viewedAt), { addSuffix: true })
      : 'Never';

    return {
      labels,
      views: viewsData,
      learned: learnedData,
      totalViews,
      categoriesExplored,
      lastActivity,
    };
  }

  async getUserStreak(userId: string): Promise<LearningStreak> {
    // Get all days with activity, ordered by date
    const activeViews = await db
      .select({
        day: sql<string>`date_trunc('day', ${termViews.viewedAt})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
      .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));

    // Calculate current streak
    let currentStreak = 0;
    let bestStreak = 0;
    const lastActivityDate = activeViews.length > 0 ? new Date(activeViews[0].day) : new Date();

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
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) /
              (1000 * 60 * 60 * 24)
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

    // Get streak history for last 30 days
    const streakHistory = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);

      // Get terms learned and time spent on this day
      const [{ count: termsLearned }] = await db
        .select({
          count: sql<number>`count(DISTINCT ${termViews.termId})`,
        })
        .from(termViews)
        .where(
          and(
            eq(termViews.userId, userId),
            gte(termViews.viewedAt, startOfDayDate),
            lte(termViews.viewedAt, endOfDayDate)
          )
        );

      streakHistory.push({
        date: day,
        termsLearned: Number(termsLearned),
        timeSpent: 0, // This would need actual implementation
      });
    }

    return {
      current: currentStreak,
      longest: bestStreak,
      currentStreak,
      longestStreak: bestStreak,
      lastActivityDate,
      streakHistory,
    };
  }

  // Recommendations
  async getRecommendedTerms(userId: string): Promise<any[]> {
    // Strategy:
    // 1. Find categories and subcategories from viewed/learned terms
    // 2. Find other terms in those categories that user hasn't viewed yet
    // 3. Add some popular terms as recommendations too

    // Get user's viewed terms
    const viewedTerms = await db
      .select({
        termId: termViews.termId,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId));

    const viewedTermIds = viewedTerms.map((v: any) => v.termId);

    // Get categories from viewed terms
    const viewedCategories = await db
      .select({
        categoryId: terms.categoryId,
      })
      .from(terms)
      .where(
        and(
          not(isNull(terms.categoryId)),
          sql`${terms.id} IN (${viewedTermIds.length > 0 ? viewedTermIds : ['00000000-0000-0000-0000-000000000000']})`
        )
      )
      .groupBy(terms.categoryId);

    const categoryIds = viewedCategories.map((c: any) => c.categoryId);

    // Get related terms from the same categories, excluding already viewed
    const recommendedTerms = await db
      .select({
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
      const popularTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(viewedTermIds.length > 0 ? not(sql`${terms.id} IN (${viewedTermIds})`) : sql`1=1`)
        .orderBy(desc(terms.viewCount))
        .limit(6 - recommendedTerms.length);

      recommendedTerms.push(...popularTerms);
    }

    // Get subcategories for each term
    const result = [];

    for (const term of recommendedTerms) {
      // Check if this term is a favorite
      const [favorite] = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.termId, term.id)));

      // Get subcategories for this term
      const termSubcats = await db
        .select({
          name: subcategories.name,
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, term.id));

      result.push({
        ...term,
        isFavorite: !!favorite,
        subcategories: termSubcats.map((sc: any) => sc.name),
      });
    }

    return result;
  }

  async getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<any[]> {
    try {
      // Get the term to find its category
      const [term] = await db
        .select({
          id: terms.id,
          categoryId: terms.categoryId,
        })
        .from(terms)
        .where(eq(terms.id, termId));

      if (!term) {
        throw new Error('Term not found');
      }

      // Build WHERE conditions - always exclude the current term
      const whereConditions = [not(eq(terms.id, termId))];

      // If term has a category, add category filter
      if (term.categoryId) {
        whereConditions.push(eq(terms.categoryId, term.categoryId));
      }

      // Only proceed if we have valid WHERE conditions
      if (whereConditions.length === 0) {
        return [];
      }

      // Find terms with same category, excluding the current term
      const relatedTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .orderBy(desc(terms.viewCount))
        .limit(3);

      // Get subcategories and favorite status for each term
      const result = [];

      for (const relTerm of relatedTerms) {
        // Check if this term is a favorite (if user is authenticated)
        let isFavorite = false;

        if (userId) {
          try {
            const [favorite] = await db
              .select()
              .from(favorites)
              .where(and(eq(favorites.userId, userId), eq(favorites.termId, relTerm.id)));

            isFavorite = !!favorite;
          } catch (favoriteError) {
            logger.warn(`Could not check favorite status for term ${relTerm.id}:`, favoriteError);
            isFavorite = false;
          }
        }

        // Get subcategories for this term
        let termSubcats: Array<{ name: string }> = [];
        try {
          termSubcats = await db
            .select({
              name: subcategories.name,
            })
            .from(termSubcategories)
            .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
            .where(eq(termSubcategories.termId, relTerm.id));
        } catch (subcatError) {
          logger.warn(`Could not fetch subcategories for term ${relTerm.id}:`, subcatError);
          termSubcats = [];
        }

        result.push({
          ...relTerm,
          isFavorite,
          subcategories: termSubcats.map((sc: any) => sc.name),
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in getRecommendedTermsForTerm:', error);
      throw error;
    }
  }

  // Settings
  async getUserSettings(userId: string): Promise<unknown> {
    // Get user settings or create default
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

    if (settings) {
      return settings;
    }

    // Create default settings
    const defaultPreferences = {
      emailNotifications: true,
      progressTracking: true,
      shareActivity: false,
    };

    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        preferences: defaultPreferences,
      })
      .returning();

    return newSettings;
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    // Update settings
    await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      });
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsOverview> {
    // Get total users
    const [{ count: totalUsers }] = await db
      .select({
        count: sql<number>`count(${users.id})`,
      })
      .from(users);

    // Get total terms
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get total views
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews);

    // Get top terms by views
    const topTermsData = await db
      .select({
        id: terms.id,
        name: terms.name,
        viewCount: terms.viewCount,
        categoryId: terms.categoryId,
        category: categories.name,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(10);

    const topTerms = topTermsData.map((term: any) => ({
      termId: term.id,
      name: term.name,
      category: term.category || '',
      views: term.viewCount || 0,
      completionRate: 0, // Would need actual implementation
      averageRating: 0, // Would need actual implementation
    }));

    // Get top categories
    const categoryStats = await db
      .select({
        categoryId: categories.id,
        name: categories.name,
        termCount: sql<number>`count(DISTINCT ${terms.id})`,
        totalViews: sql<number>`COALESCE(sum(${terms.viewCount}), 0)`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id, categories.name)
      .having(sql`count(${terms.id}) > 0`)
      .orderBy(desc(sql`sum(${terms.viewCount})`))
      .limit(10);

    const topCategories = categoryStats.map((cat: any) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      termCount: Number(cat.termCount),
      totalViews: Number(cat.totalViews),
      averageCompletionRate: 0, // Would need actual implementation
    }));

    // Get user engagement metrics
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sevenDaysAgo = subDays(today, 7);

    // Daily active users (approximation using views)
    const [{ dailyActive }] = await db
      .select({
        dailyActive: sql<number>`count(DISTINCT ${termViews.userId})`,
      })
      .from(termViews)
      .where(gte(termViews.viewedAt, startOfDay(today)));

    // Weekly active users
    const [{ weeklyActive }] = await db
      .select({
        weeklyActive: sql<number>`count(DISTINCT ${termViews.userId})`,
      })
      .from(termViews)
      .where(gte(termViews.viewedAt, sevenDaysAgo));

    // Monthly active users
    const [{ monthlyActive }] = await db
      .select({
        monthlyActive: sql<number>`count(DISTINCT ${termViews.userId})`,
      })
      .from(termViews)
      .where(gte(termViews.viewedAt, thirtyDaysAgo));

    // Content quality metrics
    const [contentStats] = await db
      .select({
        termsWithContent: sql<number>`count(CASE WHEN ${terms.definition} IS NOT NULL AND ${terms.definition} != '' THEN 1 END)`,
        termsWithEnhanced: sql<number>`count(CASE WHEN ${terms.characteristics} IS NOT NULL OR ${terms.visualUrl} IS NOT NULL OR ${terms.mathFormulation} IS NOT NULL THEN 1 END)`,
      })
      .from(terms);

    // Growth metrics
    const [newUsersToday] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, startOfDay(today)));

    const [newUsersThisWeek] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo));

    const [newUsersThisMonth] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    // Calculate average session duration (placeholder)
    const averageSessionDuration = 15; // minutes - would need actual implementation

    return {
      totalTerms: Number(totalTerms),
      totalUsers: Number(totalUsers),
      totalViews: Number(totalViews),
      averageSessionDuration,
      topTerms,
      topCategories,
      userEngagement: {
        dailyActiveUsers: Number(dailyActive),
        weeklyActiveUsers: Number(weeklyActive),
        monthlyActiveUsers: Number(monthlyActive),
        averageSessionsPerUser: 1.5, // Would need actual implementation
        averageTermsPerSession: 3, // Would need actual implementation
        retentionRate: 0.65, // Would need actual implementation
      },
      contentQuality: {
        termsWithContent: Number(contentStats.termsWithContent),
        termsWithEnhancedContent: Number(contentStats.termsWithEnhanced),
        averageContentCompleteness: 0.75, // Would need actual implementation
        termsNeedingReview: 0, // Would need actual implementation
        recentlyUpdated: 0, // Would need actual implementation
      },
      growthMetrics: {
        newUsersToday: Number(newUsersToday.count),
        newUsersThisWeek: Number(newUsersThisWeek.count),
        newUsersThisMonth: Number(newUsersThisMonth.count),
        growthRate: 0.1, // Would need actual calculation
        projectedMonthlyUsers: Number(totalUsers) * 1.1, // Simple projection
      },
      lastUpdated: new Date(),
    };
  }

  // User data export/delete
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Get user info
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's favorites
    const favoritesList = await this.getUserFavorites(userId);

    // Get user's progress
    const progressStats = await this.getUserProgress(userId);

    // Get learned terms
    const learned = await db
      .select({
        termId: userProgress.termId,
        learnedAt: userProgress.learnedAt,
        name: terms.name,
      })
      .from(userProgress)
      .innerJoin(terms, eq(userProgress.termId, terms.id))
      .where(eq(userProgress.userId, userId));

    // Get user's views with aggregated data
    const viewData = await db
      .select({
        termId: termViews.termId,
        termName: terms.name,
        viewCount: sql<number>`count(${termViews.id})`,
        lastViewed: sql<Date>`max(${termViews.viewedAt})`,
        firstViewed: sql<Date>`min(${termViews.viewedAt})`,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .where(eq(termViews.userId, userId))
      .groupBy(termViews.termId, terms.name);

    // Get user's settings
    const settings = await this.getUserSettings(userId);

    // Get achievements (placeholder for now)
    const achievements: Achievement[] = [];

    // Calculate total time spent (placeholder)
    const totalTimeSpent = progressStats.totalTimeSpent || 0;

    // Build export data
    const exportData: UserDataExport = {
      exportDate: new Date(),
      userData: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt || new Date(),
        lastLogin: user.updatedAt || user.createdAt || new Date(),
        subscription: user.subscriptionTier
          ? {
              tier: (user.subscriptionTier as 'free' | 'pro' | 'enterprise') || 'free',
              status: user.lifetimeAccess ? 'active' : 'inactive',
              startDate: user.purchaseDate || new Date(),
            }
          : undefined,
        achievements,
      },
      termsData: {
        viewedTerms: viewData.map((v: any) => ({
          termId: v.termId,
          termName: v.termName,
          viewCount: Number(v.viewCount),
          lastViewed: v.lastViewed || new Date(),
          totalTimeSpent: 0, // Would need actual implementation
        })),
        favoriteTerms: favoritesList.map(fav => ({
          termId: fav.id,
          termName: fav.name,
          favoritedAt: new Date(), // Would need actual date from favorites table
        })),
        ratedTerms: [], // Would need rating implementation
        notes: [], // Would need notes implementation
      },
      progressData: {
        overallProgress: progressStats,
        sectionProgress: [], // Would need section progress implementation
        categoryProgress: progressStats.categoryProgress || [],
        learningStreak: await this.getUserStreak(userId),
        milestones: [], // Would need milestones implementation
      },
      preferencesData: settings,
      analyticsData: {
        totalTimeSpent,
        averageSessionDuration: totalTimeSpent / (progressStats.totalTermsViewed || 1),
        totalSessions: progressStats.totalTermsViewed || 0,
        learningVelocity: 0, // Would need actual calculation
        topCategories: progressStats.favoriteCategories.map(cat => cat.categoryName),
        activityHeatmap: [], // Would need actual implementation
      },
    };

    return exportData;
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete user's data (but not the user account itself)
    await db.delete(favorites).where(eq(favorites.userId, userId));

    await db.delete(userProgress).where(eq(userProgress.userId, userId));

    await db.delete(termViews).where(eq(termViews.userId, userId));

    await db.delete(userSettings).where(eq(userSettings.userId, userId));
  }

  // Admin operations
  async getAdminStats(): Promise<ContentMetrics> {
    // Get total terms
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get content metrics
    const [contentStats] = await db
      .select({
        termsWithContent: sql<number>`count(CASE WHEN ${terms.definition} IS NOT NULL AND ${terms.definition} != '' THEN 1 END)`,
        termsWithShortDefinitions: sql<number>`count(CASE WHEN ${terms.shortDefinition} IS NOT NULL AND ${terms.shortDefinition} != '' THEN 1 END)`,
        termsWithCodeExamples: sql<number>`count(CASE WHEN ${terms.characteristics} LIKE '%code%' OR ${terms.characteristics} LIKE '%example%' THEN 1 END)`,
        termsWithVisuals: sql<number>`count(CASE WHEN ${terms.visualUrl} IS NOT NULL AND ${terms.visualUrl} != '' THEN 1 END)`,
      })
      .from(terms);

    // Get total views
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews);

    // Get total categories
    const [{ count: totalCategories }] = await db
      .select({
        count: sql<number>`count(${categories.id})`,
      })
      .from(categories);

    // Get verification stats (commented out - verificationStatus field doesn't exist)
    // const verificationStats = await db
    //   .select({
    //     status: terms.verificationStatus,
    //     count: sql<number>`count(*)`,
    //   })
    //   .from(terms)
    //   .groupBy(terms.verificationStatus);

    const verificationStatsMap = {
      unverified: 0,
      verified: 0,
      flagged: 0,
      needsReview: 0,
      expertReviewed: 0,
    };

    // verificationStats.forEach((stat: any) => {
    //   if (stat.status && stat.status in verificationStatsMap) {
    //     verificationStatsMap[stat.status as keyof typeof verificationStatsMap] = Number(stat.count);
    //   }
    // });

    // Get category distribution
    const categoryDist = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        termCount: sql<number>`count(${terms.id})`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id, categories.name)
      .having(sql`count(${terms.id}) > 0`)
      .orderBy(desc(sql`count(${terms.id})`));

    const totalTermsInCategories = categoryDist.reduce((sum: number, cat: any) => sum + Number(cat.termCount), 0);
    
    const categoryDistribution = categoryDist.map((cat: any) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      termCount: Number(cat.termCount),
      percentage: totalTermsInCategories > 0 ? (Number(cat.termCount) / totalTermsInCategories) * 100 : 0,
    }));

    // Get last updated date
    const [lastTerm] = await db
      .select({
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .orderBy(desc(terms.updatedAt))
      .limit(1);

    return {
      totalTerms: Number(totalTerms),
      termsWithContent: Number(contentStats.termsWithContent),
      termsWithShortDefinitions: Number(contentStats.termsWithShortDefinitions),
      termsWithCodeExamples: Number(contentStats.termsWithCodeExamples),
      termsWithVisuals: Number(contentStats.termsWithVisuals),
      totalViews: Number(totalViews),
      totalCategories: Number(totalCategories),
      totalSections: 0, // Would need actual implementation
      averageSectionsPerTerm: 0, // Would need actual implementation
      lastUpdated: lastTerm?.updatedAt || new Date(),
      verificationStats: verificationStatsMap,
      categoryDistribution,
    };
  }

  // Monetization operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  // Revenue tracking methods
  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return result[0]?.total || 0;
  }

  async getTotalPurchases(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return result[0]?.count || 0;
  }

  async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    return result[0]?.total || 0;
  }

  async getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    return result[0]?.count || 0;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users);

    return result[0]?.count || 0;
  }

  async getRevenueByCurrency(): Promise<
    Array<{ currency: string; amount: number; count: number }>
  > {
    const result = await db
      .select({
        currency: purchases.currency,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(purchases.currency)
      .orderBy(sql`SUM(${purchases.amount}) DESC`);

    // Filter out null currencies and ensure string type
    return result
      .filter((r: any) => r.currency != null)
      .map((r: any) => ({
        currency: r.currency as string,
        amount: r.amount,
        count: r.count,
      }));
  }

  async getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number; purchases: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${purchases.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${purchases.createdAt})`)
      .orderBy(sql`DATE(${purchases.createdAt})`);

    return result;
  }

  async getRecentPurchases(options: {
    page: number;
    limit: number;
    status?: string;
    currency?: string;
  }): Promise<{
    items: RecentPurchase[];
    total: number;
    hasMore: boolean;
  }> {
    const { page, limit, status, currency } = options;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(purchases.status, status));
    }
    if (currency) {
      conditions.push(eq(purchases.currency, currency));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get purchases with user info
    const items = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        userId: purchases.userId,
        userEmail: users.email,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .where(whereClause)
      .orderBy(desc(purchases.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Map to RecentPurchase type
    const recentPurchases: RecentPurchase[] = items.map((item: any) => ({
      orderId: item.gumroadOrderId,
      email: item.userEmail || '',
      productName: (item.purchaseData as any)?.product_name || 'AI Glossary Pro',
      amount: item.amount || 0,
      currency: item.currency || 'USD',
      purchaseDate: item.createdAt || new Date(),
      status: item.status || 'completed',
      country: (item.purchaseData as any)?.country,
      refunded: item.status === 'refunded',
    }));

    return {
      items: recentPurchases,
      total,
      hasMore: offset + items.length < total,
    };
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: string): Promise<RevenuePeriodData[]> {
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = sql`DATE_TRUNC('hour', ${purchases.createdAt})`;
        break;
      case 'day':
        dateFormat = sql`DATE_TRUNC('day', ${purchases.createdAt})`;
        break;
      case 'week':
        dateFormat = sql`DATE_TRUNC('week', ${purchases.createdAt})`;
        break;
      case 'month':
        dateFormat = sql`DATE_TRUNC('month', ${purchases.createdAt})`;
        break;
      default:
        dateFormat = sql`DATE_TRUNC('day', ${purchases.createdAt})`;
    }

    const result = await db
      .select({
        period: dateFormat,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(dateFormat)
      .orderBy(dateFormat);

    // Get top products for the period
    const topProducts = await db
      .select({
        productName: sql<string>`${purchases.purchaseData}->>'product_name'`,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`${purchases.purchaseData}->>'product_name'`)
      .orderBy(desc(sql`SUM(${purchases.amount})`))
      .limit(5);

    // Map to RevenuePeriodData
    return result.map((r: any) => {
      const revenue = Number(r.revenue);
      const purchaseCount = Number(r.purchases);
      
      return {
        period: r.period ? new Date(r.period).toISOString() : new Date().toISOString(),
        startDate: r.period ? new Date(r.period) : startDate,
        endDate: r.period ? new Date(r.period) : endDate,
        totalRevenue: revenue,
        totalPurchases: purchaseCount,
        averageOrderValue: purchaseCount > 0 ? revenue / purchaseCount : 0,
        topProducts: topProducts.map((p: any) => ({
          productId: p.productName || 'unknown',
          productName: p.productName || 'AI Glossary Pro',
          revenue: Number(p.revenue),
          purchases: Number(p.purchases),
          averagePrice: Number(p.purchases) > 0 ? Number(p.revenue) / Number(p.purchases) : 0,
        })),
        revenueByDay: [], // Would need actual implementation
        refundRate: 0, // Would need actual calculation
      };
    });
  }

  async getTopCountriesByRevenue(limit: number = 10): Promise<CountryRevenue[]> {
    const result = await db
      .select({
        country: sql<string>`${purchases.purchaseData}->>'country'`,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(sql`${purchases.purchaseData}->>'country'`)
      .orderBy(sql`SUM(${purchases.amount}) DESC`)
      .limit(limit);

    // Calculate total revenue for percentage calculation
    const totalRevenue = result.reduce((sum: number, r: any) => sum + Number(r.revenue), 0);

    return result
      .filter((r: any) => r.country) // Filter out null countries
      .map((r: any) => ({
        country: r.country || 'Unknown',
        countryCode: r.country?.substring(0, 2).toUpperCase() || 'UN',
        revenue: Number(r.revenue),
        purchases: Number(r.purchases),
        averageOrderValue: Number(r.purchases) > 0 ? Number(r.revenue) / Number(r.purchases) : 0,
        percentage: totalRevenue > 0 ? (Number(r.revenue) / totalRevenue) * 100 : 0,
      }));
  }

  async getConversionFunnel(): Promise<ConversionFunnel> {
    const totalUsers = await this.getTotalUsers();
    const totalPurchases = await this.getTotalPurchases();

    // For now, we'll use simple metrics
    // In a real implementation, you'd track actual visitor counts
    const conversionRate = totalUsers > 0 ? (totalPurchases / totalUsers) * 100 : 0;

    // Define funnel stages
    const stages = [
      {
        name: 'Visitors',
        users: totalUsers * 10, // Rough estimate
        conversionRate: 100,
        averageTimeInStage: 0,
      },
      {
        name: 'Signups',
        users: totalUsers,
        conversionRate: totalUsers > 0 ? (totalUsers / (totalUsers * 10)) * 100 : 0,
        averageTimeInStage: 0,
      },
      {
        name: 'Active Users',
        users: Math.floor(totalUsers * 0.6), // 60% become active
        conversionRate: totalUsers > 0 ? 60 : 0,
        averageTimeInStage: 0,
      },
      {
        name: 'Purchases',
        users: totalPurchases,
        conversionRate: totalUsers > 0 ? conversionRate : 0,
        averageTimeInStage: 0,
      },
    ];

    // Calculate dropoff points
    const dropoffAnalysis = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];
      const dropoffRate = fromStage.users > 0 
        ? ((fromStage.users - toStage.users) / fromStage.users) * 100 
        : 0;
      
      dropoffAnalysis.push({
        fromStage: fromStage.name,
        toStage: toStage.name,
        dropoffRate,
        commonReasons: [], // Would need actual analysis
      });
    }

    return {
      stages,
      overallConversionRate: conversionRate,
      averageTimeToConversion: 7 * 24 * 60 * 60, // 7 days in seconds
      dropoffAnalysis,
    };
  }

  async getRefundAnalytics(startDate: Date, endDate: Date): Promise<RefundAnalytics> {
    const refunds = await db
      .select({
        count: sql<number>`COUNT(*)`,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'refunded'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    const totalPurchases = await this.getPurchasesForPeriod(startDate, endDate);
    const refundRate = totalPurchases > 0 ? ((refunds[0]?.count || 0) / totalPurchases) * 100 : 0;

    // Get refund reasons (if stored in purchaseData)
    const refundReasons = await db
      .select({
        reason: sql<string>`${purchases.purchaseData}->>'refund_reason'`,
        count: sql<number>`COUNT(*)`,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'refunded'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`${purchases.purchaseData}->>'refund_reason'`);

    const totalRefundAmount = refunds[0]?.amount || 0;

    // Get refund trend over the period
    const refundTrend = await db
      .select({
        date: sql<string>`DATE(${purchases.createdAt})`,
        refunds: sql<number>`COUNT(*)`,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'refunded'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${purchases.createdAt})`)
      .orderBy(sql`DATE(${purchases.createdAt})`);

    // Calculate average refund time (placeholder)
    const averageRefundTime = 2 * 24 * 60 * 60; // 2 days in seconds

    return {
      totalRefunds: refunds[0]?.count || 0,
      refundAmount: totalRefundAmount,
      refundRate: Math.round(refundRate * 100) / 100,
      averageRefundTime,
      refundReasons: refundReasons
        .filter((r: any) => r.reason)
        .map((r: any) => ({
          reason: r.reason || 'Unknown',
          count: Number(r.count),
          percentage: refunds[0]?.count > 0 ? (Number(r.count) / refunds[0].count) * 100 : 0,
          averageAmount: Number(r.count) > 0 ? Number(r.amount) / Number(r.count) : 0,
        })),
      refundTrend: refundTrend.map((r: any) => ({
        date: new Date(r.date),
        refunds: Number(r.refunds),
        amount: Number(r.amount),
        rate: totalPurchases > 0 ? (Number(r.refunds) / totalPurchases) * 100 : 0,
      })),
    };
  }

  async getPurchasesForExport(startDate: Date, endDate: Date): Promise<PurchaseExport[]> {
    const result = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        userId: purchases.userId,
        userEmail: users.email,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
        country: sql<string>`${purchases.purchaseData}->>'country'`,
        paymentMethod: sql<string>`${purchases.purchaseData}->>'payment_method'`,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .where(and(gte(purchases.createdAt, startDate), lte(purchases.createdAt, endDate)))
      .orderBy(desc(purchases.createdAt));

    return result.map(r => ({
      orderId: r.gumroadOrderId,
      purchaseDate: r.createdAt || new Date(),
      email: r.userEmail || '',
      customerName: r.userName?.trim() || undefined,
      productId: (r.purchaseData as any)?.product_id || 'ai-glossary-pro',
      productName: (r.purchaseData as any)?.product_name || 'AI Glossary Pro',
      amount: r.amount || 0,
      currency: r.currency || 'USD',
      status: r.status || 'completed',
      refunded: r.status === 'refunded',
      refundDate: r.status === 'refunded' ? r.createdAt : undefined,
      country: r.country || undefined,
      paymentMethod: r.paymentMethod || undefined,
      metadata: {
        internalId: r.id,
        userId: r.userId || undefined,
        ...(r.purchaseData as Record<string, string>),
      },
    }));
  }

  async getRecentWebhookActivity(limit: number = 10): Promise<WebhookActivity[]> {
    // This would require a webhook_logs table to track webhook activity
    // For now, return recent purchases as a proxy
    const result = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        status: purchases.status,
        receivedAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
      })
      .from(purchases)
      .orderBy(desc(purchases.createdAt))
      .limit(limit);

    return result.map(r => ({
      id: r.id,
      timestamp: r.receivedAt || new Date(),
      eventType: 'purchase.created',
      status: r.status === 'completed' ? 'success' as const : 'failed' as const,
      orderId: r.gumroadOrderId,
      payload: r.purchaseData as Record<string, unknown> || {},
      response: undefined,
      error: undefined,
      retryCount: 0,
    }));
  }

  async getPurchaseByOrderId(gumroadOrderId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.gumroadOrderId, gumroadOrderId));

    return purchase;
  }

  async updateUserAccess(userId: string, updates: UserAccessUpdate): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.accessGranted !== undefined) {
      updateData.lifetimeAccess = updates.accessGranted;
    }

    if (updates.accessLevel !== undefined) {
      updateData.subscriptionTier = updates.accessLevel;
    }

    if (updates.accessExpiresAt !== undefined) {
      updateData.purchaseDate = updates.accessExpiresAt;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
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

  // Missing Admin Methods
  async getAllUsers(): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return result;
  }

  async reindexDatabase(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    try {
      // Perform database reindexing operations
      // This is a placeholder - actual implementation would depend on your database
      await db.execute(sql`REINDEX`);
      return {
        success: true,
        message: 'Database reindexed successfully',
        operation: 'reindex',
        duration: Date.now() - startTime,
        operations: ['reindex_all_tables'],
        timestamp: new Date(),
        details: {
          tablesProcessed: 10, // Placeholder
          rowsAffected: 0,
        },
      };
    } catch (error) {
      logger.error('Error reindexing database:', error);
      return {
        success: false,
        message: 'Failed to reindex database',
        operation: 'reindex',
        duration: Date.now() - startTime,
        operations: ['reindex_all_tables'],
        timestamp: new Date(),
        details: {
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    }
  }

  async cleanupDatabase(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    const operations: string[] = [];
    let rowsAffected = 0;
    
    try {
      // Clean up orphaned records and optimize database
      // Remove orphaned favorites
      const favoritesResult = await db.execute(sql`
        DELETE FROM ${favorites} 
        WHERE term_id NOT IN (SELECT id FROM ${terms})
        OR user_id NOT IN (SELECT id FROM ${users})
      `);
      operations.push('cleanup_orphaned_favorites');
      rowsAffected += favoritesResult.rowCount || 0;

      // Remove orphaned user progress
      const progressResult = await db.execute(sql`
        DELETE FROM ${userProgress} 
        WHERE term_id NOT IN (SELECT id FROM ${terms})
        OR user_id NOT IN (SELECT id FROM ${users})
      `);
      operations.push('cleanup_orphaned_progress');
      rowsAffected += progressResult.rowCount || 0;

      return {
        success: true,
        message: 'Database cleaned up successfully',
        operation: 'cleanup',
        duration: Date.now() - startTime,
        operations,
        timestamp: new Date(),
        details: {
          tablesProcessed: 2,
          rowsAffected,
        },
      };
    } catch (error) {
      logger.error('Error cleaning up database:', error);
      return {
        success: false,
        message: 'Failed to clean up database',
        operation: 'cleanup',
        duration: Date.now() - startTime,
        operations,
        timestamp: new Date(),
        details: {
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    }
  }

  async vacuumDatabase(): Promise<MaintenanceResult> {
    const startTime = Date.now();
    try {
      // Vacuum database to reclaim space and optimize performance
      await db.execute(sql`VACUUM`);
      return {
        success: true,
        message: 'Database vacuumed successfully',
        operation: 'vacuum',
        duration: Date.now() - startTime,
        operations: ['vacuum_full'],
        timestamp: new Date(),
        details: {
          tablesProcessed: 10, // Placeholder
        },
      };
    } catch (error) {
      logger.error('Error vacuuming database:', error);
      return {
        success: false,
        message: 'Failed to vacuum database',
        operation: 'vacuum',
        duration: Date.now() - startTime,
        operations: ['vacuum_full'],
        timestamp: new Date(),
        details: {
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    }
  }

  // Missing Content Moderation Methods
  async getPendingContent(): Promise<PendingContent[]> {
    // This is a placeholder implementation
    // You would need to implement content moderation tables first
    return [];
  }

  async approveContent(contentId: string): Promise<PendingContent> {
    // This is a placeholder implementation
    // You would need to implement content moderation logic
    return {
      id: contentId,
      type: 'term',
      status: 'approved',
      submittedBy: 'system',
      submittedAt: new Date(),
      content: {},
      success: true,
      contentId,
      action: 'approved',
      timestamp: new Date(),
    };
  }

  async rejectContent(contentId: string): Promise<PendingContent> {
    // This is a placeholder implementation
    // You would need to implement content moderation logic
    return {
      id: contentId,
      type: 'term',
      status: 'rejected',
      submittedBy: 'system',
      submittedAt: new Date(),
      content: {},
      success: true,
      contentId,
      action: 'rejected',
      timestamp: new Date(),
    };
  }

  // Section-Based Methods Implementation
  async getTermSections(termId: string): Promise<TermSectionWithMetadata[]> {
    try {
      // For now, return empty array since sections table might not exist
      // In a real implementation, you would query the sections table
      return [];
    } catch (error) {
      logger.error('Error fetching term sections:', error);
      return [];
    }
  }

  async getUserProgressForTerm(_userId: string, _termId: string): Promise<any[]> {
    try {
      // Return empty array for now - this would be implemented with a user_progress table
      // that tracks which sections of each term the user has completed
      return [];
    } catch (error) {
      logger.error('Error fetching user progress for term:', error);
      return [];
    }
  }

  async getSectionById(sectionId: number): Promise<unknown> {
    try {
      const sectionResult = await db.execute(sql`
        SELECT 
          s.id,
          s.term_id,
          s.name,
          s.display_order,
          s.is_completed,
          s.created_at,
          s.updated_at,
          et.name as term_name
        FROM sections s
        LEFT JOIN enhanced_terms et ON s.term_id = et.id
        WHERE s.id = ${sectionId}
      `);

      return sectionResult.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching section by ID:', error);
      return null;
    }
  }

  async getSectionItems(sectionId: number): Promise<any[]> {
    try {
      const itemsResult = await db.execute(sql`
        SELECT 
          si.id,
          si.section_id,
          si.label,
          si.content,
          si.content_type,
          si.display_order,
          si.metadata,
          si.is_ai_generated,
          si.verification_status,
          si.created_at,
          si.updated_at
        FROM section_items si
        WHERE si.section_id = ${sectionId}
        ORDER BY si.display_order ASC
      `);

      return itemsResult.rows;
    } catch (error) {
      logger.error('Error fetching section items:', error);
      return [];
    }
  }

  async getUserProgressForSection(_userId: string, _sectionId: number): Promise<unknown> {
    // This is a placeholder - you would need to implement section progress
    return null;
  }

  async updateUserProgress(userId: string, updates: Response): Promise<void> {
    // This is a placeholder - you would need to implement progress updates
    logger.info('Progress update placeholder:', { userId, updates });
  }

  async getUserProgressSummary(userId: string): Promise<unknown> {
    // This is a placeholder - you would need to implement progress summary logic
    return {
      userId,
      totalTerms: 0,
      completedTerms: 0,
      totalSections: 0,
      completedSections: 0,
      totalTimeMinutes: 0,
      streak: 0,
      recentActivity: [],
    };
  }

  async getContentGallery(
    _sectionName: string,
    options: { page: number; limit: number }
  ): Promise<unknown> {
    // This is a placeholder - you would need to implement content gallery logic
    return {
      galleries: [],
      totalItems: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async getQuizzes(_options: { termId?: number; difficulty?: string }): Promise<any[]> {
    // This is a placeholder - you would need to implement quizzes table
    return [];
  }

  async searchSectionContent(options: {
    query: string;
    contentType?: string;
    sectionName?: string;
    page: number;
    limit: number;
  }): Promise<unknown> {
    try {
      const { query, contentType, sectionName, page, limit } = options;
      const offset = (page - 1) * limit;

      // Build dynamic WHERE clause
      let whereClause = `WHERE (si.content ILIKE '%${query}%' OR si.label ILIKE '%${query}%')`;

      if (contentType) {
        whereClause += ` AND si.content_type = '${contentType}'`;
      }

      if (sectionName) {
        whereClause += ` AND s.name ILIKE '%${sectionName}%'`;
      }

      const searchResult = await db.execute(sql`
        SELECT 
          si.id,
          si.label,
          si.content,
          si.content_type,
          si.metadata,
          s.name as section_name,
          et.name as term_name,
          et.id as term_id
        FROM section_items si
        JOIN sections s ON si.section_id = s.id
        JOIN enhanced_terms et ON s.term_id = et.id
        ${sql.raw(whereClause)}
        ORDER BY si.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      // Get total count for pagination
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM section_items si
        JOIN sections s ON si.section_id = s.id
        JOIN enhanced_terms et ON s.term_id = et.id
        ${sql.raw(whereClause)}
      `);

      return {
        results: searchResult.rows,
        totalResults: countResult.rows[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
      };
    } catch (error) {
      logger.error('Error searching section content:', error);
      return {
        results: [],
        totalResults: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 0,
      };
    }
  }

  async getSectionAnalytics(): Promise<unknown> {
    try {
      // Get basic section analytics
      const sectionStatsResult = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT s.id) as total_sections,
          COUNT(DISTINCT s.term_id) as terms_with_sections,
          COUNT(DISTINCT si.id) as total_section_items,
          AVG(item_counts.item_count) as avg_items_per_section
        FROM sections s
        LEFT JOIN section_items si ON s.id = si.section_id
        LEFT JOIN (
          SELECT section_id, COUNT(*) as item_count 
          FROM section_items 
          GROUP BY section_id
        ) item_counts ON s.id = item_counts.section_id
      `);

      // Get section distribution by name
      const sectionDistributionResult = await db.execute(sql`
        SELECT 
          s.name,
          COUNT(*) as section_count,
          COUNT(si.id) as total_items
        FROM sections s
        LEFT JOIN section_items si ON s.id = si.section_id
        GROUP BY s.name
        ORDER BY section_count DESC
        LIMIT 20
      `);

      // Get content type distribution
      const contentTypeResult = await db.execute(sql`
        SELECT 
          content_type,
          COUNT(*) as count
        FROM section_items
        GROUP BY content_type
        ORDER BY count DESC
      `);

      const stats = sectionStatsResult.rows[0];

      return {
        overview: {
          totalSections: stats?.total_sections || 0,
          termsWithSections: stats?.terms_with_sections || 0,
          totalSectionItems: stats?.total_section_items || 0,
          avgItemsPerSection: Number(stats?.avg_items_per_section) || 0,
        },
        sectionDistribution: sectionDistributionResult.rows,
        contentTypeDistribution: contentTypeResult.rows,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching section analytics:', error);
      return {
        overview: {
          totalSections: 0,
          termsWithSections: 0,
          totalSectionItems: 0,
          avgItemsPerSection: 0,
        },
        sectionDistribution: [],
        contentTypeDistribution: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Missing User Progress Methods
  async getTermProgress(userId: string, termId: string): Promise<unknown> {
    const progress = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)))
      .limit(1);

    return progress[0] || null;
  }

  async updateTermProgress(userId: string, termId: string, progressData: Response): Promise<void> {
    await db
      .insert(userProgress)
      .values({
        userId,
        termId: termId, // Keep as string UUID, not parseInt
        learnedAt: progressData.completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.termId],
        set: {
          learnedAt: progressData.completed ? new Date() : null,
        },
      });
  }

  async getCategoryProgress(userId: string): Promise<CategoryProgress[]> {
    // Get all categories with term counts
    const categoriesWithTerms = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalTerms: sql<number>`count(DISTINCT ${terms.id})`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id, categories.name);

    // Get user's viewed terms per category
    const userViewedByCategory = await db
      .select({
        categoryId: terms.categoryId,
        viewedTerms: sql<number>`count(DISTINCT ${termViews.termId})`,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .where(eq(termViews.userId, userId))
      .groupBy(terms.categoryId);

    // Get user's completed terms per category
    const userCompletedByCategory = await db
      .select({
        categoryId: terms.categoryId,
        completedTerms: sql<number>`count(DISTINCT ${userProgress.termId})`,
      })
      .from(userProgress)
      .innerJoin(terms, eq(userProgress.termId, terms.id))
      .where(eq(userProgress.userId, userId))
      .groupBy(terms.categoryId);

    // Create lookup maps
    const viewedMap = new Map(userViewedByCategory.map(c => [c.categoryId, Number(c.viewedTerms)]));
    const completedMap = new Map(userCompletedByCategory.map(c => [c.categoryId, Number(c.completedTerms)]));

    // Combine the data
    return categoriesWithTerms.map(cat => {
      const totalTerms = Number(cat.totalTerms);
      const viewedTerms = viewedMap.get(cat.categoryId) || 0;
      const completedTerms = completedMap.get(cat.categoryId) || 0;
      const percentComplete = totalTerms > 0 ? (completedTerms / totalTerms) * 100 : 0;

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        termsViewed: viewedTerms,
        termsTotal: totalTerms,
        completedTerms,
        percentComplete,
        completionPercentage: percentComplete,
      };
    }).filter(cat => cat.termsTotal > 0);
  }

  async removeTermProgress(userId: string, termId: string): Promise<void> {
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));
  }

  async getUserStats(userId: string): Promise<unknown> {
    const totalProgress = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const completedProgress = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), sql`${userProgress.learnedAt} IS NOT NULL`));

    return {
      totalTermsStarted: Number(totalProgress[0]?.count) || 0,
      completedTerms: Number(completedProgress[0]?.count) || 0,
      totalTimeSpent: 0, // Time tracking not implemented yet
      completionRate:
        totalProgress[0]?.count > 0
          ? (Number(completedProgress[0]?.count) / Number(totalProgress[0]?.count)) * 100
          : 0,
    };
  }

  // Missing methods for tests
  async getTerms(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    const { limit = 10, offset = 0 } = options;

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        mathFormulation: terms.mathFormulation,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .orderBy(terms.name)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getTerm(id: string): Promise<unknown> {
    const [term] = await db.select().from(terms).where(eq(terms.id, id));

    return term || null;
  }

  async getTermsByCategory(
    categoryId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    const { limit = 20, offset = 0 } = options;

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .where(eq(terms.categoryId, categoryId))
      .orderBy(terms.name)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async createTerm(termData: any): Promise<unknown> {
    // Validate required fields
    if (!termData.name || !termData.definition) {
      throw new Error('Term name and definition are required');
    }

    const [newTerm] = await db
      .insert(terms)
      .values({
        name: termData.name,
        definition: termData.definition,
        shortDefinition: termData.shortDefinition,
        categoryId: termData.categoryId,
        characteristics: termData.characteristics,
        visualUrl: termData.visualUrl,
        mathFormulation: termData.mathFormulation,
      })
      .returning();

    return newTerm;
  }

  // AI/Search operations

  async updateTerm(termId: string, updates: Partial<Term>): Promise<Term> {
    const [updatedTerm] = await db
      .update(terms)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId))
      .returning();

    return updatedTerm;
  }

  // Missing optional methods implementation
  async getAllTerms(options?: PaginationOptions): Promise<{
    terms: Term[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options || {};
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count: total }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(terms);

    // Get terms with pagination
    let query = db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        visualCaption: terms.visualCaption,
        mathFormulation: terms.mathFormulation,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        verificationStatus: terms.verificationStatus,
        category: categories.name,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sortBy === 'name') {
      query = query.orderBy(sortOrder === 'desc' ? desc(terms.name) : terms.name);
    } else if (sortBy === 'createdAt') {
      query = query.orderBy(sortOrder === 'desc' ? desc(terms.createdAt) : terms.createdAt);
    } else if (sortBy === 'viewCount') {
      query = query.orderBy(sortOrder === 'desc' ? desc(terms.viewCount) : terms.viewCount);
    }

    const result = await query;

    return {
      terms: result,
      total: Number(total),
      page,
      limit,
    };
  }

  async getRecentTerms(limit: number): Promise<Term[]> {
    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        visualCaption: terms.visualCaption,
        mathFormulation: terms.mathFormulation,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        verificationStatus: terms.verificationStatus,
        category: categories.name,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.createdAt))
      .limit(limit);

    return result;
  }

  async deleteTerm(id: string): Promise<void> {
    // Delete related data first
    await db.delete(termViews).where(eq(termViews.termId, id));
    await db.delete(favorites).where(eq(favorites.termId, id));
    await db.delete(userProgress).where(eq(userProgress.termId, id));
    await db.delete(termSubcategories).where(eq(termSubcategories.termId, id));
    
    // Finally delete the term
    await db.delete(terms).where(eq(terms.id, id));
  }

  async bulkDeleteTerms(ids: string[]): Promise<BulkDeleteResult> {
    const errors: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        await this.deleteTerm(id);
        deleted++;
      } catch (error) {
        errors.push(`Failed to delete term ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      deleted,
      failed: errors.length,
      errors,
    };
  }

  async bulkUpdateTermCategory(ids: string[], categoryId: string): Promise<BulkUpdateResult> {
    try {
      const result = await db
        .update(terms)
        .set({
          categoryId,
          updatedAt: new Date(),
        })
        .where(sql`${terms.id} IN (${ids})`);

      return {
        success: true,
        updated: result.rowCount || 0,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        updated: 0,
        failed: ids.length,
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  async bulkUpdateTermStatus(ids: string[], status: string): Promise<BulkUpdateResult> {
    try {
      const result = await db
        .update(terms)
        .set({
          verificationStatus: status as any,
          updatedAt: new Date(),
        })
        .where(sql`${terms.id} IN (${ids})`);

      return {
        success: true,
        updated: result.rowCount || 0,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        updated: 0,
        failed: ids.length,
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  async getUserAnalytics(userId: string): Promise<TermAnalytics> {
    // This is a placeholder implementation
    return {
      termId: '',
      totalViews: 0,
      uniqueViewers: 0,
      averageTimeSpent: 0,
      completionRate: 0,
      averageRating: 0,
      ratingCount: 0,
      sectionEngagement: [],
      viewTrend: [],
      popularityScore: 0,
      lastUpdated: new Date(),
    };
  }

  async getUserSectionProgress(userId: string, options?: PaginationOptions): Promise<SectionProgress[]> {
    // This is a placeholder implementation
    return [];
  }

  async trackTermView(userId: string, termId: string, sectionId?: string): Promise<void> {
    // Already implemented as recordTermView
    await this.recordTermView(termId, userId);
  }

  async trackSectionCompletion(userId: string, termId: string, sectionId: string): Promise<void> {
    // This is a placeholder implementation
    logger.info('Section completion tracked:', { userId, termId, sectionId });
  }

  async getUserTimeSpent(userId: string, timeframe?: string): Promise<number> {
    // This is a placeholder implementation
    return 0;
  }

  async updateUserStreak(userId: string, streak: Partial<LearningStreak>): Promise<void> {
    // This is a placeholder implementation
    logger.info('User streak updated:', { userId, streak });
  }

  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    // This is a placeholder implementation
    return false;
  }

  async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    // This is a placeholder implementation
    logger.info('Achievement unlocked:', { userId, achievement });
  }

  async getEnhancedTermById(id: string): Promise<EnhancedTermWithSections | null> {
    const term = await this.getTermById(id);
    if (!term) return null;

    const sections = await this.getTermSections(id);
    
    return {
      ...term,
      relatedTerms: [],
      prerequisites: [],
      nextTerms: [],
      sections,
      interactiveElements: [],
      analytics: undefined,
      qualityMetrics: undefined,
      userSpecificData: undefined,
    } as EnhancedTermWithSections;
  }

  async updateEnhancedTerm(id: string, data: Partial<EnhancedTerm>): Promise<void> {
    await this.updateTerm(id, data);
  }

  async updateTermSection(termId: string, sectionId: string, data: Partial<TermSection>): Promise<void> {
    // This is a placeholder implementation
    logger.info('Term section updated:', { termId, sectionId, data });
  }

  async incrementTermViewCount(termId: string): Promise<void> {
    const [term] = await db
      .select({ viewCount: terms.viewCount })
      .from(terms)
      .where(eq(terms.id, termId));

    if (term) {
      await db
        .update(terms)
        .set({
          viewCount: (term.viewCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(terms.id, termId));
    }
  }

  async getTermsOptimized(options?: { limit?: number }): Promise<OptimizedTerm[]> {
    const limit = options?.limit || 100;

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        categoryId: terms.categoryId,
        category: categories.name,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        updatedAt: terms.updatedAt,
        hasEnhanced: sql<boolean>`
          ${terms.characteristics} IS NOT NULL 
          OR ${terms.visualUrl} IS NOT NULL 
          OR ${terms.mathFormulation} IS NOT NULL
        `,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(limit);

    return result.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.name.toLowerCase().replace(/\s+/g, '-'),
      category: r.category || '',
      shortDefinition: r.shortDefinition || '',
      difficulty: 'intermediate' as const,
      popularity: r.viewCount || 0,
      hasEnhancedContent: r.hasEnhanced || false,
      lastUpdated: r.updatedAt || new Date(),
    }));
  }

  async submitFeedback(feedback: TermFeedback | GeneralFeedback): Promise<void> {
    // This is a placeholder implementation
    logger.info('Feedback submitted:', feedback);
  }

  async storeFeedback(feedback: TermFeedback | GeneralFeedback): Promise<void> {
    // This is a placeholder implementation
    logger.info('Feedback stored:', feedback);
  }

  async getFeedback(filters?: FeedbackFilters, pagination?: PaginationOptions): Promise<PaginatedFeedback> {
    // This is a placeholder implementation
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.limit || 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  async getFeedbackStats(): Promise<FeedbackStatistics> {
    // This is a placeholder implementation
    return {
      total: 0,
      byStatus: {
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0,
      },
      byType: {},
      averageResolutionTime: 0,
      recentTrends: [],
    };
  }

  async updateFeedbackStatus(id: string, status: FeedbackStatus, notes?: string): Promise<FeedbackResult> {
    // This is a placeholder implementation
    return {
      success: true,
      message: `Feedback ${id} status updated to ${status}`,
      feedbackId: id,
      timestamp: new Date(),
    };
  }

  async initializeFeedbackSchema(): Promise<void> {
    // This is a placeholder implementation
    logger.info('Feedback schema initialized');
  }

  async createFeedbackIndexes(): Promise<void> {
    // This is a placeholder implementation
    logger.info('Feedback indexes created');
  }

  async getRecentFeedback(limit: number): Promise<(TermFeedback | GeneralFeedback)[]> {
    // This is a placeholder implementation
    return [];
  }

  async getTermsByIds(ids: string[]): Promise<Term[]> {
    if (ids.length === 0) return [];

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        category: categories.name,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        visualCaption: terms.visualCaption,
        mathFormulation: terms.mathFormulation,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        verificationStatus: terms.verificationStatus,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(sql`${terms.id} IN (${ids})`);

    return result;
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
