import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/types";
import { enhancedStorage as storage } from "../../enhancedStorage";

/**
 * Mock authentication middleware for local development
 * This bypasses authentication and provides a test user
 */

// Mock session state to track logout
let mockLoggedOut = false;

// Test user for local development
const DEV_USER = {
  id: "dev-user-123",
  email: "dev@example.com",
  firstName: "Development",
  lastName: "User",
  profileImageUrl: null,
  claims: {
    sub: "dev-user-123",
    email: "dev@example.com",
    name: "Development User",
    first_name: "Development",
    last_name: "User"
  },
  access_token: "dev-token",
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  isAdmin: true // Grant admin access in development
};

/**
 * Mock isAuthenticated middleware for development
 */
export const mockIsAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if user has been logged out
  if (mockLoggedOut) {
    console.log("🔓 Mock authentication: User is logged out");
    // Don't set user, proceed without authentication
    req.user = undefined;
    next();
    return;
  }
  
  // Simulate authenticated user with proper typing
  (req as AuthenticatedRequest).user = DEV_USER;
  
  // Mock passport methods with correct types
  (req as any).isAuthenticated = () => !mockLoggedOut;
  (req as any).login = (user: any, options?: any, callback?: (err: any) => void) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    mockLoggedOut = false;
    req.user = user;
    if (callback) callback(null);
  };
  (req as any).logout = (options?: any, callback?: (err: any) => void) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    mockLoggedOut = true;
    req.user = undefined;
    if (callback) callback(null);
  };

  console.log("🔓 Mock authentication: User logged in as", DEV_USER.claims.email);
  next();
};

/**
 * Mock authenticate token middleware for development
 */
export const mockAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user has been logged out
    if (mockLoggedOut) {
      console.log("🔓 Mock token auth: User is logged out");
      // Don't set user, proceed without authentication
      req.user = undefined;
      next();
      return;
    }
    
    // Ensure user is set (should be from mockIsAuthenticated)
    if (!req.user) {
      (req as AuthenticatedRequest).user = DEV_USER;
    }

    // Transform to expected format
    const userClaims = (req.user as any).claims || (req.user as any);
    (req as AuthenticatedRequest).user = {
      id: userClaims.sub || "dev-user-123",
      email: userClaims.email || "dev@example.com",
      firstName: userClaims.first_name || "Development",
      lastName: userClaims.last_name || "User",
      profileImageUrl: null,
      claims: {
        sub: userClaims.sub || "dev-user-123",
        email: userClaims.email || "dev@example.com",
        name: userClaims.name || 
              (userClaims.first_name && userClaims.last_name 
                ? `${userClaims.first_name} ${userClaims.last_name}`
                : "Development User")
      },
      isAdmin: (req.user as any)?.isAdmin || true // Preserve admin status for development
    };

    console.log("🔓 Mock token auth: Validated user", (req as AuthenticatedRequest).user.claims.email);
    next();
  } catch (error) {
    console.error("Mock authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Mock authentication failed"
    });
  }
};

/**
 * Mock admin middleware for development - always allows access
 */
export async function mockRequireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure mock user is set
    if (!req.user) {
      (req as AuthenticatedRequest).user = DEV_USER;
    }

    console.log("🔓 Mock admin auth: Admin access granted to dev user");
    next();
  } catch (error) {
    console.error("Mock admin authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Mock admin authentication failed"
    });
  }
};

/**
 * Development auth setup that provides mock login/logout endpoints
 */
export function setupMockAuth(app: any) {
  console.log("🔧 Setting up mock authentication for local development");
  
  // Ensure dev user exists in database
  ensureDevUserExists();
  
  // Mock login endpoint
  app.get("/api/login", (req: Request, res: Response) => {
    mockLoggedOut = false; // Reset logout state
    req.user = DEV_USER as any;
    console.log("🔓 Mock login: User logged in");
    res.redirect("/app");
  });

  // Mock logout endpoint  
  app.get("/api/logout", (req: Request, res: Response) => {
    mockLoggedOut = true; // Set logout state
    req.user = undefined;
    console.log("🔓 Mock logout: User logged out");
    res.redirect("/");
  });
  
  // Mock logout POST endpoint (for compatibility with frontend)
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    mockLoggedOut = true; // Set logout state
    req.user = undefined;
    console.log("🔓 Mock logout (POST): User logged out");
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });

  // Mock callback endpoint
  app.get("/api/callback", (req: Request, res: Response) => {
    mockLoggedOut = false; // Reset logout state
    req.user = DEV_USER as any;
    console.log("🔓 Mock callback: User authenticated");
    res.redirect("/app");
  });
}

/**
 * Ensure the development user exists in the database
 */
async function ensureDevUserExists() {
  try {
    
    await storage.upsertUser({
      id: DEV_USER.claims.sub,
      email: DEV_USER.claims.email,
      firstName: DEV_USER.claims.first_name,
      lastName: DEV_USER.claims.last_name,
      profileImageUrl: null,
      subscriptionTier: 'lifetime',
      lifetimeAccess: true,
      purchaseDate: new Date(),
      dailyViews: 0,
      lastViewReset: new Date()
    });
    
    console.log("🔓 Development user ensured in database:", DEV_USER.claims.email);
  } catch (error) {
    console.warn("⚠️  Could not ensure dev user exists:", error);
  }
}

/**
 * Set mock logout state - for use by logout endpoints
 */
export function setMockLogoutState(loggedOut: boolean) {
  mockLoggedOut = loggedOut;
  console.log(`🔓 Mock auth state changed: ${loggedOut ? 'LOGGED OUT' : 'LOGGED IN'}`);
}
