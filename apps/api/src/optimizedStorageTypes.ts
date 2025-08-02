/**
 * Type-safe IStorage Interface
 * Replaces all 'any' types with proper type definitions
 */

import type { User, UpsertUser, Purchase } from '@aiglossarypro/shared';
import type { ICategory, ITerm } from '@aiglossarypro/shared';
import type {
  UserProgressStats,
  RecentPurchase,
  RevenuePeriodData,
  CountryRevenue,
  ConversionFunnel,
  RefundAnalytics,
  PurchaseExport,
  WebhookActivity,
  PurchaseDetails,
  UserAccessUpdate,
  UserSettings,
  UserDataExport,
  MaintenanceResult,
  ContentMetrics,
  PendingContent,
  FeedbackResult,
  FeedbackFilters,
  PaginatedFeedback,
  FeedbackStatistics,
  FeedbackUpdate,
  OptimizedTerm,
  SectionProgress,
  LearningStreak,
  Achievement,
} from './types/enhancedStorage.types';
import type {
  PaginatedResult,
  Term,
} from './types/storage.types';

// Additional types needed for the interface
export interface PurchaseData {
  orderId: string;
  email: string;
  userId?: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'gumroad' | 'stripe' | 'other';
  metadata?: Record<string, unknown>;
}

export interface UserListOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserListResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DatabaseCleanupResult {
  tablesCleared: string[];
}

export interface DatabaseOperationResult {
  success: boolean;
  operation: string;
  duration: number;
  operations: string[];
  timestamp: Date;
  message: string;
}

export interface AdminStats extends ContentMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  recentActivity: Array<{
    type: string;
    count: number;
    timestamp: Date;
  }>;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'down';
    lastChecked: Date;
  };
}

export interface OptimizedFavoritesResult {
  data: ITerm[];
  total: number;
  hasMore: boolean;
}

export interface FeedbackData {
  termId?: string;
  userId?: string;
  type: 'correction' | 'suggestion' | 'error' | 'enhancement' | 'general';
  content: string;
  rating?: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface TermSectionUpdate {
  content?: string;
  title?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface UserProgressUpdate {
  termsViewed?: number;
  termsCompleted?: number;
  timeSpent?: number;
  lastActivityDate?: Date;
  currentStreak?: number;
}

export interface CurrencyRevenue {
  currency: string;
  total: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

// Type-safe IStorage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<ICategory[]>;
  getCategoryById(id: string): Promise<ICategory | null>;

  // Term operations
  getFeaturedTerms(): Promise<ITerm[]>;
  getTermById(id: string): Promise<ITerm | null>;
  getRecentlyViewedTerms(userId: string): Promise<ITerm[]>;
  recordTermView(termId: string, userId: string | null): Promise<void>;
  searchTerms(query: string): Promise<ITerm[]>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<ITerm[]>;
  getUserFavoritesOptimized?(
    userId: string,
    pagination?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<OptimizedFavoritesResult>;
  isTermFavorite(userId: string, termId: string): Promise<boolean>;
  addFavorite(userId: string, termId: string): Promise<void>;
  removeFavorite(userId: string, termId: string): Promise<void>;

  // Progress operations
  getUserProgress(userId: string): Promise<UserProgressStats>;
  isTermLearned(userId: string, termId: string): Promise<boolean>;
  markTermAsLearned(userId: string, termId: string): Promise<void>;
  unmarkTermAsLearned(userId: string, termId: string): Promise<void>;

  // Revenue tracking operations
  getTotalRevenue(): Promise<number>;
  getTotalPurchases(): Promise<number>;
  getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getTotalUsers(): Promise<number>;
  getRevenueByCurrency(): Promise<CurrencyRevenue[]>;
  getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<DailyRevenue[]>;
  getRecentPurchases(limit?: number): Promise<RecentPurchase[]>;
  getRevenueByPeriod(period: string): Promise<RevenuePeriodData>;
  getTopCountriesByRevenue(limit?: number): Promise<CountryRevenue[]>;
  getConversionFunnel(): Promise<ConversionFunnel>;
  getRefundAnalytics(): Promise<RefundAnalytics>;
  getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<PurchaseExport[]>;
  getRecentWebhookActivity(limit?: number): Promise<WebhookActivity[]>;
  getPurchaseByOrderId(orderId: string): Promise<PurchaseDetails | null>;
  updateUserAccess(orderId: string, updates: UserAccessUpdate): Promise<void>;

  // Additional user operations
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  createPurchase(purchaseData: PurchaseData): Promise<Purchase>;
  getUserSettings(userId: string): Promise<UserSettings | null>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void>;
  exportUserData(userId: string): Promise<UserDataExport>;
  deleteUserData(userId: string): Promise<void>;
  getUserStreak(userId: string): Promise<LearningStreak>;

  // Admin user management
  getAllUsers(options?: UserListOptions): Promise<UserListResult>;

  // Admin data management
  clearAllData(): Promise<DatabaseCleanupResult>;
  reindexDatabase(): Promise<DatabaseOperationResult>;
  getAdminStats(): Promise<AdminStats>;
  cleanupDatabase(): Promise<DatabaseOperationResult>;
  vacuumDatabase(): Promise<DatabaseOperationResult>;

  // Content moderation
  getPendingContent(): Promise<PendingContent[]>;
  approveContent(id: string): Promise<PendingContent>;
  rejectContent(id: string): Promise<PendingContent>;

  // Missing methods for enhanced features
  getTermsOptimized?(options?: { limit?: number }): Promise<OptimizedTerm[]>;
  getTermsByIds?(ids: string[]): Promise<Term[]>;
  submitFeedback?(data: FeedbackData): Promise<FeedbackResult>;
  storeFeedback?(data: FeedbackData): Promise<FeedbackResult>;
  getFeedback?(filters: FeedbackFilters, pagination: { page?: number; limit?: number }): Promise<PaginatedFeedback>;
  getFeedbackStats?(): Promise<FeedbackStatistics>;
  updateFeedbackStatus?(id: string, status: 'pending' | 'reviewing' | 'resolved' | 'rejected', notes?: string): Promise<FeedbackUpdate>;
  initializeFeedbackSchema?(): Promise<void>;
  createFeedbackIndexes?(): Promise<void>;
  updateTermSection?(termId: string, sectionId: string, data: TermSectionUpdate): Promise<void>;
  trackTermView?(userId: string, termId: string, sectionId?: string): Promise<void>;
  trackSectionCompletion?(userId: string, termId: string, sectionId: string): Promise<void>;
  updateUserProgress?(userId: string, updates: UserProgressUpdate): Promise<void>;
  getUserSectionProgress?(userId: string, options?: { limit?: number; offset?: number }): Promise<SectionProgress[]>;
  getUserTimeSpent?(userId: string, timeframe?: string): Promise<number>;
  getCategoryProgress?(userId: string): Promise<Array<{ categoryId: string; categoryName: string; termsViewed: number; termsTotal: number; percentComplete: number }>>;
  isAchievementUnlocked?(userId: string, achievementId: string): Promise<boolean>;
  unlockAchievement?(userId: string, achievementId: string): Promise<Achievement>;
  getAllTerms?(options?: { limit?: number; offset?: number }): Promise<PaginatedResult<Term>>;
}