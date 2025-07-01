import crypto from 'crypto';
import { pool } from './db.js';
import { ChunkedExcelProcessor } from './chunkedExcelProcessor.js';

interface TermHash {
  termId: string;
  termName: string;
  contentHash: string;
  fieldHashes: Record<string, string>;
  lastChecked: Date;
}

interface ChangeDetectionResult {
  new: any[];
  modified: { term: any; changes: string[] }[];
  unchanged: any[];
  errors: any[];
}

interface ImportSession {
  id: string;
  filePath: string;
  fileHash: string;
  startedAt: Date;
  status: string;
  stats: {
    total: number;
    new: number;
    modified: number;
    unchanged: number;
    errors: number;
  };
}

export class IncrementalImporter {
  private hashFields = ['name', 'definition', 'category', 'examples', 'related_terms'];

  /**
   * Import Excel file with incremental updates
   */
  async import(filePath: string, options: any = {}): Promise<ImportSession> {
    console.log('🔍 Starting Incremental Import');
    console.log('==============================');
    
    const session = await this.createImportSession(filePath);
    
    try {
      // Phase 1: Scan for changes
      console.log('\n📊 Phase 1: Scanning for changes...');
      const changes = await this.scanForChanges(filePath, options);
      
      // Update session stats
      session.stats = {
        total: changes.new.length + changes.modified.length + changes.unchanged.length,
        new: changes.new.length,
        modified: changes.modified.length,
        unchanged: changes.unchanged.length,
        errors: changes.errors.length
      };

      console.log(`\n📈 Change Detection Results:
        Total Terms: ${session.stats.total}
        New Terms: ${session.stats.new}
        Modified Terms: ${session.stats.modified}
        Unchanged Terms: ${session.stats.unchanged}
        Errors: ${session.stats.errors}
      `);

      // Phase 2: Process changes
      console.log('\n📦 Phase 2: Processing changes...');
      
      if (changes.new.length > 0) {
        console.log(`\n🆕 Processing ${changes.new.length} new terms...`);
        await this.processNewTerms(changes.new, session.id, options);
      }

      if (changes.modified.length > 0 && options.updateExisting !== false) {
        console.log(`\n🔄 Updating ${changes.modified.length} modified terms...`);
        await this.processModifiedTerms(changes.modified, session.id, options);
      }

      if (changes.unchanged.length > 0) {
        console.log(`\n⏭️  Skipping ${changes.unchanged.length} unchanged terms`);
        await this.logSkippedTerms(changes.unchanged, session.id);
      }

      // Update session status
      await this.updateSessionStatus(session.id, 'completed');
      
      console.log('\n✅ Incremental import completed successfully!');
      
      return await this.getImportSession(session.id);

    } catch (error) {
      console.error('❌ Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateSessionStatus(session.id, 'failed', errorMessage);
      throw error;
    }
  }

  /**
   * Scan file for changes compared to existing data
   */
  private async scanForChanges(filePath: string, options: any): Promise<ChangeDetectionResult> {
    const result: ChangeDetectionResult = {
      new: [],
      modified: [],
      unchanged: [],
      errors: []
    };

    // Load Excel data
    const xlsx = await import('xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📄 Loaded ${data.length} rows from Excel`);

    // Process each row
    for (const row of data) {
      try {
        const rowData = row as Record<string, any>;
        const termName = rowData['Term'] || rowData['Name'] || rowData[Object.keys(rowData)[0]];
        
        if (!termName || termName.trim() === '') {
          continue;
        }

        // Check if term exists
        const existingTerm = await this.findExistingTerm(termName);
        
        if (!existingTerm) {
          result.new.push(row);
        } else {
          // Check for changes
          const changes = await this.detectChanges(row, existingTerm);
          
          if (changes.length > 0) {
            result.modified.push({ term: row, changes });
          } else {
            result.unchanged.push(row);
          }
        }

        // Progress update
        if ((result.new.length + result.modified.length + result.unchanged.length) % 100 === 0) {
          console.log(`  Scanned ${result.new.length + result.modified.length + result.unchanged.length} terms...`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({ row, error: errorMessage });
      }
    }

    return result;
  }

  /**
   * Detect changes between new and existing term data
   */
  private async detectChanges(newData: any, existingTerm: any): Promise<string[]> {
    const changes: string[] = [];
    
    // Get existing term hash
    const existingHash = await this.getTermHash(existingTerm.id);
    
    if (!existingHash) {
      // No hash exists, generate and compare
      const newHash = this.generateTermHash(newData);
      const oldHash = this.generateTermHash(existingTerm);
      
      if (newHash !== oldHash) {
        changes.push('content');
      }
    } else {
      // Compare field by field
      for (const field of this.hashFields) {
        const newValue = newData[field] || '';
        const newFieldHash = this.generateFieldHash(newValue);
        const existingFieldHash = existingHash.fieldHashes[field];
        
        if (newFieldHash !== existingFieldHash) {
          changes.push(field);
        }
      }
    }

    return changes;
  }

  /**
   * Process new terms
   */
  private async processNewTerms(terms: any[], sessionId: string, options: any): Promise<void> {
    const client = await pool.connect();
    
    try {
      for (const termData of terms) {
        await client.query('BEGIN');
        
        try {
          // Insert term (simplified - use your actual logic)
          const termId = await this.insertTerm(termData, client);
          
          // Store term hash
          await this.storeTermHash(termId, termData);
          
          // Log import action
          await this.logImportAction(sessionId, termId, termData['Term'] || termData['Name'], 'create');
          
          await client.query('COMMIT');
          
        } catch (error) {
          await client.query('ROLLBACK');
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.logImportAction(sessionId, null, termData['Term'] || termData['Name'], 'error', errorMessage);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Process modified terms
   */
  private async processModifiedTerms(modifications: any[], sessionId: string, options: any): Promise<void> {
    const client = await pool.connect();
    
    try {
      for (const { term, changes } of modifications) {
        await client.query('BEGIN');
        
        try {
          // Update term
          const termId = await this.updateTerm(term, changes, client);
          
          // Update term hash
          await this.updateTerm(termId, term);
          
          // Log import action
          await this.logImportAction(sessionId, termId, term['Term'] || term['Name'], 'update', undefined, changes);
          
          await client.query('COMMIT');
          
        } catch (error) {
          await client.query('ROLLBACK');
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.logImportAction(sessionId, null, term['Term'] || term['Name'], 'error', errorMessage);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Database operations
   */
  private async createImportSession(filePath: string): Promise<ImportSession> {
    const client = await pool.connect();
    
    try {
      const fileHash = this.generateFileHash(filePath);
      
      const result = await client.query(`
        INSERT INTO import_sessions (file_path, file_hash, status, started_at)
        VALUES ($1, $2, 'processing', NOW())
        RETURNING *
      `, [filePath, fileHash]);
      
      return {
        id: result.rows[0].id,
        filePath: result.rows[0].file_path,
        fileHash: result.rows[0].file_hash,
        startedAt: result.rows[0].started_at,
        status: result.rows[0].status,
        stats: {
          total: 0,
          new: 0,
          modified: 0,
          unchanged: 0,
          errors: 0
        }
      };
    } finally {
      client.release();
    }
  }

  private async findExistingTerm(name: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM terms WHERE LOWER(name) = LOWER($1)',
        [name]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  private async getTermHash(termId: string): Promise<TermHash | null> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM term_hashes WHERE term_id = $1',
        [termId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        termId: result.rows[0].term_id,
        termName: result.rows[0].term_name,
        contentHash: result.rows[0].content_hash,
        fieldHashes: result.rows[0].field_hashes || {},
        lastChecked: result.rows[0].last_checked
      };
    } finally {
      client.release();
    }
  }

  private async storeTermHash(termId: string, termData: any): Promise<void> {
    const client = await pool.connect();
    
    try {
      const contentHash = this.generateTermHash(termData);
      const fieldHashes = this.generateFieldHashes(termData);
      
      await client.query(`
        INSERT INTO term_hashes (term_id, term_name, content_hash, field_hashes, last_checked)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (term_id) DO UPDATE SET
          content_hash = EXCLUDED.content_hash,
          field_hashes = EXCLUDED.field_hashes,
          last_checked = NOW()
      `, [termId, termData['Term'] || termData['Name'], contentHash, JSON.stringify(fieldHashes)]);
    } finally {
      client.release();
    }
  }

  /**
   * Hash generation
   */
  private generateTermHash(termData: any): string {
    const content = this.hashFields
      .map(field => termData[field] || '')
      .join('|');
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private generateFieldHash(value: any): string {
    const normalizedValue = String(value).trim().toLowerCase();
    return crypto.createHash('sha256').update(normalizedValue).digest('hex');
  }

  private generateFieldHashes(termData: any): Record<string, string> {
    const hashes: Record<string, string> = {};
    
    for (const field of this.hashFields) {
      hashes[field] = this.generateFieldHash(termData[field] || '');
    }
    
    return hashes;
  }

  private generateFileHash(filePath: string): string {
    // For now, use file path and timestamp
    // In production, you might want to use actual file content hash
    return crypto.createHash('sha256')
      .update(filePath + Date.now())
      .digest('hex');
  }

  /**
   * Simplified database operations (replace with your actual logic)
   */
  private async insertTerm(termData: any, client: any): Promise<string> {
    const result = await client.query(`
      INSERT INTO terms (id, name, definition, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      RETURNING id
    `, [termData['Term'] || termData['Name'], termData['Definition'] || '']);
    
    return result.rows[0].id;
  }

  private async updateTerm(termData: any, changes: string[], client: any): Promise<string> {
    // Simplified update - implement your actual update logic
    const result = await client.query(`
      UPDATE terms 
      SET definition = $2, updated_at = NOW()
      WHERE LOWER(name) = LOWER($1)
      RETURNING id
    `, [termData['Term'] || termData['Name'], termData['Definition'] || '']);
    
    return result.rows[0].id;
  }

  private async logImportAction(
    sessionId: string, 
    termId: string | null, 
    termName: string, 
    action: string, 
    errorMessage?: string,
    changedFields?: string[]
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`
        INSERT INTO import_updates 
        (import_session_id, term_id, term_name, action, changed_fields, error_message, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [sessionId, termId, termName, action, changedFields || null, errorMessage || null]);
    } finally {
      client.release();
    }
  }

  private async logSkippedTerms(terms: any[], sessionId: string): Promise<void> {
    // Batch log skipped terms for efficiency
    const client = await pool.connect();
    
    try {
      for (const termBatch of this.chunk(terms, 100)) {
        const values = termBatch.map(term => 
          `('${sessionId}', '${term['Term'] || term['Name']}', 'skip', NOW())`
        ).join(', ');
        
        await client.query(`
          INSERT INTO import_updates (import_session_id, term_name, action, created_at)
          VALUES ${values}
        `);
      }
    } finally {
      client.release();
    }
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async updateSessionStatus(sessionId: string, status: string, error?: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`
        UPDATE import_sessions 
        SET status = $2, 
            completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE NULL END,
            error_message = $3,
            updated_at = NOW()
        WHERE id = $1
      `, [sessionId, status, error || null]);
    } finally {
      client.release();
    }
  }

  private async getImportSession(sessionId: string): Promise<ImportSession> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM import_sessions WHERE id = $1',
        [sessionId]
      );
      
      // Get stats
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN action = 'create' THEN 1 END) as new,
          COUNT(CASE WHEN action = 'update' THEN 1 END) as modified,
          COUNT(CASE WHEN action = 'skip' THEN 1 END) as unchanged,
          COUNT(CASE WHEN action = 'error' THEN 1 END) as errors
        FROM import_updates
        WHERE import_session_id = $1
      `, [sessionId]);
      
      return {
        ...result.rows[0],
        stats: stats.rows[0]
      };
    } finally {
      client.release();
    }
  }
}

// Export convenience functions
export async function incrementalImport(filePath: string, options?: any): Promise<ImportSession> {
  const importer = new IncrementalImporter();
  return await importer.import(filePath, options);
}