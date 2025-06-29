/**
 * Shared types and interfaces for the AI Glossary Pro application
 * This file contains types that are used by both client and server
 */

// User related types
export interface IUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  avatar?: string;
  createdAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  emailUpdates: boolean;
}

// Term related types
export interface ITerm {
  id: string;
  name: string;
  definition: string;
  shortDefinition?: string;
  category: string;
  categoryId?: string;
  subcategories?: string[];
  subcategoryIds?: string[];
  viewCount: number;
  isFavorite?: boolean;
  isLearned?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  relativeTime?: string; // For recently viewed items ("2 hours ago", "yesterday", etc.)
  // Enhanced fields
  characteristics?: string;
  visualUrl?: string;
  visualCaption?: string;
  mathFormulation?: string;
  relatedTerms?: ITerm[];
  // AI Content Management
  isAiGenerated?: boolean;
  verificationStatus?: 'unverified' | 'verified' | 'flagged' | 'needs_review' | 'expert_reviewed';
  aiModel?: string;
  confidenceLevel?: 'low' | 'medium' | 'high';
  lastReviewed?: string;
  expertReviewRequired?: boolean;
}

// Category related types
export interface ICategory {
  id: string;
  name: string;
  description?: string;
  termCount?: number;
  subcategories?: ISubcategory[];
  createdAt?: Date;
}

export interface ISubcategory {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  termCount?: number;
  createdAt?: Date;
}

// Search and filtering types
export interface SearchFilters {
  category?: string;
  subcategory?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

export interface SearchResult {
  terms: ITerm[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AdvancedSearchOptions {
  query?: string;
  filters?: {
    categories?: string[];
    difficulty?: string;
    hasCodeExamples?: boolean;
    hasInteractiveElements?: boolean;
    applicationDomains?: string[];
    techniques?: string[];
  };
  page: number;
  limit: number;
  sortBy?: 'relevance' | 'name' | 'popularity' | 'recent';
}

// Analytics and progress types
export interface UserProgress {
  id: string;
  userId: string;
  termId: string;
  status: 'learning' | 'learned' | 'reviewing';
  progress: number; // 0-100
  lastReviewed?: Date;
  createdAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: 'view' | 'favorite' | 'learn' | 'search';
  entityType: 'term' | 'category';
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AnalyticsData {
  totalTerms: number;
  totalViews: number;
  uniqueUsers: number;
  topCategories: Array<{ name: string; count: number }>;
  topTerms: Array<{ name: string; views: number }>;
  dailyActivity: Array<{ date: string; views: number; users: number }>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// File upload and import types
export interface ImportResult {
  success: boolean;
  termsImported: number;
  categoriesImported: number;
  errors: string[];
  warnings: string[];
}

export interface FileUploadMetadata {
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Authentication types - using types from server/types/express.d.ts
export type { AuthenticatedRequest, AdminRequest } from '../server/types/express';

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalTerms: number;
  totalCategories: number;
  totalViews: number;
  termCount?: number;
  categoryCount?: number;
  userCount?: number;
  pendingFeedback?: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  recentActivity: UserActivity[];
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    s3: 'healthy' | 'warning' | 'error';
    ai: 'healthy' | 'warning' | 'error';
  };
}

// S3 and external service types
export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export interface ProcessingJob {
  id: string;
  type: 'excel_import' | 'data_migration' | 'analytics_update';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// Configuration types
export interface AppConfig {
  features: {
    s3Enabled: boolean;
    aiEnabled: boolean;
    authEnabled: boolean;
    analyticsEnabled: boolean;
  };
  limits: {
    maxFileSize: number;
    maxTermsPerUser: number;
    rateLimit: number;
  };
  integrations: {
    openai: boolean;
    s3: boolean;
    googleDrive: boolean;
  };
}

// New types for section-based architecture
export interface ISection {
  id: number;
  termId: number;
  name: string;
  displayOrder: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: ISectionItem[];
}

export interface ISectionItem {
  id: number;
  sectionId: number;
  label: string;
  content: string;
  contentType: 'markdown' | 'mermaid' | 'image' | 'json' | 'interactive' | 'code';
  displayOrder: number;
  metadata?: Record<string, any>;
  isAiGenerated: boolean;
  verificationStatus: 'unverified' | 'verified' | 'flagged' | 'expert_reviewed';
  createdAt: Date;
  updatedAt: Date;
  media?: IMedia[];
}

export interface IMedia {
  id: number;
  sectionItemId: number;
  url: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'notebook';
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  altText?: string;
  createdAt: Date;
}

export interface IUserProgress {
  id: number;
  userId: string;
  termId: number;
  sectionId: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  completionPercentage: number;
  timeSpentMinutes: number;
  lastAccessedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced term interface with section support
export interface IEnhancedTerm extends ITerm {
  sections?: ISection[];
  userProgress?: IUserProgress[];
  completionPercentage?: number;
  totalSections?: number;
  completedSections?: number;
}

// Content-driven site section types
export interface IContentGallery {
  sectionName: string;
  items: ISectionItem[];
  termCount: number;
}

export interface IQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  termId: number;
  sectionName: string;
}

export interface ILearningPath {
  id: number;
  name: string;
  description: string;
  termIds: number[];
  sectionFocus: string[];
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// API response types for section-based endpoints
export interface ISectionResponse {
  section: ISection;
  items: ISectionItem[];
  userProgress?: IUserProgress;
}

export interface ITermSectionsResponse {
  term: IEnhancedTerm;
  sections: ISection[];
  userProgress: IUserProgress[];
}

export interface IContentGalleryResponse {
  galleries: IContentGallery[];
  totalItems: number;
  page: number;
  limit: number;
}

// Progress tracking types
export interface IProgressUpdate {
  sectionId: number;
  status: IUserProgress['status'];
  completionPercentage?: number;
  timeSpentMinutes?: number;
}

export interface IProgressSummary {
  userId: string;
  totalTerms: number;
  completedTerms: number;
  totalSections: number;
  completedSections: number;
  totalTimeMinutes: number;
  streak: number;
  recentActivity: {
    termId: number;
    termName: string;
    sectionName: string;
    completedAt: Date;
  }[];
}