// Define the interface for a Term
export interface ITerm {
  id: string;
  name: string;
  shortDefinition: string;
  definition: string;
  category: string;
  categoryId: string;
  subcategories?: string[];
  characteristics?: string[];
  types?: {
    name: string;
    description: string;
  }[];
  visualUrl?: string;
  visualCaption?: string;
  mathFormulation?: string;
  applications?: {
    name: string;
    description: string;
    icon?: string;
  }[];
  relatedTerms?: {
    id: string;
    name: string;
  }[];
  references?: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isFavorite?: boolean;
  favoriteDate?: string;
}

// Define the interface for a Category
export interface ICategory {
  id: string;
  name: string;
  termCount?: number;
}

// Define the interface for a Category with subcategories
export interface ICategoryWithSubcategories extends ICategory {
  subcategories?: ICategory[];
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

// Enhanced term interface for the new data structure
export interface IEnhancedTerm {
  id: string;
  name: string;
  slug: string;
  shortDefinition?: string;
  fullDefinition: string;
  
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
  
  // Search and filtering
  searchText?: string;
  keywords: string[];
  
  // Analytics
  viewCount: number;
  lastViewed?: string;
  
  // Metadata
  parseHash?: string;
  parseVersion?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sections?: ITermSection[];
  interactiveElements?: IInteractiveElement[];
  relationships?: ITermRelationship[];
  displayConfig?: IDisplayConfig;
  
  // Compatibility
  isFavorite?: boolean;
  favoriteDate?: string;
}

// Term section interface for 42 structured content sections
export interface ITermSection {
  id: string;
  termId: string;
  sectionName: string;
  sectionData: any; // JSON data specific to each section type
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
    // For mermaid diagrams
    diagram?: string;
    title?: string;
    
    // For code examples
    code?: string;
    language?: string;
    description?: string;
    
    // For quizzes
    questions?: {
      id: string;
      question: string;
      type: 'multiple-choice' | 'true-false' | 'fill-blank';
      options?: string[];
      correctAnswer: string | number;
      explanation?: string;
    }[];
    
    // For demos/simulations
    demoUrl?: string;
    simulationConfig?: any;
    
    // Common properties
    title?: string;
    description?: string;
    difficulty?: string;
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
export interface IEnhancedUserSettings {
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

// Search filter interface for advanced search
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
  onInteraction?: (interactionType: string, data?: any) => void;
}
