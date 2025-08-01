import { Router, Request, Response } from 'express';
import { db } from '@aiglossarypro/database/db';
import { systemConfig } from '@aiglossarypro/shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get current pricing phase status
router.get('/phase-status', async (req: Request, res: Response) => {
  try {
    // Get phase configuration from database
    const [phaseConfig] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'pricing_phase'))
      .limit(1);
    
    const [salesCount] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'total_sales'))
      .limit(1);
    
    const [phaseHistory] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'phase_history'))
      .limit(1);
    
    const currentPhase = phaseConfig?.value?.phase || process.env.PRICING_PHASE || 'early';
    const totalSales = parseInt(salesCount?.value?.count || '0');
    const history = phaseHistory?.value || {};
    
    res.json({
      success: true,
      data: {
        currentPhase,
        totalSales,
        phaseHistory: history,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching pricing phase status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing phase status',
    });
  }
});

// Transition to next pricing phase
router.post('/transition-phase', async (req: Request, res: Response) => {
  try {
    const { fromPhase, toPhase } = req.body;
    
    if (!fromPhase || !toPhase) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromPhase, toPhase',
      });
    }
    
    // Update the current phase
    await db
      .insert(systemConfig)
      .values({
        key: 'pricing_phase',
        value: { phase: toPhase },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value: { phase: toPhase },
          updatedAt: new Date(),
        },
      });
    
    // Update phase history
    const [history] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'phase_history'))
      .limit(1);
    
    const updatedHistory = {
      ...(history?.value || {}),
      [toPhase]: new Date().toISOString(),
    };
    
    await db
      .insert(systemConfig)
      .values({
        key: 'phase_history',
        value: updatedHistory,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value: updatedHistory,
          updatedAt: new Date(),
        },
      });
    
    res.json({
      success: true,
      data: {
        fromPhase,
        toPhase,
        transitionTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error transitioning pricing phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transition pricing phase',
    });
  }
});

// Admin: Manually set pricing phase
router.post('/set-phase', async (req: Request, res: Response) => {
  try {
    const { phase } = req.body;
    
    // TODO: Add admin authentication check here
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Unauthorized: Admin access required',
    //   });
    // }
    
    if (!phase || !['beta', 'early', 'launch', 'regular'].includes(phase)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phase. Must be one of: beta, early, launch, regular',
      });
    }
    
    // Update the current phase
    await db
      .insert(systemConfig)
      .values({
        key: 'pricing_phase',
        value: { phase },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value: { phase },
          updatedAt: new Date(),
        },
      });
    
    res.json({
      success: true,
      data: {
        phase,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error setting pricing phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set pricing phase',
    });
  }
});

// Get sales count for current phase
router.get('/sales-count', async (req: Request, res: Response) => {
  try {
    const [salesCount] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'total_sales'))
      .limit(1);
    
    const totalSales = parseInt(salesCount?.value?.count || '0');
    
    res.json({
      success: true,
      data: {
        totalSales,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching sales count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales count',
    });
  }
});

export default router;