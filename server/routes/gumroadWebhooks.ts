import { Router, Request, Response } from 'express';
import { z } from 'zod';
import GumroadService from '../services/gumroadService';
import { RefundService } from '../services/customerService';
import { ReferralService } from '../services/referralService';
import { validateRequest } from '../middleware/validation';
import { log as logger } from '../utils/logger';
import { db } from '../db';
import { purchases, supportTickets } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Gumroad sale webhook schema
const gumroadSaleSchema = z.object({
  sale_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  product_permalink: z.string(),
  short_product_id: z.string(),
  email: z.string().email(),
  price: z.number(),
  gumroad_fee: z.number(),
  currency: z.string(),
  quantity: z.number(),
  discover_fee_charged: z.boolean(),
  can_contact: z.boolean(),
  referrer: z.string().optional(),
  order_number: z.number(),
  sale_timestamp: z.string(),
  url_params: z.record(z.any()).optional(),
  custom_fields: z.record(z.any()).optional(),
  ip_country: z.string(),
  recurrence: z.string().optional(),
  is_gift_receiver_purchase: z.boolean(),
  refunded: z.boolean(),
  disputed: z.boolean(),
  dispute_won: z.boolean(),
  test: z.boolean(),
  affiliates: z.array(z.any()).optional(),
  variants_and_quantity: z.array(z.any()).optional(),
  license_key: z.string().optional(),
  variants: z.record(z.any()).optional(),
  full_name: z.string(),
  purchaser_id: z.string(),
});

// Gumroad refund webhook schema
const gumroadRefundSchema = z.object({
  refund_id: z.string(),
  sale_id: z.string(),
  amount_refunded_in_cents: z.number(),
  refund_date: z.string(),
  refund_reason: z.string().optional(),
});

// Middleware to validate webhook signature
const validateGumroadWebhook = (req: any, res: any, next: any) => {
  try {
    const signature = req.headers['x-gumroad-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature) {
      logger.warn('Gumroad webhook missing signature header');
      return res.status(401).json({
        success: false,
        error: 'Missing signature header',
      });
    }

    const isValid = GumroadService.validateWebhookSignature(rawBody, signature);

    if (!isValid) {
      logger.warn('Invalid Gumroad webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating Gumroad webhook signature:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      success: false,
      error: 'Signature validation failed',
    });
  }
};

// Sale webhook endpoint
router.post('/sale', 
  validateGumroadWebhook,
  validateRequest({ body: gumroadSaleSchema }),
  async (req: Request, res: Response) => {
    try {
      const saleData = req.body;

      logger.info('Received Gumroad sale webhook:', {
        saleId: saleData.sale_id,
        email: saleData.email,
        amount: saleData.price,
        productId: saleData.product_id,
        isTest: saleData.test,
      });

      // Skip test purchases in production
      if (saleData.test && process.env.NODE_ENV === 'production') {
        logger.info('Skipping test purchase in production');
        return res.status(200).json({
          success: true,
          message: 'Test purchase skipped',
        });
      }

      await GumroadService.processSaleWebhook(saleData);

      // Process referral payout if applicable
      try {
        await ReferralService.processReferralPayout(saleData);
        logger.info('Referral processing completed for sale', {
          saleId: saleData.sale_id,
        });
      } catch (referralError) {
        logger.error('Error processing referral payout (sale still successful)', {
          saleId: saleData.sale_id,
          error: referralError instanceof Error ? referralError.message : String(referralError),
        });
        // Don't fail the webhook if referral processing fails
      }

      res.status(200).json({
        success: true,
        message: 'Sale processed successfully',
      });
    } catch (error) {
      logger.error('Error processing Gumroad sale webhook:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process sale',
      });
    }
  }
);

// Refund webhook endpoint
router.post('/refund',
  validateGumroadWebhook,
  validateRequest({ body: gumroadRefundSchema }),
  async (req: Request, res: Response) => {
    try {
      const refundData = req.body;

      logger.info('Received Gumroad refund webhook:', {
        refundId: refundData.refund_id,
        saleId: refundData.sale_id,
        amount: refundData.amount_refunded_in_cents,
      });

      await GumroadService.processRefundWebhook(refundData);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
      });
    } catch (error) {
      logger.error('Error processing Gumroad refund webhook:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process refund',
      });
    }
  }
);

// Dispute webhook endpoint
router.post('/dispute',
  validateGumroadWebhook,
  async (req: Request, res: Response) => {
    try {
      const disputeData = req.body;

      logger.info('Received Gumroad dispute webhook:', {
        saleId: disputeData.sale_id,
        disputeReason: disputeData.dispute_reason,
        disputeWon: disputeData.dispute_won,
      });

      // Find the purchase record
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.gumroadOrderId, disputeData.sale_id))
        .limit(1);

      if (purchase) {
        // Update purchase status
        await db
          .update(purchases)
          .set({ 
            status: disputeData.dispute_won ? 'completed' : 'disputed'
          })
          .where(eq(purchases.id, purchase.id));

        // Create a support ticket for disputes
        if (!disputeData.dispute_won) {
          const { SupportTicketService } = await import('../services/customerService');
          
          await SupportTicketService.createTicket({
            customerEmail: purchase.purchaseData?.email || 'unknown@example.com',
            customerName: purchase.purchaseData?.fullName || 'Unknown Customer',
            subject: `Payment Dispute - Order ${disputeData.sale_id}`,
            description: `A payment dispute has been filed for this order.\n\nDispute Reason: ${disputeData.dispute_reason}\nOrder ID: ${disputeData.sale_id}\n\nThis ticket was automatically created to track the dispute resolution.`,
            type: 'billing',
            priority: 'high',
            gumroadOrderId: disputeData.sale_id,
            purchaseId: purchase.id,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Dispute processed successfully',
      });
    } catch (error) {
      logger.error('Error processing Gumroad dispute webhook:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process dispute',
      });
    }
  }
);

// Cancellation webhook endpoint (for subscription products)
router.post('/cancellation',
  validateGumroadWebhook,
  async (req: Request, res: Response) => {
    try {
      const cancellationData = req.body;

      logger.info('Received Gumroad cancellation webhook:', {
        saleId: cancellationData.sale_id,
        productId: cancellationData.product_id,
      });

      // Find the purchase record
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.gumroadOrderId, cancellationData.sale_id))
        .limit(1);

      if (purchase) {
        // Update purchase status
        await db
          .update(purchases)
          .set({ status: 'cancelled' })
          .where(eq(purchases.id, purchase.id));

        // Update user's subscription status
        if (purchase.userId) {
          const { users } = await import('../../shared/schema');
          await db
            .update(users)
            .set({
              subscriptionTier: 'free',
              lifetimeAccess: false,
            })
            .where(eq(users.id, purchase.userId));
        }

        // Create a support ticket for cancellation follow-up
        const { SupportTicketService } = await import('../services/customerService');
        
        await SupportTicketService.createTicket({
          customerEmail: purchase.purchaseData?.email || 'unknown@example.com',
          customerName: purchase.purchaseData?.fullName || 'Unknown Customer',
          subject: `Subscription Cancelled - Order ${cancellationData.sale_id}`,
          description: `Your subscription has been cancelled.\n\nOrder ID: ${cancellationData.sale_id}\n\nIf you have any questions or would like to reactivate your subscription, please let us know. We're here to help!`,
          type: 'billing',
          priority: 'medium',
          gumroadOrderId: cancellationData.sale_id,
          purchaseId: purchase.id,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Cancellation processed successfully',
      });
    } catch (error) {
      logger.error('Error processing Gumroad cancellation webhook:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process cancellation',
      });
    }
  }
);

// Webhook health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gumroad webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Manual webhook test endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test-sale', async (req, res) => {
    try {
      const testSale = {
        sale_id: `test_${Date.now()}`,
        product_id: 'test_product',
        product_name: 'AI Glossary Pro (Test)',
        product_permalink: 'ai-glossary-pro',
        short_product_id: 'test',
        email: 'test@example.com',
        price: 249,
        gumroad_fee: 25,
        currency: 'USD',
        quantity: 1,
        discover_fee_charged: false,
        can_contact: true,
        referrer: '',
        order_number: Math.floor(Math.random() * 1000000),
        sale_timestamp: new Date().toISOString(),
        url_params: {},
        custom_fields: {},
        ip_country: 'US',
        recurrence: '',
        is_gift_receiver_purchase: false,
        refunded: false,
        disputed: false,
        dispute_won: false,
        test: true,
        affiliates: [],
        variants_and_quantity: [],
        license_key: 'test-license-key',
        variants: {},
        full_name: 'Test User',
        purchaser_id: 'test_purchaser',
        ...req.body,
      };

      await GumroadService.processSaleWebhook(testSale);

      res.status(200).json({
        success: true,
        message: 'Test sale processed successfully',
        data: testSale,
      });
    } catch (error) {
      logger.error('Error processing test sale:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process test sale',
      });
    }
  });

  router.post('/test-refund', async (req, res) => {
    try {
      const testRefund = {
        refund_id: `test_refund_${Date.now()}`,
        sale_id: req.body.sale_id || 'test_sale_id',
        amount_refunded_in_cents: req.body.amount || 24900,
        refund_date: new Date().toISOString(),
        refund_reason: req.body.reason || 'Test refund',
        ...req.body,
      };

      await GumroadService.processRefundWebhook(testRefund);

      res.status(200).json({
        success: true,
        message: 'Test refund processed successfully',
        data: testRefund,
      });
    } catch (error) {
      logger.error('Error processing test refund:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to process test refund',
      });
    }
  });
}

export default router;