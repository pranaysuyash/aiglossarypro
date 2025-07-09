// Standardized Copy and Messaging for AI/ML Glossary Pro
// Ensures consistent tone, voice, and user communication

// Error Messages
export const errorMessages = {
  // Authentication errors
  auth: {
    loginRequired: 'Please sign in to access this feature',
    loginFailed: 'Sign in failed. Please try again',
    sessionExpired: 'Your session has expired. Please sign in again',
    unauthorized: "You don't have permission to access this resource",
    invalidCredentials: 'Invalid email or password',
  },

  // Network errors
  network: {
    offline: "You're offline. Please check your connection and try again",
    timeout: 'Request timed out. Please try again',
    serverError: 'Something went wrong on our end. Please try again later',
    notFound: 'The requested resource was not found',
    rateLimited: 'Too many requests. Please wait a moment and try again',
  },

  // Form validation errors
  validation: {
    required: (field: string) => `${field} is required`,
    tooShort: (field: string, min: number) => `${field} must be at least ${min} characters`,
    tooLong: (field: string, max: number) => `${field} must be less than ${max} characters`,
    invalidFormat: (field: string) => `Please enter a valid ${field}`,
    passwordMismatch: 'Passwords do not match',
    emailInvalid: 'Please enter a valid email address',
  },

  // Data operation errors
  data: {
    loadFailed: 'Failed to load data. Please refresh the page',
    saveFailed: 'Failed to save changes. Please try again',
    deleteFailed: 'Failed to delete item. Please try again',
    uploadFailed: 'File upload failed. Please try again',
    importFailed: 'Import failed. Please check your file format',
  },

  // Search errors
  search: {
    noResults: 'No results found for your search',
    searchFailed: 'Search failed. Please try again',
    queryTooShort: 'Search query must be at least 2 characters',
    queryTooLong: 'Search query is too long. Please shorten it',
  },

  // Generic fallback
  generic: 'Something went wrong. Please try again',
} as const;

// Success Messages
export const successMessages = {
  // User actions
  user: {
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    settingsSaved: 'Settings saved successfully',
    dataExported: 'Data exported successfully',
  },

  // Content actions
  content: {
    termAdded: (name: string) => `"${name}" added to glossary`,
    termUpdated: (name: string) => `"${name}" updated successfully`,
    termDeleted: (name: string) => `"${name}" removed from glossary`,
    favoriteAdded: (name: string) => `"${name}" added to favorites`,
    favoriteRemoved: (name: string) => `"${name}" removed from favorites`,
  },

  // Admin actions
  admin: {
    userCreated: 'User created successfully',
    userUpdated: 'User updated successfully',
    dataImported: (count: number) => `${count} items imported successfully`,
    cacheCleared: 'Cache cleared successfully',
    backupCreated: 'Backup created successfully',
  },

  // Generic
  saved: 'Changes saved successfully',
  copied: 'Copied to clipboard',
  shared: 'Shared successfully',
} as const;

// Call-to-Action (CTA) Text
export const ctaText = {
  // Primary actions
  primary: {
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    signUp: 'Sign Up',
    signIn: 'Sign In',
    tryItNow: 'Try It Now',
    explore: 'Explore',
  },

  // Secondary actions
  secondary: {
    cancel: 'Cancel',
    goBack: 'Go Back',
    skip: 'Skip',
    later: 'Maybe Later',
    dismiss: 'Dismiss',
    close: 'Close',
  },

  // Content actions
  content: {
    readMore: 'Read More',
    viewDetails: 'View Details',
    seeAll: 'See All',
    showMore: 'Show More',
    showLess: 'Show Less',
    expand: 'Expand',
    collapse: 'Collapse',
  },

  // Form actions
  form: {
    save: 'Save',
    saveChanges: 'Save Changes',
    submit: 'Submit',
    update: 'Update',
    delete: 'Delete',
    confirm: 'Confirm',
    edit: 'Edit',
    create: 'Create',
    add: 'Add',
    remove: 'Remove',
  },

  // Navigation
  navigation: {
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue',
    finish: 'Finish',
    home: 'Home',
    back: 'Back',
  },
} as const;

// Empty State Messages
export const emptyStateMessages = {
  // Content
  terms: {
    title: 'No terms found',
    description:
      'Start exploring AI/ML concepts by browsing categories or searching for specific terms',
    action: 'Browse Categories',
  },

  favorites: {
    title: 'No favorites yet',
    description: 'Save terms you want to reference later by clicking the heart icon',
    action: 'Explore Terms',
  },

  search: {
    title: 'No results found',
    description:
      'Try adjusting your search terms or browse categories to discover relevant content',
    action: 'Browse Categories',
  },

  categories: {
    title: 'No categories available',
    description: 'Categories help organize AI/ML concepts for easier browsing',
    action: 'Contact Support',
  },

  progress: {
    title: 'Start your learning journey',
    description: 'Track your progress as you explore AI/ML concepts and build your knowledge',
    action: 'Begin Learning',
  },

  // Admin
  admin: {
    users: {
      title: 'No users found',
      description: 'User accounts will appear here once they sign up',
    },
    analytics: {
      title: 'No data available',
      description: 'Analytics data will appear as users interact with the platform',
    },
  },
} as const;

// Loading States
export const loadingMessages = {
  default: 'Loading...',
  terms: 'Loading terms...',
  categories: 'Loading categories...',
  search: 'Searching...',
  saving: 'Saving...',
  uploading: 'Uploading...',
  processing: 'Processing...',
  authenticating: 'Signing in...',
  generating: 'Generating content...',
} as const;

// Placeholder Text
export const placeholders = {
  // Search
  search: {
    terms: 'Search for AI/ML terms...',
    categories: 'Search categories...',
    users: 'Search users...',
    global: 'Search...',
  },

  // Forms
  form: {
    email: 'Enter your email',
    password: 'Enter your password',
    name: 'Enter your name',
    title: 'Enter a title',
    description: 'Enter a description',
    tags: 'Enter tags separated by commas',
    url: 'Enter a URL',
  },

  // Content creation
  content: {
    termName: 'e.g., Machine Learning',
    definition: 'Provide a clear, concise definition...',
    example: 'Add an example or use case...',
    reference: 'Add a reference or source...',
  },
} as const;

// Confirmation Messages
export const confirmationMessages = {
  delete: {
    term: (name: string) =>
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    user: (name: string) =>
      `Are you sure you want to delete user "${name}"? This action cannot be undone.`,
    generic: 'Are you sure you want to delete this item? This action cannot be undone.',
  },

  logout: 'Are you sure you want to sign out?',
  discard: 'Are you sure you want to discard your changes?',
  reset: 'Are you sure you want to reset all settings to default?',
  clear: 'Are you sure you want to clear all data?',
} as const;

// Help Text / Microcopy
export const helpText = {
  // Features
  features: {
    favorites: 'Save terms for quick access later',
    progress: 'Track your learning journey',
    search: 'Find terms quickly with smart search',
    categories: 'Browse terms by topic area',
  },

  // Form help
  form: {
    password: 'Password must be at least 8 characters long',
    email: "We'll never share your email with anyone else",
    optional: 'This field is optional',
    required: 'This field is required',
  },

  // Tips
  tips: {
    search: 'Tip: Use quotes for exact phrases',
    keyboard: 'Press Ctrl+K to search anywhere',
    favorites: 'Click the heart icon to save terms',
    share: 'Share terms with colleagues using the share button',
  },
} as const;

// Accessibility Labels
export const a11yLabels = {
  navigation: {
    mainMenu: 'Main navigation',
    breadcrumb: 'Breadcrumb navigation',
    pagination: 'Pagination navigation',
    skipToContent: 'Skip to main content',
    skipToNavigation: 'Skip to navigation',
  },

  actions: {
    toggleMenu: 'Toggle navigation menu',
    toggleTheme: 'Toggle dark mode',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    share: 'Share this term',
    copy: 'Copy link to clipboard',
    search: 'Search terms',
    filter: 'Filter results',
    sort: 'Sort options',
  },

  content: {
    termDefinition: 'Term definition',
    termExample: 'Term example',
    relatedTerms: 'Related terms',
    termCategory: 'Term category',
    loadingContent: 'Loading content',
  },
} as const;

// Utility function to get consistent error message
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return errorMessages.generic;
}

// Utility function to format validation errors
export function formatValidationError(field: string, type: string, value?: any): string {
  switch (type) {
    case 'required':
      return errorMessages.validation.required(field);
    case 'tooShort':
      return errorMessages.validation.tooShort(field, value);
    case 'tooLong':
      return errorMessages.validation.tooLong(field, value);
    case 'invalidFormat':
      return errorMessages.validation.invalidFormat(field);
    default:
      return errorMessages.generic;
  }
}

export default {
  errorMessages,
  successMessages,
  ctaText,
  emptyStateMessages,
  loadingMessages,
  placeholders,
  confirmationMessages,
  helpText,
  a11yLabels,
  getErrorMessage,
  formatValidationError,
};
