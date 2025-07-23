import type { Express, Request, Response } from 'express';
import type { ApiResponse, IUser } from '../../shared/types';
import { features } from '../config';
import { authenticateToken } from '../middleware/adminAuth';
import { getUserInfo, multiAuthMiddleware } from '../middleware/multiAuth';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log as logger } from '../utils/logger';
import { validate } from '../middleware/validationMiddleware';
import { userSchemas } from '../schemas/apiValidation';

/**
 * Authentication and user management routes
 */
export function registerAuthRoutes(app: Express): void {
  // Use multiAuthMiddleware for all authentication needs
  const authMiddleware = multiAuthMiddleware;
  const tokenMiddleware = authenticateToken;

  /**
   * @openapi
   * /api/auth/user:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get current authenticated user
   *     description: Retrieves the current authenticated user's information including profile data and subscription details
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "user123"
   *                     email:
   *                       type: string
   *                       example: "user@example.com"
   *                     name:
   *                       type: string
   *                       example: "John Doe"
   *                     avatar:
   *                       type: string
   *                       nullable: true
   *                       example: "https://example.com/avatar.jpg"
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2023-01-01T00:00:00.000Z"
   *                     isAdmin:
   *                       type: boolean
   *                       example: false
   *                     lifetimeAccess:
   *                       type: boolean
   *                       example: false
   *                     subscriptionTier:
   *                       type: string
   *                       enum: [free, premium, enterprise]
   *                       example: "free"
   *                     purchaseDate:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                       example: "2023-01-01T00:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(
    '/api/auth/user',
    authMiddleware,
    tokenMiddleware,
    async (req: Request, res: Response) => {
      try {
        // Check if user is logged out (for development mock auth)
        if (process.env.NODE_ENV === 'development' && !req.user) {
          return res.status(401).json({
            success: false,
            message: 'User not authenticated',
          });
        }

        const userInfo = getUserInfo(req);
        if (!userInfo) {
          return res.status(401).json({
            success: false,
            message: 'User not authenticated',
          });
        }

        const dbUser = await storage.getUser(userInfo.id);

        // Transform database user to IUser format
        const user: IUser | undefined = dbUser
          ? {
              id: dbUser.id,
              email: dbUser.email || userInfo.email,
              name:
                dbUser.firstName && dbUser.lastName
                  ? `${dbUser.firstName} ${dbUser.lastName}`
                  : userInfo.name || 'Unknown User',
              avatar: dbUser.profileImageUrl || undefined,
              createdAt: dbUser.createdAt || new Date(),
              isAdmin: dbUser.isAdmin || false,
              lifetimeAccess: dbUser.lifetimeAccess || false,
              subscriptionTier: dbUser.subscriptionTier || 'free',
              purchaseDate: dbUser.purchaseDate || undefined,
            }
          : undefined;

        const response: ApiResponse<IUser> = {
          success: true,
          data: user,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching user', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/settings:
   *   get:
   *     tags:
   *       - User Settings
   *     summary: Get user settings
   *     description: Retrieves the current user's application settings and preferences
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User settings retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   description: User settings object with various preference keys
   *                   additionalProperties: true
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/settings', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const settings = await storage.getUserSettings(userInfo.id);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Error fetching user settings', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user settings',
      });
    }
  });

  /**
   * @openapi
   * /api/settings:
   *   put:
   *     tags:
   *       - User Settings
   *     summary: Update user settings
   *     description: Updates the current user's application settings and preferences
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: User settings object with various preference keys
   *             additionalProperties: true
   *             example:
   *               theme: "dark"
   *               notifications: true
   *               language: "en"
   *     responses:
   *       200:
   *         description: User settings updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Settings updated successfully"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.put(
    '/api/settings',
    authMiddleware,
    tokenMiddleware,
    validate.body(userSchemas.updateSettings, { 
      sanitizeHtml: true,
      logErrors: true 
    }),
    async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const settings = req.body;

      await storage.updateUserSettings(userInfo.id, settings);

      res.json({
        success: true,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      logger.error('Error updating user settings', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update user settings',
      });
    }
  });

  /**
   * @openapi
   * /api/user/export:
   *   get:
   *     tags:
   *       - User Data
   *     summary: Export user data
   *     description: Exports all user data in JSON format for GDPR compliance and data portability
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User data exported successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Complete user data export including profile, settings, and activity
   *               additionalProperties: true
   *         headers:
   *           Content-Disposition:
   *             description: Attachment filename for download
   *             schema:
   *               type: string
   *               example: 'attachment; filename="user-data-user123.json"'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/user/export', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }
      const userData = await storage.exportUserData(userInfo.id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userInfo.id}.json"`);
      res.json(userData);
    } catch (error) {
      logger.error('Error exporting user data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to export user data',
      });
    }
  });

  /**
   * @openapi
   * /api/user/data:
   *   delete:
   *     tags:
   *       - User Data
   *     summary: Delete user data
   *     description: Permanently deletes all user data for GDPR compliance (right to be forgotten)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User data deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "User data deleted successfully"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.delete('/api/user/data', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }
      await storage.deleteUserData(userInfo.id);

      res.json({
        success: true,
        message: 'User data deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting user data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete user data',
      });
    }
  });
}
