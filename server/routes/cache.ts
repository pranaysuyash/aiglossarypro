import express from 'express';
import { cacheManager } from '../cacheManager';
import { smartLoadExcelData } from '../smartExcelLoader';
import { requireAdmin } from '../middleware/adminAuth';
import { features } from '../config';
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
        ageHours: Math.round((Date.now() - entry.processedAt) / (1000 * 60 * 60)),
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

/**
 * Force reprocess Excel file
 * Requires admin authentication
 */
router.post('/reprocess/:fileName', requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    const { clearCache = true } = req.body;
    
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `File ${fileName} not found`
      });
    }
    
    // Clear cache if requested
    if (clearCache) {
      await cacheManager.clearCache(filePath);
      console.log(`🗑️ Cache cleared for ${fileName}`);
    }
    
    // Start reprocessing
    console.log(`🔄 Starting manual reprocessing of ${fileName}...`);
    const startTime = Date.now();
    
    await smartLoadExcelData(filePath, {
      chunkSize: 500,
      enableProgress: true
    }, true); // Force reprocess = true
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `Successfully reprocessed ${fileName}`,
      processingTimeSeconds: (processingTime / 1000).toFixed(2)
    });
    
  } catch (error) {
    console.error('Error reprocessing file:', error);
    res.status(500).json({
      success: false,
      error: `Failed to reprocess file: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * Get processing recommendations based on cache status and file changes
 * Requires admin authentication
 */
router.get('/recommendations', requireAdmin, async (req, res) => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const recommendations = [];
    
    if (!fs.existsSync(dataDir)) {
      return res.json({ success: true, data: { recommendations: [] } });
    }
    
    const files = fs.readdirSync(dataDir);
    const excelFiles = files.filter(file => 
      (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
      !file.startsWith('~$')
    );
    
    for (const file of excelFiles) {
      const filePath = path.join(dataDir, file);
      const cacheInfo = await cacheManager.getCacheInfo(filePath);
      const isCacheValid = await cacheManager.isCacheValid(filePath);
      
      let recommendation = {
        fileName: file,
        hasCache: !!cacheInfo,
        cacheValid: isCacheValid,
        action: 'none',
        reason: '',
        priority: 'low'
      };
      
      if (!cacheInfo) {
        recommendation.action = 'process';
        recommendation.reason = 'No cache found - initial processing required';
        recommendation.priority = 'high';
      } else if (!isCacheValid) {
        recommendation.action = 'reprocess';
        recommendation.reason = 'File has changed since last processing';
        recommendation.priority = 'medium';
      } else {
        const ageHours = (Date.now() - cacheInfo.processedAt) / (1000 * 60 * 60);
        if (ageHours > 168) { // 7 days
          recommendation.action = 'refresh';
          recommendation.reason = `Cache is ${Math.round(ageHours / 24)} days old`;
          recommendation.priority = 'low';
        } else {
          recommendation.reason = `Cache is current (${Math.round(ageHours)} hours old)`;
        }
      }
      
      recommendations.push(recommendation);
    }
    
    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get recommendations' 
    });
  }
});

export default router; 