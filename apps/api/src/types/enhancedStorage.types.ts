/**
 * Enhanced Storage Type Definitions
 * Comprehensive types for all enhanced storage operations to eliminate 'any' usage
 */

import type {
  Term,
  EnhancedTerm,
  TermSection,
  User,
  SearchFacets,
  InteractiveElement,
  PersonalizedRecommendation,
  LearningPath,
  Category,
  ICategory,
  ITerm,
  PaginatedResult,
  Achievement,
  LearningStreak,
  UserProgressStats,
  SectionProgress,
  CategoryProgress,
} from './storage.types';

// ===== ENHANCED TERM TYPES =====

export interface EnhancedTermWithSections extends EnhancedTerm {
  sections: TermSectionWithMetadata[];
  interactiveElements?: InteractiveElement[];
  analytics?: TermAnalytics;
  qualityMetrics?: QualityMetrics;
  userSpecificData?: UserSpecificTermData;
}

export interface TermSectionWithMetadata extends TermSection {
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  hasInteractiveElements?: boolean;
  hasCodeExamples?: boolean;
  hasMathFormulas?: boolean;
  hasVisualizations?: boolean;
  userProgress?: SectionUserProgress;
}

export interface SectionUserProgress {
  isCompleted: boolean;
  completedAt?: Date;
  timeSpent: number;
  lastAccessedAt?: Date;
}

export interface UserSpecificTermData {
  isFavorite: boolean;
  lastViewed?: Date;
  viewCount: number;
  progress: number;
  notes?: string;
  rating?: number;
}

// ===== SEARCH & AUTOCOMPLETE TYPES =====

export interface EnhancedSearchFacets extends SearchFacets {
  applicationDomains: FacetValue[];
  techniques: FacetValue[];
  hasImplementation: FacetValue[];
  hasInteractiveElements: FacetValue[];
  experienceLevels: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  label: string;
  selected?: boolean;
}

export interface AutocompleteSuggestion {
  value: string;
  type: 'term' | 'category' | 'tag' | 'query';
  termId?: string;
  categoryId?: string;
  popularity?: number;
  matchedFields?: string[];
}

// ===== USER PREFERENCES & SETTINGS TYPES =====

export interface UserPreferences {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredSections?: string[];
  hiddenSections?: string[];
  showMathematicalDetails?: boolean;
  showCodeExamples?: boolean;
  showInteractiveElements?: boolean;
  favoriteCategories?: string[];
  favoriteApplications?: string[];
  compactMode?: boolean;
  darkMode?: boolean;
  emailNotifications?: EmailNotificationSettings;
  learningGoals?: LearningGoals;
}

export interface EmailNotificationSettings {
  weeklyProgress?: boolean;
  newTerms?: boolean;
  achievements?: boolean;
  recommendations?: boolean;
}

export interface LearningGoals {
  targetTermsPerWeek?: number;
  targetTimePerDay?: number;
  focusCategories?: string[];
  completionTarget?: Date;
}

export interface UserSettings extends UserPreferences {
  userId: string;
  privacy?: PrivacySettings;
  accessibility?: AccessibilitySettings;
  lastUpdated: Date;
}

export interface PrivacySettings {
  shareProgress?: boolean;
  publicProfile?: boolean;
  showAchievements?: boolean;
}

export interface AccessibilitySettings {
  fontSize?: 'small' | 'medium' | 'large';
  highContrast?: boolean;
  reduceMotion?: boolean;
  screenReaderOptimized?: boolean;
}

// ===== ANALYTICS TYPES =====

export interface TermAnalytics {
  termId: string;
  totalViews: number;
  uniqueViewers: number;
  averageTimeSpent: number;
  completionRate: number;
  averageRating: number;
  ratingCount: number;
  sectionEngagement: SectionEngagement[];
  viewTrend: ViewTrend[];
  popularityScore: number;
  lastUpdated: Date;
}

export interface SectionEngagement {
  sectionId: string;
  sectionTitle: string;
  views: number;
  completions: number;
  averageTimeSpent: number;
  engagementScore: number;
}

export interface ViewTrend {
  date: Date;
  views: number;
  uniqueUsers: number;
}

export interface AnalyticsOverview {
  totalTerms: number;
  totalUsers: number;
  totalViews: number;
  averageSessionDuration: number;
  topTerms: PopularTerm[];
  topCategories: PopularCategory[];
  userEngagement: UserEngagementMetrics;
  contentQuality: ContentQualityMetrics;
  growthMetrics: GrowthMetrics;
  lastUpdated: Date;
}

export interface PopularTerm {
  termId: string;
  name: string;
  category: string;
  views: number;
  completionRate: number;
  averageRating: number;
}

export interface PopularCategory {
  categoryId: string;
  name: string;
  termCount: number;
  totalViews: number;
  averageCompletionRate: number;
}

export interface UserEngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionsPerUser: number;
  averageTermsPerSession: number;
  retentionRate: number;
}

export interface ContentQualityMetrics {
  termsWithContent: number;
  termsWithEnhancedContent: number;
  averageContentCompleteness: number;
  termsNeedingReview: number;
  recentlyUpdated: number;
}

export interface GrowthMetrics {
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  growthRate: number;
  projectedMonthlyUsers: number;
}

// ===== QUALITY & PROCESSING TYPES =====

export interface QualityReport {
  timestamp: Date;
  overallScore: number;
  totalTerms: number;
  metrics: QualityMetrics;
  recommendations: QualityRecommendation[];
  termsByQuality: QualityDistribution;
}

export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  clarity: number;
  examples: number;
  references: number;
  interactivity: number;
  overall: number;
}

export interface QualityRecommendation {
  type: 'improvement' | 'warning' | 'suggestion';
  category: string;
  message: string;
  affectedTerms: number;
  priority: 'low' | 'medium' | 'high';
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  average: number;
  needsImprovement: number;
  poor: number;
}

export interface ProcessingStats {
  totalProcessed: number;
  successfullyProcessed: number;
  failedProcessing: number;
  pendingProcessing: number;
  averageProcessingTime: number;
  lastProcessingRun: Date;
  processingQueue: ProcessingQueueItem[];
}

export interface ProcessingQueueItem {
  termId: string;
  type: 'create' | 'update' | 'enhance';
  priority: number;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

// ===== SCHEMA & HEALTH TYPES =====

export interface SchemaInfo {
  version: string;
  tables: TableInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  lastMigration: Date;
  pendingMigrations: string[];
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
  sizeEstimate: number;
  lastAnalyzed: Date;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  size: number;
  usage: number;
}

export interface ConstraintInfo {
  name: string;
  type: 'primary' | 'foreign' | 'unique' | 'check';
  table: string;
  columns: string[];
  definition: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  components: ComponentHealth[];
  recentErrors: HealthError[];
  performance: PerformanceMetrics;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
  lastCheck: Date;
  metrics?: Record<string, number>;
}

export interface HealthError {
  timestamp: Date;
  component: string;
  error: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  saturation: number;
}

// ===== TERM RELATIONSHIPS TYPES =====

export interface TermRelationships {
  termId: string;
  relatedTerms: RelatedTerm[];
  prerequisites: RelatedTerm[];
  nextTerms: RelatedTerm[];
  applications: RelatedApplication[];
  references: Reference[];
}

export interface RelatedTerm {
  termId: string;
  name: string;
  category: string;
  relationshipType: 'related' | 'prerequisite' | 'next' | 'similar';
  relevanceScore: number;
}

export interface RelatedApplication {
  name: string;
  domain: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface Reference {
  title: string;
  authors: string[];
  year: number;
  type: 'paper' | 'book' | 'article' | 'website';
  url?: string;
  doi?: string;
}

// ===== REVENUE & PURCHASE TYPES =====

export interface RecentPurchase {
  orderId: string;
  email: string;
  productName: string;
  amount: number;
  currency: string;
  purchaseDate: Date;
  status: string;
  country?: string;
  refunded: boolean;
}

export interface RevenuePeriodData {
  period: string;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalPurchases: number;
  averageOrderValue: number;
  topProducts: ProductRevenue[];
  revenueByDay: DailyRevenue[];
  refundRate: number;
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  revenue: number;
  purchases: number;
  averagePrice: number;
}

export interface DailyRevenue {
  date: Date;
  revenue: number;
  purchases: number;
}

export interface CountryRevenue {
  country: string;
  countryCode: string;
  revenue: number;
  purchases: number;
  averageOrderValue: number;
  percentage: number;
}

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;
  averageTimeToConversion: number;
  dropoffAnalysis: DropoffPoint[];
}

export interface FunnelStage {
  name: string;
  users: number;
  conversionRate: number;
  averageTimeInStage: number;
}

export interface DropoffPoint {
  fromStage: string;
  toStage: string;
  dropoffRate: number;
  commonReasons: string[];
}

export interface RefundAnalytics {
  totalRefunds: number;
  refundAmount: number;
  refundRate: number;
  averageRefundTime: number;
  refundReasons: RefundReason[];
  refundTrend: RefundTrend[];
}

export interface RefundReason {
  reason: string;
  count: number;
  percentage: number;
  averageAmount: number;
}

export interface RefundTrend {
  date: Date;
  refunds: number;
  amount: number;
  rate: number;
}

export interface PurchaseExport {
  orderId: string;
  purchaseDate: Date;
  email: string;
  customerName?: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  refunded: boolean;
  refundDate?: Date;
  country?: string;
  paymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface WebhookActivity {
  id: string;
  timestamp: Date;
  eventType: string;
  status: 'success' | 'failed' | 'pending';
  orderId?: string;
  payload: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
  retryCount: number;
}

export interface PurchaseDetails extends RecentPurchase {
  userId?: string;
  customerName?: string;
  billingAddress?: Address;
  paymentMethod?: string;
  transactionId?: string;
  webhookEvents: WebhookActivity[];
  accessGranted: boolean;
  accessExpiresAt?: Date;
  metadata?: Record<string, string>;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface UserAccessUpdate {
  accessGranted?: boolean;
  accessExpiresAt?: Date;
  accessLevel?: 'basic' | 'pro' | 'enterprise';
  notes?: string;
}

// ===== USER DATA EXPORT TYPES =====

export interface UserDataExport {
  exportDate: Date;
  userData: ExportedUserData;
  termsData: ExportedTermsData;
  progressData: ExportedProgressData;
  preferencesData: UserSettings;
  analyticsData: ExportedAnalyticsData;
}

export interface ExportedUserData {
  userId: string;
  email: string;
  name?: string;
  createdAt: Date;
  lastLogin: Date;
  subscription?: UserSubscription;
  achievements: Achievement[];
}

export interface ExportedTermsData {
  viewedTerms: ViewedTerm[];
  favoriteTerms: FavoriteTerm[];
  ratedTerms: RatedTerm[];
  notes: TermNote[];
}

export interface ViewedTerm {
  termId: string;
  termName: string;
  viewCount: number;
  lastViewed: Date;
  totalTimeSpent: number;
}

export interface FavoriteTerm {
  termId: string;
  termName: string;
  favoritedAt: Date;
}

export interface RatedTerm {
  termId: string;
  termName: string;
  rating: number;
  feedback?: string;
  ratedAt: Date;
}

export interface TermNote {
  termId: string;
  termName: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportedProgressData {
  overallProgress: UserProgressStats;
  sectionProgress: SectionProgress[];
  categoryProgress: CategoryProgress[];
  learningStreak: LearningStreak;
  milestones: ProgressMilestone[];
}

export interface ProgressMilestone {
  name: string;
  description: string;
  achievedAt: Date;
  value: number;
  target: number;
}

export interface ExportedAnalyticsData {
  totalTimeSpent: number;
  averageSessionDuration: number;
  totalSessions: number;
  learningVelocity: number;
  topCategories: string[];
  activityHeatmap: ActivityHeatmap[];
}

export interface ActivityHeatmap {
  date: Date;
  hour: number;
  activityLevel: number;
}

// ===== OPTIMIZED TERMS TYPES =====

export interface OptimizedTerm {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDefinition: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  hasEnhancedContent: boolean;
  lastUpdated: Date;
}

// ===== USER SUBSCRIPTION TYPE =====

export interface UserSubscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  gumroadLicenseKey?: string;
  features: string[];
  renewalDate?: Date;
}

// ===== ACTIVITY TYPES =====

export interface RecentActivity {
  id: string;
  type: 'view' | 'complete' | 'favorite' | 'rate' | 'note';
  userId: string;
  termId?: string;
  termName?: string;
  sectionId?: string;
  sectionTitle?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ===== ADMIN ACTIVITY TYPES =====

export interface AdminActivity {
  id: string;
  type: 'content_review' | 'user_management' | 'system_maintenance' | 'analytics_view';
  action: string;
  adminId: string;
  targetId?: string;
  targetType?: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

// ===== CATEGORY WITH STATS =====

export interface CategoryWithStats extends Category {
  termCount: number;
  completedTerms: number;
  averageCompletionRate: number;
  totalViews: number;
  subcategories?: CategoryWithStats[];
}

export interface CategoryStats {
  categoryId: string;
  termCount: number;
  userCount: number;
  totalViews: number;
  averageTimeSpent: number;
  completionRate: number;
  popularTerms: PopularTerm[];
  difficultyDistribution: DifficultyDistribution;
}

export interface DifficultyDistribution {
  beginner: number;
  intermediate: number;
  advanced: number;
}

// ===== MAINTENANCE TYPES =====

export interface MaintenanceStatus {
  isInMaintenance: boolean;
  scheduledMaintenance?: ScheduledMaintenance[];
  lastMaintenance?: MaintenanceRecord;
  systemHealth: SystemHealthSummary;
}

export interface ScheduledMaintenance {
  id: string;
  startTime: Date;
  estimatedDuration: number;
  type: 'routine' | 'emergency' | 'upgrade';
  description: string;
  affectedServices: string[];
}

export interface MaintenanceRecord {
  startTime: Date;
  endTime: Date;
  duration: number;
  type: string;
  operations: string[];
  success: boolean;
  notes?: string;
}

export interface SystemHealthSummary {
  status: 'optimal' | 'good' | 'degraded' | 'critical';
  uptime: number;
  lastIncident?: Date;
  activeAlerts: number;
}

// ===== BACKUP TYPES =====

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: Date;
  size: number;
  location: string;
  type: 'full' | 'incremental' | 'differential';
  tablesBackedUp: string[];
  duration: number;
  metadata?: BackupMetadata;
}

export interface BackupMetadata {
  version: string;
  termsCount: number;
  usersCount: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
}

// Additional type definition for enhanced terms statistics
export interface EnhancedTermsStats {
  totalTerms: number;
  termsWithEnhancedContent: number;
  contentStats: {
    withDefinitions: number;
    withExamples: number;
    withCodeExamples: number;
    withInteractiveElements: number;
    withMathFormulas: number;
    withVisualizations: number;
  };
  qualityMetrics: {
    averageDefinitionLength: number;
    termsWithExamples: number;
    termsWithReferences: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  lastUpdated: Date;
}