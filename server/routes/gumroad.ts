import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { optimizedStorage as storage } from "../optimizedStorage";
import { log } from '../utils/logger';
import { captureAPIError } from '../utils/sentry';
import { isAuthenticated } from '../replitAuth';
import { requireAdmin, authenticateToken } from '../middleware/adminAuth';
import { mockIsAuthenticated, mockAuthenticateToken } from '../middleware/dev/mockAuth';
import { features } from '../config';
import { UserService } from '../services/userService';

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
        
        // Use UserService to grant lifetime access
        const result = await UserService.grantLifetimeAccess({
          email,
          orderId: order_id,
          amount: amount_cents,
          currency,
          purchaseData: data.sale
        });

        log.info('Successfully processed Gumroad purchase', {
          email: email.substring(0, 3) + '***',
          orderId: order_id,
          userId: result.userId,
          wasExistingUser: result.wasExistingUser
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

      // Use UserService to check access status
      const accessStatus = await UserService.getUserAccessStatus(email);

      if (!accessStatus.hasAccess) {
        log.info('No purchase found for email', {
          email: email.substring(0, 3) + '***'
        });
        
        return res.status(404).json({ error: 'No purchase found for this email' });
      }

      log.info('Purchase verification successful', {
        email: email.substring(0, 3) + '***'
      });

      res.json({ 
        success: true, 
        message: 'Purchase verified',
        user: accessStatus.user
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

      const grantedBy = (req.user as any)?.id || 'admin';
      
      log.info('Manual access grant requested', {
        email: email.substring(0, 3) + '***',
        orderId,
        requestedBy: grantedBy
      });

      // Use UserService to grant lifetime access
      const result = await UserService.grantLifetimeAccess({
        email,
        orderId,
        amount: 24900, // $249.00 in cents
        currency: 'USD',
        grantedBy
      });

      res.json({ 
        success: true, 
        message: 'Lifetime access granted successfully',
        user: {
          id: result.userId,
          email: result.email,
          lifetimeAccess: result.lifetimeAccess
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
      const testOrderId = UserService.generateTestOrderId();

      // Use UserService to grant lifetime access for test
      const result = await UserService.grantLifetimeAccess({
        email,
        orderId: testOrderId,
        amount: 24900, // $249.00 in cents
        currency: 'USD',
        purchaseData: { email },
        isTestPurchase: true
      });

      log.info('Test purchase completed successfully', {
        email: email.substring(0, 3) + '***',
        orderId: testOrderId,
        userId: result.userId,
        wasExistingUser: result.wasExistingUser
      });

      res.json({ 
        success: true, 
        message: 'Test purchase completed successfully! You now have lifetime access for $249.00.',
        user: {
          email: result.email,
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
