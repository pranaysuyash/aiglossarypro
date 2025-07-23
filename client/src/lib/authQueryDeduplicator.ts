/**
 * Auth Query Deduplicator with Enhanced Loop Prevention
 * Prevents multiple simultaneous auth queries and implements intelligent caching
 */

interface AuthQueryState {
  promise: Promise<any> | null;
  lastQueryTime: number;
  result: any;
  consecutiveQueries: number;
  lastResultHash: string | null;
}

class AuthQueryDeduplicator {
  private static instance: AuthQueryDeduplicator;
  private state: AuthQueryState = {
    promise: null,
    lastQueryTime: 0,
    result: null,
    consecutiveQueries: 0,
    lastResultHash: null
  };

  private readonly MIN_QUERY_INTERVAL = 1000; // 1 second - reduced for faster auth updates
  private readonly MAX_CONSECUTIVE_QUERIES = 5; // Increased limit for login flows
  private readonly FORCED_DELAY = 10000; // 10 seconds - reduced for better UX

  private constructor() { }

  static getInstance(): AuthQueryDeduplicator {
    if (!AuthQueryDeduplicator.instance) {
      AuthQueryDeduplicator.instance = new AuthQueryDeduplicator();
    }
    return AuthQueryDeduplicator.instance;
  }

  /**
   * Simple hash function for result comparison
   */
  private hashResult(result: any): string {
    return JSON.stringify(result);
  }

  /**
   * Execute auth query with enhanced deduplication and loop prevention
   */
  async executeQuery(queryFn: () => Promise<any>): Promise<any> {
    const now = Date.now();

    // If we have a pending promise, return it (deduplication)
    if (this.state.promise) {
      console.log('🔄 Returning existing auth query promise (deduplication)');
      return this.state.promise;
    }

    // Always allow the first request through (no cooldown on attempt 0)
    const isFirstRequest = this.state.lastQueryTime === 0;

    // Check for too many consecutive queries (but not for the first request)
    if (!isFirstRequest && this.state.consecutiveQueries >= this.MAX_CONSECUTIVE_QUERIES) {
      const timeSinceLastQuery = now - this.state.lastQueryTime;
      if (timeSinceLastQuery < this.FORCED_DELAY) {
        console.log(`🚫 Too many consecutive auth queries (${this.state.consecutiveQueries}), forcing delay`);
        return this.state.result;
      } else {
        // Reset counter after forced delay
        this.state.consecutiveQueries = 0;
      }
    }

    // If we have a recent result, return it (caching) - but not for the first request
    if (!isFirstRequest && 
        this.state.result !== undefined &&
        now - this.state.lastQueryTime < this.MIN_QUERY_INTERVAL) {
      console.log(`✅ Returning cached auth result (${now - this.state.lastQueryTime}ms old)`);
      return this.state.result;
    }

    // Create new query promise
    console.log(`🚀 Starting new auth query (attempt ${this.state.consecutiveQueries + 1})`);
    this.state.consecutiveQueries++;

    this.state.promise = queryFn()
      .then(result => {
        const resultHash = this.hashResult(result);

        // Check if result is the same as last time
        if (this.state.lastResultHash === resultHash) {
          console.log('📊 Auth query returned same result as before');
        } else {
          console.log('📊 Auth query returned new result');
          this.state.lastResultHash = resultHash;
        }

        this.state.result = result;
        this.state.lastQueryTime = Date.now();
        this.state.promise = null;

        // Reset consecutive queries on successful result
        this.state.consecutiveQueries = 0;

        return result;
      })
      .catch(error => {
        // Still update timestamp on error to prevent rapid retries
        this.state.lastQueryTime = Date.now();
        this.state.promise = null;

        // Don't reset consecutive queries on error to maintain backoff
        console.log(`❌ Auth query failed (consecutive: ${this.state.consecutiveQueries})`);

        throw error;
      });

    return this.state.promise;
  }

  /**
   * Clear cached result (for logout)
   */
  clear(): void {
    console.log('🧹 Clearing auth query deduplicator state');
    this.state = {
      promise: null,
      lastQueryTime: 0,
      result: null,
      consecutiveQueries: 0,
      lastResultHash: null
    };
  }

  /**
   * Get current state for debugging
   */
  getState(): AuthQueryState {
    return { ...this.state };
  }

  /**
   * Force reset consecutive query counter
   */
  resetConsecutiveQueries(): void {
    this.state.consecutiveQueries = 0;
  }
}

export const authQueryDeduplicator = AuthQueryDeduplicator.getInstance();