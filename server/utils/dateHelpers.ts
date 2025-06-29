import { TIME_PERIODS } from '../constants';

/**
 * Calculate date range based on period string
 */
export function calculateDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case TIME_PERIODS.SEVEN_DAYS:
      startDate.setDate(now.getDate() - 7);
      break;
    case TIME_PERIODS.THIRTY_DAYS:
      startDate.setDate(now.getDate() - 30);
      break;
    case TIME_PERIODS.NINETY_DAYS:
      startDate.setDate(now.getDate() - 90);
      break;
    case TIME_PERIODS.ONE_YEAR:
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30); // Default to 30 days
  }
  
  return { startDate, endDate: now };
}

/**
 * Get date range for the last N days
 */
export function getLastNDaysRange(days: number): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);
  
  return { startDate, endDate: now };
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    case 'iso':
      return date.toISOString();
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Get start of day/week/month/year
 */
export function getStartOf(date: Date, unit: 'day' | 'week' | 'month' | 'year'): Date {
  const result = new Date(date);
  
  switch (unit) {
    case 'day':
      result.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = result.getDay();
      const diff = result.getDate() - day;
      result.setDate(diff);
      result.setHours(0, 0, 0, 0);
      break;
    case 'month':
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
    case 'year':
      result.setMonth(0, 1);
      result.setHours(0, 0, 0, 0);
      break;
  }
  
  return result;
}