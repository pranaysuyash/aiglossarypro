import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../shared/types";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Authentication token middleware - validates user is authenticated
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if user is authenticated via passport session
    if (!req.isAuthenticated?.() || !req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    res.status(500).json({
      success: false,
      message: "Authentication verification failed"
    });
  }
}

/**
 * Middleware to check if the authenticated user has admin privileges
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    // In development mode with mock auth, allow admin access for dev user
    if (req.user.id === "dev-user-123") {
      console.log("🔓 Development mode: Granting admin access to dev user");
      next();
      return;
    }

    // Check if user has admin role
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user.length || !user[0].isAdmin) {
      res.status(403).json({
        success: false,
        message: "Admin privileges required"
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify admin privileges"
    });
  }
}

/**
 * Check if a user is an admin (for use in route handlers)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 && user[0].isAdmin === true;
  } catch (error) {
    console.error("Error checking if user is admin:", error);
    return false;
  }
} 