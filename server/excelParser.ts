import ExcelJS from 'exceljs';
import { optimizedStorage as storage } from "./optimizedStorage";
import { db } from './db';
import { terms, categories, subcategories, termSubcategories } from '../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';

interface ExcelTerm {
  name: string;
  definition: string;
  shortDefinition?: string;
  category?: string;
  subcategories?: string[];
  characteristics?: string[];
  visual?: string;
  mathFormulation?: string;
  references?: string[];
}

interface ParsedData {
  terms: ExcelTerm[];
  categories: Set<string>;
  subcats: Map<string, Set<string>>;
}

/**
 * Parse Excel file content and extract terms, categories, and subcategories
 */
export async function parseExcelFile(buffer: Buffer): Promise<ParsedData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('Excel file has no worksheets');
  }
  
  // Check required columns
  const firstRow = worksheet.getRow(1);
  const requiredColumns = ['name', 'definition', 'category'];
  const headers: Record<string, number> = {};
  
  // Map column names to indexes
  firstRow.eachCell((cell, colNumber) => {
    headers[cell.value?.toString().toLowerCase() || ''] = colNumber;
  });
  
  // Validate required columns exist
  const missingColumns = requiredColumns.filter(col => !(col in headers));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  const parsedData: ParsedData = {
    terms: [],
    categories: new Set<string>(),
    subcats: new Map<string, Set<string>>()
  };
  
  // Process rows starting from row 2 (skip header)
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (row.hasValues) {
      const termName = row.getCell(headers.name).value?.toString().trim();
      const definition = row.getCell(headers.definition).value?.toString().trim();
      
      // Skip if name or definition is missing
      if (!termName || !definition) {
        continue;
      }
      
      // Process category and subcategories
      let categoryName = '';
      let subCategoryList: string[] = [];
      
      if ('category' in headers) {
        const categoryPath = row.getCell(headers.category).value?.toString().trim() || '';
        if (categoryPath) {
          // Parse category path like "a - b - c" into categories
          const parts = categoryPath.split('-').map(p => p.trim());
          categoryName = parts[0];
          parsedData.categories.add(categoryName);
          
          // Add subcategories
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
              if (parts[i]) {
                subCategoryList.push(parts[i]);
                
                if (!parsedData.subcats.has(categoryName)) {
                  parsedData.subcats.set(categoryName, new Set<string>());
                }
                parsedData.subcats.get(categoryName)!.add(parts[i]);
              }
            }
          }
        }
      }
      
      // Get short definition (for cards)
      let shortDef = '';
      if ('shortdefinition' in headers) {
        shortDef = row.getCell(headers.shortdefinition).value?.toString().trim() || '';
      }
      
      // If no short definition is provided, create one from the main definition
      if (!shortDef) {
        shortDef = definition.length > 150 
          ? definition.substring(0, 150).trim() + '...' 
          : definition;
      }
      
      // Get characteristics (bullet points)
      let characteristics: string[] = [];
      if ('characteristics' in headers) {
        const chars = row.getCell(headers.characteristics).value?.toString().trim();
        if (chars) {
          characteristics = chars.split('\n').map(c => c.trim()).filter(c => c.length > 0);
        }
      }
      
      // Get visual URL or reference
      let visual = '';
      if ('visual' in headers) {
        visual = row.getCell(headers.visual).value?.toString().trim() || '';
      }
      
      // Get mathematical formulation
      let mathFormulation = '';
      if ('mathformulation' in headers) {
        mathFormulation = row.getCell(headers.mathformulation).value?.toString().trim() || '';
      }
      
      // Get references
      let references: string[] = [];
      if ('references' in headers) {
        const refs = row.getCell(headers.references).value?.toString().trim();
        if (refs) {
          references = refs.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        }
      }
      
      // Add the term to our parsed data
      parsedData.terms.push({
        name: termName,
        definition,
        shortDefinition: shortDef,
        category: categoryName,
        subcategories: subCategoryList,
        characteristics,
        visual,
        mathFormulation,
        references
      });
    }
  }
  
  return parsedData;
}

/**
 * Import the parsed Excel data into the database
 */
export async function importToDatabase(parsedData: ParsedData): Promise<{
  termsImported: number;
  categoriesImported: number;
}> {
  // First, import categories
  const categoryMap = new Map<string, string>(); // Maps category name to ID
  const subcategoryMap = new Map<string, string>(); // Maps subcategory name to ID
  
  // Import main categories first
  for (const categoryName of parsedData.categories) {
    try {
      // Check if the category already exists
      const existingCategory = await db.select().from(categories)
        .where(eq(categories.name, categoryName));
      
      if (existingCategory.length > 0) {
        categoryMap.set(categoryName, existingCategory[0].id);
      } else {
        // Insert new category
        const [newCategory] = await db.insert(categories)
          .values({ name: categoryName })
          .returning();
        
        categoryMap.set(categoryName, newCategory.id);
      }
    } catch (error) {
      console.error(`Error importing category ${categoryName}:`, error);
    }
  }
  
  // Import subcategories
  for (const [categoryName, subcats] of parsedData.subcats.entries()) {
    const categoryId = categoryMap.get(categoryName);
    if (!categoryId) continue;
    
    for (const subcatName of subcats) {
      try {
        // Check if the subcategory already exists
        const existingSubcat = await db.select().from(subcategories)
          .where(and(
            eq(subcategories.name, subcatName),
            eq(subcategories.categoryId, categoryId)
          ));
        
        if (existingSubcat.length > 0) {
          subcategoryMap.set(`${categoryName}:${subcatName}`, existingSubcat[0].id);
        } else {
          // Insert new subcategory
          const [newSubcat] = await db.insert(subcategories)
            .values({ name: subcatName, categoryId })
            .returning();
          
          subcategoryMap.set(`${categoryName}:${subcatName}`, newSubcat.id);
        }
      } catch (error) {
        console.error(`Error importing subcategory ${subcatName}:`, error);
      }
    }
  }
  
  // Import terms
  let termsImported = 0;
  
  for (const termData of parsedData.terms) {
    try {
      const categoryId = categoryMap.get(termData.category || '') || null;
      
      // Check if term already exists
      const existingTerm = await db.select().from(terms)
        .where(eq(terms.name, termData.name));
      
      let termId: string;
      
      if (existingTerm.length > 0) {
        // Update existing term
        const [updatedTerm] = await db.update(terms)
          .set({
            definition: termData.definition,
            shortDefinition: termData.shortDefinition,
            categoryId,
            characteristics: termData.characteristics,
            visualUrl: termData.visual,
            mathFormulation: termData.mathFormulation,
            references: termData.references,
            updatedAt: new Date()
          })
          .where(eq(terms.id, existingTerm[0].id))
          .returning();
        
        termId = updatedTerm.id;
      } else {
        // Insert new term
        const [newTerm] = await db.insert(terms)
          .values({
            name: termData.name,
            definition: termData.definition,
            shortDefinition: termData.shortDefinition,
            categoryId,
            characteristics: termData.characteristics,
            visualUrl: termData.visual,
            mathFormulation: termData.mathFormulation,
            references: termData.references
          })
          .returning();
        
        termId = newTerm.id;
        termsImported++;
      }
      
      // Link term to subcategories
      if (termData.subcategories && termData.subcategories.length > 0 && termData.category) {
        // First, delete existing links
        await db.delete(termSubcategories)
          .where(eq(termSubcategories.termId, termId));
        
        // Add new links
        for (const subcatName of termData.subcategories) {
          const subcatId = subcategoryMap.get(`${termData.category}:${subcatName}`);
          if (subcatId) {
            await db.insert(termSubcategories)
              .values({ termId, subcategoryId: subcatId })
              .onConflictDoNothing();
          }
        }
      }
    } catch (error) {
      console.error(`Error importing term ${termData.name}:`, error);
    }
  }
  
  return {
    termsImported,
    categoriesImported: categoryMap.size
  };
}
