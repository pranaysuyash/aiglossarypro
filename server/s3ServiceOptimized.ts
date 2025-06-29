import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import { parseExcelFile, importToDatabase } from './excelParser';
import { streamExcelFile } from './excelStreamer';

export interface S3FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  key: string;
  stage: 'initializing' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface S3Config {
  bucketName: string;
  region: string;
  multipartThreshold: number; // 5MB default
  retryAttempts: number;
  retryDelay: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Enhanced S3 client with retry logic and exponential backoff
class OptimizedS3Client {
  private s3Client: S3Client;
  private config: S3Config;
  private activeUploads: Map<string, AbortController> = new Map();

  constructor(config: S3Config) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      },
      maxAttempts: config.retryAttempts,
      retryMode: 'adaptive'
    });
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`${operationName} failed after ${maxRetries} attempts:`, lastError);
          throw lastError;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30s delay
        console.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private generateFileName(originalName: string, options?: { 
    addTimestamp?: boolean;
    addVersion?: boolean;
    compress?: boolean;
  }): string {
    const { addTimestamp = true, addVersion = false, compress = false } = options || {};
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    let fileName = baseName;
    
    if (addTimestamp) {
      fileName += `_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }
    
    if (addVersion) {
      fileName += `_v${Date.now()}`;
    }
    
    fileName += ext;
    
    if (compress) {
      fileName += '.gz';
    }
    
    return fileName;
  }

  // Enhanced file listing with pagination and filtering
  async listFiles(prefix: string = '', options?: {
    maxKeys?: number;
    continuationToken?: string;
    fileTypes?: string[];
    sortBy?: 'lastModified' | 'size' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    files: S3FileMetadata[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }> {
    const { maxKeys = 1000, continuationToken, fileTypes, sortBy = 'lastModified', sortOrder = 'desc' } = options || {};
    
    return this.retryOperation(async () => {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
      });
      
      const response = await this.s3Client.send(command);
      
      let files = response.Contents?.map(item => ({
        key: item.Key!,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag,
        contentType: item.StorageClass
      })) || [];
      
      // Filter by file types if specified
      if (fileTypes && fileTypes.length > 0) {
        files = files.filter(file => 
          fileTypes.some(type => file.key.toLowerCase().endsWith(type.toLowerCase()))
        );
      }
      
      // Sort files
      files.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'name':
            aValue = a.key.toLowerCase();
            bValue = b.key.toLowerCase();
            break;
          case 'lastModified':
          default:
            aValue = a.lastModified;
            bValue = b.lastModified;
            break;
        }
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      return {
        files,
        nextContinuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false
      };
    }, 'listFiles');
  }

  // Enhanced upload with multipart support and progress tracking
  async uploadFile(
    filePath: string,
    key: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      tags?: Record<string, string>;
      compress?: boolean;
      onProgress?: (progress: UploadProgress) => void;
      abortSignal?: AbortSignal;
    }
  ): Promise<{ key: string; etag: string; location: string }> {
    const { contentType, metadata = {}, tags = {}, compress = false, onProgress, abortSignal } = options || {};
    
    // Generate progress tracker
    const progressTracker = (loaded: number, total: number, stage: UploadProgress['stage'] = 'uploading') => {
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          key,
          stage
        });
      }
    };
    
    try {
      progressTracker(0, 100, 'initializing');
      
      let fileBuffer = fs.readFileSync(filePath);
      const originalSize = fileBuffer.length;
      
      // Compress if requested and file is large enough
      if (compress && originalSize > 1024) { // Only compress files > 1KB
        const compressed = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          const gzip = createGzip({ level: 6 }); // Balanced compression
          
          gzip.on('data', chunk => chunks.push(chunk));
          gzip.on('end', () => resolve(Buffer.concat(chunks)));
          gzip.on('error', reject);
          
          gzip.end(fileBuffer);
        });
        
        fileBuffer = compressed;
        key = key.endsWith('.gz') ? key : key + '.gz';
        metadata['x-original-size'] = originalSize.toString();
        metadata['x-compressed'] = 'true';
      }
      
      // Enhanced metadata
      const enhancedMetadata = {
        'x-upload-timestamp': new Date().toISOString(),
        'x-original-filename': path.basename(filePath),
        'x-file-size': fileBuffer.length.toString(),
        'x-application': 'ai-glossary-pro',
        ...metadata
      };
      
      // Use Upload class for automatic multipart handling
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType || 'application/octet-stream',
          Metadata: enhancedMetadata,
          ServerSideEncryption: this.config.encryptionEnabled ? 'AES256' : undefined,
          Tagging: Object.entries(tags).map(([k, v]) => `${k}=${v}`).join('&')
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB chunks
        leavePartsOnError: false
      });
      
      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          progressTracker(progress.loaded, progress.total, 'uploading');
        }
      });
      
      const result = await upload.done();
      progressTracker(100, 100, 'complete');
      
      return {
        key,
        etag: result.ETag || '',
        location: result.Location || `s3://${this.config.bucketName}/${key}`
      };
      
    } catch (error) {
      progressTracker(0, 100, 'error');
      throw error;
    }
  }

  // Enhanced download with streaming and decompression
  async downloadFile(
    key: string,
    destinationPath: string,
    options?: {
      decompress?: boolean;
      onProgress?: (progress: UploadProgress) => void;
      abortSignal?: AbortSignal;
    }
  ): Promise<string> {
    const { decompress = false, onProgress, abortSignal } = options || {};
    
    return this.retryOperation(async () => {
      // Get file metadata first
      const headCommand = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      });
      
      const headResponse = await this.s3Client.send(headCommand);
      const totalSize = headResponse.ContentLength || 0;
      const isCompressed = headResponse.Metadata?.['x-compressed'] === 'true' || key.endsWith('.gz');
      
      // Ensure directory exists
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No data received from S3');
      }
      
      let writeStream = fs.createWriteStream(destinationPath);
      let downloadedBytes = 0;
      
      // Set up progress tracking
      const progressTracker = (loaded: number, stage: UploadProgress['stage'] = 'uploading') => {
        if (onProgress) {
          onProgress({
            loaded,
            total: totalSize,
            percentage: totalSize > 0 ? Math.round((loaded / totalSize) * 100) : 0,
            key,
            stage
          });
        }
      };
      
      progressTracker(0, 'initializing');
      
      // Create pipeline for streaming
      const streams: any[] = [response.Body as any];
      
      // Add progress tracking
      const progressTransform = new (require('stream').Transform)({
        transform(chunk: any, encoding: any, callback: any) {
          downloadedBytes += chunk.length;
          progressTracker(downloadedBytes);
          callback(null, chunk);
        }
      });
      streams.push(progressTransform);
      
      // Add decompression if needed
      if (decompress && isCompressed) {
        streams.push(createGunzip());
        // Update destination path to remove .gz extension
        if (destinationPath.endsWith('.gz')) {
          const newPath = destinationPath.slice(0, -3);
          writeStream.end();
          writeStream = fs.createWriteStream(newPath);
          destinationPath = newPath;
        }
      }
      
      streams.push(writeStream);
      
      // Handle abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          streams.forEach(stream => {
            if (stream.destroy) stream.destroy();
          });
        });
      }
      
      await pipeline(...(streams as [any, ...any[]]));
      progressTracker(totalSize, totalSize);
      
      return destinationPath;
    }, 'downloadFile');
  }

  // Generate presigned URLs for secure direct access
  async generatePresignedUrl(
    key: string,
    operation: 'getObject' | 'putObject' = 'getObject',
    expiresIn: number = 3600
  ): Promise<string> {
    const command = operation === 'getObject' 
      ? new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: key
        })
      : new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key
        });
    
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // Bulk operations
  async bulkDelete(keys: string[]): Promise<{
    deleted: string[];
    errors: Array<{ key: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const errors: Array<{ key: string; error: string }> = [];
    
    // Process in batches of 1000 (S3 limit)
    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      try {
        const command = new DeleteObjectsCommand({
          Bucket: this.config.bucketName,
          Delete: {
            Objects: batch.map(key => ({ Key: key })),
            Quiet: false
          }
        });
        
        const response = await this.s3Client.send(command);
        
        if (response.Deleted) {
          deleted.push(...response.Deleted.map(obj => obj.Key!));
        }
        
        if (response.Errors) {
          errors.push(...response.Errors.map(err => ({
            key: err.Key!,
            error: `${err.Code}: ${err.Message}`
          })));
        }
      } catch (error) {
        errors.push(...batch.map(key => ({
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        })));
      }
    }
    
    return { deleted, errors };
  }

  // File validation and security scanning
  async validateFile(key: string): Promise<{
    isValid: boolean;
    fileType: string;
    size: number;
    securityCheck: 'safe' | 'suspicious' | 'dangerous';
    issues: string[];
  }> {
    const issues: string[] = [];
    let securityCheck: 'safe' | 'suspicious' | 'dangerous' = 'safe';
    
    // Get file metadata
    const headCommand = new HeadObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    });
    
    const response = await this.s3Client.send(headCommand);
    const size = response.ContentLength || 0;
    const contentType = response.ContentType || '';
    
    // Basic file type validation
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/json',
      'text/plain'
    ];
    
    const fileExtension = path.extname(key).toLowerCase();
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.json', '.txt'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      issues.push(`File extension ${fileExtension} is not allowed`);
      securityCheck = 'dangerous';
    }
    
    // Size validation (max 100MB)
    if (size > 100 * 1024 * 1024) {
      issues.push('File size exceeds maximum allowed size (100MB)');
      securityCheck = 'suspicious';
    }
    
    // Suspicious file name patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|vbs|js)$/i,
      /^\./, // Hidden files
      /[<>:"|?*]/, // Invalid characters
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(key)) {
        issues.push(`File name contains suspicious pattern: ${pattern}`);
        securityCheck = 'suspicious';
        break;
      }
    }
    
    return {
      isValid: securityCheck !== 'dangerous',
      fileType: contentType,
      size,
      securityCheck,
      issues
    };
  }

  // Create archive of multiple files
  async createArchive(
    fileKeys: string[],
    archiveName: string,
    format: 'zip' | 'tar' = 'zip'
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const archivePath = path.join(tempDir, archiveName);
    const output = fs.createWriteStream(archivePath);
    
    const archive = archiver(format, {
      zlib: { level: 9 } // Maximum compression
    });
    
    archive.pipe(output);
    
    // Download and add each file to the archive
    for (const fileKey of fileKeys) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: fileKey
        });
        
        const response = await this.s3Client.send(command);
        if (response.Body) {
          const fileName = path.basename(fileKey);
          archive.append(response.Body as any, { name: fileName });
        }
      } catch (error) {
        console.warn(`Failed to add file ${fileKey} to archive:`, error);
      }
    }
    
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(archivePath));
      output.on('error', reject);
    });
  }

  // Clean up old versions and temporary files
  async cleanupOldFiles(options: {
    prefix?: string;
    olderThanDays?: number;
    keepVersions?: number;
  }): Promise<{ deletedCount: number; totalSize: number }> {
    const { prefix = '', olderThanDays = 30, keepVersions = 5 } = options;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const { files } = await this.listFiles(prefix, { maxKeys: 10000 });
    
    // Group files by base name (without timestamp)
    const fileGroups = new Map<string, S3FileMetadata[]>();
    
    files.forEach(file => {
      const baseName = file.key.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*$/, '');
      if (!fileGroups.has(baseName)) {
        fileGroups.set(baseName, []);
      }
      fileGroups.get(baseName)!.push(file);
    });
    
    const filesToDelete: string[] = [];
    let totalSize = 0;
    
    // For each group, keep only the latest versions and delete old files
    fileGroups.forEach((groupFiles, baseName) => {
      // Sort by last modified (newest first)
      groupFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      
      // Keep the specified number of versions
      const filesToDeleteFromGroup = groupFiles.slice(keepVersions);
      
      // Also delete files older than cutoff date
      const oldFiles = groupFiles.filter(file => 
        file.lastModified < cutoffDate && 
        !filesToDeleteFromGroup.includes(file)
      );
      
      const deleteList = [...filesToDeleteFromGroup, ...oldFiles];
      
      deleteList.forEach(file => {
        filesToDelete.push(file.key);
        totalSize += file.size;
      });
    });
    
    if (filesToDelete.length > 0) {
      await this.bulkDelete(filesToDelete);
    }
    
    return { deletedCount: filesToDelete.length, totalSize };
  }

  // Health check for S3 connectivity
  async healthCheck(): Promise<{
    connected: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple list operation to test connectivity
      await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1
      }));
      
      return {
        connected: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
let optimizedS3Client: OptimizedS3Client | null = null;

export function getOptimizedS3Client(): OptimizedS3Client {
  if (!optimizedS3Client) {
    const config: S3Config = {
      bucketName: process.env.S3_BUCKET_NAME || '',
      region: process.env.AWS_REGION || 'ap-south-1',
      multipartThreshold: 5 * 1024 * 1024, // 5MB
      retryAttempts: 3,
      retryDelay: 1000,
      compressionEnabled: process.env.S3_COMPRESSION_ENABLED === 'true',
      encryptionEnabled: process.env.S3_ENCRYPTION_ENABLED !== 'false' // Default to true
    };
    
    optimizedS3Client = new OptimizedS3Client(config);
  }
  
  return optimizedS3Client;
}

// Export types and client
export { OptimizedS3Client };
export default getOptimizedS3Client;