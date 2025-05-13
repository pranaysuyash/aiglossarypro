import * as ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { categories, subcategories, terms, termSubcategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ProcessResult {
  processed: number;
  totalRows: number;
  success: boolean;
  error?: string;
}

/**
 * Process a large Excel file by streaming it row by row
 * @param filePath Path to the large Excel file
 * @param batchSize Number of rows to process in each batch
 */
export async function streamExcelFile(
  filePath: string, 
  batchSize: number = 100
): Promise<ProcessResult> {
  console.log(`Starting to process Excel file: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      processed: 0,
      totalRows: 0,
      success: false,
      error: `File not found: ${filePath}`
    };
  }
  
  const workbook = new ExcelJS.Workbook();
  const result: ProcessResult = {
    processed: 0,
    totalRows: 0,
    success: true
  };
  
  try {
    // Open a stream to the file
    const stream = fs.createReadStream(filePath);
    
    // Create a workbook from the stream
    await workbook.xlsx.read(stream);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return {
        processed: 0,
        totalRows: 0,
        success: false,
        error: 'Excel file has no worksheets'
      };
    }
    
    // Map column headers
    const headers: Record<string, number> = {};
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers[cell.value?.toString().toLowerCase() || ''] = colNumber;
    });
    
    // Validate required columns
    const requiredColumns = ['name', 'definition', 'category'];
    const missingColumns = requiredColumns.filter(col => !(col in headers));
    if (missingColumns.length > 0) {
      return {
        processed: 0,
        totalRows: 0,
        success: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }
    
    result.totalRows = worksheet.rowCount - 1; // Excluding header
    const categories = new Set<string>();
    const subcats = new Map<string, Set<string>>();
    
    // Process in batches
    let currentBatch: any[] = [];
    let processedCount = 0;
    
    // Process rows in batches
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;
      
      const termName = row.getCell(headers.name).value?.toString().trim();
      const definition = row.getCell(headers.definition).value?.toString().trim();
      
      // Skip if name or definition is missing
      if (!termName || !definition) continue;
      
      // Process category and subcategories
      let categoryName = '';
      let subCategoryList: string[] = [];
      
      if ('category' in headers) {
        const categoryPath = row.getCell(headers.category).value?.toString().trim() || '';
        if (categoryPath) {
          // Parse category path
          const parts = categoryPath.split('-').map(p => p.trim());
          categoryName = parts[0];
          
          // Add category to set
          categories.add(categoryName);
          
          // Process subcategories (if any)
          if (parts.length > 1) {
            subCategoryList = parts.slice(1);
            
            // Add subcategories to map
            if (!subcats.has(categoryName)) {
              subcats.set(categoryName, new Set<string>());
            }
            
            for (const subcat of subCategoryList) {
              subcats.get(categoryName)?.add(subcat);
            }
          }
        }
      }
      
      // Create term object
      const term = {
        name: termName,
        definition: definition,
        shortDefinition: row.getCell(headers.shortdefinition || 0).value?.toString().trim() || '',
        category: categoryName,
        subcategories: subCategoryList,
        characteristics: row.getCell(headers.characteristics || 0).value?.toString().trim()?.split(',').map(c => c.trim()) || [],
        visual: row.getCell(headers.visual || 0).value?.toString().trim() || '',
        mathFormulation: row.getCell(headers.mathformulation || 0).value?.toString().trim() || '',
        references: row.getCell(headers.references || 0).value?.toString().trim()?.split(',').map(r => r.trim()) || []
      };
      
      currentBatch.push(term);
      
      // If we've reached the batch size or this is the last row, process the batch
      if (currentBatch.length >= batchSize || rowNumber === worksheet.rowCount) {
        await processBatch({
          terms: currentBatch,
          categories,
          subcats
        });
        
        processedCount += currentBatch.length;
        console.log(`Processed ${processedCount}/${result.totalRows} rows`);
        
        // Reset batch
        currentBatch = [];
      }
    }
    
    result.processed = processedCount;
    return result;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return {
      processed: 0,
      totalRows: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process a batch of terms
 */
async function processBatch(data: {
  terms: any[],
  categories: Set<string>,
  subcats: Map<string, Set<string>>
}) {
  // Store categories first
  for (const categoryName of data.categories) {
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.name, categoryName))
      .limit(1);
    
    if (existingCategory.length === 0) {
      await db.insert(categories).values({
        name: categoryName
      });
    }
  }
  
  // Store subcategories
  for (const [categoryName, subcategorySet] of data.subcats.entries()) {
    // Get category ID
    const [category] = await db.select()
      .from(categories)
      .where(eq(categories.name, categoryName))
      .limit(1);
    
    if (!category) continue;
    
    // Store each subcategory
    for (const subcategoryName of subcategorySet) {
      const existingSubcategory = await db.select()
        .from(subcategories)
        .where(eq(subcategories.name, subcategoryName))
        .limit(1);
      
      if (existingSubcategory.length === 0) {
        await db.insert(subcategories).values({
          name: subcategoryName,
          categoryId: category.id
        });
      }
    }
  }
  
  // Store terms
  for (const termData of data.terms) {
    // Get category ID
    let categoryId: string | null = null;
    
    if (termData.category) {
      const [category] = await db.select()
        .from(categories)
        .where(eq(categories.name, termData.category))
        .limit(1);
      
      if (category) {
        categoryId = category.id;
      }
    }
    
    // Check if term exists
    const existingTerms = await db.select()
      .from(terms)
      .where(eq(terms.name, termData.name))
      .limit(1);
    
    let termId: string;
    
    if (existingTerms.length > 0) {
      // Update existing term
      termId = existingTerms[0].id;
      await db.update(terms)
        .set({
          definition: termData.definition,
          shortDefinition: termData.shortDefinition || null,
          categoryId: categoryId,
          updatedAt: new Date()
        })
        .where(eq(terms.id, termId));
    } else {
      // Insert new term
      const [newTerm] = await db.insert(terms)
        .values({
          name: termData.name,
          definition: termData.definition,
          shortDefinition: termData.shortDefinition || null,
          categoryId: categoryId,
        })
        .returning({ id: terms.id });
      
      termId = newTerm.id;
    }
    
    // Process subcategories for this term
    if (termData.subcategories && termData.subcategories.length > 0) {
      // Get subcategory IDs
      for (const subcategoryName of termData.subcategories) {
        const [subcategory] = await db.select()
          .from(subcategories)
          .where(eq(subcategories.name, subcategoryName))
          .limit(1);
        
        if (subcategory) {
          // Check if termSubcategory relation exists
          const existingRelation = await db.select()
            .from(termSubcategories)
            .where(eq(termSubcategories.termId, termId))
            .where(eq(termSubcategories.subcategoryId, subcategory.id))
            .limit(1);
          
          if (existingRelation.length === 0) {
            // Create relation
            await db.insert(termSubcategories)
              .values({
                termId: termId,
                subcategoryId: subcategory.id
              });
          }
        }
      }
    }
  }
}

/**
 * Split a large Excel file into smaller chunks
 * @param sourceFilePath Path to the large Excel file
 * @param outputDir Directory to save the split files
 * @param rowsPerFile Number of rows per split file
 */
export async function splitExcelFile(
  sourceFilePath: string,
  outputDir: string,
  rowsPerFile: number = 1000
): Promise<string[]> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourceFilePath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('Excel file has no worksheets');
  }
  
  const totalRows = worksheet.rowCount;
  const headerRow = worksheet.getRow(1);
  const headers: any[] = [];
  
  // Extract headers
  headerRow.eachCell(cell => {
    headers.push(cell.value);
  });
  
  const fileNames: string[] = [];
  let currentRowStart = 2; // Start after header
  
  // Calculate how many files we'll create
  const totalFiles = Math.ceil((totalRows - 1) / rowsPerFile);
  
  for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
    const endRow = Math.min(currentRowStart + rowsPerFile - 1, totalRows);
    
    // Create a new workbook for this chunk
    const chunkWorkbook = new ExcelJS.Workbook();
    const chunkWorksheet = chunkWorkbook.addWorksheet('Sheet1');
    
    // Add header row
    chunkWorksheet.addRow(headers);
    
    // Add data rows
    for (let rowNum = currentRowStart; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const values: any[] = [];
      
      row.eachCell(cell => {
        values.push(cell.value);
      });
      
      chunkWorksheet.addRow(values);
    }
    
    // Save the chunk
    const fileName = `part_${fileIndex + 1}_of_${totalFiles}.xlsx`;
    const filePath = path.join(outputDir, fileName);
    await chunkWorkbook.xlsx.writeFile(filePath);
    
    fileNames.push(filePath);
    console.log(`Created split file: ${filePath}`);
    
    // Move to next chunk
    currentRowStart = endRow + 1;
  }
  
  return fileNames;
}