import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { categories, terms, subcategories, termSubcategories } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { exec } from 'child_process';

/**
 * Simple and direct import function for Excel data
 */
export async function importFromS3() {
  console.log('Starting S3 import...');
  
  // Initialize S3 client
  const s3 = new S3Client({
    region: 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });
  
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    console.error('S3 bucket name not configured');
    return;
  }
  
  try {
    // List Excel files in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName
    });
    
    const listResponse = await s3.send(listCommand);
    const files = listResponse.Contents?.filter(item => 
      item.Key?.endsWith('.xlsx') || item.Key?.endsWith('.xls')
    );
    
    if (!files || files.length === 0) {
      console.log('No Excel files found in bucket');
      return;
    }
    
    console.log(`Found ${files.length} Excel files in bucket`);
    
    // Download the first file
    const firstFile = files[0];
    if (!firstFile.Key) {
      console.error('No valid key for file');
      return;
    }
    
    console.log(`Processing file: ${firstFile.Key}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `s3_${Date.now()}_${path.basename(firstFile.Key)}`);
    
    // Download file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: firstFile.Key
    });
    
    const response = await s3.send(getCommand);
    
    if (!response.Body) {
      console.error('No data received from S3');
      return;
    }
    
    // Create write stream for file
    const writeStream = fs.createWriteStream(tempFilePath);
    
    // Process the stream
    // @ts-ignore - Body should be a readable stream
    await new Promise((resolve, reject) => {
      // @ts-ignore
      response.Body.pipe(writeStream)
        .on('error', (err: Error) => {
          console.error('Error writing file:', err);
          reject(err);
        })
        .on('close', () => {
          console.log(`File downloaded to ${tempFilePath}`);
          resolve(true);
        });
    });
    
    console.log('Processing Excel file...');
    
    // Process as CSV for simplicity
    const csvPath = tempFilePath.replace('.xlsx', '.csv');
    
    // Convert to CSV using a shell command
    await new Promise((resolve, reject) => {
      exec(`npx xlsx-cli "${tempFilePath}" -o "${csvPath}"`, (error: Error | null) => {
        if (error) {
          console.error('Error converting Excel to CSV:', error);
          reject(error);
          return;
        }
        console.log(`Converted to CSV: ${csvPath}`);
        resolve(true);
      });
    });
    
    // Process CSV file
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n');
      
      // Determine headers from first line
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Map indices
      const nameIndex = headers.indexOf('name');
      const definitionIndex = headers.indexOf('definition');
      const categoryIndex = headers.indexOf('category');
      
      if (nameIndex === -1 || definitionIndex === -1) {
        console.error('Required columns not found in CSV');
        return;
      }
      
      const categorySet = new Set<string>();
      const subcatMap = new Map<string, Set<string>>();
      
      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = lines[i].split(',');
        
        const name = row[nameIndex]?.trim();
        const definition = row[definitionIndex]?.trim();
        
        if (!name || !definition) continue;
        
        // Process category
        let categoryName = '';
        let subcats: string[] = [];
        
        if (categoryIndex !== -1 && row[categoryIndex]) {
          const categoryPath = row[categoryIndex].trim();
          if (categoryPath) {
            const parts = categoryPath.split('-').map(p => p.trim());
            categoryName = parts[0];
            categorySet.add(categoryName);
            
            if (parts.length > 1) {
              subcats = parts.slice(1);
              
              if (!subcatMap.has(categoryName)) {
                subcatMap.set(categoryName, new Set<string>());
              }
              
              for (const subcat of subcats) {
                subcatMap.get(categoryName)?.add(subcat);
              }
            }
          }
        }
        
        console.log(`Processed row ${i}: ${name}`);
      }
      
      // Store categories
      console.log(`Found ${categorySet.size} categories`);
      for (const catName of categorySet) {
        const existingCat = await db.select().from(categories).where(eq(categories.name, catName)).limit(1);
        
        if (existingCat.length === 0) {
          await db.insert(categories).values({ name: catName });
          console.log(`Added category: ${catName}`);
        }
      }
      
      // Store subcategories
      let subcatCount = 0;
      for (const [catName, subcatSet] of subcatMap.entries()) {
        const [category] = await db.select().from(categories).where(eq(categories.name, catName)).limit(1);
        
        if (!category) continue;
        
        for (const subcatName of subcatSet) {
          const existingSubcat = await db.select().from(subcategories).where(eq(subcategories.name, subcatName)).limit(1);
          
          if (existingSubcat.length === 0) {
            await db.insert(subcategories).values({
              name: subcatName,
              categoryId: category.id
            });
            subcatCount++;
          }
        }
      }
      console.log(`Added ${subcatCount} subcategories`);
      
      // Clean up
      try {
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(csvPath);
        console.log('Removed temporary files');
      } catch (err) {
        console.error('Error cleaning up temp files:', err);
      }
    } else {
      console.error('CSV file not created successfully');
    }
    
    return {
      success: true,
      message: 'Import completed'
    };
  } catch (error) {
    console.error('Error during import:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}