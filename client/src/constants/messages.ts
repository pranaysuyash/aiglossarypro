/**
 * Centralized UI messages for consistent user communication
 * This makes the app easier to maintain and potentially support internationalization
 */

export const AUTH_MESSAGES = {
  REQUIRED: {
    title: "Authentication required",
    description: "Please sign in to save favorites"
  },
  SESSION_EXPIRED: {
    title: "Session expired",
    description: "Please sign in again to continue"
  }
} as const;

export const FAVORITES_MESSAGES = {
  ADDED: (termName: string) => ({
    title: "Added to favorites",
    description: `${termName} has been added to your favorites`
  }),
  REMOVED: (termName: string) => ({
    title: "Removed from favorites", 
    description: `${termName} has been removed from your favorites`
  }),
  ERROR: {
    title: "Error",
    description: "Failed to update favorites. Please try again."
  }
} as const;

export const CLIPBOARD_MESSAGES = {
  SUCCESS: {
    title: "Link copied",
    description: "Link has been copied to clipboard"
  },
  ERROR: {
    title: "Failed to copy",
    description: "Please try again or copy manually"
  }
} as const;

export const LEARNING_MESSAGES = {
  MARKED: (termName: string) => ({
    title: "Marked as learned",
    description: `${termName} has been marked as learned`
  }),
  UNMARKED: (termName: string) => ({
    title: "Unmarked as learned",
    description: `${termName} has been unmarked as learned`
  }),
  ERROR: {
    title: "Error",
    description: "Failed to update learning status. Please try again."
  }
} as const;

export const GENERIC_MESSAGES = {
  ERROR: {
    title: "Error",
    description: "Something went wrong. Please try again."
  },
  SUCCESS: {
    title: "Success",
    description: "Operation completed successfully"
  },
  LOADING: {
    title: "Loading",
    description: "Please wait..."
  }
} as const;