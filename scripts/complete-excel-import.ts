#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';
import { db } from '../server/db';
import { enhancedTerms, termSections, interactiveElements } from '../shared/enhancedSchema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Import the 42-section configuration
import COMPLETE_CONTENT_SECTIONS from './complete_42_sections_config';

interface ParsedRow {
  termName: string;
  columns: Map<string, any>;
}

async function parseExcelFile(filePath: string): Promise<ParsedRow[]> {
  console.log('📊 Reading Excel file...');
  const buffer = await readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (data.length < 2) {
    throw new Error('Excel file must have at least header row and one data row');
  }
  
  const headers = data[0] as string[];
  const rows: ParsedRow[] = [];
  
  console.log(`📋 Found ${headers.length} columns and ${data.length - 1} data rows`);
  
  // Process each data row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const termName = row[0]; // First column is always the term name
    if (!termName) continue;
    
    const columns = new Map<string, any>();
    
    // Map all columns by header name
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        columns.set(header, row[index]);
      }
    });
    
    rows.push({ termName: String(termName).trim(), columns });
  }
  
  return rows;
}

function mapColumnsToSections(columns: Map<string, any>): Map<string, any> {
  const sections = new Map<string, any>();
  
  // Process each section configuration
  for (const sectionConfig of COMPLETE_CONTENT_SECTIONS) {
    const sectionData: any = {};
    let hasData = false;
    
    // Extract data for each column in this section
    for (const columnName of sectionConfig.columns) {
      const value = columns.get(columnName);
      if (value !== undefined && value !== null && value !== '') {
        // Clean up the column name for the section data
        const cleanKey = columnName
          .replace(sectionConfig.sectionName + ' – ', '')
          .replace(/^[^–]+– /, '');
        
        sectionData[cleanKey] = value;
        hasData = true;
      }
    }
    
    if (hasData) {
      sections.set(sectionConfig.sectionName, sectionData);
    }
  }
  
  return sections;
}

function extractCategories(columns: Map<string, any>) {
  return {
    main: columns.get('Introduction – Category and Sub-category of the Term – Main Category')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    sub: columns.get('Introduction – Category and Sub-category of the Term – Sub-category')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    related: columns.get('Related Concepts – Connection to Other AI/ML Terms or Topics')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    domains: columns.get('Applications – Industries or Domains of Application')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    techniques: columns.get('Tags and Keywords – Technique or Algorithm Tags')?.split(',').map((s: string) => s.trim()).filter(Boolean) || []
  };
}

async function importTermToDatabase(termName: string, columns: Map<string, any>, sections: Map<string, any>) {
  console.log(`\n📝 Importing: ${termName}`);
  
  // Check if term already exists
  const existing = await db.select().from(enhancedTerms).where(eq(enhancedTerms.name, termName)).limit(1);
  
  if (existing.length > 0) {
    console.log(`  ⚠️  Term already exists, updating...`);
    // Delete existing sections to reimport
    await db.delete(termSections).where(eq(termSections.termId, existing[0].id));
    await db.delete(interactiveElements).where(eq(interactiveElements.termId, existing[0].id));
  }
  
  const categories = extractCategories(columns);
  
  // Create or update the enhanced term
  const termId = existing[0]?.id || crypto.randomUUID();
  const slug = termName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const termData = {
    id: termId,
    name: termName,
    slug,
    shortDefinition: columns.get('Introduction – Definition and Overview')?.substring(0, 500) || '',
    fullDefinition: columns.get('Introduction – Definition and Overview') || '',
    mainCategories: categories.main,
    subCategories: categories.sub,
    relatedConcepts: categories.related,
    applicationDomains: categories.domains,
    techniques: categories.techniques,
    difficultyLevel: 'intermediate',
    hasImplementation: !!columns.get('Implementation – Code Snippets or Pseudocode'),
    hasInteractiveElements: !!columns.get('Introduction – Interactive Element: Mermaid Diagram'),
    hasCaseStudies: !!columns.get('Case Studies – In-depth Analysis of Real-world Applications'),
    hasCodeExamples: !!columns.get('Implementation – Code Snippets or Pseudocode'),
    searchText: `${termName} ${categories.main.join(' ')} ${categories.sub.join(' ')} ${categories.domains.join(' ')}`,
    keywords: [...categories.main, ...categories.sub, ...categories.techniques].filter((v, i, a) => a.indexOf(v) === i),
    parseHash: crypto.createHash('md5').update(JSON.stringify(Array.from(columns.entries()))).digest('hex'),
    parseVersion: '2.0'
  };
  
  if (existing.length > 0) {
    await db.update(enhancedTerms).set(termData).where(eq(enhancedTerms.id, termId));
  } else {
    await db.insert(enhancedTerms).values(termData);
  }
  
  console.log(`  ✅ Term saved`);
  
  // Import all sections
  let sectionIndex = 0;
  console.log(`  📥 Importing ${sections.size} sections to database...`);
  
  for (const [sectionName, sectionContent] of sections) {
    try {
      console.log(`    💾 Importing section: ${sectionName} (${Object.keys(sectionContent).length} fields)`);
      
      await db.insert(termSections).values({
        id: crypto.randomUUID(),
        termId,
        sectionName,
        sectionData: sectionContent,
        displayType: COMPLETE_CONTENT_SECTIONS.find(s => s.sectionName === sectionName)?.displayType || 'main',
        priority: sectionIndex + 1
      });
      
      sectionIndex++;
      console.log(`      ✅ Success`);
    } catch (error) {
      console.log(`      ❌ Error importing ${sectionName}:`, error.message);
    }
  }
  
  console.log(`  ✅ ${sectionIndex} sections imported`);
  
  // Import interactive elements
  let elementCount = 0;
  
  // Mermaid diagram
  const mermaidContent = columns.get('Introduction – Interactive Element: Mermaid Diagram');
  if (mermaidContent) {
    await db.insert(interactiveElements).values({
      id: crypto.randomUUID(),
      termId,
      sectionName: 'Introduction',
      elementType: 'mermaid_diagram',
      elementData: { diagram: mermaidContent },
      displayOrder: elementCount++
    });
  }
  
  // Code examples
  const codeContent = columns.get('Implementation – Code Snippets or Pseudocode');
  if (codeContent) {
    await db.insert(interactiveElements).values({
      id: crypto.randomUUID(),
      termId,
      sectionName: 'Implementation',
      elementType: 'code_example',
      elementData: { code: codeContent, language: 'python' },
      displayOrder: elementCount++
    });
  }
  
  // Quiz elements
  const quizContent = columns.get('Quick Quiz – Interactive Element: Embedded Quiz Widgets');
  if (quizContent) {
    await db.insert(interactiveElements).values({
      id: crypto.randomUUID(),
      termId,
      sectionName: 'Quick Quiz',
      elementType: 'quiz',
      elementData: { quiz: quizContent },
      displayOrder: elementCount++
    });
  }
  
  if (elementCount > 0) {
    console.log(`  ✅ ${elementCount} interactive elements imported`);
  }
}

async function main() {
  console.log('🚀 Complete Excel Import Script');
  console.log('================================\n');
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'aiml2.xlsx');
    
    // Parse the Excel file
    const parsedRows = await parseExcelFile(filePath);
    console.log(`\n✅ Successfully parsed ${parsedRows.length} terms from Excel\n`);
    
    // Import each term
    for (let i = 0; i < parsedRows.length; i++) {
      const { termName, columns } = parsedRows[i];
      
      console.log(`\n[${i + 1}/${parsedRows.length}] Processing: ${termName}`);
      console.log(`  📊 Found ${columns.size} non-empty columns`);
      
      // Map columns to sections
      const sections = mapColumnsToSections(columns);
      console.log(`  📦 Mapped to ${sections.size} sections`);
      
      // Import to database
      await importTermToDatabase(termName, columns, sections);
    }
    
    // Show final statistics
    console.log('\n\n📊 Import Summary');
    console.log('==================');
    
    const termCount = await db.select({ count: sql<number>`count(*)` }).from(enhancedTerms);
    const sectionCount = await db.select({ count: sql<number>`count(*)` }).from(termSections);
    const elementCount = await db.select({ count: sql<number>`count(*)` }).from(interactiveElements);
    
    console.log(`✅ Total terms in database: ${termCount[0].count}`);
    console.log(`✅ Total sections: ${sectionCount[0].count}`);
    console.log(`✅ Total interactive elements: ${elementCount[0].count}`);
    
    // Check specific terms
    const checkTerms = ['Characteristic Function', 'Activation Function', 'Neural Network'];
    console.log('\n📋 Sample Terms Check:');
    
    for (const termName of checkTerms) {
      const term = await db.select().from(enhancedTerms).where(eq(enhancedTerms.name, termName)).limit(1);
      
      if (term.length > 0) {
        const sections = await db.select().from(termSections).where(eq(termSections.termId, term[0].id));
        console.log(`  ✅ ${term[0].name}: ${sections.length} sections`);
      } else {
        console.log(`  ❌ ${termName}: Not found`);
      }
    }
    
    console.log('\n🎉 Import complete!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main().catch(console.error);