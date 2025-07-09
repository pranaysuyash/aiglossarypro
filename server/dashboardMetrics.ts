// Dashboard metrics endpoint

import { sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from './db';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTerms: number;
  totalViews: number;
  totalSearches: number;
  totalFavorites: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  recentActivity: any[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Get basic counts
    const [totalUsersResult, totalTermsResult, totalViewsResult, totalFavoritesResult] =
      await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM users`),
        db.execute(sql`SELECT COUNT(*) as count FROM terms`),
        db.execute(sql`SELECT COUNT(*) as count FROM term_views`),
        db.execute(sql`SELECT COUNT(*) as count FROM favorites`),
      ]);

    // Get active users (last 30 days)
    const activeUsersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM term_views 
      WHERE viewed_at >= NOW() - INTERVAL '30 days'
    `);

    // Estimate search count (if you have search tracking)
    // For now, we'll use a placeholder
    const totalSearches = 0; // Will implement with analytics

    // Get recent activity
    const recentActivityResult = await db.execute(sql`
      SELECT 
        'Term View' as action,
        CONCAT('User viewed "', t.name, '"') as details,
        tv.viewed_at as timestamp
      FROM term_views tv
      JOIN terms t ON tv.term_id = t.id
      ORDER BY tv.viewed_at DESC
      LIMIT 10
    `);

    // Simple system health check
    const systemHealth = 'healthy'; // Will implement proper health checks

    return {
      totalUsers: Number((totalUsersResult.rows[0] as any)?.count || 0),
      activeUsers: Number((activeUsersResult.rows[0] as any)?.count || 0),
      totalTerms: Number((totalTermsResult.rows[0] as any)?.count || 0),
      totalViews: Number((totalViewsResult.rows[0] as any)?.count || 0),
      totalSearches,
      totalFavorites: Number((totalFavoritesResult.rows[0] as any)?.count || 0),
      systemHealth,
      recentActivity: (recentActivityResult.rows as any[]).map((row: any) => ({
        action: row.action,
        details: row.details,
        timestamp: row.timestamp,
      })),
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalTerms: 0,
      totalViews: 0,
      totalSearches: 0,
      totalFavorites: 0,
      systemHealth: 'error',
      recentActivity: [],
    };
  }
}

// Express route handler
export async function handleDashboardMetrics(req: Request, res: Response) {
  try {
    // Check if user is admin (you'll need to implement this check)
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For now, we'll allow any authenticated user
    // In production, add proper admin check here

    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
}
