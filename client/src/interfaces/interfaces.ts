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
