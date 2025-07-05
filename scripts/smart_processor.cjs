#!/usr/bin/env node

/**
 * Smart AI/ML Glossary Processor - Cost Optimized
 * Based on aimlv2_simple.js but with secure configuration
 */

const fs = require('fs').promises;
const https = require('https');

// ── Configuration ─────────────────────────────────────────────────────────────

const CSV_FILE = process.argv.includes('--sample') ? "aiml2_sample.csv" : "aiml2.csv";
const JSON_FILE = "aiml2.json";
const CHECKPOINT_FILE = "checkpoint.json";

const MAX_WORKERS = 25;
const BATCH_SIZE = MAX_WORKERS * 3;
const REQUEST_TIMEOUT = 60000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Use environment variable for API key (secure)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PRIMARY_MODEL = "gpt-4.1-nano";  // Cost-optimized model as requested
const FALLBACK_MODEL = "gpt-3.5-turbo";

// ── Validation ───────────────────────────────────────────────────────────────

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.error('❌ ERROR: OPENAI_API_KEY environment variable is required');
    console.error('Set it with: export OPENAI_API_KEY="your-actual-api-key"');
    process.exit(1);
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${level.toUpperCase()} - ${message}`);
}

// ── Simple CSV Parser ─────────────────────────────────────────────────────────

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

function formatCSVLine(row) {
    return row.map(cell => {
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
}

// ── File Helpers ──────────────────────────────────────────────────────────────

async function loadCSV(filename) {
    const content = await fs.readFile(filename, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => parseCSVLine(line));
    return { headers, rows };
}

async function saveCSV(filename, headers, rows) {
    const lines = [
        formatCSVLine(headers),
        ...rows.map(row => formatCSVLine(row))
    ];
    const tmpFile = filename + '.tmp';
    await fs.writeFile(tmpFile, lines.join('\n'), 'utf-8');
    await fs.rename(tmpFile, filename);
}

// ── OpenAI API ────────────────────────────────────────────────────────────────

async function callOpenAI(prompt, model = PRIMARY_MODEL) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: "You are an AI/ML educational content assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.choices[0].message.content.trim());
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(REQUEST_TIMEOUT, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(data);
        req.end();
    });
}

// ── Checkpoint Management ─────────────────────────────────────────────────────

async function loadCheckpoint() {
    try {
        const content = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return {};
    }
}

async function saveCheckpoint(checkpoint) {
    const tmpFile = CHECKPOINT_FILE + '.tmp';
    await fs.writeFile(tmpFile, JSON.stringify(checkpoint, null, 2), 'utf-8');
    await fs.rename(tmpFile, CHECKPOINT_FILE);
}

// ── Main Processing Functions ─────────────────────────────────────────────────

function constructPrompt(term, section) {
    return `You are an AI/ML educational content assistant. ` +
           `For the term "${term}", please write only the content for this section:\n\n` +
           `"${section}"\n\n` +
           `Do not include any extra headings or formatting—just the prose, ` +
           `concise enough to fit in one spreadsheet cell.`;
}

async function processCell(term, section, row, col, attempt = 0) {
    log('info', `Row ${row}, Col ${col}: '${term}' → '${section}' (attempt ${attempt + 1})`);
    
    try {
        const model = attempt < MAX_RETRIES ? PRIMARY_MODEL : FALLBACK_MODEL;
        const content = await callOpenAI(constructPrompt(term, section), model);
        
        if (content && content.length > 10) {
            log('info', `Completed Row ${row}, Col ${col} (${content.length} chars)`);
            return content;
        }
        throw new Error('Content too short');
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            log('warning', `Row ${row}, Col ${col}: ${error.message}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
            return processCell(term, section, row, col, attempt + 1);
        }
        log('error', `Row ${row}, Col ${col}: Final failure: ${error.message}`);
        return null;
    }
}

async function processCSV(mode = 'topdown') {
    log('info', `Starting CSV processing in ${mode} mode`);
    log('info', `Using model: ${PRIMARY_MODEL} (cost-optimized)`);
    
    const { headers, rows } = await loadCSV(CSV_FILE);
    const checkpoint = await loadCheckpoint();
    
    // Find missing cells
    const tasks = [];
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const term = row[0] || '';
        if (!term) continue;
        
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
            const excelRow = rowIdx + 2;
            const key = `${excelRow}-${colIdx}`;
            
            if (checkpoint[key] || row[colIdx]) continue;
            
            tasks.push({
                rowIdx, colIdx, excelRow,
                term, section: headers[colIdx]
            });
        }
    }
    
    if (mode === 'bottomup') tasks.reverse();
    
    log('info', `Found ${tasks.length} cells to process`);
    
    // Process in batches
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        log('info', `Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(tasks.length/BATCH_SIZE)}`);
        
        const promises = batch.map(task => 
            processCell(task.term, task.section, task.excelRow, task.colIdx)
                .then(content => ({ ...task, content }))
        );
        
        const results = await Promise.all(promises);
        
        // Update data and checkpoint
        let updated = 0;
        for (const result of results) {
            if (result.content) {
                rows[result.rowIdx][result.colIdx] = result.content;
                checkpoint[`${result.excelRow}-${result.colIdx}`] = true;
                updated++;
            }
        }
        
        await saveCSV(CSV_FILE, headers, rows);
        await saveCheckpoint(checkpoint);
        log('info', `Batch completed: ${updated}/${batch.length} updated`);
    }
    
    log('info', 'CSV processing complete!');
}

// ── CLI Interface ─────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Smart AI/ML Glossary Processor (Cost-Optimized)

Usage:
  node smart_processor.cjs [options]

Options:
  --csv         Process CSV file (default)
  --topdown     Process from top to bottom (default)
  --bottomup    Process from bottom to top
  --help, -h    Show this help

Environment Variables:
  OPENAI_API_KEY    Required: Your OpenAI API key

Configuration:
  Model: ${PRIMARY_MODEL} (cost-optimized)
  Fallback: ${FALLBACK_MODEL}
  Batch Size: ${BATCH_SIZE}
  Workers: ${MAX_WORKERS}

Examples:
  export OPENAI_API_KEY="your-actual-key"
  node smart_processor.cjs --csv --topdown
        `);
        return;
    }
    
    try {
        const mode = args.includes('--bottomup') ? 'bottomup' : 'topdown';
        await processCSV(mode);
    } catch (error) {
        log('error', `Fatal error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}