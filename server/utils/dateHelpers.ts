import { TIME_PERIODS } from '../constants';
import { TIME_CONSTANTS } from './constants';

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
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
  const diffInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / TIME_CONSTANTS.MILLISECONDS_IN_SECOND
  );

  if (diffInSeconds < TIME_CONSTANTS.SECONDS_IN_MINUTE) {
    return 'just now';
  } else if (diffInSeconds < TIME_CONSTANTS.SECONDS_IN_HOUR) {
    const minutes = Math.floor(diffInSeconds / TIME_CONSTANTS.SECONDS_IN_MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < TIME_CONSTANTS.SECONDS_IN_DAY) {
    const hours = Math.floor(diffInSeconds / TIME_CONSTANTS.SECONDS_IN_HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < TIME_CONSTANTS.SECONDS_IN_MONTH) {
    const days = Math.floor(diffInSeconds / TIME_CONSTANTS.SECONDS_IN_DAY);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < TIME_CONSTANTS.SECONDS_IN_YEAR) {
    const months = Math.floor(diffInSeconds / TIME_CONSTANTS.SECONDS_IN_MONTH);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } 
    const years = Math.floor(diffInSeconds / TIME_CONSTANTS.SECONDS_IN_YEAR);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  
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
    case 'week': {
      const day = result.getDay();
      const diff = result.getDate() - day;
      result.setDate(diff);
      result.setHours(0, 0, 0, 0);
      break;
    }
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

/**
 * Calculate date range from timeframe string (for analytics)
 * Supports timeframes like '24h', '7d', '30d', '1y'
 */
export function calculateDateRangeFromTimeframe(timeframe: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  let days = 30; // default

  // Parse timeframe to days
  if (timeframe.endsWith('h')) {
    const hours = parseInt(timeframe);
    days = hours / 24;
  } else if (timeframe.endsWith('d')) {
    days = parseInt(timeframe);
  } else if (timeframe.endsWith('y')) {
    const years = parseInt(timeframe);
    days = years * 365;
  }

  const startDate = new Date(Date.now() - days * TIME_CONSTANTS.MILLISECONDS_IN_DAY);

  return { startDate, endDate: now };
}
