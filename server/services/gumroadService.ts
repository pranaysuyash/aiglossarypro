import axios from 'axios';
import { eq } from 'drizzle-orm';
import { purchases, refundRequests } from '../../shared/schema';
import { db } from '../db';
import { log as logger } from '../utils/logger';
import { emailService } from './emailService';

interface GumroadSale {
  sale_id: string;
  product_id: string;
  product_name: string;
  product_permalink: string;
  short_product_id: string;
  email: string;
  price: number;
  gumroad_fee: number;
  currency: string;
  quantity: number;
  discover_fee_charged: boolean;
  can_contact: boolean;
  referrer: string;
  order_number: number;
  sale_timestamp: string;
  url_params: Record<string, unknown>;
  custom_fields: Record<string, unknown>;
  ip_country: string;
  recurrence: string;
  is_gift_receiver_purchase: boolean;
  refunded: boolean;
  disputed: boolean;
  dispute_won: boolean;
  test: boolean;
  affiliates: unknown[];
  variants_and_quantity: unknown[];
  license_key: string;
  variants: Record<string, unknown>;
  full_name: string;
  purchaser_id: string;
}

interface GumroadRefund {
  refund_id: string;
  sale_id: string;
  amount_refunded_in_cents: number;
  refund_date: string;
  refund_reason?: string;
}

interface GumroadApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class GumroadService {
  private static readonly GUMROAD_API_BASE = 'https://api.gumroad.com/v2';
  private static readonly ACCESS_TOKEN = process.env.GUMROAD_ACCESS_TOKEN;

  /**
   * Validate Gumroad webhook signature
   */
  static validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const secret = process.env.GUMROAD_WEBHOOK_SECRET;
      if (!secret) {
        logger.warn('Gumroad webhook secret not configured');
        return false;
      }

      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error validating webhook signature:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Process Gumroad sale webhook
   */
  static async processSaleWebhook(saleData: GumroadSale): Promise<void> {
    try {
      logger.info('Processing Gumroad sale webhook:', {
        saleId: saleData.sale_id,
        email: saleData.email,
        amount: saleData.price,
        productId: saleData.product_id,
      });

      // Store purchase in database
      const purchaseData = {
        gumroadOrderId: saleData.sale_id,
        amount: Math.round(saleData.price * 100), // Convert to cents
        currency: saleData.currency,
        status: saleData.refunded ? 'refunded' : 'completed',
        purchaseData: {
          email: saleData.email,
          fullName: saleData.full_name,
          productId: saleData.product_id,
          productName: saleData.product_name,
          orderNumber: saleData.order_number,
          timestamp: saleData.sale_timestamp,
          ipCountry: saleData.ip_country,
          referrer: saleData.referrer,
          urlParams: saleData.url_params,
          customFields: saleData.custom_fields,
          licenseKey: saleData.license_key,
          variants: saleData.variants,
          isTest: saleData.test,
        },
      };

      // Try to find existing user by email
      const { users } = await import('../../shared/schema');
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, saleData.email))
        .limit(1);

      if (existingUser) {
        purchaseData.userId = existingUser.id;

        // Update user's subscription status
        await db
          .update(users)
          .set({
            subscriptionTier: 'pro',
            lifetimeAccess: true,
            purchaseDate: new Date(saleData.sale_timestamp),
          })
          .where(eq(users.id, existingUser.id));
      }

      // Insert purchase record
      await db.insert(purchases).values(purchaseData);

      logger.info('Gumroad sale processed successfully:', {
        saleId: saleData.sale_id,
        userId: existingUser?.id,
        amount: purchaseData.amount,
      });
    } catch (error) {
      logger.error('Error processing Gumroad sale webhook:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process Gumroad refund webhook
   */
  static async processRefundWebhook(refundData: GumroadRefund): Promise<void> {
    try {
      logger.info('Processing Gumroad refund webhook:', {
        refundId: refundData.refund_id,
        saleId: refundData.sale_id,
        amount: refundData.amount_refunded_in_cents,
      });

      // Find the purchase record
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.gumroadOrderId, refundData.sale_id))
        .limit(1);

      if (!purchase) {
        logger.error('Purchase not found for refund:', {
          saleId: refundData.sale_id,
          refundId: refundData.refund_id,
        });
        return;
      }

      // Update purchase status
      await db.update(purchases).set({ status: 'refunded' }).where(eq(purchases.id, purchase.id));

      // Find associated refund request
      const [refundRequest] = await db
        .select()
        .from(refundRequests)
        .where(eq(refundRequests.gumroadOrderId, refundData.sale_id))
        .limit(1);

      if (refundRequest) {
        // Update refund request status
        await db
          .update(refundRequests)
          .set({
            status: 'processed',
            gumroadRefundId: refundData.refund_id,
            refundedAmount: refundData.amount_refunded_in_cents,
            processedAt: new Date(refundData.refund_date),
          })
          .where(eq(refundRequests.id, refundRequest.id));
      }

      // Update user's subscription status if they have an account
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

      logger.info('Gumroad refund processed successfully:', {
        refundId: refundData.refund_id,
        purchaseId: purchase.id,
        refundRequestId: refundRequest?.id,
      });
    } catch (error) {
      logger.error('Error processing Gumroad refund webhook:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get sale details from Gumroad API
   */
  static async getSaleDetails(saleId: string): Promise<GumroadSale | null> {
    try {
      if (!GumroadService.ACCESS_TOKEN) {
        throw new Error('Gumroad access token not configured');
      }

      const response = await axios.get<GumroadApiResponse<GumroadSale>>(
        `${GumroadService.GUMROAD_API_BASE}/sales/${saleId}`,
        {
          headers: {
            Authorization: `Bearer ${GumroadService.ACCESS_TOKEN}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      logger.warn('Failed to get sale details from Gumroad:', {
        saleId,
        response: response.data,
      });
      return null;
    } catch (error) {
      logger.error('Error getting sale details from Gumroad:', error);
      throw error;
    }
  }

  /**
   * Issue refund through Gumroad API
   */
  static async issueRefund(
    saleId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      if (!GumroadService.ACCESS_TOKEN) {
        throw new Error('Gumroad access token not configured');
      }

      const refundData: any = {};
      if (amount) {
        refundData.amount = amount;
      }
      if (reason) {
        refundData.reason = reason;
      }

      const response = await axios.put<GumroadApiResponse<GumroadRefund>>(
        `${GumroadService.GUMROAD_API_BASE}/sales/${saleId}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${GumroadService.ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.success && response.data.data) {
        logger.info('Refund issued successfully through Gumroad:', {
          saleId,
          refundId: response.data.data.refund_id,
          amount: response.data.data.amount_refunded_in_cents,
        });

        return {
          success: true,
          refundId: response.data.data.refund_id,
        };
      }

      logger.error('Failed to issue refund through Gumroad:', {
        saleId,
        response: response.data,
      });

      return {
        success: false,
        error: response.data.message || 'Failed to issue refund',
      };
    } catch (error) {
      logger.error('Error issuing refund through Gumroad:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get product sales data
   */
  static async getProductSales(
    productId: string,
    after?: string,
    before?: string,
    page = 1
  ): Promise<{ sales: GumroadSale[]; hasMore: boolean } | null> {
    try {
      if (!GumroadService.ACCESS_TOKEN) {
        throw new Error('Gumroad access token not configured');
      }

      const params: any = {
        product_id: productId,
        page: page.toString(),
      };

      if (after) {params.after = after;}
      if (before) {params.before = before;}

      const response = await axios.get<GumroadApiResponse<{ sales: GumroadSale[] }>>(
        `${GumroadService.GUMROAD_API_BASE}/sales`,
        {
          headers: {
            Authorization: `Bearer ${GumroadService.ACCESS_TOKEN}`,
          },
          params,
          timeout: 15000,
        }
      );

      if (response.data.success && response.data.data) {
        return {
          sales: response.data.data.sales,
          hasMore: response.data.data.sales.length > 0,
        };
      }

      logger.warn('Failed to get product sales from Gumroad:', {
        productId,
        response: response.data,
      });
      return null;
    } catch (error) {
      logger.error('Error getting product sales from Gumroad:', error);
      throw error;
    }
  }

  /**
   * Validate purchase by order ID
   */
  static async validatePurchase(orderId: string, email: string): Promise<boolean> {
    try {
      const sale = await GumroadService.getSaleDetails(orderId);

      if (!sale) {
        return false;
      }

      // Check if the email matches and the sale is valid
      const isValid =
        sale.email.toLowerCase() === email.toLowerCase() &&
        !sale.refunded &&
        !sale.disputed &&
        !sale.test;

      logger.info('Purchase validation result:', {
        orderId,
        email,
        isValid,
        refunded: sale.refunded,
        disputed: sale.disputed,
        test: sale.test,
      });

      return isValid;
    } catch (error) {
      logger.error('Error validating purchase:', error);
      return false;
    }
  }

  /**
   * Sync all sales from Gumroad (for data reconciliation)
   */
  static async syncAllSales(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ synced: number; errors: number }> {
    try {
      let synced = 0;
      let errors = 0;
      let page = 1;
      let hasMore = true;

      const after = startDate?.toISOString();
      const before = endDate?.toISOString();

      logger.info('Starting Gumroad sales sync:', {
        productId,
        after,
        before,
      });

      while (hasMore) {
        try {
          const result = await GumroadService.getProductSales(productId, after, before, page);

          if (!result || result.sales.length === 0) {
            hasMore = false;
            break;
          }

          for (const sale of result.sales) {
            try {
              await GumroadService.processSaleWebhook(sale);
              synced++;
            } catch (error) {
              logger.error('Error processing sale during sync:', {
                saleId: sale.sale_id,
                error,
              });
              errors++;
            }
          }

          hasMore = result.hasMore;
          page++;

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error('Error fetching sales page during sync:', {
            page,
            error,
          });
          errors++;
          break;
        }
      }

      logger.info('Gumroad sales sync completed:', {
        synced,
        errors,
        pages: page - 1,
      });

      return { synced, errors };
    } catch (error) {
      logger.error('Error during Gumroad sales sync:', error);
      throw error;
    }
  }
}

export default GumroadService;
