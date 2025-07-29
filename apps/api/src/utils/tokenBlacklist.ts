/**
 * Token Blacklist Manager
 * Maintains a list of invalidated JWT tokens to prevent reuse after logout
 */

import { log } from './logger';

// In-memory blacklist for development
// In production, this should be backed by Redis or a database
const blacklistedTokens = new Set<string>();

// Cleanup old tokens every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days (matches JWT expiry)

// Track token expiry times
const tokenExpiryMap = new Map<string, number>();

/**
 * Add a token to the blacklist
 */
export function blacklistToken(token: string): void {
  blacklistedTokens.add(token);
  tokenExpiryMap.set(token, Date.now() + TOKEN_EXPIRY);
  
  log.info('Token blacklisted', { 
    tokenPrefix: token.substring(0, 10) + '...',
    totalBlacklisted: blacklistedTokens.size 
  });
}

/**
 * Check if a token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token);
}

/**
 * Clean up expired tokens from the blacklist
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  let removed = 0;
  
  for (const [token, expiry] of tokenExpiryMap.entries()) {
    if (expiry < now) {
      blacklistedTokens.delete(token);
      tokenExpiryMap.delete(token);
      removed++;
    }
  }
  
  if (removed > 0) {
    log.info('Cleaned up expired blacklisted tokens', { 
      removed, 
      remaining: blacklistedTokens.size 
    });
  }
}

// Start cleanup interval
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);

// Cleanup on process exit
process.on('SIGINT', () => {
  blacklistedTokens.clear();
  tokenExpiryMap.clear();
});

export default {
  blacklistToken,
  isTokenBlacklisted,
  size: () => blacklistedTokens.size,
};