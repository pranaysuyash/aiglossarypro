/**
 * Shared types and interfaces for the AI Glossary Pro application
 * This file contains types that are used by both client and server
 */

// User related types
export interface IUser {
  id: string;
  email: string;
  name: string;
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
  // Enhanced fields
  characteristics?: string;
  visualUrl?: string;
  visualCaption?: string;
  mathFormulation?: string;
  relatedTerms?: ITerm[];
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

// Authentication types
export interface AuthenticatedRequest {
  user: {
    claims: {
      sub: string;
      email: string;
      name: string;
    };
  };
  isAuthenticated(): boolean;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalTerms: number;
  totalCategories: number;
  totalViews: number;
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