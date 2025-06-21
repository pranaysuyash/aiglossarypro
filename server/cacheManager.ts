import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

interface CacheMetadata {
  filePath: string;
  fileHash: string;
  fileSize: number;
  lastModified: number;
  processedAt: number;
  processingTime: number;
  termCount: number;
  categoryCount: number;
  subcategoryCount: number;
  cacheVersion: string;
}

interface CacheEntry {
  metadata: CacheMetadata;
  data: any;
}

export class CacheManager {
  private cacheDir: string;
  private cacheVersion = '1.0.0';

  constructor(cacheDir: string = './cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Generate file hash for change detection
   */
  private async generateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.error(`Error generating hash for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata for change detection
   */
  private async getFileMetadata(filePath: string): Promise<{ hash: string; size: number; lastModified: number }> {
    const stats = await stat(filePath);
    const hash = await this.generateFileHash(filePath);
    
    return {
      hash,
      size: stats.size,
      lastModified: stats.mtime.getTime()
    };
  }

  /**
   * Generate cache key from file path
   */
  private getCacheKey(filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `${fileName}_processed`;
  }

  /**
   * Get cache file paths
   */
  private getCachePaths(filePath: string) {
    const cacheKey = this.getCacheKey(filePath);
    return {
      metadataPath: path.join(this.cacheDir, `${cacheKey}_metadata.json`),
      dataPath: path.join(this.cacheDir, `${cacheKey}_data.json`)
    };
  }

  /**
   * Check if cache exists and is valid
   */
  async isCacheValid(filePath: string): Promise<boolean> {
    try {
      const { metadataPath, dataPath } = this.getCachePaths(filePath);
      
      // Check if cache files exist
      if (!fs.existsSync(metadataPath) || !fs.existsSync(dataPath)) {
        console.log('📦 Cache files not found');
        return false;
      }

      // Load cache metadata
      const metadataContent = await readFile(metadataPath, 'utf8');
      const metadata: CacheMetadata = JSON.parse(metadataContent);

      // Check cache version compatibility
      if (metadata.cacheVersion !== this.cacheVersion) {
        console.log('📦 Cache version mismatch, invalidating cache');
        return false;
      }

      // Get current file metadata
      const currentMetadata = await this.getFileMetadata(filePath);

      // Compare file hash and modification time
      const isValid = metadata.fileHash === currentMetadata.hash && 
                     metadata.lastModified === currentMetadata.lastModified;

      if (isValid) {
        console.log('✅ Cache is valid and up-to-date');
        const cacheAge = Date.now() - metadata.processedAt;
        const ageHours = Math.round(cacheAge / (1000 * 60 * 60));
        console.log(`📦 Cache age: ${ageHours} hours`);
      } else {
        console.log('📦 Cache is invalid (file changed)');
      }

      return isValid;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Load data from cache
   */
  async loadFromCache(filePath: string): Promise<any | null> {
    try {
      const { dataPath } = this.getCachePaths(filePath);
      
      if (!fs.existsSync(dataPath)) {
        return null;
      }

      const dataContent = await readFile(dataPath, 'utf8');
      const data = JSON.parse(dataContent);
      
      console.log('📦 Successfully loaded data from cache');
      return data;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  async saveToCache(filePath: string, data: any, processingTime: number): Promise<void> {
    try {
      await this.ensureCacheDirectory();
      
      const { metadataPath, dataPath } = this.getCachePaths(filePath);
      const fileMetadata = await this.getFileMetadata(filePath);

      // Create metadata
      const metadata: CacheMetadata = {
        filePath,
        fileHash: fileMetadata.hash,
        fileSize: fileMetadata.size,
        lastModified: fileMetadata.lastModified,
        processedAt: Date.now(),
        processingTime,
        termCount: data.terms?.length || 0,
        categoryCount: data.categories?.length || 0,
        subcategoryCount: data.subcategories?.length || 0,
        cacheVersion: this.cacheVersion
      };

      // Save metadata and data
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      await writeFile(dataPath, JSON.stringify(data, null, 2));

      console.log('✅ Data saved to cache successfully');
      console.log(`📊 Cached: ${metadata.termCount} terms, ${metadata.categoryCount} categories, ${metadata.subcategoryCount} subcategories`);
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw error;
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(filePath: string): Promise<CacheMetadata | null> {
    try {
      const { metadataPath } = this.getCachePaths(filePath);
      
      if (!fs.existsSync(metadataPath)) {
        return null;
      }

      const metadataContent = await readFile(metadataPath, 'utf8');
      return JSON.parse(metadataContent);
    } catch (error) {
      console.error('Error getting cache info:', error);
      return null;
    }
  }

  /**
   * Clear cache for specific file
   */
  async clearCache(filePath: string): Promise<void> {
    try {
      const { metadataPath, dataPath } = this.getCachePaths(filePath);
      
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }
      
      if (fs.existsSync(dataPath)) {
        fs.unlinkSync(dataPath);
      }
      
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all cache files
   */
  async clearAllCache(): Promise<void> {
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
      console.log('🗑️ All cache cleared successfully');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * List all cache entries
   */
  async listCache(): Promise<CacheMetadata[]> {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return [];
      }

      const files = fs.readdirSync(this.cacheDir);
      const metadataFiles = files.filter(f => f.endsWith('_metadata.json'));
      
      const cacheEntries: CacheMetadata[] = [];
      
      for (const file of metadataFiles) {
        try {
          const content = await readFile(path.join(this.cacheDir, file), 'utf8');
          const metadata: CacheMetadata = JSON.parse(content);
          cacheEntries.push(metadata);
        } catch (error) {
          console.warn(`Error reading cache metadata ${file}:`, error);
        }
      }
      
      return cacheEntries;
    } catch (error) {
      console.error('Error listing cache:', error);
      return [];
    }
  }
}

export const cacheManager = new CacheManager(); 