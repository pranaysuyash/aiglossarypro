/**
 * AuthStateManager with Circuit Breaker Pattern
 * Prevents infinite authentication loops and manages auth state centrally
 */
import type { IUser } from '@aiglossarypro/shared';

// Simple debounce implementation to avoid external dependencies
function debounce<T extends (...args: unknown[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T & { flush: () => void; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  let maxTimeoutId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs!;
    const thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = undefined;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = maxTimeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  (debounced as any).cancel = cancel;
  (debounced as any).flush = flush;
  return debounced as T & { flush: () => void; cancel: () => void };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  isLoading: boolean;
  error: Error | null;
  lastCheck: number;
  source: 'cache' | 'network' | 'storage' | 'initial';
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextRetryTime: number;
}

export class AuthStateManager {
  private static instance: AuthStateManager;
  private authState: AuthState;
  private circuitBreaker: CircuitBreakerState;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private debouncedNotify: () => void;

  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT = 30000; // 30 seconds
  private readonly MIN_CHECK_INTERVAL = 5000; // 5 seconds minimum between checks
  private readonly DEBOUNCE_DELAY = 100; // 100ms debounce for state changes

  private constructor() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastCheck: 0,
      source: 'initial'
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      nextRetryTime: 0
    };

    // Create debounced notify function to prevent rapid re-renders
    this.debouncedNotify = debounce(this.notifyListeners.bind(this), this.DEBOUNCE_DELAY, {
      leading: false,
      trailing: true,
      maxWait: 500 // Maximum wait time for debounce
    });
  }

  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  /**
   * Check if we can make an auth request based on circuit breaker state
   */
  canMakeAuthRequest(): boolean {
    const now = Date.now();

    // Always allow the first request
    const isFirstRequest = this.authState.lastCheck === 0;
    if (isFirstRequest) {
      console.log('✅ First auth request - allowing through');
      return true;
    }

    // Check minimum interval between requests
    if (now - this.authState.lastCheck < this.MIN_CHECK_INTERVAL) {
      console.log('🚫 Auth request blocked: Too soon since last check');
      return false;
    }

    // Check circuit breaker state
    switch (this.circuitBreaker.state) {
      case 'OPEN':
        if (now >= this.circuitBreaker.nextRetryTime) {
          // Move to half-open state
          this.circuitBreaker.state = 'HALF_OPEN';
          console.log('🔄 Circuit breaker: OPEN -> HALF_OPEN');
          return true;
        }
        console.log('🚫 Circuit breaker OPEN: Auth request blocked');
        return false;

      case 'HALF_OPEN':
        console.log('⚠️ Circuit breaker HALF_OPEN: Allowing one request');
        return true;

      case 'CLOSED':
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful auth check
   */
  recordSuccess(user: IUser | null, source: AuthState['source'] = 'network'): void {
    const now = Date.now();

    // Reset circuit breaker on success
    if (this.circuitBreaker.state !== 'CLOSED') {
      console.log('✅ Circuit breaker: -> CLOSED (success)');
    }

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      nextRetryTime: 0
    };

    // Update auth state
    this.authState = {
      isAuthenticated: !!user,
      user,
      isLoading: false,
      error: null,
      lastCheck: now,
      source
    };

    this.debouncedNotify();
  }

  /**
   * Record a failed auth check
   */
  recordFailure(error: Error): void {
    const now = Date.now();

    // Don't count 401s as failures for circuit breaker (expected when not logged in)
    if (error.message?.includes('401')) {
      this.authState = {
        ...this.authState,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastCheck: now,
        source: 'network'
      };
      this.debouncedNotify();
      return;
    }

    // Increment failure count
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = now;

    // Check if we should open the circuit
    if (this.circuitBreaker.failures >= this.FAILURE_THRESHOLD) {
      this.circuitBreaker.state = 'OPEN';
      // Use exponential backoff for retry timeout
      const backoffFactor = Math.min(Math.pow(2, this.circuitBreaker.failures - this.FAILURE_THRESHOLD), 5);
      this.circuitBreaker.nextRetryTime = now + (this.RESET_TIMEOUT * backoffFactor);
      console.log(`🚨 Circuit breaker OPEN after ${this.circuitBreaker.failures} failures, next retry in ${(this.RESET_TIMEOUT * backoffFactor) / 1000}s`);
    }

    // Update auth state
    this.authState = {
      ...this.authState,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error,
      lastCheck: now,
      source: 'network'
    };

    this.debouncedNotify();
  }

  /**
   * Start loading state
   */
  setLoading(): void {
    // Only update if not already loading
    if (!this.authState.isLoading) {
      this.authState = {
        ...this.authState,
        isLoading: true
      };
      this.debouncedNotify();
    }
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Force reset auth state (for logout)
   */
  reset(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastCheck: 0,
      source: 'initial'
    };

    // Keep circuit breaker state to prevent loops after logout
    this.debouncedNotify();
  }

  /**
   * Get circuit breaker status for debugging
   */
  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  /**
   * Update auth state from cache
   */
  updateFromCache(user: IUser | null): void {
    if (user !== this.authState.user) {
      this.authState = {
        ...this.authState,
        isAuthenticated: !!user,
        user,
        source: 'cache'
      };
      this.debouncedNotify();
    }
  }

  /**
   * Update auth state from storage
   */
  updateFromStorage(user: IUser | null): void {
    if (user !== this.authState.user) {
      this.authState = {
        ...this.authState,
        isAuthenticated: !!user,
        user,
        source: 'storage'
      };
      this.debouncedNotify();
    }
  }

  /**
   * Force flush any pending state changes
   */
  flushChanges(): void {
    (this.debouncedNotify as any).flush?.();
  }

  /**
   * Cancel any pending state changes
   */
  cancelChanges(): void {
    (this.debouncedNotify as any).cancel?.();
  }
}