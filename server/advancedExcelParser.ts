import ExcelJS from 'exceljs';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache directory for parsed results
const CACHE_DIR = path.join(process.cwd(), 'temp', 'parsed_cache');

// Content section definitions based on your structure
interface ContentSection {
  sectionName: string;
  columns: string[];
  displayType: 'card' | 'filter' | 'sidebar' | 'main' | 'metadata' | 'interactive';
  parseType: 'simple' | 'list' | 'structured' | 'ai_parse';
}

// Import the complete 42-section configuration
import COMPLETE_CONTENT_SECTIONS from '../complete_42_sections_config';

// Use the complete 42 sections
const CONTENT_SECTIONS = COMPLETE_CONTENT_SECTIONS;

interface ParsedTerm {
  name: string;
  sections: Map<string, any>;
  categories: {
    main: string[];
    sub: string[];
    related: string[];
    domains: string[];
    techniques: string[];
  };
  metadata: any;
  displayData: {
    cardContent: any;
    filterData: any;
    sidebarContent: any;
    mainContent: any;
  };
  parseHash: string; // Hash of original data to detect changes
}

class AdvancedExcelParser {
  private headers: Map<string, number> = new Map();
  private aiParseCache: Map<string, any> = new Map();

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      
      // Load existing AI parse cache
      const cacheFile = path.join(CACHE_DIR, 'ai_parse_cache.json');
      try {
        const cacheData = await fs.readFile(cacheFile, 'utf8');
        const cacheObj = JSON.parse(cacheData);
        this.aiParseCache = new Map(Object.entries(cacheObj));
        console.log(`Loaded ${this.aiParseCache.size} cached AI parse results`);
      } catch {
        console.log('No existing AI parse cache found, starting fresh');
      }
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  async parseComplexExcel(buffer: Buffer): Promise<ParsedTerm[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Excel file has no worksheets');
    }

    // Map all headers
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      const headerName = cell.value?.toString().trim() || '';
      if (headerName) {
        this.headers.set(headerName, colNumber);
      }
    });

    console.log(`Found ${this.headers.size} columns in Excel file`);

    const parsedTerms: ParsedTerm[] = [];

    // Process each term row
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.hasValues) {
        const termName = this.getCellValue(row, 'Term');
        if (!termName) continue;

        console.log(`Processing term: ${termName}`);
        
        // Check if we have cached parsed data for this term
        const termHash = this.generateTermHash(row);
        const cachedTerm = await this.loadCachedTerm(termName, termHash);
        
        if (cachedTerm) {
          console.log(`Using cached data for: ${termName}`);
          parsedTerms.push(cachedTerm);
        } else {
          console.log(`Parsing new data for: ${termName}`);
          const parsedTerm = await this.parseTermRow(row, termName, termHash);
          await this.saveCachedTerm(parsedTerm);
          parsedTerms.push(parsedTerm);
        }
      }
    }

    // Save AI parse cache
    await this.saveAIParseCache();

    return parsedTerms;
  }

  private generateTermHash(row: ExcelJS.Row): string {
    // Generate hash of all row data to detect changes
    let rowData = '';
    for (let i = 1; i <= row.cellCount; i++) {
      const cellValue = row.getCell(i).value?.toString() || '';
      rowData += cellValue;
    }
    return crypto.createHash('md5').update(rowData).digest('hex');
  }

  private async loadCachedTerm(termName: string, hash: string): Promise<ParsedTerm | null> {
    try {
      const cacheFile = path.join(CACHE_DIR, `${this.sanitizeFilename(termName)}.json`);
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      const parsed = JSON.parse(cachedData);
      
      // Check if hash matches (data hasn't changed)
      if (parsed.parseHash === hash) {
        // Convert sections back to Map
        parsed.sections = new Map(Object.entries(parsed.sections));
        return parsed;
      }
    } catch {
      // Cache miss or error - will parse fresh
    }
    return null;
  }

  private async saveCachedTerm(parsedTerm: ParsedTerm): Promise<void> {
    try {
      const cacheFile = path.join(CACHE_DIR, `${this.sanitizeFilename(parsedTerm.name)}.json`);
      // Convert Map to object for JSON serialization
      const serializable = {
        ...parsedTerm,
        sections: Object.fromEntries(parsedTerm.sections)
      };
      await fs.writeFile(cacheFile, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.error(`Error saving cache for ${parsedTerm.name}:`, error);
    }
  }

  private async saveAIParseCache(): Promise<void> {
    try {
      const cacheFile = path.join(CACHE_DIR, 'ai_parse_cache.json');
      const cacheObj = Object.fromEntries(this.aiParseCache);
      await fs.writeFile(cacheFile, JSON.stringify(cacheObj, null, 2));
      console.log(`Saved ${this.aiParseCache.size} AI parse results to cache`);
    } catch (error) {
      console.error('Error saving AI parse cache:', error);
    }
  }

  private async parseTermRow(row: ExcelJS.Row, termName: string, hash: string): Promise<ParsedTerm> {
    const parsedTerm: ParsedTerm = {
      name: termName,
      sections: new Map(),
      categories: {
        main: [],
        sub: [],
        related: [],
        domains: [],
        techniques: []
      },
      metadata: {},
      displayData: {
        cardContent: {},
        filterData: {},
        sidebarContent: {},
        mainContent: {}
      },
      parseHash: hash
    };

    // Parse each content section
    for (const section of CONTENT_SECTIONS) {
      const sectionData = await this.parseSectionData(row, section);
      parsedTerm.sections.set(section.sectionName, sectionData);

      // Distribute data based on display type
      this.distributeDisplayData(parsedTerm, section, sectionData);
    }

    // Parse categories using AI (with caching)
    await this.parseCategories(row, parsedTerm);

    return parsedTerm;
  }

  private async parseSectionData(row: ExcelJS.Row, section: ContentSection): Promise<any> {
    const sectionData: any = {};

    for (const columnName of section.columns) {
      const cellValue = this.getCellValue(row, columnName);
      if (!cellValue) continue;

      const fieldName = this.extractFieldName(columnName);
      
      switch (section.parseType) {
        case 'simple':
          sectionData[fieldName] = cellValue;
          break;
          
        case 'list':
          sectionData[fieldName] = this.parseAsList(cellValue);
          break;
          
        case 'structured':
          sectionData[fieldName] = await this.parseStructured(cellValue, columnName);
          break;
          
        case 'ai_parse':
          sectionData[fieldName] = await this.parseWithAICached(cellValue, columnName);
          break;
      }
    }

    return sectionData;
  }

  private async parseCategories(row: ExcelJS.Row, parsedTerm: ParsedTerm): Promise<void> {
    const categoryColumns = [
      'Introduction – Category and Sub-category of the Term – Main Category',
      'Introduction – Category and Sub-category of the Term – Sub-category',
      'Tags and Keywords – Main Category Tags',
      'Tags and Keywords – Sub-category Tags',
      'Tags and Keywords – Related Concept Tags',
      'Tags and Keywords – Application Domain Tags',
      'Tags and Keywords – Technique or Algorithm Tags'
    ];

    const categoryData: string[] = [];
    
    for (const column of categoryColumns) {
      const value = this.getCellValue(row, column);
      if (value) {
        categoryData.push(`${column}: ${value}`);
      }
    }

    if (categoryData.length > 0) {
      const aiParsedCategories = await this.parseWithAICached(
        categoryData.join('\n'),
        'category_extraction'
      );

      // Distribute parsed categories
      if (aiParsedCategories.main) parsedTerm.categories.main = aiParsedCategories.main;
      if (aiParsedCategories.sub) parsedTerm.categories.sub = aiParsedCategories.sub;
      if (aiParsedCategories.related) parsedTerm.categories.related = aiParsedCategories.related;
      if (aiParsedCategories.domains) parsedTerm.categories.domains = aiParsedCategories.domains;
      if (aiParsedCategories.techniques) parsedTerm.categories.techniques = aiParsedCategories.techniques;
    }
  }

  private async parseWithAICached(content: string, context: string): Promise<any> {
    // Create cache key from content and context
    const cacheKey = crypto.createHash('md5').update(`${context}:${content}`).digest('hex');
    
    // Check cache first
    if (this.aiParseCache.has(cacheKey)) {
      return this.aiParseCache.get(cacheKey);
    }

    // Not in cache, make AI call
    const result = await this.parseWithAI(content, context);
    
    // Cache the result
    this.aiParseCache.set(cacheKey, result);
    
    return result;
  }

  private async parseWithAI(content: string, context: string): Promise<any> {
    try {
      let systemPrompt = '';
      
      if (context === 'category_extraction') {
        systemPrompt = `
You are a data parser for an AI/ML glossary. Extract and categorize information from the given text.
Return a JSON object with these exact keys:
{
  "main": ["array of main categories"],
  "sub": ["array of subcategories"],
  "related": ["array of related concepts"],
  "domains": ["array of application domains"],
  "techniques": ["array of techniques/algorithms"]
}

Parse comma-separated values, sentences, and any other format. Extract meaningful categories only.
Each array should contain clean, normalized category names.
`;
      } else {
        systemPrompt = `
You are a data parser for an AI/ML glossary. Parse the given content and return structured data.
For context "${context}", extract the most relevant information and return it as JSON.
Handle comma-separated lists, sentences, and mixed formats intelligently.
Return clean, structured data that can be easily used in a web application.
`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (aiResponse) {
        try {
          return JSON.parse(aiResponse);
        } catch {
          // If JSON parsing fails, return the raw response
          return { parsed: aiResponse };
        }
      }
    } catch (error) {
      console.error('AI parsing error:', error);
    }

    return {};
  }

  private parseAsList(content: string): string[] {
    // Handle various list formats
    if (content.includes('\n')) {
      return content.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    } else if (content.includes(',')) {
      return content.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else if (content.includes(';')) {
      return content.split(';').map(item => item.trim()).filter(item => item.length > 0);
    } else {
      return [content.trim()];
    }
  }

  private async parseStructured(content: string, columnName: string): Promise<any> {
    // For structured content, try to identify the structure and parse accordingly
    if (content.includes('```')) {
      // Code blocks
      return { type: 'code', content: content };
    } else if (content.includes('graph TD') || content.includes('flowchart')) {
      // Mermaid diagrams
      return { type: 'mermaid', content: content };
    } else if (content.length > 500) {
      // Long text - might need summarization
      return { 
        type: 'long_text', 
        content: content, 
        summary: content.substring(0, 200) + '...',
        wordCount: content.split(' ').length
      };
    } else {
      return { type: 'text', content: content };
    }
  }

  private distributeDisplayData(parsedTerm: ParsedTerm, section: ContentSection, sectionData: any): void {
    switch (section.displayType) {
      case 'card':
        Object.assign(parsedTerm.displayData.cardContent, sectionData);
        break;
      case 'filter':
        Object.assign(parsedTerm.displayData.filterData, sectionData);
        break;
      case 'sidebar':
        Object.assign(parsedTerm.displayData.sidebarContent, sectionData);
        break;
      case 'main':
        Object.assign(parsedTerm.displayData.mainContent, sectionData);
        break;
      case 'metadata':
        Object.assign(parsedTerm.metadata, sectionData);
        break;
    }
  }

  private getCellValue(row: ExcelJS.Row, columnName: string): string | null {
    const columnIndex = this.headers.get(columnName);
    if (!columnIndex) return null;
    
    const value = row.getCell(columnIndex).value;
    return value?.toString().trim() || null;
  }

  private extractFieldName(columnName: string): string {
    // Extract the last part after the last dash as field name
    const parts = columnName.split('–').map(p => p.trim());
    return parts[parts.length - 1]
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }
}

// Enhanced database import for complex structure
export async function importComplexTerms(parsedTerms: ParsedTerm[]): Promise<void> {
  const { db } = await import('./db');
  const { enhancedTerms, termSections } = await import('../shared/enhancedSchema');
  const { eq } = await import('drizzle-orm');
  
  console.log(`Importing ${parsedTerms.length} complex terms...`);
  
  for (const term of parsedTerms) {
    console.log(`Processing term: ${term.name}`);
    console.log(`Sections: ${Array.from(term.sections.keys()).join(', ')}`);
    console.log(`Categories: Main=${term.categories.main.length}, Sub=${term.categories.sub.length}`);
    
    try {
      // Create slug from name
      const slug = term.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Prepare enhanced term data (only using fields that exist in database)
      const enhancedTermData = {
        name: term.name,
        slug: slug,
        fullDefinition: term.sections.get('Introduction')?.definition_and_overview?.content || 
                       term.sections.get('Introduction')?.content || 
                       'Definition not available',
        shortDefinition: term.sections.get('Introduction')?.definition_and_overview?.summary || null,
        
        // AI-parsed categories
        mainCategories: term.categories.main || [],
        subCategories: term.categories.sub || [],
        relatedConcepts: term.categories.related || [],
        applicationDomains: term.categories.domains || [],
        techniques: term.categories.techniques || [],
        
        // Metadata flags
        hasImplementation: term.sections.has('Implementation'),
        hasInteractiveElements: Array.from(term.sections.values()).some(section => 
          JSON.stringify(section).includes('mermaid') || 
          JSON.stringify(section).includes('interactive')
        ),
        hasCaseStudies: term.sections.has('Applications') || term.sections.has('Case Studies'),
        hasCodeExamples: Array.from(term.sections.values()).some(section => 
          JSON.stringify(section).includes('code') || 
          JSON.stringify(section).includes('example')
        ),
        
        // Search text (combine all section content, truncated for index limits)
        searchText: Array.from(term.sections.values())
          .map(section => JSON.stringify(section))
          .join(' ')
          .replace(/[{}"]/g, ' ')
          .toLowerCase()
          .substring(0, 2000), // Truncate to avoid index size limits
          
        // Parse metadata
        parseHash: term.parseHash,
        parseVersion: '2.0'
      };

      // Insert or update enhanced term
      const [enhancedTerm] = await db
        .insert(enhancedTerms)
        .values(enhancedTermData)
        .onConflictDoUpdate({
          target: enhancedTerms.name,
          set: {
            ...enhancedTermData,
            updatedAt: new Date()
          }
        })
        .returning();

      console.log(`✅ Enhanced term saved: ${enhancedTerm.id}`);

      // Delete existing sections for this term (for updates)
      await db.delete(termSections).where(eq(termSections.termId, enhancedTerm.id));

      // Insert all sections
      const sectionInserts = [];
      let priority = 1;
      
      for (const [sectionName, sectionData] of term.sections) {
        // Determine display type based on section name
        let displayType = 'main';
        if (sectionName.includes('Metadata') || sectionName.includes('Tags')) {
          displayType = 'metadata';
        } else if (sectionName.includes('Prerequisites') || sectionName.includes('Related')) {
          displayType = 'sidebar';
        } else if (sectionName.includes('Interactive') || sectionName.includes('Quiz')) {
          displayType = 'interactive';
        }

        sectionInserts.push({
          termId: enhancedTerm.id,
          sectionName,
          sectionData: sectionData as any, // JSONB field
          displayType,
          priority,
          isInteractive: sectionName.toLowerCase().includes('interactive') || 
                        JSON.stringify(sectionData).includes('mermaid')
        });
        
        priority++;
      }

      if (sectionInserts.length > 0) {
        await db.insert(termSections).values(sectionInserts);
        console.log(`✅ Inserted ${sectionInserts.length} sections`);
      }

    } catch (error) {
      console.error(`❌ Error importing term ${term.name}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Successfully imported ${parsedTerms.length} complex terms with 42-section structure`);
}

export { AdvancedExcelParser, type ParsedTerm };