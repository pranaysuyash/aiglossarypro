import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { parseExcelFile, importToDatabase } from './excelParser';
import { streamExcelFile } from './excelStreamer';

// S3 client configuration
let s3Client: S3Client | null = null;

// Initialize S3 client with credentials
export function initS3Client() {
  // Log environment variables (excluding sensitive values)
  console.log('Initializing S3 client with credentials');
  console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
  console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
  
  // Check if required environment variables are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS credentials not found. S3 functionality will not work.');
    return;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1', // Use ap-south-1 based on the error message
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    console.log('S3 client initialized with region: ap-south-1');
  }
  
  return s3Client;
}

// Get S3 client (initialize if needed)
export function getS3Client(): S3Client {
  if (!s3Client) {
    const client = initS3Client();
    if (!client) {
      throw new Error('Failed to initialize S3 client. Check your AWS credentials.');
    }
    s3Client = client;
  }
  return s3Client;
}

/**
 * List Excel files in S3 bucket
 */
export async function listExcelFiles(bucketName: string, prefix: string = '') {
  try {
    const s3 = getS3Client();
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    
    const response = await s3.send(command);
    
    // Filter for Excel files
    const excelFiles = response.Contents?.filter(item => 
      item.Key?.endsWith('.xlsx') || item.Key?.endsWith('.xls')
    ).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    })) || [];
    
    return excelFiles;
  } catch (error) {
    console.error('Error listing files from S3:', error);
    throw error;
  }
}

/**
 * Download file from S3 to local storage
 */
export async function downloadFileFromS3(
  bucketName: string, 
  key: string, 
  destinationPath: string
) {
  try {
    const s3 = getS3Client();
    
    // Ensure directory exists
    const dir = path.dirname(destinationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3.send(command);
    
    // Write stream for file
    const writeStream = fs.createWriteStream(destinationPath);
    
    // Process the stream
    return new Promise<string>((resolve, reject) => {
      if (!response.Body) {
        reject(new Error('No data received from S3'));
        return;
      }
      
      // @ts-ignore - Body should have pipe method as a readable stream
      response.Body.pipe(writeStream)
        .on('error', (err: Error) => {
          console.error('Error writing file:', err);
          reject(err);
        })
        .on('close', () => {
          console.log(`File downloaded successfully to ${destinationPath}`);
          resolve(destinationPath);
        });
    });
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    throw error;
  }
}

/**
 * Upload file to S3
 */
export async function uploadFileToS3(
  bucketName: string, 
  key: string, 
  filePath: string
) {
  try {
    const s3 = getS3Client();
    
    // Read file
    const fileContent = fs.readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      // Enable server-side encryption
      ServerSideEncryption: 'AES256',
      // Set metadata to track versions in application
      Metadata: {
        'x-amz-meta-version-date': new Date().toISOString(),
        'x-amz-meta-version-info': 'Uploaded via AI/ML Glossary App'
      }
    });
    
    const response = await s3.send(command);
    console.log(`File uploaded successfully to s3://${bucketName}/${key}`);
    
    return response;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Delete file from S3
 */
export async function deleteFileFromS3(bucketName: string, key: string) {
  try {
    const s3 = getS3Client();
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3.send(command);
    console.log(`File deleted successfully: s3://${bucketName}/${key}`);
    
    return response;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

/**
 * Process Excel file from S3
 * Downloads file to temporary location, processes it, then deletes the temp file
 */
export async function processExcelFromS3(
  bucketName: string, 
  key: string, 
  useStreaming: boolean = false
) {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate a unique temp file path
    const tempFilePath = path.join(tempDir, `s3_${Date.now()}_${path.basename(key)}`);
    
    // Download the file
    await downloadFileFromS3(bucketName, key, tempFilePath);
    
    let result;
    
    // Process based on file size and streaming preference
    const fileStats = fs.statSync(tempFilePath);
    const fileSizeMB = fileStats.size / (1024 * 1024);
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 100 || useStreaming) {
      // Use streaming for large files
      console.log(`Using streaming processor for large file (${fileSizeMB.toFixed(2)} MB)`);
      result = await streamExcelFile(tempFilePath, 500); // Process 500 rows at a time
    } else {
      // Use standard processor for smaller files
      console.log('Using standard processor for file');
      const buffer = fs.readFileSync(tempFilePath);
      const parsedData = await parseExcelFile(buffer);
      result = await importToDatabase(parsedData);
    }
    
    // Clean up the temp file
    fs.unlinkSync(tempFilePath);
    console.log('Temporary file deleted');
    
    return result;
  } catch (error) {
    console.error('Error processing Excel from S3:', error);
    throw error;
  }
}

/**
 * Get file size from S3 (in bytes)
 */
export async function getFileSizeFromS3(bucketName: string, key: string): Promise<number> {
  try {
    const s3 = getS3Client();
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: key
    });
    
    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      throw new Error(`File not found: s3://${bucketName}/${key}`);
    }
    
    const file = response.Contents.find(item => item.Key === key);
    return file?.Size || 0;
  } catch (error) {
    console.error('Error getting file size from S3:', error);
    throw error;
  }
}