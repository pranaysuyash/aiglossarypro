/**
 * Storage Layer Type Definitions
 * Comprehensive types for all storage operations to eliminate 'any' usage
 */

import type {
  ApiResponse,
  SearchFilters as BaseSearchFilters,
  ICategory,
  ISubcategory,
  ITerm,
  IUser,
  PaginatedResponse,
  UserActivity,
} from '@aiglossarypro/shared';

// ===== CORE DATA TYPES =====

export interface Term extends ITerm {
  sections?: TermSection[];
  metadata?: TermMetadata;
}

export interface EnhancedTerm extends Term {
  relatedTerms: Term[];
  prerequisites: Term[];
  nextTerms: Term[];
  learningPath?: LearningPath;
  userProgress?: UserTermProgress;
}

export interface TermSection {
  id: string;
  termId: string;
  sectionId: string;
  title: string;
  content: string;
  order: number;
  metadata?: SectionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionMetadata {
  hasCodeExample?: boolean;
  hasVisualization?: boolean;
  hasInteractiveElement?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
}

export interface TermMetadata {
  lastAiUpdate?: Date;
  dataSource?: string;
  citations?: string[];
  reviewCount?: number;
  qualityScore?: number;
}

// ===== USER & PROGRESS TYPES =====

export interface User extends IUser {
  subscription?: UserSubscription;
  achievements?: Achievement[];
  learningStats?: LearningStats;
}

export interface UserSubscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  gumroadLicenseKey?: string;
}

export interface UserTermProgress {
  userId: string;
  termId: string;
  sectionsCompleted: string[];
  percentComplete: number;
  lastAccessedAt: Date;
  timeSpent: number;
  notes?: string;
}

export interface UserProgressStats {
  totalTermsViewed: number;
  totalTermsCompleted: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  streakDays?: number;
  favoriteCategories: CategoryProgress[];
  categoryProgress?: CategoryProgress[];
  recentActivity: UserActivity[];
  completedSections?: number;
  favoriteTerms?: string[];
  achievements?: Achievement[];
  lastActivity?: Date;
}

export interface SectionProgress {
  termId: string;
  termName: string;
  sectionId: string;
  sectionTitle: string;
  completedAt: Date;
  timeSpent: number;
  status?: string;
  completionPercentage?: number;
  timeSpentMinutes?: number;
  lastAccessed?: Date;
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  termsViewed: number;
  termsTotal: number;
  completedTerms?: number;
  percentComplete: number;
  completionPercentage?: number;
}

export interface LearningStats {
  totalTermsLearned: number;
  totalTimeSpent: number;
  averageSessionTime: number;
  preferredCategories: string[];
  learningVelocity: number;
}

export interface LearningStreak {
  current: number;
  longest: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate: Date;
  streakHistory: StreakEntry[];
}

export interface StreakEntry {
  date: Date;
  termsLearned: number;
  timeSpent: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

// ===== SEARCH & FILTER TYPES =====

export interface SearchResult {
  terms: Term[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  query?: string;
  facets?: SearchFacets;
  suggestions?: string[];
}

export interface SearchFilters extends BaseSearchFilters {
  query?: string;
  categories?: string[];
  subcategories?: string[];
  difficulty?: string;
  verificationStatus?: string[];
  hasContent?: boolean;
  hasCodeExamples?: boolean;
  hasInteractiveElements?: boolean;
  hasCaseStudies?: boolean;
  applicationDomains?: string[];
  techniques?: string[];
  dateRange?: DateRange;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SearchFacets {
  categories: FacetValue[];
  subcategories: FacetValue[];
  difficulties: FacetValue[];
  verificationStatuses: FacetValue[];
  tags: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  label?: string;
}

export interface PopularTerm {
  termId: string;
  name: string;
  searchCount: number;
  category: string;
}

// ===== ADMIN & CONTENT MANAGEMENT TYPES =====

export interface ContentMetrics {
  totalTerms: number;
  termsWithContent: number;
  termsWithShortDefinitions: number;
  termsWithCodeExamples: number;
  termsWithVisuals: number;
  totalViews?: number;
  totalCategories?: number;
  totalSections?: number;
  averageSectionsPerTerm?: number;
  lastUpdated?: Date;
  verificationStats: VerificationStats;
  categoryDistribution: CategoryDistribution[];
}

export interface VerificationStats {
  unverified: number;
  verified: number;
  flagged: number;
  needsReview: number;
  expertReviewed: number;
}

export interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  termCount: number;
  percentage: number;
}

export interface PendingContent {
  id: string;
  type:
    | 'term'
    | 'definition'
    | 'example'
    | 'visual'
    | 'feedback'
    | 'term_suggestion'
    | 'ai_generated';
  termId?: string;
  content: Record<string, unknown>;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  success?: boolean;
  contentId?: string;
  action?: 'approved' | 'rejected';
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high';
  author?: string;
  title?: string;
}

export interface MaintenanceResult {
  success: boolean;
  message: string;
  operation: string;
  duration: number;
  operations: string[];
  timestamp: Date;
  details?: {
    tablesProcessed?: number;
    rowsAffected?: number;
    errors?: string[];
  };
}

// ===== FEEDBACK TYPES =====

export interface TermFeedback {
  termId: string;
  userId?: string;
  type: 'correction' | 'suggestion' | 'error' | 'enhancement';
  content: string;
  rating?: number;
  comment?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface GeneralFeedback {
  userId?: string;
  category: 'bug' | 'feature' | 'content' | 'other';
  subject: string;
  content: string;
  type?: string;
  message?: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

export interface FeedbackResult {
  id?: string;
  success: boolean;
  message: string;
  feedbackId?: string;
  timestamp?: Date;
}

export interface FeedbackFilters {
  type?: string[];
  status?: FeedbackStatus[];
  dateRange?: DateRange;
  termId?: string;
  userId?: string;
  category?: string;
}

export type FeedbackStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface PaginatedFeedback extends PaginatedResponse<FeedbackItem> {
  stats?: FeedbackStatistics;
}

export interface FeedbackItem {
  id: string;
  type: string;
  content: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  termId?: string;
  adminNotes?: string;
}

export interface FeedbackStatistics {
  total: number;
  byStatus: Record<FeedbackStatus, number>;
  byType: Record<string, number>;
  averageResolutionTime?: number;
  recentTrends?: TrendData[];
}

export interface TrendData {
  date: Date;
  count: number;
  type?: string;
}

export interface FeedbackUpdate {
  success: boolean;
  feedback: FeedbackItem;
  previousStatus?: FeedbackStatus;
}

// ===== SYSTEM HEALTH & MONITORING TYPES =====

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    s3: ServiceHealth;
    ai: ServiceHealth;
  };
  lastChecked: Date;
}

export interface ServiceHealth {
  status: 'healthy' | 'warning' | 'error';
  latency?: number;
  errorRate?: number;
  details?: string;
}

export interface DatabaseMetrics {
  connectionCount: number;
  queryPerformance: QueryPerformance[];
  tableStats: TableStats[];
  diskUsage: DiskUsage;
  indexStats?: any;
  connectionStats?: any;
}

export interface QueryPerformance {
  query: string;
  averageTime: number;
  callCount: number;
  lastExecuted: Date;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  sizeInBytes: number;
  lastVacuum?: Date;
  lastAnalyze?: Date;
}

export interface DiskUsage {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueUsers: number;
  averageResultsPerSearch: number;
  zeroResultSearches: number;
  popularQueries: PopularQuery[];
  searchVelocity: number[];
  searchCategories?: Record<string, number>;
}

export interface PopularQuery {
  query: string;
  count: number;
  averageClickPosition?: number;
}

// ===== BULK OPERATIONS TYPES =====

export interface TermUpdate {
  id: string;
  updates: Partial<Term>;
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors?: BulkUpdateError[];
  message?: string;
}

export interface BulkUpdateError {
  termId?: string;
  error: string;
  id?: string;
}

export interface BulkDeleteResult {
  success: boolean;
  deleted: number;
  failed: number;
  errors?: string[];
}

// ===== EXPORT/IMPORT TYPES =====

export interface ExportFilters {
  categories?: string[];
  verificationStatus?: string[];
  dateRange?: DateRange;
  includeMetadata?: boolean;
  difficulty?: string;
  includeEnhanced?: boolean;
}

export interface ImportData {
  terms?: Partial<Term>[];
  categories?: Partial<ICategory>[];
  subcategories?: Partial<ISubcategory>[];
}

// ===== INTERACTIVE ELEMENTS TYPES =====

export interface InteractiveElement {
  id: string;
  termId: string;
  type: 'quiz' | 'code-playground' | 'visualization' | 'diagram';
  config: InteractiveElementConfig;
  userStates?: Record<string, InteractiveElementState>;
}

export interface InteractiveElementConfig {
  title?: string;
  description?: string;
  data: Record<string, unknown>;
}

export interface InteractiveElementState {
  userId: string;
  elementId: string;
  state: Record<string, unknown>;
  lastUpdated: Date;
}

// ===== RECOMMENDATIONS TYPES =====

export interface PersonalizedRecommendation {
  termId: string;
  term: Term;
  score: number;
  reason: string;
  basedOn?: string[];
}

// ===== LEARNING PATH TYPES =====

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  terms: LearningPathTerm[];
  estimatedHours: number;
  prerequisites?: string[];
}

export interface LearningPathTerm {
  termId: string;
  order: number;
  required: boolean;
  estimatedMinutes: number;
}

// ===== CATEGORY TYPES =====

export interface Category extends ICategory {
  parentId?: string;
  children?: Category[];
  metadata?: CategoryMetadata;
}

export interface CategoryMetadata {
  icon?: string;
  color?: string;
  description?: string;
  relatedCategories?: string[];
}

// ===== PAGINATION & COMMON TYPES =====

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ===== ERROR TYPES =====

export class StorageError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends StorageError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends StorageError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}
