import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { optimizedStorage as storage } from "../optimizedStorage";
import { users, purchases } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { log } from '../utils/logger';
import { captureAPIError } from '../utils/sentry';
import { isAuthenticated } from '../replitAuth';
import { requireAdmin, authenticateToken } from '../middleware/adminAuth';
import { mockIsAuthenticated, mockAuthenticateToken } from '../middleware/dev/mockAuth';
import { features } from '../config';

// Gumroad webhook verification
function verifyGumroadWebhook(body: string, signature: string): boolean {
  if (!process.env.GUMROAD_WEBHOOK_SECRET) {
    console.warn('GUMROAD_WEBHOOK_SECRET not set - allowing webhook in development');
    return true; // Allow in development
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.GUMROAD_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Gumroad integration routes for purchase handling
 */
export function registerGumroadRoutes(app: Express): void {
  
  // Gumroad webhook endpoint
  app.post('/api/gumroad/webhook', async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-gumroad-signature'] as string || '';
      const body = JSON.stringify(req.body);
      
      log.info('Gumroad webhook received', {
        hasSignature: !!signature,
        bodySize: body.length,
        headers: Object.keys(req.headers)
      });
      
      if (!verifyGumroadWebhook(body, signature)) {
        log.warn('Invalid Gumroad webhook signature', {
          signature: signature?.substring(0, 10) + '...',
          expectedLength: process.env.GUMROAD_WEBHOOK_SECRET?.length
        });
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const data = req.body;
      log.info('Processing Gumroad webhook data', {
        saleExists: !!data.sale,
        email: data.sale?.email ? 'provided' : 'missing',
        orderId: data.sale?.order_id || 'missing'
      });
      
      // Handle successful purchase
      if (data.sale && data.sale.email) {
        const { email, order_id, amount_cents, currency } = data.sale;
        
        log.info('Processing purchase', {
          email: email.substring(0, 3) + '***',
          orderId: order_id,
          amount: amount_cents,
          currency
        });
        
        // Find user by email
        let existingUser;
        try {
          existingUser = await storage.getUserByEmail(email);
        } catch (error) {
          log.warn('Error finding user by email', {
            email: email.substring(0, 3) + '***',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          existingUser = null;
        }
        
        let userId: string;
        
        if (!existingUser) {
          // Create new user with lifetime access
          const newUserId = crypto.randomUUID();
          await storage.upsertUser({
            id: newUserId,
            email: email,
            subscriptionTier: 'lifetime',
            lifetimeAccess: true,
            purchaseDate: new Date(),
            dailyViews: 0,
            lastViewReset: new Date(),
          });
          userId = newUserId;
          
          log.info('Created new user with lifetime access', {
            userId: newUserId,
            email: email.substring(0, 3) + '***'
          });
        } else {
          // Update existing user to lifetime access
          await storage.updateUser(existingUser.id, {
            subscriptionTier: 'lifetime',
            lifetimeAccess: true,
            purchaseDate: new Date(),
          });
          userId = existingUser.id;
          
          log.info('Updated existing user to lifetime access', {
            userId: existingUser.id,
            email: email.substring(0, 3) + '***'
          });
        }

        // Record purchase in database
        try {
          await storage.createPurchase({
            userId: userId,
            gumroadOrderId: order_id,
            amount: amount_cents,
            currency: currency,
            status: 'completed',
            purchaseData: data.sale,
          });
          
          log.info('Purchase recorded successfully', {
            userId,
            orderId: order_id,
            amount: amount_cents
          });
        } catch (error) {
          log.error('Failed to record purchase', {
            userId,
            orderId: order_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          captureAPIError(error as Error, {
            method: 'POST',
            path: '/api/gumroad/webhook',
            userId,
            body: { orderId: order_id }
          });
        }

        log.info('Successfully processed Gumroad purchase', {
          email: email.substring(0, 3) + '***',
          orderId: order_id,
          userId
        });
      } else {
        log.warn('Invalid webhook data - missing sale or email', {
          hasSale: !!data.sale,
          hasEmail: !!data.sale?.email
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      log.error('Gumroad webhook processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/webhook',
        body: req.body
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
  
  // Purchase verification endpoint
  app.post('/api/gumroad/verify-purchase', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      log.info('Purchase verification requested', {
        email: email.substring(0, 3) + '***'
      });

      // Check if user has lifetime access
      const user = await storage.getUserByEmail(email);

      if (!user || !user.lifetimeAccess) {
        log.info('No purchase found for email', {
          email: email.substring(0, 3) + '***',
          userExists: !!user,
          hasLifetimeAccess: user?.lifetimeAccess || false
        });
        
        return res.status(404).json({ error: 'No purchase found for this email' });
      }

      log.info('Purchase verification successful', {
        email: email.substring(0, 3) + '***',
        userId: user.id
      });

      res.json({ 
        success: true, 
        message: 'Purchase verified',
        user: {
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          lifetimeAccess: user.lifetimeAccess,
          purchaseDate: user.purchaseDate,
        }
      });
    } catch (error) {
      log.error('Purchase verification error', {
        email: req.body.email?.substring(0, 3) + '***',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/verify-purchase',
        body: { email: 'filtered' }
      });
      
      res.status(500).json({ error: 'Verification failed' });
    }
  });
  
  // Admin endpoint to manually grant lifetime access
  app.post('/api/gumroad/grant-access', 
    features.useReplit ? [isAuthenticated, requireAdmin] : [mockAuthenticateToken, requireAdmin],
    async (req: Request, res: Response) => {
    try {
      const { email, orderId } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      log.info('Manual access grant requested', {
        email: email.substring(0, 3) + '***',
        orderId,
        requestedBy: (req.user as any)?.id || 'unknown'
      });

      // Find or create user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        const newUserId = crypto.randomUUID();
        await storage.upsertUser({
          id: newUserId,
          email: email,
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date(),
          dailyViews: 0,
          lastViewReset: new Date(),
        });
        user = { id: newUserId, email, lifetimeAccess: true };
        
        log.info('Created new user with manual lifetime access', {
          userId: newUserId,
          email: email.substring(0, 3) + '***'
        });
      } else {
        // Update existing user
        await storage.updateUser(user.id, {
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date(),
        });
        
        log.info('Updated existing user with manual lifetime access', {
          userId: user.id,
          email: email.substring(0, 3) + '***'
        });
      }

      // Record manual purchase if orderId provided
      if (orderId) {
        try {
          await storage.createPurchase({
            userId: user.id,
            gumroadOrderId: orderId,
            amount: 24900, // $249.00 in cents
            currency: 'USD',
            status: 'completed',
            purchaseData: {
              manual_grant: true,
              granted_by: (req.user as any)?.id || 'admin',
              granted_at: new Date().toISOString()
            },
          });
        } catch (error) {
          log.warn('Failed to record manual purchase', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({ 
        success: true, 
        message: 'Lifetime access granted successfully',
        user: {
          id: user.id,
          email: user.email,
          lifetimeAccess: true
        }
      });
    } catch (error) {
      log.error('Manual access grant error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/grant-access',
        body: { email: 'filtered' }
      });
      
      res.status(500).json({ error: 'Failed to grant access' });
    }
  });

  // TEST/DUMMY Purchase endpoint for development mode
  app.post('/api/gumroad/test-purchase', 
    features.useReplit ? [isAuthenticated, requireAdmin] : [mockAuthenticateToken, requireAdmin],
    async (req: Request, res: Response) => {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Test purchases only available in development mode' });
      }

      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email required for test purchase' });
      }

      log.info('Test purchase initiated', {
        email: email.substring(0, 3) + '***',
        environment: 'development'
      });

      // Generate a fake order ID for testing
      const testOrderId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Find or create user
      let user = await storage.getUserByEmail(email);
      let userId: string;
      
      if (!user) {
        // Create new user with lifetime access
        const newUserId = crypto.randomUUID();
        await storage.upsertUser({
          id: newUserId,
          email: email,
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date(),
          dailyViews: 0,
          lastViewReset: new Date(),
        });
        userId = newUserId;
        
        log.info('Created new user with test lifetime access', {
          userId: newUserId,
          email: email.substring(0, 3) + '***'
        });
      } else {
        // Update existing user to lifetime access
        await storage.updateUser(user.id, {
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date(),
        });
        userId = user.id;
        
        log.info('Updated existing user with test lifetime access', {
          userId: user.id,
          email: email.substring(0, 3) + '***'
        });
      }

      // Record test purchase in database
      try {
        await storage.createPurchase({
          userId: userId,
          gumroadOrderId: testOrderId,
          amount: 24900, // $249.00 in cents
          currency: 'USD',
          status: 'completed',
          purchaseData: {
            test_purchase: true,
            environment: 'development',
            email: email,
            amount_cents: 24900,
            currency: 'USD',
            order_id: testOrderId,
            created_at: new Date().toISOString()
          },
        });
        
        log.info('Test purchase recorded successfully', {
          userId,
          orderId: testOrderId,
          amount: 12900
        });
      } catch (error) {
        log.error('Failed to record test purchase', {
          userId,
          orderId: testOrderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      log.info('Test purchase completed successfully', {
        email: email.substring(0, 3) + '***',
        orderId: testOrderId,
        userId
      });

      res.json({ 
        success: true, 
        message: 'Test purchase completed successfully! You now have lifetime access for $249.00.',
        user: {
          email: email,
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date().toISOString(),
        },
        testData: {
          orderId: testOrderId,
          amount: '$249.00',
          environment: 'development'
        }
      });
    } catch (error) {
      log.error('Test purchase error', {
        email: req.body.email?.substring(0, 3) + '***',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/test-purchase',
        body: { email: 'filtered' }
      });
      
      res.status(500).json({ error: 'Test purchase failed' });
    }
  });
}
