/**
 * Centralized UI messages for consistent user communication
 * This makes the app easier to maintain and potentially support internationalization
 */

export const AUTH_MESSAGES = {
  REQUIRED: {
    title: 'Authentication required',
    description: 'Please sign in to save favorites',
  },
  SESSION_EXPIRED: {
    title: 'Session expired',
    description: 'Please sign in again to continue',
  },
} as const;

export const FAVORITES_MESSAGES = {
  ADDED: (termName: string) => ({
    title: 'Added to favorites',
    description: `${termName} has been added to your favorites`,
  }),
  REMOVED: (termName: string) => ({
    title: 'Removed from favorites',
    description: `${termName} has been removed from your favorites`,
  }),
  ERROR: {
    title: 'Error',
    description: 'Failed to update favorites. Please try again.',
  },
} as const;

export const CLIPBOARD_MESSAGES = {
  SUCCESS: {
    title: 'Link copied',
    description: 'Link has been copied to clipboard',
  },
  ERROR: {
    title: 'Failed to copy',
    description: 'Please try again or copy manually',
  },
} as const;

export const LEARNING_MESSAGES = {
  MARKED: (termName: string) => ({
    title: 'Marked as learned',
    description: `${termName} has been marked as learned`,
  }),
  UNMARKED: (termName: string) => ({
    title: 'Unmarked as learned',
    description: `${termName} has been unmarked as learned`,
  }),
  ERROR: {
    title: 'Error',
    description: 'Failed to update learning status. Please try again.',
  },
} as const;

export const PROGRESS_MESSAGES = {
  AUTH_REQUIRED: {
    title: 'Authentication required',
    description: 'Please sign in to track your progress',
  },
  MARKED_LEARNED: {
    title: 'Marked as learned',
    description: 'This term has been added to your learned list',
  },
  UPDATED: {
    title: 'Progress updated',
    description: 'This term has been removed from your learned list',
  },
  ERROR: {
    title: 'Error',
    description: 'Failed to update progress. Please try again.',
  },
} as const;

export const SHARE_MESSAGES = {
  COPIED: {
    title: 'Link copied to clipboard',
    description: 'You can now paste it anywhere',
  },
  COPY_ERROR: {
    title: 'Failed to copy link',
    description: 'Please try again',
  },
} as const;

export const AI_IMPROVEMENT_MESSAGES = {
  SUCCESS: {
    title: 'Success',
    description: 'AI improvements generated successfully!',
  },
  APPLIED: {
    title: 'Success',
    description: 'AI improvements applied successfully!',
  },
  DISMISSED: {
    title: 'Dismissed',
    description: 'AI improvements dismissed.',
  },
} as const;

export const NAVIGATION_LABELS = {
  BACK: 'Back',
  HOME: 'Home',
  CATEGORIES: 'Categories',
  RETURN_HOME: 'Return to Home',
} as const;

export const FEATURE_LABELS = {
  CODE_EXAMPLES: 'Code Examples',
  INTERACTIVE: 'Interactive',
  CASE_STUDIES: 'Case Studies',
  IMPLEMENTATION: 'Implementation',
} as const;

export const TAB_LABELS = {
  OVERVIEW: 'Overview',
  SECTIONS: 'Sections',
  INTERACTIVE: 'Interactive',
  RELATED: 'Related',
  AI_TOOLS: 'AI Tools',
  PROGRESS: 'Progress',
} as const;

export const ERROR_MESSAGES = {
  TERM_NOT_FOUND: {
    title: 'Term Not Found',
    description: "The term you're looking for doesn't exist or has been removed.",
    action: 'Try searching for a similar term or browse our categories',
  },
  FAILED_TO_GENERATE: {
    title: 'AI Generation Error',
    description:
      'Unable to generate AI improvements at this time. This might be due to high server load or a temporary service interruption.',
    action: 'Please try again in a few moments',
  },
  FAILED_TO_APPLY: {
    title: 'Update Error',
    description: "The improvements couldn't be saved due to a technical issue.",
    action: 'Please try applying the changes again',
  },
  NETWORK_ERROR: {
    title: 'Connection Error',
    description: 'Unable to connect to our servers. Please check your internet connection.',
    action: 'Try refreshing the page or check your network settings',
  },
  SEARCH_ERROR: {
    title: 'Search Unavailable',
    description: 'The search service is temporarily unavailable.',
    action: 'Please try again in a moment or browse categories instead',
  },
  FAVORITES_SYNC_ERROR: {
    title: 'Sync Error',
    description: "Your favorites couldn't be synchronized with the server.",
    action: 'Changes are saved locally and will sync when connection is restored',
  },
  PROGRESS_SYNC_ERROR: {
    title: 'Progress Sync Error',
    description: "Your learning progress couldn't be saved to the server.",
    action: 'Changes are saved locally and will sync when connection is restored',
  },
  SESSION_ERROR: {
    title: 'Session Expired',
    description: 'Your session has expired for security reasons.',
    action: 'Please sign in again to continue',
  },
  PERMISSION_ERROR: {
    title: 'Access Denied',
    description: "You don't have permission to perform this action.",
    action: 'Please contact support if you believe this is an error',
  },
  RATE_LIMIT_ERROR: {
    title: 'Too Many Requests',
    description: "You're making requests too quickly. Please slow down.",
    action: 'Wait a moment before trying again',
  },
} as const;

export const PROGRESS_LABELS = {
  TRACK_PROGRESS: 'Track your progress',
  MARKED_AS_LEARNED: "You've marked this term as learned",
  MARK_TO_TRACK: 'Mark this term as learned to track your progress',
  MARK_LEARNED: 'Mark as learned',
  MARK_UNLEARNED: 'Mark as unlearned',
  PROCESSING: 'Processing...',
  DIFFICULTY_MATCH: (level: string) => `Difficulty Match for ${level}`,
} as const;

export const CONTENT_LABELS = {
  KEYWORDS_PREFIX: 'Keywords: ',
  ANALYZING: 'Analyzing Definition...',
  APPLYING: 'Applying...',
  CURRENT: 'Current',
  AI_IMPROVED: 'AI Improved',
  NONE: 'None',
  IMPROVED: 'Improved',
  NEW: 'New',
  SUGGESTED: 'Suggested',
} as const;

export const AI_TOOL_LABELS = {
  AI_DEFINITION_IMPROVER: 'AI Definition Improver',
  USE_AI_ENHANCE: (termName: string) =>
    `Use AI to enhance and improve the definition for "${termName}"`,
  AI_SUGGESTIONS_DESC:
    "Get AI-powered suggestions to improve this term's definition, characteristics, and applications.",
  GENERATE_IMPROVEMENTS: 'Generate AI Improvements',
  AI_IMPROVEMENT_SUGGESTIONS: 'AI Improvement Suggestions',
  DISMISS: 'Dismiss',
  APPLY_CHANGES: 'Apply Changes',
  SHORT_DEFINITION: 'Short Definition',
  DETAILED_DEFINITION: 'Detailed Definition',
  CHARACTERISTICS: 'Characteristics',
  MATHEMATICAL_FORMULATION: 'Mathematical Formulation',
  APPLICATIONS: 'Applications',
  RELATED_TERMS: 'Related Terms',
} as const;

export const SHARE_LABELS = {
  SHARE_TERM: 'Share this term',
  SHARE_VIA: (title: string) => `Share "${title}" with others via:`,
  CHECK_OUT_TERM: (title: string) => `Check out "${title}" in the AI/ML Glossary`,
  THOUGHT_INTERESTED: 'I thought you might be interested in this AI/ML term:',
} as const;

export const GENERIC_MESSAGES = {
  ERROR: {
    title: 'Error',
    description: 'Something went wrong. Please try again.',
  },
  SUCCESS: {
    title: 'Success',
    description: 'Operation completed successfully',
  },
  LOADING: {
    title: 'Loading',
    description: 'Please wait...',
  },
} as const;
