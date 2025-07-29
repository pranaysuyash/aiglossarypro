/**
 * Media Management Routes
 * Handles image and media upload/management for rich content
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express'
import type { Request, Response } from 'express';
import multer from 'multer';
import type { ApiResponse } from '@aiglossarypro/shared/types';
import { db } from '@aiglossarypro/database';
import { requireAdmin } from '../middleware/adminAuth';
import { log as logger } from '../utils/logger';

// File type validation using magic numbers
const FILE_SIGNATURES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftypmp4
  'video/webm': [0x1a, 0x45, 0xdf, 0xa3],
};

async function validateFileContent(filePath: string, declaredMimeType: string): Promise<boolean> {
  try {
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(20); // Read first 20 bytes
    await fd.read(buffer, 0, 20, 0);
    await fd.close();

    const signature = FILE_SIGNATURES[declaredMimeType as keyof typeof FILE_SIGNATURES];
    if (!signature) {return false;}

    // Check if file starts with expected signature
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  } catch (error) {
    logger.error('File validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

const mediaRouter = Router();

// Create media table if it doesn't exist
const createMediaTable = async () => {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS media_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        caption TEXT,
        upload_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_media_files_term_id 
      ON media_files(term_id) WHERE term_id IS NOT NULL
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_media_files_mime_type 
      ON media_files(mime_type)
    `);

    logger.info('Media files table initialized');
  } catch (error) {
    logger.error('Error creating media table', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Initialize media table
createMediaTable();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'media');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
    }
  },
});

// Upload media file
mediaRouter.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Security: Validate file content matches declared MIME type
      const isValidContent = await validateFileContent(req.file.path, req.file.mimetype);
      if (!isValidContent) {
        // Delete the uploaded file since it failed validation
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.warn('Could not delete invalid file', {
            error: unlinkError instanceof Error ? unlinkError.message : String(unlinkError),
          });
        }

        return res.status(400).json({
          success: false,
          error: 'File content does not match declared file type',
        });
      }

      const { altText, caption, termId } = req.body;
      const userId = req.user?.claims?.sub;

      // Get image dimensions if it's an image
      const width = null;
      const height = null;

      if (req.file.mimetype.startsWith('image/')) {
        // You might want to use a library like 'sharp' for better image processing
        // For now, we'll skip dimensions
      }

      const publicUrl = `/uploads/media/${req.file.filename}`;

      // Save file info to database
      const mediaFile = await db.execute(sql`
      INSERT INTO media_files (
        filename, original_name, mime_type, file_size, width, height,
        alt_text, caption, upload_path, public_url, term_id, uploaded_by
      ) VALUES (
        ${req.file.filename}, ${req.file.originalname}, ${req.file.mimetype},
        ${req.file.size}, ${width}, ${height}, ${altText || null}, ${caption || null},
        ${req.file.path}, ${publicUrl}, ${termId || null}, ${userId}
      ) RETURNING *
    `);

      res.json({
        success: true,
        data: mediaFile.rows?.[0],
      });
    } catch (error) {
      logger.error('Media upload error', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'Failed to upload media file',
      });
    }
  }
);

// Get media files
mediaRouter.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { termId, type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build parameterized query conditions
    let query = sql`SELECT * FROM media_files`;
    let countQuery = sql`SELECT COUNT(*) as count FROM media_files`;

    const conditions = [];

    if (termId) {
      conditions.push(sql`term_id = ${termId}`);
    }

    if (type) {
      conditions.push(sql`mime_type LIKE ${`${type}/%`}`);
    }

    if (conditions.length > 0) {
      const whereClause = sql.join(conditions, sql` AND `);
      query = sql`SELECT * FROM media_files WHERE ${whereClause}`;
      countQuery = sql`SELECT COUNT(*) as count FROM media_files WHERE ${whereClause}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${offset}`;

    const mediaFiles = await db.execute(query);
    const countResult = await db.execute(countQuery);

    res.json({
      success: true,
      data: {
        files: mediaFiles,
        pagination: {
          total: Number((countResult.rows?.[0] as any)?.count || 0),
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(Number((countResult.rows?.[0] as any)?.count || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Media list error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media files',
    });
  }
});

// Update media metadata
mediaRouter.patch('/:id', requireAdmin, async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const { altText, caption, termId } = req.body;

    const updatedFile = await db.execute(sql`
      UPDATE media_files 
      SET alt_text = ${altText}, caption = ${caption}, term_id = ${termId || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);

    res.json({
      success: true,
      data: updatedFile.rows?.[0],
    });
  } catch (error) {
    logger.error('Media update error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update media file',
    });
  }
});

// Delete media file
mediaRouter.delete('/:id', requireAdmin, async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    // Get file info first
    const fileInfo = await db.execute(sql`
      SELECT upload_path FROM media_files WHERE id = ${id}
    `);

    if (fileInfo.rows?.length && fileInfo.rows[0]) {
      // Delete physical file
      try {
        await fs.unlink((fileInfo.rows[0] as any).upload_path);
      } catch (error) {
        logger.warn('Could not delete physical file', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Delete database record
    await db.execute(sql`
      DELETE FROM media_files WHERE id = ${id}
    `);

    res.json({
      success: true,
      data: { message: 'Media file deleted successfully' },
    });
  } catch (error) {
    logger.error('Media delete error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete media file',
    });
  }
});

// Serve uploaded files
mediaRouter.get('/serve/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Security: Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
      });
    }

    // Security: Only allow alphanumeric, dash, underscore, and dot
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format',
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'media', filename);

    // Security: Ensure resolved path is still within uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'media');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
      return res.status(400).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Get file info from database for security
    const fileInfo = await db.execute(sql`
      SELECT mime_type, original_name FROM media_files WHERE filename = ${filename}
    `);

    if (!fileInfo.rows?.length) {
      return res.status(404).json({
        success: false,
        error: 'File not found in database',
      });
    }

    const file = fileInfo.rows[0] as unknown;

    // Security: Sanitize headers to prevent header injection
    const safeOriginalName = (file.original_name || 'download').replace(/["\\r\\n]/g, '');

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Media serve error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to serve media file',
    });
  }
});

// Register media routes
export function registerMediaRoutes(app: any): void {
  app.use('/api/media', mediaRouter);
  logger.info('Media management routes registered');
}

export { mediaRouter };
