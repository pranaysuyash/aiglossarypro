import ExcelJS from 'exceljs';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { aiService } from './aiService';
import { CheckpointManager } from './checkpointManager';
import { versioningService } from './versioningService';
import { log as logger } from './utils/logger';

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;
function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// AI Content Generation Configuration (integrated from aimlv2_simple.js)
const AI_CONFIG = {
  PRIMARY_MODEL: "gpt-4-turbo-preview",
  FALLBACK_MODEL: "gpt-3.5-turbo",
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  REQUEST_TIMEOUT: 60000,
  MAX_WORKERS: 25,
  BATCH_SIZE: 75, // MAX_WORKERS * 3
};

interface AIGenerationOptions {
  enableAI: boolean;
  mode: 'none' | 'basic' | 'full' | 'selective';
  sections?: string[]; // For selective mode
  costOptimization: boolean;
}

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
  private checkpointManager: CheckpointManager | null = null;

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
        logger.info(`Loaded ${this.aiParseCache.size} cached AI parse results`);
      } catch {
        logger.info('No existing AI parse cache found, starting fresh');
      }
    } catch (error) {
      logger.error('Error initializing cache:', error);
    }
  }

  async parseComplexExcel(buffer: Buffer, options: AIGenerationOptions = { 
    enableAI: false, 
    mode: 'none', 
    costOptimization: true 
  }, fileName: string = 'excel_file.xlsx'): Promise<ParsedTerm[]> {
    logger.info('🧠 ADVANCED EXCEL PARSER WITH CHECKPOINTS');
    logger.info('==========================================');
    logger.info('📋 Starting complex 42-section parsing...');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Excel file has no worksheets');
    }

    // Initialize checkpoint manager
    this.checkpointManager = new CheckpointManager(`${fileName}_checkpoint.json`);
    await this.checkpointManager.loadCheckpoint();

    // Map all headers
    logger.info('📋 Mapping column headers...');
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      const headerName = cell.value?.toString().trim() || '';
      if (headerName) {
        this.headers.set(headerName, colNumber);
      }
    });

    logger.info(`✅ Found ${this.headers.size} columns in Excel file`);
    
    // Log sample headers for verification
    const sampleHeaders = Array.from(this.headers.keys()).slice(0, 5);
    logger.info('📋 Sample headers:', sampleHeaders);

    // Initialize checkpoint if not exists
    const totalRows = worksheet.rowCount - 1; // Exclude header row
    const totalCells = totalRows * this.headers.size;
    
    if (!this.checkpointManager!.getProgress().total) {
      await this.checkpointManager!.initializeCheckpoint(
        'typescript',
        fileName,
        totalRows,
        this.headers.size,
        { enableAI: options.enableAI, mode: options.mode }
      );
    }

    const parsedTerms: ParsedTerm[] = [];
    let processedCount = 0;
    let cachedCount = 0;
    let newlyParsedCount = 0;
    let checkpointHits = 0;

    logger.info(`📊 Processing ${totalRows} term rows...`);
    const progress = this.checkpointManager!.getProgress();
    logger.info(`📈 Checkpoint progress: ${progress.processed}/${progress.total} cells (${progress.percentage.toFixed(1)}%)`);
    
    if (progress.errors > 0) {
      logger.info(`⚠️  Previous errors: ${progress.errors}`);
    }

    // Process each term row
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.hasValues) {
        // Try multiple possible term name columns
        const termName = this.getCellValue(row, 'Term') || 
                         this.getCellValue(row, 'Name') ||
                         this.getCellValue(row, 'Term Name') ||
                         row.getCell(1).value?.toString().trim(); // First column fallback
        
        if (!termName) {
          logger.warn(`⚠️  Row ${rowNumber}: No term name found, skipping`);
          continue;
        }

        processedCount++;
        
        if (processedCount % 100 === 0 || processedCount <= 10) {
          logger.info(`🔄 Processing term ${processedCount}/${totalRows}: ${termName}`);
        }
        
        // Check if we have cached parsed data for this term
        const termHash = this.generateTermHash(row);
        const cachedTerm = await this.loadCachedTerm(termName, termHash);
        
        if (cachedTerm) {
          if (processedCount <= 10) {
            logger.info(`⚡ Using cached data for: ${termName}`);
          }
          cachedCount++;
          parsedTerms.push(cachedTerm);
          
          // Mark cells as completed in checkpoint for cached terms
          for (let colIdx = 1; colIdx < this.headers.size; colIdx++) {
            this.checkpointManager!.markCellCompleted(rowNumber, colIdx);
          }
          checkpointHits++;
        } else {
          if (processedCount <= 10) {
            logger.info(`🆕 Parsing new data for: ${termName}`);
          }
          try {
            const startTime = Date.now();
            const parsedTerm = await this.parseTermRowWithCheckpoint(row, termName, termHash, options, rowNumber);
            await this.saveCachedTerm(parsedTerm);
            parsedTerms.push(parsedTerm);
            newlyParsedCount++;
            
            const processingTime = Date.now() - startTime;
            if (processedCount <= 10) {
              logger.info(`✅ Parsed ${termName} in ${processingTime}ms`);
            }
          } catch (error) {
            logger.error(`❌ Error parsing term ${termName}:`, error);
            // Log error in checkpoint
            this.checkpointManager!.logError(rowNumber, 1, termName, 'term_parsing', error instanceof Error ? error.message : String(error));
            // Continue with other terms
          }
        }
      }
    }

    // Save AI parse cache
    await this.saveAIParseCache();

    // Final checkpoint save and report
    if (this.checkpointManager) {
      await this.checkpointManager.saveCheckpoint();
      logger.info('\n📊 CHECKPOINT REPORT');
      logger.info('===================');
      logger.info(this.checkpointManager.generateReport());
    }

    logger.info('\n✅ ADVANCED PARSING WITH CHECKPOINTS COMPLETED');
    logger.info('===============================================');
    logger.info(`📊 Total terms parsed: ${parsedTerms.length}`);
    logger.info(`⚡ From cache: ${cachedCount}`);
    logger.info(`🔍 Checkpoint hits: ${checkpointHits}`);
    logger.info(`🆕 Newly parsed: ${newlyParsedCount}`);
    logger.info(`🧠 AI cache entries: ${this.aiParseCache.size}`);

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
      logger.error(`Error saving cache for ${parsedTerm.name}:`, error);
    }
  }

  private async saveAIParseCache(): Promise<void> {
    try {
      const cacheFile = path.join(CACHE_DIR, 'ai_parse_cache.json');
      const cacheObj = Object.fromEntries(this.aiParseCache);
      await fs.writeFile(cacheFile, JSON.stringify(cacheObj, null, 2));
      logger.info(`Saved ${this.aiParseCache.size} AI parse results to cache`);
    } catch (error) {
      logger.error('Error saving AI parse cache:', error);
    }
  }

  private async parseTermRow(row: ExcelJS.Row, termName: string, hash: string, options: AIGenerationOptions): Promise<ParsedTerm> {
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

    // Parse each content section with AI enhancement if enabled
    for (const section of CONTENT_SECTIONS) {
      const sectionData = await this.parseSectionData(row, section, termName, options);
      parsedTerm.sections.set(section.sectionName, sectionData);

      // Distribute data based on display type
      this.distributeDisplayData(parsedTerm, section, sectionData);
    }

    // Parse categories using AI (with caching)
    await this.parseCategories(row, parsedTerm);

    return parsedTerm;
  }

  private async parseTermRowWithCheckpoint(
    row: ExcelJS.Row, 
    termName: string, 
    hash: string, 
    options: AIGenerationOptions,
    rowNumber: number
  ): Promise<ParsedTerm> {
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

    // Parse each content section with checkpoint tracking
    for (const section of CONTENT_SECTIONS) {
      try {
        const startTime = Date.now();
        const sectionData = await this.parseSectionDataWithCheckpoint(row, section, termName, options, rowNumber);
        parsedTerm.sections.set(section.sectionName, sectionData);

        // Distribute data based on display type
        this.distributeDisplayData(parsedTerm, section, sectionData);
        
        const processingTime = Date.now() - startTime;
        
        // Mark section columns as completed in checkpoint
        for (const columnName of section.columns) {
          const colIdx = this.headers.get(columnName);
          if (colIdx) {
            this.checkpointManager!.markCellCompleted(rowNumber, colIdx, processingTime);
          }
        }
      } catch (error) {
        logger.error(`❌ Error parsing section ${section.sectionName} for ${termName}:`, error);
        
        // Log error for each column in this section
        for (const columnName of section.columns) {
          const colIdx = this.headers.get(columnName);
          if (colIdx) {
            this.checkpointManager!.logError(
              rowNumber, 
              colIdx, 
              termName, 
              section.sectionName, 
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }
    }

    // Parse categories using AI (with checkpoint tracking)
    try {
      await this.parseCategories(row, parsedTerm);
    } catch (error) {
      logger.error(`❌ Error parsing categories for ${termName}:`, error);
      this.checkpointManager!.logError(rowNumber, 1, termName, 'categories', error instanceof Error ? error.message : String(error));
    }

    return parsedTerm;
  }

  private async parseSectionDataWithCheckpoint(
    row: ExcelJS.Row, 
    section: ContentSection, 
    termName: string, 
    options: AIGenerationOptions,
    rowNumber: number
  ): Promise<any> {
    const sectionData: any = {};

    for (const columnName of section.columns) {
      const colIdx = this.headers.get(columnName);
      if (!colIdx) continue;

      // Check if this cell was already processed via checkpoint
      if (this.checkpointManager!.isCellCompleted(rowNumber, colIdx)) {
        // Cell already processed, skip
        continue;
      }

      const cellValue = this.getCellValue(row, columnName);
      const fieldName = this.extractFieldName(columnName);
      
      // Check if we should generate AI content for empty fields
      if (!cellValue && this.shouldGenerateAIContent(section, columnName, options)) {
        try {
          logger.info(`🤖 Generating AI content for ${termName} → ${columnName}`);
          const startTime = Date.now();
          const aiContent = await this.generateAIContent(termName, columnName, section);
          const processingTime = Date.now() - startTime;
          
          if (aiContent) {
            sectionData[fieldName] = aiContent;
            
            // Update checkpoint performance metrics
            this.checkpointManager!.updatePerformanceMetrics({
              apiCalls: 1,
              cacheMisses: 1,
              costEstimate: 0.001 // Rough estimate per API call
            });
            
            this.checkpointManager!.markCellCompleted(rowNumber, colIdx, processingTime);
            continue;
          }
        } catch (error) {
          logger.error(`❌ AI generation failed for ${termName} → ${columnName}:`, error);
          this.checkpointManager!.logError(
            rowNumber, 
            colIdx, 
            termName, 
            columnName, 
            error instanceof Error ? error.message : String(error)
          );
        }
      }
      
      if (!cellValue) {
        this.checkpointManager!.markCellCompleted(rowNumber, colIdx, 0);
        continue;
      }
      
      // Process existing content
      try {
        const startTime = Date.now();
        
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
            this.checkpointManager!.updatePerformanceMetrics({
              apiCalls: 1,
              cacheMisses: 1,
              costEstimate: 0.001
            });
            break;
        }
        
        const processingTime = Date.now() - startTime;
        this.checkpointManager!.markCellCompleted(rowNumber, colIdx, processingTime);
        
      } catch (error) {
        logger.error(`❌ Error processing ${columnName} for ${termName}:`, error);
        this.checkpointManager!.logError(
          rowNumber, 
          colIdx, 
          termName, 
          columnName, 
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return sectionData;
  }

  private async parseSectionData(row: ExcelJS.Row, section: ContentSection, termName: string, options: AIGenerationOptions): Promise<any> {
    const sectionData: any = {};

    for (const columnName of section.columns) {
      const cellValue = this.getCellValue(row, columnName);
      const fieldName = this.extractFieldName(columnName);
      
      // Check if we should generate AI content for empty fields
      if (!cellValue && this.shouldGenerateAIContent(section, columnName, options)) {
        logger.info(`🤖 Generating AI content for ${termName} → ${columnName}`);
        const aiContent = await this.generateAIContent(termName, columnName, section);
        if (aiContent) {
          sectionData[fieldName] = aiContent;
          continue;
        }
      }
      
      if (!cellValue) continue;
      
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

      const response = await getOpenAIClient().chat.completions.create({
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
      logger.error('AI parsing error:', error);
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

  // AI Content Generation Methods (integrated from aimlv2_simple.js)
  private shouldGenerateAIContent(section: ContentSection, columnName: string, options: AIGenerationOptions): boolean {
    if (!options.enableAI || options.mode === 'none') return false;
    
    switch (options.mode) {
      case 'basic':
        // Only generate basic sections
        const basicSections = ['definition', 'examples', 'applications', 'advantages', 'disadvantages'];
        return basicSections.some(basic => columnName.toLowerCase().includes(basic));
        
      case 'full':
        // Generate all sections
        return true;
        
      case 'selective':
        // Only generate selected sections
        return options.sections?.some(selected => 
          section.sectionName.toLowerCase().includes(selected.toLowerCase()) ||
          columnName.toLowerCase().includes(selected.toLowerCase())
        ) || false;
        
      default:
        return false;
    }
  }

  private async generateAIContent(termName: string, sectionName: string, section: ContentSection): Promise<string | null> {
    const cacheKey = `ai_gen_${termName}_${sectionName}`;
    
    // Check local cache first for cost optimization
    if (this.aiParseCache.has(cacheKey)) {
      return this.aiParseCache.get(cacheKey);
    }

    try {
      // Use enhanced aiService with smart caching
      logger.info(`🤖 Generating AI content for: ${termName} → ${sectionName}`);
      const content = await aiService.generateSectionContent(termName, sectionName);
      
      if (content && content.length > 10) {
        // Cache locally as well for this session
        this.aiParseCache.set(cacheKey, content);
        logger.info(`✅ Generated content for ${termName} → ${sectionName} (${content.length} chars)`);
        return content;
      }
      
      return null;
    } catch (error) {
      logger.error(`Error generating AI content for ${termName} -> ${sectionName}:`, error);
      return null;
    }
  }

  // AI methods removed - now using enhanced aiService with smart caching
}

// Enhanced database import for complex structure with versioning
export async function importComplexTerms(parsedTerms: ParsedTerm[], enableVersioning: boolean = true): Promise<void> {
  logger.info('\n💾 ENHANCED DATABASE IMPORT');
  logger.info('===========================');
  logger.info(`📊 Importing ${parsedTerms.length} complex terms to enhanced schema...`);
  
  const { db } = await import('./db');
  const { enhancedTerms, termSections } = await import('../shared/enhancedSchema');
  const { eq } = await import('drizzle-orm');
  
  let successCount = 0;
  let errorCount = 0;
  let updateCount = 0;
  let insertCount = 0;
  
  for (let i = 0; i < parsedTerms.length; i++) {
    const term = parsedTerms[i];
    const progress = ((i + 1) / parsedTerms.length * 100).toFixed(1);
    
    if ((i + 1) % 100 === 0 || i < 10) {
      logger.info(`🔄 Processing term ${i + 1}/${parsedTerms.length} (${progress}%): ${term.name}`);
    }
    
    if (i < 5) {
      logger.info(`📋 Sections: ${Array.from(term.sections.keys()).slice(0, 3).join(', ')}...`);
      logger.info(`🏷️  Categories: Main=${term.categories.main.length}, Sub=${term.categories.sub.length}`);
    }
    
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

      // Check if term already exists
      const existingTerm = await db.select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.name, term.name))
        .limit(1);

      let enhancedTerm;
      if (existingTerm.length > 0) {
        // If versioning is enabled and term exists, use versioning system
        if (enableVersioning) {
          logger.info(`🔄 Using versioning system for existing term: ${term.name}`);
          
          // Create new version with quality assessment
          const versionResult = await versioningService.createVersion(
            existingTerm[0].id,
            term.name,
            {
              sections: Object.fromEntries(term.sections),
              categories: term.categories,
              displayData: term.displayData,
              metadata: term.metadata
            },
            {
              source: 'excel_import',
              processingMode: 'advanced_42_section',
              aiGenerated: true
            }
          );
          
          logger.info(`📊 Versioning decision: ${versionResult.decision.action} (confidence: ${versionResult.decision.confidence})`);
          
          // Update term data only if version was upgraded
          if (versionResult.decision.action === 'upgrade') {
            [enhancedTerm] = await db
              .update(enhancedTerms)
              .set({
                ...enhancedTermData,
                updatedAt: new Date()
              })
              .where(eq(enhancedTerms.id, existingTerm[0].id))
              .returning();
            updateCount++;
            
            if (i < 5) {
              logger.info(`✨ Upgraded term v${versionResult.decision.qualityDelta.toFixed(1)}: ${enhancedTerm.id}`);
            }
          } else {
            enhancedTerm = existingTerm[0];
            if (i < 5) {
              logger.info(`📋 Kept existing version: ${enhancedTerm.id} (${versionResult.decision.reasoning})`);
            }
          }
        } else {
          // Standard update without versioning
          [enhancedTerm] = await db
            .update(enhancedTerms)
            .set({
              ...enhancedTermData,
              updatedAt: new Date()
            })
            .where(eq(enhancedTerms.id, existingTerm[0].id))
            .returning();
          updateCount++;
          
          if (i < 5) {
            logger.info(`🔄 Updated existing term: ${enhancedTerm.id}`);
          }
        }
      } else {
        // Insert new term
        [enhancedTerm] = await db
          .insert(enhancedTerms)
          .values(enhancedTermData)
          .returning();
        insertCount++;
        
        // If versioning enabled, create initial version
        if (enableVersioning) {
          await versioningService.createVersion(
            enhancedTerm.id,
            term.name,
            {
              sections: Object.fromEntries(term.sections),
              categories: term.categories,
              displayData: term.displayData,
              metadata: term.metadata
            },
            {
              source: 'excel_import',
              processingMode: 'advanced_42_section',
              aiGenerated: true
            }
          );
          
          if (i < 5) {
            logger.info(`✨ Created new term with versioning: ${enhancedTerm.id}`);
          }
        } else {
          if (i < 5) {
            logger.info(`➕ Inserted new term: ${enhancedTerm.id}`);
          }
        }
      }

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
        if (i < 5) {
          logger.info(`📋 Inserted ${sectionInserts.length} sections`);
        }
      }

      successCount++;

    } catch (error) {
      logger.error(`❌ Error importing term ${term.name}:`, error);
      errorCount++;
      // Continue with other terms instead of throwing
    }
  }
  
  logger.info('\n✅ ENHANCED IMPORT COMPLETED');
  logger.info('============================');
  logger.info(`📊 Total processed: ${parsedTerms.length}`);
  logger.info(`✅ Successfully imported: ${successCount}`);
  logger.info(`➕ New terms: ${insertCount}`);
  logger.info(`🔄 Updated terms: ${updateCount}`);
  logger.info(`❌ Errors: ${errorCount}`);
  logger.info(`💾 Database: Enhanced terms table (enhancedTerms + termSections)`);
}

export { AdvancedExcelParser, type ParsedTerm };