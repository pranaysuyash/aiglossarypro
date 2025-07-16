import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import expressWs from 'express-ws';
import multer from 'multer';
import { WebSocket } from 'ws';
import { mockIsAuthenticated } from './middleware/dev/mockAuth';
import { getOptimizedS3Client, type UploadProgress } from './s3ServiceOptimized';

const router = Router();
const _wsRouter = expressWs(router as any).getWss;

// Configure multer for file uploads with enhanced validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10, // Max 10 files per upload
  },
  fileFilter: (_req, file, cb) => {
    // Enhanced file type validation
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/json',
      'text/plain',
    ];

    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.json', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  },
});

// WebSocket connections for real-time progress updates
const progressConnections = new Map<string, WebSocket>();

// Health check endpoint
router.get('/health', async (_req, res) => {
  try {
    const s3Client = getOptimizedS3Client();
    const health = await s3Client.healthCheck();

    res.json({
      status: health.connected ? 'healthy' : 'unhealthy',
      latency: health.latency,
      timestamp: new Date().toISOString(),
      error: health.error,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Enhanced file listing with advanced filtering and pagination
router.get('/files', async (req, res) => {
  try {
    const s3Client = getOptimizedS3Client();

    const {
      prefix = '',
      maxKeys = 50,
      continuationToken,
      fileTypes,
      sortBy = 'lastModified',
      sortOrder = 'desc',
    } = req.query;

    const fileTypesArray = fileTypes ? (fileTypes as string).split(',') : undefined;

    const result = await s3Client.listFiles(prefix as string, {
      maxKeys: parseInt(maxKeys as string),
      continuationToken: continuationToken as string,
      fileTypes: fileTypesArray,
      sortBy: sortBy as 'lastModified' | 'size' | 'name',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      files: result.files,
      pagination: {
        nextContinuationToken: result.nextContinuationToken,
        isTruncated: result.isTruncated,
      },
    });
  } catch (error) {
    console.error('Error listing S3 files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    });
  }
});

// Enhanced single file upload with progress tracking
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const s3Client = getOptimizedS3Client();
    const sessionId = req.headers['x-session-id'] as string;

    // Create temporary file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const { compress = 'false', contentType = req.file.mimetype, addTimestamp = 'true' } = req.body;

    const fileName =
      addTimestamp === 'true' ? `${Date.now()}_${req.file.originalname}` : req.file.originalname;

    const uploadOptions = {
      contentType,
      compress: compress === 'true',
      metadata: {
        'original-name': req.file.originalname,
        'upload-session': sessionId || 'unknown',
        'user-agent': req.headers['user-agent'] || 'unknown',
      },
      onProgress: (progress: UploadProgress) => {
        // Send progress to WebSocket if connected
        const ws = progressConnections.get(sessionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'upload-progress',
              data: progress,
            })
          );
        }
      },
    };

    const result = await s3Client.uploadFile(tempFilePath, fileName, uploadOptions);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    res.json({
      success: true,
      file: {
        key: result.key,
        etag: result.etag,
        location: result.location,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

// Bulk file upload
router.post('/upload/bulk', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    const s3Client = getOptimizedS3Client();
    const sessionId = req.headers['x-session-id'] as string;
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Create temporary file
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(
          tempDir,
          `bulk_upload_${Date.now()}_${i}_${file.originalname}`
        );
        fs.writeFileSync(tempFilePath, file.buffer);

        const fileName = `${Date.now()}_${file.originalname}`;

        const result = await s3Client.uploadFile(tempFilePath, fileName, {
          contentType: file.mimetype,
          metadata: {
            'original-name': file.originalname,
            'bulk-upload': 'true',
            'upload-index': i.toString(),
          },
          onProgress: (progress: UploadProgress) => {
            const ws = progressConnections.get(sessionId);
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'bulk-upload-progress',
                  data: {
                    ...progress,
                    fileIndex: i,
                    fileName: file.originalname,
                    totalFiles: files.length,
                  },
                })
              );
            }
          },
        });

        results.push({
          originalName: file.originalname,
          key: result.key,
          etag: result.etag,
          location: result.location,
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    res.json({
      success: errors.length === 0,
      uploaded: results.length,
      total: files.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bulk upload failed',
    });
  }
});

// Download file with streaming
router.get('/download/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    const { decompress = 'auto' } = req.query;

    const s3Client = getOptimizedS3Client();

    // Create temporary file for download
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `download_${Date.now()}_${path.basename(key)}`);

    const shouldDecompress =
      decompress === 'true' || (decompress === 'auto' && key.endsWith('.gz'));

    const downloadedPath = await s3Client.downloadFile(key, tempFilePath, {
      decompress: shouldDecompress,
      onProgress: (progress: UploadProgress) => {
        // Could implement Server-Sent Events for download progress
        console.log(`Download progress: ${progress.percentage}%`);
      },
    });

    // Send file to client
    const fileName = path.basename(downloadedPath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(downloadedPath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(downloadedPath, err => {
        if (err) {console.warn('Failed to cleanup temp file:', err);}
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    });
  }
});

// Generate presigned URL for direct access
router.post('/presigned-url', async (req, res) => {
  try {
    const { key, operation = 'getObject', expiresIn = 3600 } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    const s3Client = getOptimizedS3Client();
    const url = await s3Client.generatePresignedUrl(
      key,
      operation as 'getObject' | 'putObject',
      parseInt(expiresIn)
    );

    res.json({
      success: true,
      url,
      expiresIn: parseInt(expiresIn),
      expiresAt: new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL',
    });
  }
});

// File validation endpoint
router.post('/validate', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key is required',
      });
    }

    const s3Client = getOptimizedS3Client();
    const validation = await s3Client.validateFile(key);

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('Error validating file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File validation failed',
    });
  }
});

// Bulk delete files
router.delete('/bulk', async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'File keys array is required',
      });
    }

    const s3Client = getOptimizedS3Client();
    const result = await s3Client.bulkDelete(keys);

    res.json({
      success: result.errors.length === 0,
      deleted: result.deleted,
      errors: result.errors,
      summary: {
        totalRequested: keys.length,
        deleted: result.deleted.length,
        failed: result.errors.length,
      },
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bulk delete failed',
    });
  }
});

// Create archive of multiple files
router.post('/archive', async (req, res) => {
  try {
    const { keys, archiveName = 'files.zip', format = 'zip' } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'File keys array is required',
      });
    }

    const s3Client = getOptimizedS3Client();
    const archivePath = await s3Client.createArchive(keys, archiveName, format as 'zip' | 'tar');

    // Send archive file to client
    res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);
    res.setHeader('Content-Type', format === 'zip' ? 'application/zip' : 'application/x-tar');

    const fileStream = fs.createReadStream(archivePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(archivePath, err => {
        if (err) {console.warn('Failed to cleanup archive file:', err);}
      });
    });
  } catch (error) {
    console.error('Error creating archive:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Archive creation failed',
    });
  }
});

// Cleanup old files
router.post('/cleanup', mockIsAuthenticated, async (req, res) => {
  try {
    const { prefix = '', olderThanDays = 30, keepVersions = 5 } = req.body;

    const s3Client = getOptimizedS3Client();
    const result = await s3Client.cleanupOldFiles({
      prefix,
      olderThanDays: parseInt(olderThanDays),
      keepVersions: parseInt(keepVersions),
    });

    res.json({
      success: true,
      cleanup: {
        deletedCount: result.deletedCount,
        totalSizeFreed: result.totalSize,
        totalSizeFreedMB: Math.round((result.totalSize / (1024 * 1024)) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error cleaning up files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    });
  }
});

// WebSocket endpoint for real-time progress updates (temporarily disabled)
// TODO: Re-enable after proper WebSocket setup
/*
router.ws('/progress', (ws, req) => {
  const sessionId = req.query.sessionId as string;
  
  if (sessionId) {
    progressConnections.set(sessionId, ws);
    
    ws.on('close', () => {
      progressConnections.delete(sessionId);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      progressConnections.delete(sessionId);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection-established',
      sessionId,
      timestamp: new Date().toISOString()
    }));
  } else {
    ws.close(1008, 'Session ID required');
  }
});
*/

export default router;
