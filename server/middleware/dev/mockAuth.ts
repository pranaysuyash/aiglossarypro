import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/types";
import { enhancedStorage as storage } from "../../enhancedStorage";

/**
 * Mock authentication middleware for local development
 * This bypasses Replit authentication and provides a test user
 */

// Test user for local development
const DEV_USER = {
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
  // Simulate authenticated user with proper typing
  (req as AuthenticatedRequest).user = DEV_USER;
  
  // Mock passport methods with correct types
  (req as any).isAuthenticated = () => true;
  (req as any).login = (user: any, options?: any, callback?: (err: any) => void) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    req.user = user;
    if (callback) callback(null);
  };
  (req as any).logout = (options?: any, callback?: (err: any) => void) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
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
    // Ensure user is set (should be from mockIsAuthenticated)
    if (!req.user) {
      (req as AuthenticatedRequest).user = DEV_USER;
    }

    // Transform to expected format
    const userClaims = (req.user as any).claims || (req.user as any);
    req.user = {
      claims: {
        sub: userClaims.sub || "dev-user-123",
        email: userClaims.email || "dev@example.com",
        name: userClaims.name || 
              (userClaims.first_name && userClaims.last_name 
                ? `${userClaims.first_name} ${userClaims.last_name}`
                : "Development User")
      },
      isAdmin: (req.user as any).isAdmin || true // Preserve admin status for development
    };

    console.log("🔓 Mock token auth: Validated user", req.user.claims.email);
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
    req.user = DEV_USER as any;
    console.log("🔓 Mock login: User logged in");
    res.redirect("/");
  });

  // Mock logout endpoint  
  app.get("/api/logout", (req: Request, res: Response) => {
    req.user = undefined;
    console.log("🔓 Mock logout: User logged out");
    res.redirect("/");
  });

  // Mock callback endpoint
  app.get("/api/callback", (req: Request, res: Response) => {
    req.user = DEV_USER as any;
    console.log("🔓 Mock callback: User authenticated");
    res.redirect("/");
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
