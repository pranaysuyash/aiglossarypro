import express from 'express';
import { cacheManager } from '../cacheManager';
import { requireAdmin } from '../middleware/adminAuth';
import { features } from '../config';
import { TIME_CONSTANTS } from '../utils/constants';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * Get cache status and information
 * Requires admin authentication
 */
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const cacheEntries = await cacheManager.listCache();
    
    const status = {
      totalCacheEntries: cacheEntries.length,
      cacheEntries: cacheEntries.map(entry => ({
        fileName: path.basename(entry.filePath),
        fileSizeMB: (entry.fileSize / (1024 * 1024)).toFixed(2),
        termCount: entry.termCount,
        categoryCount: entry.categoryCount,
        subcategoryCount: entry.subcategoryCount,
        processedAt: new Date(entry.processedAt).toISOString(),
        processingTimeSeconds: (entry.processingTime / 1000).toFixed(2),
        ageHours: Math.round((Date.now() - entry.processedAt) / TIME_CONSTANTS.MILLISECONDS_IN_HOUR),
        cacheVersion: entry.cacheVersion
      }))
    };
    
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cache status' 
    });
  }
});

/**
 * Clear specific cache entry
 * Requires admin authentication
 */
router.delete('/:fileName', requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, fileName);
    
    await cacheManager.clearCache(filePath);
    
    res.json({ 
      success: true, 
      message: `Cache cleared for ${fileName}` 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
});

/**
 * Clear all cache entries
 * Requires admin authentication
 */
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await cacheManager.clearAllCache();
    
    res.json({ 
      success: true, 
      message: 'All cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear all cache' 
    });
  }
});



export default router; 