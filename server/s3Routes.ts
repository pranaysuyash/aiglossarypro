import { Router } from 'express';
import { 
  listExcelFiles, 
  processExcelFromS3,
  getS3Client,
  initS3Client
} from './s3Service';
import { processAndImportFromS3 } from './pythonProcessor';
// Import appropriate auth based on configuration
import { features } from './config';
import { authenticateToken, requireAdmin } from './middleware/adminAuth';
import { mockIsAuthenticated, mockAuthenticateToken, mockRequireAdmin } from './middleware/dev/mockAuth';

const router = Router();

// Choose authentication middleware based on environment  
const authMiddleware = features.isDevelopment ? mockIsAuthenticated : mockIsAuthenticated; // Using mock for now
const tokenMiddleware = mockAuthenticateToken;
const adminMiddleware = mockRequireAdmin;

// Check S3 setup status - REQUIRES ADMIN
router.get('/setup', authMiddleware, tokenMiddleware, adminMiddleware, async (req, res) => {
  try {
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    const hasBucketName = !!process.env.S3_BUCKET_NAME;
    
    // Initialize S3 client if not already initialized
    let s3Client;
    try {
      s3Client = getS3Client();
    } catch (e) {
      // If getS3Client fails, try to initialize a new one
      s3Client = initS3Client();
    }
    
    if (!s3Client || !hasAccessKey || !hasSecretKey || !hasBucketName) {
      console.log('S3 credentials missing or incomplete:',
        { hasAccessKey, hasSecretKey, hasBucketName, hasS3Client: !!s3Client });
    }
    
    res.json({
      initialized: !!s3Client && hasAccessKey && hasSecretKey && hasBucketName,
      credentials: {
        hasAccessKey,
        hasSecretKey,
        hasBucketName
      },
      bucketName: hasBucketName ? process.env.S3_BUCKET_NAME : null,
      region: process.env.AWS_REGION || 'ap-south-1'
    });
  } catch (error) {
    console.error("Error checking S3 setup:", error);
    res.status(500).json({
      initialized: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// List Excel files in S3 bucket - REQUIRES ADMIN
router.get('/list-files', authMiddleware, tokenMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    if (!bucketName) {
      return res.status(400).json({ 
        success: false,
        message: "S3 bucket name not configured" 
      });
    }
    
    const prefix = req.query.prefix || '';
    const files = await listExcelFiles(bucketName, prefix as string);
    
    res.json({
      success: true,
      files: files.map(file => ({
        key: file.key,
        size: file.size,
        lastModified: file.lastModified?.toISOString() || new Date().toISOString()
      }))
    });
  } catch (error) {
    console.error("Error listing S3 files:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to list files from S3",
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Python-based Excel processing - REQUIRES ADMIN
router.get('/python-import', authMiddleware, tokenMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const fileKey = req.query.fileKey as string | undefined;
    const maxChunks = req.query.maxChunks ? parseInt(req.query.maxChunks as string) : undefined;
    
    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: 'S3 bucket name not configured'
      });
    }
    
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'No file key provided'
      });
    }
    
    const result = await processAndImportFromS3(bucketName, fileKey, 'ap-south-1', maxChunks);
    return res.json(result);
  } catch (error) {
    console.error('Error in Python Excel processing:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during Python Excel processing',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;