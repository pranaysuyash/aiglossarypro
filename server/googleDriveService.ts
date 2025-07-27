import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { google } from 'googleapis';

import logger from './utils/logger';
// Note: Excel processing functionality has been removed
// import { parseExcelFile, importToDatabase } from './excelParser';

// Scope for accessing files in Google Drive
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

interface DriveCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GoogleDriveAuth {
  accessToken: string;
  refreshToken?: string;
  expiry_date?: number;
}

/**
 * Create OAuth2 client for Google Drive
 */
function createOAuth2Client(credentials: DriveCredentials) {
  return new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );
}

/**
 * Generate a URL for Google authorization
 */
export function getAuthUrl(credentials: DriveCredentials): string {
  const oAuth2Client = createOAuth2Client(credentials);

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Get tokens from authorization code
 */
export async function getTokens(
  code: string,
  credentials: DriveCredentials
): Promise<GoogleDriveAuth> {
  const oAuth2Client = createOAuth2Client(credentials);
  const { tokens } = await oAuth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
  };
}

/**
 * Get Google Drive client with authentication
 */
function getDriveClient(auth: GoogleDriveAuth, credentials: DriveCredentials) {
  const oAuth2Client = createOAuth2Client(credentials);

  oAuth2Client.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken,
    expiry_date: auth.expiry_date,
  });

  return google.drive({ version: 'v3', auth: oAuth2Client });
}

/**
 * List files in Google Drive
 */
export async function listFiles(
  auth: GoogleDriveAuth,
  credentials: DriveCredentials,
  query = "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'"
) {
  const drive = getDriveClient(auth, credentials);

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size)',
    spaces: 'drive',
  });

  return response.data.files || [];
}

/**
 * Download file from Google Drive to local storage
 */
export async function downloadFile(
  auth: GoogleDriveAuth,
  credentials: DriveCredentials,
  fileId: string,
  destinationPath: string
): Promise<string> {
  const drive = getDriveClient(auth, credentials);

  return new Promise((resolve, reject) => {
    logger.info(`Downloading file ${fileId} to ${destinationPath}`);

    // Ensure directory exists
    const dir = path.dirname(destinationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create write stream
    const dest = fs.createWriteStream(destinationPath);

    drive.files
      .get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then(res => {
        const stream = res.data as unknown as Readable;

        stream
          .on('end', () => {
            logger.info('File downloaded successfully');
            resolve(destinationPath);
          })
          .on('error', err => {
            logger.error('Error downloading file:', err);
            reject(err);
          })
          .pipe(dest);
      })
      .catch(error => {
        logger.error('Error getting file:', error);
        reject(error);
      });
  });
}

/**
 * Process Excel file from Google Drive directly
 * Note: Excel processing functionality has been removed
 */
export async function processExcelFromDrive(
  _auth: GoogleDriveAuth,
  _credentials: DriveCredentials,
  _fileId: string
): Promise<unknown> {
  try {
    logger.info('⚠️  Excel processing functionality has been removed');
    throw new Error('Excel processing functionality has been removed');

    // Download to temporary file
    // const tempDir = path.join(process.cwd(), 'temp');
    // if (!fs.existsSync(tempDir)) {
    //   fs.mkdirSync(tempDir, { recursive: true });
    // }

    // const tempFile = path.join(tempDir, `${fileId}.xlsx`);
    // await downloadFile(auth, credentials, fileId, tempFile);

    // Read the file
    // const buffer = fs.readFileSync(tempFile);

    // Parse and import
    // const parsedData = await parseExcelFile(buffer);
    // const result = await importToDatabase(parsedData);

    // Clean up temporary file
    // fs.unlinkSync(tempFile);

    // return result;
  } catch (error) {
    logger.error('Error processing Excel from Drive:', error);
    throw error;
  }
}

/**
 * Stream files from Google Drive in chunks for processing
 * This is useful for very large files that can't be downloaded completely
 */
export async function streamExcelFromDrive(
  auth: GoogleDriveAuth,
  credentials: DriveCredentials,
  fileId: string
): Promise<unknown> {
  const drive = getDriveClient(auth, credentials);

  // Get metadata to check file size
  const fileMetadata = await drive.files.get({
    fileId,
    fields: 'size,name',
  });

  const fileSize = parseInt(fileMetadata.data.size as string, 10);
  logger.info(`File size: ${fileSize} bytes (${Math.round(fileSize / 1024 / 1024)} MB)`);

  // If file is too large, we should process it in chunks or use another strategy
  if (fileSize > 100 * 1024 * 1024) {
    // 100MB
    logger.info(
      'File is too large for direct processing, downloading to temporary file for streaming'
    );

    // For extremely large files, download to temp and process in chunks
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `${fileId}.xlsx`);
    await downloadFile(auth, credentials, fileId, tempFile);

    // Use the excelStreamer to process the large file
    // const { streamExcelFile } = require('./excelStreamer');
    // const result = await streamExcelFile(tempFile, 500); // Process 500 rows at a time
    logger.info('⚠️  Excel streaming functionality has been removed');
    throw new Error('Excel streaming functionality has been removed');
  } else {
    // For smaller files, process directly
    logger.info('⚠️  Excel processing functionality has been removed');
    throw new Error('Excel processing functionality has been removed');
    // return await processExcelFromDrive(auth, credentials, fileId);
  }
}
