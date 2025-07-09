#!/usr/bin/env node

/**
 * AI/ML Glossary Database Importer
 *
 * Works with the existing processor outputs to import completed data to PostgreSQL
 * Integrates seamlessly with the existing 6-processor system
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

// ── Configuration ─────────────────────────────────────────────────────────────

const CONFIG = {
  // Database settings
  DB_CONFIG: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aiglossary',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  // Import settings
  BATCH_SIZE: 100,
  HASH_FILE: 'import_hashes.json',
  IMPORT_LOG: 'import_summary.json',
};

// ── Logging ───────────────────────────────────────────────────────────────────

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${level.toUpperCase()} - ${message}`;
  console.log(logMessage);

  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// ── File Loaders ──────────────────────────────────────────────────────────────

async function loadCSV(filename) {
  try {
    log('info', `Loading CSV file: ${filename}`);
    const content = await fs.readFile(filename, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or has no data rows');
    }

    const headers = parseCSVLine(lines[0]);
    const rows = [];

    // Process in chunks to avoid memory issues
    const chunkSize = 1000;
    for (let i = 1; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize);
      const parsedChunk = chunk.map((line) => parseCSVLine(line));
      rows.push(...parsedChunk);

      if (i % 10000 === 0) {
        log('info', `Processed ${i} rows...`);
      }
    }

    log('info', `CSV loaded: ${rows.length} rows, ${headers.length} columns`);
    return { headers, rows };
  } catch (error) {
    log('error', `Failed to load CSV ${filename}: ${error.message}`);
    throw error;
  }
}

// ── Database SQL Generation ───────────────────────────────────────────────────

function sanitizeForSQL(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/'/g, "''");
}

function generateTermSQL(term, headers, record, isArray = false) {
  const statements = [];

  if (!term || !term.trim()) {
    return statements; // Skip empty terms
  }

  const safeTerm = sanitizeForSQL(term.trim());

  // 1. Create basic term entry
  statements.push(
    `INSERT INTO basic_terms (id, term, category_id) VALUES ` +
      `(gen_random_uuid(), '${safeTerm}', ` +
      `(SELECT id FROM categories WHERE name = 'AI/ML Generated' LIMIT 1)) ` +
      `ON CONFLICT (term) DO NOTHING;`
  );

  // 2. Create enhanced term with all sections
  const sections = [];

  if (isArray) {
    // CSV format - use headers with row data
    for (let i = 1; i < headers.length && i < record.length; i++) {
      const sectionName = headers[i];
      const sectionContent = record[i];

      if (sectionContent?.trim()) {
        sections.push(`'${sanitizeForSQL(sectionName)}': '${sanitizeForSQL(sectionContent)}'`);
      }
    }
  } else {
    // JSON format - use object properties
    for (const [key, value] of Object.entries(record)) {
      if (key !== headers[0] && value && String(value).trim()) {
        // Skip term column
        sections.push(`'${sanitizeForSQL(key)}': '${sanitizeForSQL(String(value))}'`);
      }
    }
  }

  if (sections.length > 0) {
    statements.push(
      `INSERT INTO enhanced_terms (id, term_id, content) VALUES ` +
        `(gen_random_uuid(), ` +
        `(SELECT id FROM basic_terms WHERE term = '${safeTerm}' LIMIT 1), ` +
        `'{${sections.join(', ')}}') ` +
        `ON CONFLICT (term_id) DO UPDATE SET content = EXCLUDED.content;`
    );
  }

  return statements;
}

// ── Main Import Functions ─────────────────────────────────────────────────────

async function generateSQL(headers, data, isJSON = false) {
  log('info', 'Generating SQL statements for database import');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sqlFile = `aiml_import_${timestamp}.sql`;

  const sqlStatements = [
    '-- AI/ML Glossary Database Import',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Format: ${isJSON ? 'JSON' : 'CSV'}`,
    `-- Total records: ${data.length}`,
    '',
    'BEGIN;',
    '',
    '-- Ensure AI/ML Generated category exists',
    `INSERT INTO categories (id, name, description) VALUES `,
    `(gen_random_uuid(), 'AI/ML Generated', 'Terms imported from AI/ML processing system') `,
    `ON CONFLICT (name) DO NOTHING;`,
    '',
  ];

  let processedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    const term = isJSON ? record[headers[0]] : record[0];

    if (!term || !term.trim()) continue;

    const termSQL = generateTermSQL(term, headers, record, !isJSON);
    sqlStatements.push(...termSQL);
    sqlStatements.push(''); // Empty line for readability

    processedCount++;

    if (processedCount % 100 === 0) {
      log('info', `Generated SQL for ${processedCount} terms...`);
    }
  }

  sqlStatements.push('COMMIT;');
  sqlStatements.push('');
  sqlStatements.push(`-- Import complete: ${processedCount} terms processed`);

  // Save SQL file
  const sqlContent = sqlStatements.join('\n');
  await fs.writeFile(sqlFile, sqlContent, 'utf-8');

  log('info', `Generated SQL import file: ${sqlFile} (${processedCount} terms)`);
  return { sqlFile, processedCount };
}

// ── Main Import Process ───────────────────────────────────────────────────────

async function importFile(inputFile, _options = {}) {
  try {
    log('info', `Starting import process for: ${inputFile}`);

    const ext = path.extname(inputFile).toLowerCase();
    const isJSON = ext === '.json';

    // Load data
    let headers, data;
    if (isJSON) {
      // JSON support would go here
      throw new Error('JSON support not implemented yet. Please use CSV files.');
    } else {
      const result = await loadCSV(inputFile);
      headers = result.headers;
      data = result.rows;
    }

    if (!headers.length || !data.length) {
      throw new Error('No data found in input file');
    }

    // Generate SQL
    const sqlResult = await generateSQL(headers, data, isJSON);

    // Create summary
    const summary = {
      inputFile,
      inputType: isJSON ? 'JSON' : 'CSV',
      totalRecords: data.length,
      totalFields: headers.length,
      sqlFile: sqlResult.sqlFile,
      processedTerms: sqlResult.processedCount,
      timestamp: new Date().toISOString(),
    };

    // Save import summary
    await fs.writeFile(CONFIG.IMPORT_LOG, JSON.stringify(summary, null, 2));

    log('info', 'Import preparation completed successfully', summary);

    console.log('\n📋 Next Steps:');
    console.log(`1. Review the generated SQL file: ${sqlResult.sqlFile}`);
    console.log(`2. Execute against your database:`);
    console.log(`   psql -d aiglossary -f ${sqlResult.sqlFile}`);
    console.log(`3. Check import summary: ${CONFIG.IMPORT_LOG}`);

    return summary;
  } catch (error) {
    log('error', `Import failed: ${error.message}`);
    throw error;
  }
}

// ── CLI Interface ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
AI/ML Glossary Database Importer

Usage:
  node database_importer.js <input-file> [options]

Supported Input:
  CSV files from any of the 6 processors

Options:
  --help, -h           Show this help

Environment Variables:
  DB_HOST              Database host (default: localhost)
  DB_PORT              Database port (default: 5432)
  DB_NAME              Database name (default: aiglossary)
  DB_USER              Database user (default: postgres)
  DB_PASSWORD          Database password

Examples:
  # Import from any processor output
  node database_importer.js aiml2.csv

Integration with Existing Processors:
  # Step 1: Run any processor
  python aimlv2_csv.py --mode topdown
  node aimlv2_simple.js --csv --topdown
  
  # Step 2: Import the results
  node database_importer.js aiml2.csv
        `);
    return;
  }

  try {
    // Get input file
    const inputFile = args.find((arg) => !arg.startsWith('--'));
    if (!inputFile) {
      throw new Error('Please specify an input file (CSV)');
    }

    // Start import
    await importFile(inputFile);
  } catch (error) {
    log('error', `Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// ── Entry Point ───────────────────────────────────────────────────────────────

main().catch(console.error);
