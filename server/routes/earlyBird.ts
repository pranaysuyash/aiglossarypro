import { Express, Request, Response } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { earlyBirdCustomers, earlyBirdStatus } from "../../shared/schema";
import { log as logger } from "../utils/logger";
import { createHash } from "crypto";

// Validation schemas
const registerEarlyBirdSchema = z.object({
  email: z.string().email(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  countryCode: z.string().length(2).optional(),
});

const updateEarlyBirdSchema = z.object({
  email: z.string().email(),
  purchaseOrderId: z.string(),
  status: z.enum(['purchased', 'expired']),
});

// Helper function to hash IP address for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

// Helper function to get client IP
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

// Register early bird customer
async function registerEarlyBirdCustomer(req: Request, res: Response): Promise<void> {
  try {
    const validation = registerEarlyBirdSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        details: validation.error.errors
      });
      return;
    }

    const { email, utmSource, utmMedium, utmCampaign, countryCode } = validation.data;

    // Check if email already registered
    const existingCustomer = await db.select()
      .from(earlyBirdCustomers)
      .where(eq(earlyBirdCustomers.email, email))
      .limit(1);

    if (existingCustomer.length > 0) {
      res.status(400).json({
        success: false,
        error: "Email already registered for early bird promotion"
      });
      return;
    }

    // Check if early bird slots are still available
    const statusResult = await db.select().from(earlyBirdStatus).limit(1);
    const status = statusResult[0];

    if (!status?.earlyBirdActive || status.totalRegistered >= status.maxEarlyBirdSlots) {
      res.status(400).json({
        success: false,
        error: "Early bird promotion has ended - all 500 slots have been filled"
      });
      return;
    }

    // Create expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Register new early bird customer
    const ipAddress = hashIP(getClientIP(req));
    
    await db.insert(earlyBirdCustomers).values({
      email,
      utmSource,
      utmMedium,
      utmCampaign,
      countryCode,
      ipAddress,
      expiresAt,
      // Using defaults for pricing fields
    });

    logger.info(`Early bird customer registered: ${email}`, {
      utmSource,
      utmMedium,
      utmCampaign,
      countryCode
    });

    res.json({
      success: true,
      message: "Successfully registered for early bird promotion",
      discount: {
        amount: 70,
        originalPrice: 249,
        discountedPrice: 179,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error) {
    logger.error("Error registering early bird customer", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

// Update early bird customer status (for webhook from Gumroad)
async function updateEarlyBirdCustomer(req: Request, res: Response): Promise<void> {
  try {
    const validation = updateEarlyBirdSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        details: validation.error.errors
      });
      return;
    }

    const { email, purchaseOrderId, status } = validation.data;

    const updateData: any = {
      status,
      purchaseOrderId,
    };

    if (status === 'purchased') {
      updateData.purchasedAt = new Date();
    }

    await db.update(earlyBirdCustomers)
      .set(updateData)
      .where(eq(earlyBirdCustomers.email, email));

    logger.info(`Early bird customer status updated: ${email} -> ${status}`, {
      purchaseOrderId
    });

    res.json({
      success: true,
      message: "Early bird customer status updated successfully"
    });

  } catch (error) {
    logger.error("Error updating early bird customer", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

// Get early bird status
async function getEarlyBirdStatus(req: Request, res: Response): Promise<void> {
  try {
    const statusResult = await db.select().from(earlyBirdStatus).limit(1);
    const status = statusResult[0];

    if (!status) {
      res.status(404).json({
        success: false,
        error: "Early bird status not found"
      });
      return;
    }

    const remainingSlots = Math.max(0, status.maxEarlyBirdSlots - status.totalRegistered);
    const percentageFilled = Math.round((status.totalRegistered / status.maxEarlyBirdSlots) * 100);

    res.json({
      success: true,
      data: {
        totalRegistered: status.totalRegistered,
        totalPurchased: status.totalPurchased,
        maxSlots: status.maxEarlyBirdSlots,
        remainingSlots,
        percentageFilled,
        isActive: status.earlyBirdActive,
        lastUpdated: status.updatedAt,
        pricing: {
          originalPrice: 249,
          discountedPrice: 179,
          discountAmount: 70,
          discountPercentage: 28
        }
      }
    });

  } catch (error) {
    logger.error("Error getting early bird status", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

// Get early bird customer by email
async function getEarlyBirdCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({
        success: false,
        error: "Email parameter is required"
      });
      return;
    }

    const customer = await db.select({
      id: earlyBirdCustomers.id,
      email: earlyBirdCustomers.email,
      status: earlyBirdCustomers.status,
      discountAmount: earlyBirdCustomers.discountAmount,
      originalPrice: earlyBirdCustomers.originalPrice,
      discountedPrice: earlyBirdCustomers.discountedPrice,
      registeredAt: earlyBirdCustomers.registeredAt,
      purchasedAt: earlyBirdCustomers.purchasedAt,
      expiresAt: earlyBirdCustomers.expiresAt,
    })
      .from(earlyBirdCustomers)
      .where(eq(earlyBirdCustomers.email, email))
      .limit(1);

    if (customer.length === 0) {
      res.status(404).json({
        success: false,
        error: "Early bird customer not found"
      });
      return;
    }

    const customerData = customer[0];
    const now = new Date();
    const isExpired = now > customerData.expiresAt;

    res.json({
      success: true,
      data: {
        ...customerData,
        isExpired,
        daysRemaining: Math.max(0, Math.ceil((customerData.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      }
    });

  } catch (error) {
    logger.error("Error getting early bird customer", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

// Register all early bird routes
export function registerEarlyBirdRoutes(app: Express): void {
  // Get early bird status (public endpoint)
  app.get('/api/early-bird-status', getEarlyBirdStatus);
  
  // Register for early bird promotion
  app.post('/api/early-bird-register', registerEarlyBirdCustomer);
  
  // Update early bird customer status (webhook endpoint)
  app.post('/api/early-bird-update', updateEarlyBirdCustomer);
  
  // Get early bird customer by email
  app.get('/api/early-bird-customer/:email', getEarlyBirdCustomer);
}