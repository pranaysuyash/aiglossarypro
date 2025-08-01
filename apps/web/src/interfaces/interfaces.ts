// Re-export shared types for backward compatibility
export * from '@aiglossarypro/shared/types';

// Client-specific enhanced interfaces that extend the shared types
import type { ICategory, ISubcategory, ITerm, UserPreferences } from '@aiglossarypro/shared/types';

// Enhanced term interface for the new data structure
export interface IEnhancedTerm extends ITerm {
  slug: string;

  // Enhanced content
  fullDefinition?: string;

  // Enhanced categorization
  mainCategories: string[];
  subCategories: string[];
  relatedConcepts: string[];
  applicationDomains: string[];
  techniques: string[];

  // Metadata
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  hasImplementation: boolean;
  hasInteractiveElements: boolean;
  hasCaseStudies: boolean;
  hasCodeExamples: boolean;

  // AI Content Management
  isAiGenerated?: boolean;
  verificationStatus?: 'unverified' | 'verified' | 'flagged' | 'needs_review' | 'expert_reviewed';
  aiModel?: string; // Which AI model generated the content
  confidenceLevel?: 'low' | 'medium' | 'high';
  lastReviewed?: string;
  expertReviewRequired?: boolean;

  // Search and filtering
  searchText?: string;
  keywords: string[];

  // Analytics
  lastViewed?: string;

  // Metadata
  parseHash?: string;
  parseVersion?: string;

  // Relations
  sections?: ITermSection[];
  interactiveElements?: IInteractiveElement[];
  relationships?: ITermRelationship[];
  displayConfig?: IDisplayConfig;
}

// Define the interface for a Category with subcategories
export interface ICategoryWithSubcategories extends ICategory {
  subcategories?: ISubcategory[];
}

// Define the interface for user progress
export interface IUserProgress {
  termsLearned: number;
  totalTerms: number;
  streak: number;
  lastWeekActivity: number[];
}

// Define the interface for user's viewed terms
export interface IViewedTerm {
  id: string;
  name: string;
  relativeTime: string;
  viewedAt: string;
}

// Define the interface for the term import result
export interface IImportResult {
  success: boolean;
  termsImported: number;
  categoriesImported: number;
  errors?: string[];
}

// Define the interface for analytics data
export interface IAnalyticsData {
  totalUsers: number;
  totalTerms: number;
  totalViews: number;
  totalFavorites: number;
  topTerms: {
    name: string;
    views: number;
  }[];
  categoriesDistribution: {
    name: string;
    count: number;
  }[];
  userActivity: {
    date: string;
    count: number;
  }[];
}

// Term section interface for 42 structured content sections
export interface ITermSection {
  id: string;
  termId: string;
  sectionName: string;
  sectionData: Record<string, unknown>; // JSON data specific to each section type
  displayType: 'card' | 'sidebar' | 'main' | 'modal' | 'metadata';
  priority: number; // 1-10 for ordering
  isInteractive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interactive elements interface
export interface IInteractiveElement {
  id: string;
  termId: string;
  sectionName: string;
  elementType: 'mermaid' | 'quiz' | 'demo' | 'code' | 'simulation';
  elementData: {
    // Common properties (moved to top to avoid duplicates)
    title?: string | undefined;
    description?: string | undefined;
    difficulty?: string;

    // For mermaid diagrams
    diagram?: string;

    // For code examples
    code?: string;
    language?: string;
    executable?: boolean;
    highlightLines?: number[];

    // For quizzes
    questions?: {
      id: string;
      question: string;
      type: 'multiple-choice' | 'true-false' | 'fill-blank';
      options?: string[];
      correctAnswer: string | number;
      explanation?: string;
    }[];
    timeLimit?: number;
    showExplanations?: boolean;
    allowRetry?: boolean;

    // For demos/simulations
    demoUrl?: string;
    simulationConfig?: Record<string, unknown>;
  };
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Term relationships interface
export interface ITermRelationship {
  id: string;
  fromTermId: string;
  toTermId: string;
  relationshipType: 'prerequisite' | 'related' | 'extends' | 'alternative';
  strength: number; // 1-10
  createdAt: string;

  // Additional relationship data
  fromTerm?: {
    id: string;
    name: string;
    slug: string;
  };
  toTerm?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Display configuration interface
export interface IDisplayConfig {
  id: string;
  termId: string;
  configType: 'card' | 'detail' | 'mobile';
  layout: {
    sections?: {
      sectionName: string;
      visible: boolean;
      order: number;
      size?: 'small' | 'medium' | 'large';
    }[];
    theme?: 'default' | 'compact' | 'detailed';
    showInteractive?: boolean;
  };
  isDefault: boolean;
  createdAt: string;
}

// Enhanced user settings interface
export interface IEnhancedUserSettings extends UserPreferences {
  userId: string;

  // Display preferences
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredSections: string[];
  hiddenSections: string[];

  // Content preferences
  showMathematicalDetails: boolean;
  showCodeExamples: boolean;
  showInteractiveElements: boolean;

  // Personalization
  favoriteCategories: string[];
  favoriteApplications: string[];

  // UI preferences
  compactMode: boolean;
  darkMode: boolean;

  createdAt: string;
  updatedAt: string;
}

// Search filters interface
export interface ISearchFilters {
  query?: string;
  categories?: string[];
  subcategories?: string[];
  difficultyLevels?: ('Beginner' | 'Intermediate' | 'Advanced' | 'Expert')[];
  applicationDomains?: string[];
  techniques?: string[];
  hasImplementation?: boolean;
  hasInteractiveElements?: boolean;
  hasCaseStudies?: boolean;
  hasCodeExamples?: boolean;
  sortBy?: 'relevance' | 'name' | 'updated' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Search result interface
export interface ISearchResult {
  term: IEnhancedTerm;
  relevanceScore: number;
  matchedFields: string[];
  explanation?: string; // AI explanation of why this term matches
}

// Content analytics interface
export interface IContentAnalytics {
  id: string;
  termId: string;
  sectionName?: string; // null for overall term analytics

  // Engagement metrics
  views: number;
  timeSpent: number; // in seconds
  interactionCount: number;

  // Quality metrics
  userRating?: number; // 1-5 stars
  helpfulnessVotes: number;

  lastUpdated: string;
  createdAt: string;
}

// Quiz result interface
export interface IQuizResult {
  quizId: string;
  userId?: string;
  termId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  answers: {
    questionId: string;
    userAnswer: string | number;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  completedAt: string;
}

// Component prop interfaces
export interface ITermCardProps {
  term: IEnhancedTerm | ITerm;
  displayMode?: 'default' | 'compact' | 'detailed';
  showInteractive?: boolean;
  userSettings?: IEnhancedUserSettings;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface IAdvancedSearchProps {
  onSearch: (filters: ISearchFilters) => void;
  initialFilters?: ISearchFilters;
  availableFilters: {
    categories: string[];
    subcategories: string[];
    applicationDomains: string[];
    techniques: string[];
  };
}

export interface ISectionDisplayProps {
  section: ITermSection;
  userSettings?: IEnhancedUserSettings;
  onInteraction?: (interactionType: string, data?: unknown) => void;
}
