import { Router } from 'express';
import logger from './utils/logger';
// Import appropriate auth based on configuration
import { features } from './config';
import { authenticateFirebaseToken, requireFirebaseAdmin } from './middleware/firebaseAuth';
import { multiAuthMiddleware } from './middleware/multiAuth';
import { processAndImportFromS3 } from './pythonProcessor';
import { getS3Client, initS3Client, listFiles } from './s3Service';

const router = Router();

// Use proper authentication middleware
const authMiddleware = multiAuthMiddleware;
const tokenMiddleware = authenticateFirebaseToken;
const adminMiddleware = requireFirebaseAdmin;

// Check S3 setup status - REQUIRES ADMIN
router.get('/setup', authMiddleware, tokenMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    const hasBucketName = !!process.env.S3_BUCKET_NAME;

    // Initialize S3 client if not already initialized
    let s3Client;
    try {
      s3Client = getS3Client();
    } catch (_e) {
      // If getS3Client fails, try to initialize a new one
      s3Client = initS3Client();
    }

    if (!s3Client || !hasAccessKey || !hasSecretKey || !hasBucketName) {
      logger.info('S3 credentials missing or incomplete:', {
        hasAccessKey,
        hasSecretKey,
        hasBucketName,
        hasS3Client: !!s3Client,
      });
    }

    res.json({
      initialized: !!s3Client && hasAccessKey && hasSecretKey && hasBucketName,
      credentials: {
        hasAccessKey,
        hasSecretKey,
        hasBucketName,
      },
      bucketName: hasBucketName ? process.env.S3_BUCKET_NAME : null,
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  } catch (error) {
    logger.error('Error checking S3 setup:', error);
    res.status(500).json({
      initialized: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// List files in S3 bucket - REQUIRES ADMIN
router.get('/list-files', authMiddleware, tokenMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'S3 bucket name not configured',
      });
    }

    const prefix = req.query.prefix || '';
    const files = await listFiles(bucketName, prefix as string);

    res.json({
      success: true,
      files: files.map(file => ({
        key: file.key,
        size: file.size,
        lastModified: file.lastModified?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Error listing S3 files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files from S3',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// General file processing - REQUIRES ADMIN
router.get('/process-file', authMiddleware, tokenMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const fileKey = req.query.fileKey as string | undefined;
    const maxChunks = req.query.maxChunks ? parseInt(req.query.maxChunks as string) : undefined;

    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'S3 bucket name not configured',
      });
    }

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'No file key provided',
      });
    }

    const result = await processAndImportFromS3(bucketName, fileKey, 'ap-south-1', maxChunks);
    return res.json(result);
  } catch (error) {
    logger.error('Error in file processing:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during file processing',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
