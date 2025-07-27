#!/usr/bin/env tsx

/**
 * Enhanced Bulk Import System for AI Glossary Pro
 * 
 * This script provides a robust, scalable solution for importing 10,000+ AI/ML terms
 * from CSV or JSON files with the following features:
 * 
 * - Streaming processing for large CSV files (memory efficient)
 * - Batch processing with configurable size
 * - Progress tracking and detailed reporting
 * - Error recovery and retry logic
 * - Duplicate detection and handling
 * - Data validation and sanitization
 * - Support for incremental imports
 * - Command-line interface with multiple options
 * 
 * Usage:
 * npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --format csv
 * npx tsx scripts/import-bulk-terms.ts --source data/terms.json --format json --batch-size 50
 * npx tsx scripts/import-bulk-terms.ts --help
 */

import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { parse } from 'csv-parse';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import { enhancedStorage } from '../server/enhancedStorage';
import { db } from '../server/db';
import { terms, categories } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Types
interface ImportOptions {
  source: string;
  format: 'csv' | 'json';
  batchSize: number;
  maxConcurrent: number;
  skipDuplicates: boolean;
  validateData: boolean;
  dryRun: boolean;
  verbose: boolean;
  resumeFrom?: number;
  maxRows?: number;
  categoryMapping?: Record<string, string>;
  errorLogFile?: string;
  progressInterval: number;
}

interface ParsedTerm {
  term_id?: string;
  term_name: string;
  basic_definition?: string;
  technical_definition?: string;
  historical_context?: string;
  importance_in_ai?: string;
  main_categories: string[];
  sub_categories: string[];
  related_categories: string[];
  application_domains: string[];
  techniques: string[];
  implementation_status?: 'theoretical' | 'implemented' | 'experimental';
  complexity_level?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  related_terms: string[];
  metadata?: Record<string, unknown>;
  sections?: Map<string, any>;
  raw_data?: Record<string, unknown>;
}

interface ImportStats {
  startTime: number;
  totalRows: number;
  processedRows: number;
  successfulImports: number;
  skippedDuplicates: number;
  validationErrors: number;
  importErrors: number;
  retryAttempts: number;
  categoriesCreated: number;
  sectionsCreated: number;
  batchesProcessed: number;
  peakMemoryUsage: number;
  currentBatch: number;
  estimatedTimeRemaining?: number;
  errors: Array<{ row: number; term: string; error: string }>;
}

// Default options
const DEFAULT_OPTIONS: ImportOptions = {
  source: '',
  format: 'csv',
  batchSize: 100,
  maxConcurrent: 5,
  skipDuplicates: true,
  validateData: true,
  dryRun: false,
  verbose: false,
  progressInterval: 1000,
};

// Main import class
class BulkTermImporter {
  private options: ImportOptions;
  private stats: ImportStats;
  private existingTerms: Set<string> = new Set();
  private categoryMap: Map<string, string> = new Map();
  private errorLog: Array<{ timestamp: Date; error: Error | unknown }> = [];
  private abortController: AbortController;

  constructor(options: Partial<ImportOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stats = this.initializeStats();
    this.abortController = new AbortController();
  }

  private initializeStats(): ImportStats {
    return {
      startTime: performance.now(),
      totalRows: 0,
      processedRows: 0,
      successfulImports: 0,
      skippedDuplicates: 0,
      validationErrors: 0,
      importErrors: 0,
      retryAttempts: 0,
      categoriesCreated: 0,
      sectionsCreated: 0,
      batchesProcessed: 0,
      peakMemoryUsage: 0,
      currentBatch: 0,
      errors: [],
    };
  }

  async import(): Promise<ImportStats> {
    try {
      console.log('🚀 Starting Enhanced Bulk Import');
      console.log('================================');
      this.printOptions();

      // Pre-load existing data
      await this.loadExistingData();

      // Import based on format
      if (this.options.format === 'csv') {
        await this.importCSV();
      } else if (this.options.format === 'json') {
        await this.importJSON();
      }

      // Final report
      this.printFinalReport();

      // Save error log if specified
      if (this.options.errorLogFile && this.stats.errors.length > 0) {
        await this.saveErrorLog();
      }

      return this.stats;
    } catch (error) {
      console.error('❌ Fatal import error:', error);
      throw error;
    }
  }

  private printOptions(): void {
    console.log(`📁 Source: ${this.options.source}`);
    console.log(`📊 Format: ${this.options.format.toUpperCase()}`);
    console.log(`📦 Batch Size: ${this.options.batchSize}`);
    console.log(`🔄 Max Concurrent: ${this.options.maxConcurrent}`);
    console.log(`🔍 Validation: ${this.options.validateData ? 'ON' : 'OFF'}`);
    console.log(`🏃 Mode: ${this.options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    if (this.options.resumeFrom) {
      console.log(`↩️  Resume from row: ${this.options.resumeFrom}`);
    }
    if (this.options.maxRows) {
      console.log(`🔢 Max rows to process: ${this.options.maxRows}`);
    }
    console.log('');
  }

  private async loadExistingData(): Promise<void> {
    console.log('📥 Loading existing data...');
    
    // Load existing terms
    const existingTerms = await db.select({ name: terms.name }).from(terms);
    existingTerms.forEach(term => {
      this.existingTerms.add(term.name.toLowerCase());
    });
    
    // Load existing categories
    const existingCategories = await db.select().from(categories);
    existingCategories.forEach(cat => {
      this.categoryMap.set(cat.name.toLowerCase(), cat.id);
    });
    
    console.log(`✅ Found ${this.existingTerms.size} existing terms`);
    console.log(`✅ Found ${this.categoryMap.size} existing categories\n`);
  }

  private async importCSV(): Promise<void> {
    const fileStats = await fs.stat(this.options.source);
    console.log(`📄 CSV file size: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);

    let headers: string[] = [];
    let currentBatch: ParsedTerm[] = [];
    let rowCount = 0;
    let progressTimer: NodeJS.Timer;

    // Create parser
    const parser = parse({
      delimiter: ',',
      columns: (headerRow) => {
        headers = headerRow;
        console.log(`📊 Found ${headers.length} columns`);
        if (this.options.verbose) {
          console.log('Column headers:', headers.slice(0, 10).join(', '), '...');
        }
        return headers;
      },
      skip_empty_lines: true,
      skip_records_with_error: true,
      from: this.options.resumeFrom || 0,
      to: this.options.maxRows,
      relax_quotes: true,
      relax_column_count: true,
      encoding: 'utf8',
    });

    // Transform stream to process rows
    const processor = new Transform({
      objectMode: true,
      transform: async (record, encoding, callback) => {
        try {
          rowCount++;
          
          // Skip empty rows
          const termName = record[headers[0]] || record['Term'] || record['term_name'];
          if (!termName || termName.trim() === '') {
            callback();
            return;
          }

          // Parse row to term
          const parsedTerm = this.parseCSVRow(record, headers);
          
          if (parsedTerm) {
            currentBatch.push(parsedTerm);
            
            // Process batch when full
            if (currentBatch.length >= this.options.batchSize) {
              const batchToProcess = [...currentBatch];
              currentBatch = [];
              
              await this.processBatch(batchToProcess);
            }
          }
          
          callback();
        } catch (error) {
          console.error(`❌ Error processing row ${rowCount}:`, error);
          this.stats.errors.push({
            row: rowCount,
            term: record[headers[0]] || 'Unknown',
            error: error instanceof Error ? error.message : String(error),
          });
          callback();
        }
      },
      flush: async (callback) => {
        // Process remaining batch
        if (currentBatch.length > 0) {
          await this.processBatch(currentBatch);
        }
        callback();
      },
    });

    // Progress reporting
    progressTimer = setInterval(() => {
      this.reportProgress();
    }, this.options.progressInterval);

    try {
      // Process file
      await pipeline(
        createReadStream(this.options.source),
        parser,
        processor,
        { signal: this.abortController.signal }
      );
    } finally {
      clearInterval(progressTimer);
    }

    this.stats.totalRows = rowCount;
  }

  private parseCSVRow(record: Record<string, string>, headers: string[]): ParsedTerm | null {
    try {
      // Map common column names
      const termName = record['Term'] || record['term_name'] || record[headers[0]];
      if (!termName || termName.trim() === '') return null;

      const parsed: ParsedTerm = {
        term_name: termName.trim(),
        basic_definition: this.findColumnValue(record, ['Definition', 'basic_definition', 'Introduction – Definition and Overview']),
        technical_definition: this.findColumnValue(record, ['Technical Definition', 'technical_definition', 'Theoretical Concepts – Key Mathematical and Statistical Foundations']),
        historical_context: this.findColumnValue(record, ['History', 'historical_context', 'Introduction – Brief History or Background']),
        importance_in_ai: this.findColumnValue(record, ['Importance', 'importance_in_ai', 'Introduction – Importance and Relevance in AI/ML']),
        main_categories: this.parseArrayField(record, ['Categories', 'main_categories', 'Introduction – Category and Sub-category of the Term – Main Category']),
        sub_categories: this.parseArrayField(record, ['Subcategories', 'sub_categories', 'Introduction – Category and Sub-category of the Term – Sub-category']),
        related_categories: this.parseArrayField(record, ['Related Categories', 'related_categories']),
        application_domains: this.parseArrayField(record, ['Applications', 'application_domains', 'Applications – Industries or Domains of Application']),
        techniques: this.parseArrayField(record, ['Techniques', 'techniques']),
        prerequisites: this.parseArrayField(record, ['Prerequisites', 'prerequisites', 'Prerequisites – Prior Knowledge or Skills Required']),
        related_terms: this.parseArrayField(record, ['Related Terms', 'related_terms', 'Related Concepts – Connection to Other AI/ML Terms or Topics']),
        complexity_level: this.parseComplexityLevel(record),
        implementation_status: this.parseImplementationStatus(record),
        raw_data: record,
      };

      // Parse sections if we have many columns (295 column format)
      if (headers.length > 100) {
        parsed.sections = this.parse295ColumnSections(record, headers);
      }

      // Generate term ID
      parsed.term_id = crypto.randomUUID();

      return parsed;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  private findColumnValue(record: Record<string, string>, possibleColumns: string[]): string | undefined {
    for (const col of possibleColumns) {
      if (record[col] && record[col].trim()) {
        return record[col].trim();
      }
    }
    return undefined;
  }

  private parseArrayField(record: Record<string, string>, possibleColumns: string[]): string[] {
    const value = this.findColumnValue(record, possibleColumns);
    if (!value) return [];

    // Handle different delimiters
    return value
      .split(/[,;|]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private parseComplexityLevel(record: Record<string, string>): 'beginner' | 'intermediate' | 'advanced' {
    const complexity = this.findColumnValue(record, ['Complexity', 'complexity_level', 'difficulty']);
    if (!complexity) return 'intermediate';
    
    const lower = complexity.toLowerCase();
    if (lower.includes('begin') || lower.includes('easy') || lower.includes('basic')) return 'beginner';
    if (lower.includes('adv') || lower.includes('hard') || lower.includes('expert')) return 'advanced';
    return 'intermediate';
  }

  private parseImplementationStatus(record: Record<string, string>): 'theoretical' | 'implemented' | 'experimental' {
    const status = this.findColumnValue(record, ['Status', 'implementation_status']);
    if (!status) return 'theoretical';
    
    const lower = status.toLowerCase();
    if (lower.includes('impl') || lower.includes('prod') || lower.includes('ready')) return 'implemented';
    if (lower.includes('exp') || lower.includes('beta') || lower.includes('test')) return 'experimental';
    return 'theoretical';
  }

  private parse295ColumnSections(record: Record<string, string>, headers: string[]): Map<string, any> {
    const sections = new Map<string, any>();
    
    // Group columns by section name (before the dash)
    const sectionGroups = new Map<string, Record<string, string>>();
    
    headers.forEach(header => {
      const value = record[header];
      if (!value || !value.trim()) return;
      
      const dashIndex = header.indexOf('–');
      if (dashIndex > 0) {
        const sectionName = header.substring(0, dashIndex).trim();
        const fieldName = header.substring(dashIndex + 1).trim();
        
        if (!sectionGroups.has(sectionName)) {
          sectionGroups.set(sectionName, {});
        }
        
        sectionGroups.get(sectionName)![fieldName] = value.trim();
      }
    });
    
    // Convert to sections map
    sectionGroups.forEach((content, sectionName) => {
      if (Object.keys(content).length > 0) {
        sections.set(sectionName, content);
      }
    });
    
    return sections;
  }

  private async importJSON(): Promise<void> {
    const content = await fs.readFile(this.options.source, 'utf-8');
    const data = JSON.parse(content);
    
    let terms: unknown[] = [];
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      terms = data;
    } else if (data.terms && Array.isArray(data.terms)) {
      terms = data.terms;
    } else if (data.data && Array.isArray(data.data)) {
      terms = data.data;
    } else {
      throw new Error('Unsupported JSON structure. Expected array of terms or object with terms array.');
    }
    
    this.stats.totalRows = terms.length;
    console.log(`📄 Found ${terms.length} terms in JSON file`);
    
    // Process in batches
    for (let i = 0; i < terms.length; i += this.options.batchSize) {
      const batch = terms.slice(i, i + this.options.batchSize);
      const parsedBatch = batch.map(term => this.parseJSONTerm(term)).filter(Boolean) as ParsedTerm[];
      
      if (parsedBatch.length > 0) {
        await this.processBatch(parsedBatch);
      }
      
      this.reportProgress();
    }
  }

  private parseJSONTerm(data: any): ParsedTerm | null {
    try {
      if (!data.term_name && !data.name && !data.title) return null;
      
      return {
        term_id: data.term_id || crypto.randomUUID(),
        term_name: data.term_name || data.name || data.title,
        basic_definition: data.basic_definition || data.definition || data.description,
        technical_definition: data.technical_definition,
        historical_context: data.historical_context || data.history,
        importance_in_ai: data.importance_in_ai || data.importance,
        main_categories: Array.isArray(data.main_categories) ? data.main_categories : [],
        sub_categories: Array.isArray(data.sub_categories) ? data.sub_categories : [],
        related_categories: Array.isArray(data.related_categories) ? data.related_categories : [],
        application_domains: Array.isArray(data.application_domains) ? data.application_domains : [],
        techniques: Array.isArray(data.techniques) ? data.techniques : [],
        prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
        related_terms: Array.isArray(data.related_terms) ? data.related_terms : [],
        complexity_level: data.complexity_level || 'intermediate',
        implementation_status: data.implementation_status || 'theoretical',
        metadata: data.metadata || {},
        sections: data.sections ? new Map(Object.entries(data.sections)) : undefined,
      };
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  private async processBatch(batch: ParsedTerm[]): Promise<void> {
    this.stats.currentBatch++;
    const batchStart = performance.now();
    
    console.log(`\n📦 Processing batch ${this.stats.currentBatch} (${batch.length} terms)...`);
    
    // Filter duplicates if needed
    let termsToProcess = batch;
    if (this.options.skipDuplicates) {
      termsToProcess = batch.filter(term => !this.existingTerms.has(term.term_name.toLowerCase()));
      const skipped = batch.length - termsToProcess.length;
      if (skipped > 0) {
        this.stats.skippedDuplicates += skipped;
        console.log(`  ⏭️  Skipped ${skipped} duplicate terms`);
      }
    }
    
    // Validate terms if needed
    if (this.options.validateData) {
      const validTerms: ParsedTerm[] = [];
      for (const term of termsToProcess) {
        const validation = this.validateTerm(term);
        if (validation.isValid) {
          validTerms.push(term);
        } else {
          this.stats.validationErrors++;
          if (this.options.verbose) {
            console.log(`  ⚠️  Validation failed for "${term.term_name}": ${validation.errors.join(', ')}`);
          }
        }
      }
      termsToProcess = validTerms;
    }
    
    // Process terms in parallel with concurrency limit
    const results = await this.processTermsConcurrently(termsToProcess);
    
    // Update stats
    this.stats.processedRows += batch.length;
    this.stats.successfulImports += results.successful;
    this.stats.importErrors += results.failed;
    this.stats.batchesProcessed++;
    
    // Update memory usage
    const memUsage = process.memoryUsage().heapUsed / (1024 * 1024);
    this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, memUsage);
    
    const batchTime = (performance.now() - batchStart) / 1000;
    console.log(`  ✅ Batch completed in ${batchTime.toFixed(2)}s`);
    console.log(`  📊 Success: ${results.successful}, Failed: ${results.failed}`);
    
    // Force garbage collection if memory usage is high
    if (memUsage > 1000 && global.gc) {
      global.gc();
      console.log(`  🧹 Triggered garbage collection (memory: ${memUsage.toFixed(0)}MB)`);
    }
  }

  private validateTerm(term: ParsedTerm): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!term.term_name || term.term_name.trim().length === 0) {
      errors.push('Missing term name');
    }
    
    if (!term.basic_definition || term.basic_definition.trim().length < 10) {
      errors.push('Definition too short or missing');
    }
    
    // Term name length
    if (term.term_name && term.term_name.length > 200) {
      errors.push('Term name too long');
    }
    
    // Categories validation
    if (term.main_categories.length === 0) {
      errors.push('No main categories specified');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async processTermsConcurrently(terms: ParsedTerm[]): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;
    
    // Process in chunks based on maxConcurrent
    for (let i = 0; i < terms.length; i += this.options.maxConcurrent) {
      const chunk = terms.slice(i, i + this.options.maxConcurrent);
      
      const promises = chunk.map(term => this.importSingleTerm(term));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successful++;
          this.existingTerms.add(chunk[index].term_name.toLowerCase());
        } else {
          failed++;
          const error = result.status === 'rejected' ? result.reason : 'Unknown error';
          this.stats.errors.push({
            row: this.stats.processedRows + i + index,
            term: chunk[index].term_name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }
    
    return { successful, failed };
  }

  private async importSingleTerm(term: ParsedTerm): Promise<boolean> {
    if (this.options.dryRun) {
      console.log(`  [DRY RUN] Would import: ${term.term_name}`);
      return true;
    }
    
    try {
      // Ensure categories exist
      const categoryIds = await this.ensureCategories(term);
      
      // Create enhanced term
      const enhancedTerm = {
        term_id: term.term_id!,
        term_name: term.term_name,
        basic_definition: term.basic_definition || '',
        technical_definition: term.technical_definition || '',
        historical_context: term.historical_context || '',
        importance_in_ai: term.importance_in_ai || '',
        main_categories: categoryIds.main,
        sub_categories: categoryIds.sub,
        related_categories: term.related_categories,
        application_domains: term.application_domains,
        techniques: term.techniques,
        implementation_status: term.implementation_status || 'theoretical',
        complexity_level: term.complexity_level || 'intermediate',
        prerequisites: term.prerequisites,
        related_terms: term.related_terms,
        metadata: {
          ...term.metadata,
          imported_at: new Date().toISOString(),
          import_source: path.basename(this.options.source),
        },
      };
      
      // Import the term
      await enhancedStorage.createEnhancedTerm(enhancedTerm);
      
      // Import sections if available
      if (term.sections && term.sections.size > 0) {
        let sectionOrder = 0;
        for (const [sectionName, content] of term.sections) {
          try {
            await enhancedStorage.createTermSection({
              term_id: term.term_id!,
              section_id: `${sectionName.toLowerCase().replace(/\s+/g, '_')}`,
              section_name: sectionName,
              content: content,
              display_type: this.getSectionDisplayType(sectionName),
              order_index: sectionOrder++,
              is_required: this.isRequiredSection(sectionName),
              version: 1,
            });
            this.stats.sectionsCreated++;
          } catch (error) {
            console.error(`Failed to create section "${sectionName}" for term "${term.term_name}":`, error);
          }
        }
      }
      
      if (this.options.verbose) {
        console.log(`  ✅ Imported: ${term.term_name}`);
      }
      
      return true;
    } catch (error) {
      // Retry logic for transient errors
      if (this.isRetryableError(error) && this.stats.retryAttempts < 3) {
        this.stats.retryAttempts++;
        await this.sleep(1000); // Wait 1 second before retry
        return this.importSingleTerm(term);
      }
      
      throw error;
    }
  }

  private async ensureCategories(term: ParsedTerm): Promise<{ main: string[]; sub: string[] }> {
    const mainIds: string[] = [];
    const subIds: string[] = [];
    
    // Ensure main categories
    for (const categoryName of term.main_categories) {
      const catId = await this.ensureCategory(categoryName);
      if (catId) mainIds.push(catId);
    }
    
    // Ensure sub categories
    for (const categoryName of term.sub_categories) {
      const catId = await this.ensureCategory(categoryName);
      if (catId) subIds.push(catId);
    }
    
    // Default category if none specified
    if (mainIds.length === 0) {
      const generalId = await this.ensureCategory('General');
      if (generalId) mainIds.push(generalId);
    }
    
    return { main: mainIds, sub: subIds };
  }

  private async ensureCategory(categoryName: string): Promise<string | null> {
    const normalized = categoryName.trim().toLowerCase();
    
    // Check cache
    if (this.categoryMap.has(normalized)) {
      return this.categoryMap.get(normalized)!;
    }
    
    // Create new category
    try {
      const newCategory = await db.insert(categories).values({
        name: categoryName.trim(),
        description: `Category for ${categoryName} related AI/ML terms`,
      }).returning();
      
      const catId = newCategory[0].id;
      this.categoryMap.set(normalized, catId);
      this.stats.categoriesCreated++;
      
      if (this.options.verbose) {
        console.log(`  📁 Created category: ${categoryName}`);
      }
      
      return catId;
    } catch (error: Error | unknown) {
      // Handle duplicate key errors
      if (error.code === '23505') {
        // Try to fetch the existing category
        const existing = await db.select().from(categories).where(sql`LOWER(name) = ${normalized}`).limit(1);
        if (existing.length > 0) {
          this.categoryMap.set(normalized, existing[0].id);
          return existing[0].id;
        }
      }
      
      console.error(`Failed to create category "${categoryName}":`, error);
      return null;
    }
  }

  private getSectionDisplayType(sectionName: string): string {
    const name = sectionName.toLowerCase();
    
    if (name.includes('introduction') || name.includes('definition') || name.includes('overview')) {
      return 'main';
    }
    if (name.includes('example') || name.includes('code') || name.includes('implementation')) {
      return 'code';
    }
    if (name.includes('diagram') || name.includes('visual') || name.includes('illustration')) {
      return 'visual';
    }
    if (name.includes('interactive') || name.includes('quiz') || name.includes('exercise')) {
      return 'interactive';
    }
    if (name.includes('metadata') || name.includes('tag') || name.includes('category')) {
      return 'metadata';
    }
    
    return 'sidebar';
  }

  private isRequiredSection(sectionName: string): boolean {
    const required = ['introduction', 'definition', 'overview', 'how it works', 'prerequisites'];
    return required.some(req => sectionName.toLowerCase().includes(req));
  }

  private isRetryableError(error: Error | unknown): boolean {
    if (!error) return false;
    
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
    const retryableMessages = ['deadlock', 'timeout', 'connection', 'temporary'];
    
    if (error.code && retryableCodes.includes(error.code)) return true;
    if (error.message) {
      const msg = error.message.toLowerCase();
      return retryableMessages.some(keyword => msg.includes(keyword));
    }
    
    return false;
  }

  private reportProgress(): void {
    const elapsed = (performance.now() - this.stats.startTime) / 1000;
    const processed = this.stats.processedRows;
    const total = this.stats.totalRows;
    
    if (processed === 0) return;
    
    const rate = processed / elapsed;
    const percentage = total > 0 ? (processed / total * 100).toFixed(1) : '?';
    const remaining = total > 0 ? (total - processed) / rate : 0;
    
    console.log(`\n📊 Progress: ${processed}/${total} (${percentage}%)`);
    console.log(`⏱️  Rate: ${rate.toFixed(1)} terms/sec`);
    console.log(`✅ Imported: ${this.stats.successfulImports}`);
    console.log(`⏭️  Skipped: ${this.stats.skippedDuplicates}`);
    console.log(`❌ Errors: ${this.stats.importErrors}`);
    
    if (remaining > 0) {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = Math.floor(remaining % 60);
      console.log(`⏳ Est. time remaining: ${hours}h ${minutes}m ${seconds}s`);
    }
    
    console.log(`💾 Memory: ${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(0)}MB`);
  }

  private printFinalReport(): void {
    const elapsed = (performance.now() - this.stats.startTime) / 1000;
    
    console.log('\n\n🎉 IMPORT COMPLETED');
    console.log('===================');
    console.log(`⏱️  Total time: ${(elapsed / 60).toFixed(2)} minutes`);
    console.log(`📊 Total rows: ${this.stats.totalRows}`);
    console.log(`✅ Successfully imported: ${this.stats.successfulImports}`);
    console.log(`⏭️  Skipped duplicates: ${this.stats.skippedDuplicates}`);
    console.log(`⚠️  Validation errors: ${this.stats.validationErrors}`);
    console.log(`❌ Import errors: ${this.stats.importErrors}`);
    console.log(`📁 Categories created: ${this.stats.categoriesCreated}`);
    console.log(`📄 Sections created: ${this.stats.sectionsCreated}`);
    console.log(`🔄 Retry attempts: ${this.stats.retryAttempts}`);
    console.log(`💾 Peak memory usage: ${this.stats.peakMemoryUsage.toFixed(0)}MB`);
    
    if (this.stats.successfulImports > 0) {
      const successRate = (this.stats.successfulImports / (this.stats.processedRows - this.stats.skippedDuplicates) * 100).toFixed(1);
      console.log(`\n📈 Success rate: ${successRate}%`);
      console.log(`⚡ Average speed: ${(this.stats.processedRows / elapsed).toFixed(1)} terms/sec`);
    }
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  ${this.stats.errors.length} errors occurred. First 5:`);
      this.stats.errors.slice(0, 5).forEach(error => {
        console.log(`  Row ${error.row} (${error.term}): ${error.error}`);
      });
    }
  }

  private async saveErrorLog(): Promise<void> {
    const logPath = this.options.errorLogFile || `import-errors-${new Date().toISOString().replace(/:/g, '-')}.json`;
    
    const errorLog = {
      importDate: new Date().toISOString(),
      sourceFile: this.options.source,
      stats: this.stats,
      errors: this.stats.errors,
      fullErrorLog: this.errorLog,
    };
    
    await fs.writeFile(logPath, JSON.stringify(errorLog, null, 2));
    console.log(`\n📝 Error log saved to: ${logPath}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Allow graceful shutdown
  shutdown(): void {
    console.log('\n⚠️  Shutting down import...');
    this.abortController.abort();
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const getArg = (flag: string, defaultValue?: any) => {
    const index = args.indexOf(flag);
    if (index === -1) return defaultValue;
    if (index + 1 >= args.length) return true;
    return args[index + 1];
  };
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Glossary Pro - Bulk Term Import Tool

Usage: npx tsx scripts/import-bulk-terms.ts [options]

Options:
  --source <path>         Path to CSV or JSON file to import (required)
  --format <type>         File format: csv or json (default: csv)
  --batch-size <n>        Number of terms to process per batch (default: 100)
  --max-concurrent <n>    Max concurrent imports (default: 5)
  --skip-duplicates       Skip terms that already exist (default: true)
  --no-skip-duplicates    Import duplicate terms
  --validate              Validate term data before import (default: true)
  --no-validate           Skip validation
  --dry-run               Preview import without making changes
  --verbose               Show detailed import progress
  --resume-from <n>       Resume from specific row number (CSV only)
  --max-rows <n>          Limit number of rows to process
  --error-log <path>      Path to save error log
  --help, -h              Show this help message

Examples:
  # Import CSV file
  npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --format csv

  # Import JSON file with larger batches
  npx tsx scripts/import-bulk-terms.ts --source data/terms.json --format json --batch-size 200

  # Dry run to preview import
  npx tsx scripts/import-bulk-terms.ts --source data/test.csv --dry-run --verbose

  # Resume interrupted import from row 5000
  npx tsx scripts/import-bulk-terms.ts --source data/large.csv --resume-from 5000

  # Import first 1000 rows only
  npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --max-rows 1000
    `);
    process.exit(0);
  }
  
  // Validate required arguments
  const source = getArg('--source');
  if (!source) {
    console.error('❌ Error: --source argument is required');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  
  // Build options
  const options: Partial<ImportOptions> = {
    source,
    format: getArg('--format', 'csv') as 'csv' | 'json',
    batchSize: parseInt(getArg('--batch-size', '100'), 10),
    maxConcurrent: parseInt(getArg('--max-concurrent', '5'), 10),
    skipDuplicates: !args.includes('--no-skip-duplicates'),
    validateData: !args.includes('--no-validate'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    errorLogFile: getArg('--error-log'),
  };
  
  const resumeFrom = getArg('--resume-from');
  if (resumeFrom) {
    options.resumeFrom = parseInt(resumeFrom, 10);
  }
  
  const maxRows = getArg('--max-rows');
  if (maxRows) {
    options.maxRows = parseInt(maxRows, 10);
  }
  
  // Validate source file exists
  try {
    await fs.access(source);
  } catch (error) {
    console.error(`❌ Error: Source file not found: ${source}`);
    process.exit(1);
  }
  
  // Create importer
  const importer = new BulkTermImporter(options);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    importer.shutdown();
    process.exit(1);
  });
  
  process.on('SIGTERM', () => {
    importer.shutdown();
    process.exit(1);
  });
  
  // Run import
  try {
    await importer.import();
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { BulkTermImporter, type ImportOptions, type ImportStats, type ParsedTerm };