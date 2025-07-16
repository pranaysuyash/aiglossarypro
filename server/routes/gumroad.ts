import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../middleware/firebaseAuth';
import { UserService } from '../services/userService';
import { ENVIRONMENT_CONSTANTS, HTTP_STATUS, PRICING_CONSTANTS } from '../utils/constants';
import { sendSystemNotificationEmail } from '../utils/email';
import { log } from '../utils/logger';
import { captureAPIError } from '../utils/sentry';

// Gumroad webhook verification
function verifyGumroadWebhook(body: string, signature: string): boolean {
  if (!process.env.GUMROAD_WEBHOOK_SECRET) {
    log.warn('GUMROAD_WEBHOOK_SECRET not set - allowing webhook in development');
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.GUMROAD_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Gumroad integration routes for purchase handling
 */
export function registerGumroadRoutes(app: Express): void {
  // Gumroad webhook endpoint
  app.post('/api/gumroad/webhook', async (req: Request, res: Response) => {
    try {
      const signature = (req.headers['x-gumroad-signature'] as string) || '';
      const body = JSON.stringify(req.body);

      log.info('Gumroad webhook received', {
        hasSignature: !!signature,
        bodySize: body.length,
        headers: Object.keys(req.headers),
      });

      if (!verifyGumroadWebhook(body, signature)) {
        log.warn('Invalid Gumroad webhook signature', {
          signature: `${signature?.substring(0, 10)}...`,
          expectedLength: process.env.GUMROAD_WEBHOOK_SECRET?.length,
        });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid signature' });
      }

      const data = req.body;
      log.info('Processing Gumroad webhook data', {
        saleExists: !!data.sale,
        email: data.sale?.email ? 'provided' : 'missing',
        orderId: data.sale?.order_id || 'missing',
      });

      // Handle successful purchase
      if (data.sale?.email) {
        const { email, order_id, amount_cents, currency, purchaser_id, product_name } = data.sale;

        log.info('Processing purchase', {
          email: `${email.substring(0, 3)}***`,
          orderId: order_id,
          amount: amount_cents,
          currency,
          purchaserId: purchaser_id,
          productName: product_name,
        });

        // Use UserService to grant lifetime access
        const result = await UserService.grantLifetimeAccess({
          email,
          orderId: order_id,
          amount: amount_cents,
          currency,
          purchaseData: {
            ...data.sale,
            webhook_processed_at: new Date().toISOString(),
            source: 'gumroad_webhook',
          },
        });

        log.info('Successfully processed Gumroad purchase', {
          email: `${email.substring(0, 3)}***`,
          orderId: order_id,
          userId: result.userId,
          wasExistingUser: result.wasExistingUser,
          productName: product_name,
        });

        // Send premium welcome email
        try {
          const { sendPremiumWelcomeEmail } = await import('../utils/email');
          await sendPremiumWelcomeEmail({
            userName: result.userName,
            userEmail: email,
            purchaseDate: new Date().toLocaleDateString(),
            orderId: order_id,
            purchaseAmount: `${currency} ${amount_cents / 100}`,
          });
          log.info('Premium welcome email sent', { email: `${email.substring(0, 3)}***` });
        } catch (emailError) {
          // Don't fail the purchase if email fails
          log.error('Failed to send premium welcome email', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            email: `${email.substring(0, 3)}***`,
          });
        }

        // Send success response with additional data for potential client-side handling
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: 'Purchase processed successfully',
          data: {
            userId: result.userId,
            email: result.email,
            wasExistingUser: result.wasExistingUser,
            orderId: order_id,
            processedAt: new Date().toISOString(),
          },
        });
        return;
      } 
        log.warn('Invalid webhook data - missing sale or email', {
          hasSale: !!data.sale,
          hasEmail: !!data.sale?.email,
        });
      

      // If we get here, the webhook was valid but didn't contain sale data
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Webhook received but no sale data processed',
      });
    } catch (error) {
      log.error('Gumroad webhook processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/webhook',
        body: req.body,
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Webhook processing failed',
        message:
          'An error occurred while processing the purchase. Please contact support if the issue persists.',
        timestamp: new Date().toISOString(),
      });
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
        email: `${email.substring(0, 3)}***`,
      });

      // Use UserService to check access status
      const accessStatus = await UserService.getUserAccessStatus(email);

      if (!accessStatus.hasAccess) {
        log.info('No purchase found for email', {
          email: `${email.substring(0, 3)}***`,
        });

        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ error: 'No purchase found for this email' });
      }

      log.info('Purchase verification successful', {
        email: `${email.substring(0, 3)}***`,
      });

      res.json({
        success: true,
        message: 'Purchase verified',
        user: accessStatus.user,
      });
    } catch (error) {
      log.error('Purchase verification error', {
        email: `${req.body.email?.substring(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      captureAPIError(error as Error, {
        method: 'POST',
        path: '/api/gumroad/verify-purchase',
        body: { email: 'filtered' },
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Verification failed' });
    }
  });

  // Admin endpoint to manually grant lifetime access
  app.post(
    '/api/gumroad/grant-access',
    [authenticateFirebaseToken, requireFirebaseAdmin],
    async (req: Request, res: Response) => {
      try {
        const { email, orderId } = req.body;

        if (!email) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Email required' });
        }

        const grantedBy = (req.user as any)?.id || 'admin';

        log.info('Manual access grant requested', {
          email: `${email.substring(0, 3)}***`,
          orderId,
          requestedBy: grantedBy,
        });

        // Use UserService to grant lifetime access
        const result = await UserService.grantLifetimeAccess({
          email,
          orderId,
          amount: PRICING_CONSTANTS.LIFETIME_PRICE_CENTS, // $249.00 in cents
          currency: PRICING_CONSTANTS.CURRENCY_USD,
          grantedBy,
        });

        res.json({
          success: true,
          message: 'Lifetime access granted successfully',
          user: {
            id: result.userId,
            email: result.email,
            lifetimeAccess: result.lifetimeAccess,
          },
        });
      } catch (error) {
        log.error('Manual access grant error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        captureAPIError(error as Error, {
          method: 'POST',
          path: '/api/gumroad/grant-access',
          body: { email: 'filtered' },
        });

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to grant access' });
      }
    }
  );

  // TEST/DUMMY Purchase endpoint for development mode
  app.post(
    '/api/gumroad/test-purchase',
    [authenticateFirebaseToken, requireFirebaseAdmin],
    async (req: Request, res: Response) => {
      try {
        // Only allow in development mode
        if (process.env.NODE_ENV !== ENVIRONMENT_CONSTANTS.NODE_ENV_DEVELOPMENT) {
          return res
            .status(HTTP_STATUS.FORBIDDEN)
            .json({ error: 'Test purchases only available in development mode' });
        }

        const { email } = req.body;

        if (!email) {
          return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ error: 'Email required for test purchase' });
        }

        log.info('Test purchase initiated', {
          email: `${email.substring(0, 3)}***`,
          environment: 'development',
        });

        // Generate a fake order ID for testing
        const testOrderId = UserService.generateTestOrderId();

        // Use UserService to grant lifetime access for test
        const result = await UserService.grantLifetimeAccess({
          email,
          orderId: testOrderId,
          amount: PRICING_CONSTANTS.LIFETIME_PRICE_CENTS, // $249.00 in cents
          currency: PRICING_CONSTANTS.CURRENCY_USD,
          purchaseData: { email },
          isTestPurchase: true,
        });

        log.info('Test purchase completed successfully', {
          email: `${email.substring(0, 3)}***`,
          orderId: testOrderId,
          userId: result.userId,
          wasExistingUser: result.wasExistingUser,
        });

        res.json({
          success: true,
          message: `Test purchase completed successfully! You now have lifetime access for ${PRICING_CONSTANTS.LIFETIME_PRICE_DISPLAY}.`,
          user: {
            email: result.email,
            subscriptionTier: 'lifetime',
            lifetimeAccess: true,
            purchaseDate: new Date().toISOString(),
          },
          testData: {
            orderId: testOrderId,
            amount: PRICING_CONSTANTS.LIFETIME_PRICE_DISPLAY,
            environment: ENVIRONMENT_CONSTANTS.NODE_ENV_DEVELOPMENT,
          },
        });
      } catch (error) {
        log.error('Test purchase error', {
          email: `${req.body.email?.substring(0, 3)}***`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        captureAPIError(error as Error, {
          method: 'POST',
          path: '/api/gumroad/test-purchase',
          body: { email: 'filtered' },
        });

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Test purchase failed' });
      }
    }
  );
}
