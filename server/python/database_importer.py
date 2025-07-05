#!/usr/bin/env python3
"""
Database Importer for Large CSV Files
Handles 1GB+ CSV files with streaming and chunked processing
"""

import os
import sys
import json
import hashlib
import logging
from datetime import datetime
from typing import List, Dict, Optional, Generator
import pandas as pd
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
DB_CONFIG = {
    'host': os.getenv('PGHOST', 'ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech'),
    'port': os.getenv('PGPORT', 5432),
    'database': os.getenv('PGDATABASE', 'neondb'),
    'user': os.getenv('PGUSER', 'neondb_owner'),
    'password': os.getenv('PGPASSWORD', 'npg_9dlJKInqoT1w')
}

BATCH_SIZE = 1000
HASH_FILE = 'import_hashes.json'
IMPORT_LOG = 'import_summary.json'

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def sanitize_for_sql(value: str) -> str:
    """Escape single quotes for SQL"""
    if value is None:
        return ''
    return str(value).replace("'", "''")

def calculate_row_hash(row: pd.Series) -> str:
    """Calculate hash for a row to detect changes"""
    row_string = '|'.join(str(val) for val in row)
    return hashlib.md5(row_string.encode()).hexdigest()

def load_hashes() -> Dict[str, str]:
    """Load existing hashes for change detection"""
    if Path(HASH_FILE).exists():
        with open(HASH_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_hashes(hashes: Dict[str, str]):
    """Save hashes for future change detection"""
    with open(HASH_FILE, 'w') as f:
        json.dump(hashes, f, indent=2)

def connect_database():
    """Create database connection with SSL for Neon"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            sslmode='require'
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def execute_sql_file(sql_file: str) -> bool:
    """Execute SQL file against the database"""
    if not Path(sql_file).exists():
        logger.error(f"SQL file not found: {sql_file}")
        return False
    
    conn = connect_database()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            logger.info(f"Executing SQL file: {sql_file}")
            cursor.execute(sql_content)
            conn.commit()
            
            logger.info("✅ SQL executed successfully!")
            return True
            
    except Exception as e:
        logger.error(f"SQL execution failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def generate_term_sql(term: str, row: pd.Series, headers: List[str]) -> List[str]:
    """Generate SQL statements for a single term matching actual schema"""
    statements = []
    
    if not term or pd.isna(term):
        return statements
    
    safe_term = sanitize_for_sql(term.strip())
    
    # Create a mapping of headers to content
    content_map = {}
    for idx, header in enumerate(headers[1:], 1):  # Skip term column
        if idx < len(row):
            content = row.iloc[idx]
            if content and pd.notna(content) and str(content).strip():
                content_map[header.lower().strip()] = sanitize_for_sql(str(content))
    
    # Extract content for main fields
    definition = content_map.get('definition', content_map.get('overview', content_map.get('description', safe_term)))
    short_definition = content_map.get('short_definition', content_map.get('summary', ''))
    
    # Build applications JSON from available content
    applications = {}
    for key, value in content_map.items():
        if key not in ['definition', 'short_definition', 'summary', 'overview', 'description']:
            applications[key] = value
    
    if applications:
        # Use dollar-quoted string for JSON to avoid quote escaping issues
        applications_json = f"$json${json.dumps(applications)}$json$"
    else:
        applications_json = 'null'
    
    # Insert into terms table with actual schema
    statements.append(
        f"INSERT INTO terms (name, definition, short_definition, applications, category_id) VALUES "
        f"('{safe_term}', '{definition}', '{short_definition}', {applications_json}, "
        f"(SELECT id FROM categories WHERE name = 'AI/ML Generated' LIMIT 1)) "
        f"ON CONFLICT (name) DO UPDATE SET "
        f"definition = EXCLUDED.definition, "
        f"short_definition = EXCLUDED.short_definition, "
        f"applications = EXCLUDED.applications, "
        f"updated_at = now();"
    )
    
    return statements

def process_csv_chunks(filename: str, chunk_size: int = BATCH_SIZE) -> Generator:
    """Process CSV file in chunks to handle large files"""
    logger.info(f"Processing CSV file: {filename}")
    
    # Count total rows first
    total_rows = sum(1 for _ in open(filename)) - 1  # Subtract header
    logger.info(f"Total rows to process: {total_rows}")
    
    # Process in chunks
    for chunk in pd.read_csv(filename, chunksize=chunk_size, low_memory=False):
        yield chunk

def main():
    if len(sys.argv) < 2:
        print("""
AI/ML Glossary Database Importer (Python Version)

Usage:
  python database_importer.py <csv-file> [options]
  python database_importer.py --execute <sql-file>

Options:
  --force-all     Import all records (skip change detection)
  --dry-run       Generate SQL without saving
  --chunk-size N  Set chunk size (default: 1000)
  --execute       Execute existing SQL file against database

Examples:
  python database_importer.py aiml2.csv
  python database_importer.py aiml2.csv --force-all
  python database_importer.py aiml2.csv --dry-run
  python database_importer.py --execute aiml_import_2025-06-30_14-52-19.sql
        """)
        sys.exit(1)
    
    # Check for execute mode
    if '--execute' in sys.argv:
        execute_idx = sys.argv.index('--execute')
        if execute_idx + 1 >= len(sys.argv):
            logger.error("SQL file required after --execute")
            sys.exit(1)
        sql_file = sys.argv[execute_idx + 1]
        success = execute_sql_file(sql_file)
        sys.exit(0 if success else 1)
    
    csv_file = sys.argv[1]
    force_all = '--force-all' in sys.argv
    dry_run = '--dry-run' in sys.argv
    
    # Custom chunk size
    chunk_size = BATCH_SIZE
    if '--chunk-size' in sys.argv:
        idx = sys.argv.index('--chunk-size')
        if idx + 1 < len(sys.argv):
            chunk_size = int(sys.argv[idx + 1])
    
    if not Path(csv_file).exists():
        logger.error(f"File not found: {csv_file}")
        sys.exit(1)
    
    # Start processing
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    sql_file = f"aiml_import_{timestamp}.sql"
    
    logger.info(f"Starting import from {csv_file}")
    logger.info(f"SQL output file: {sql_file}")
    
    # Load existing hashes for change detection
    existing_hashes = {} if force_all else load_hashes()
    new_hashes = {}
    
    # SQL file header
    sql_statements = [
        "-- AI/ML Glossary Database Import",
        f"-- Generated: {datetime.now().isoformat()}",
        f"-- Source: {csv_file}",
        "",
        "BEGIN;",
        "",
        "-- Ensure AI/ML Generated category exists",
        "INSERT INTO categories (id, name, description) VALUES ",
        "(gen_random_uuid(), 'AI/ML Generated', 'Terms imported from AI/ML processing system') ",
        "ON CONFLICT (name) DO NOTHING;",
        ""
    ]
    
    processed_count = 0
    changed_count = 0
    chunk_count = 0
    
    try:
        # Get headers first
        headers_df = pd.read_csv(csv_file, nrows=0)
        headers = headers_df.columns.tolist()
        
        # Process file in chunks
        for chunk in process_csv_chunks(csv_file, chunk_size):
            chunk_count += 1
            logger.info(f"Processing chunk {chunk_count} ({len(chunk)} rows)")
            
            for idx, row in chunk.iterrows():
                term = row.iloc[0] if len(row) > 0 else None
                
                if not term or pd.isna(term):
                    continue
                
                # Calculate row hash for change detection
                row_hash = calculate_row_hash(row)
                term_str = str(term).strip()
                
                # Check if changed
                if not force_all and term_str in existing_hashes and existing_hashes[term_str] == row_hash:
                    new_hashes[term_str] = row_hash
                    continue
                
                # Generate SQL for this term
                term_sql = generate_term_sql(term, row, headers)
                if term_sql:
                    sql_statements.extend(term_sql)
                    sql_statements.append("")  # Empty line for readability
                    processed_count += 1
                    changed_count += 1
                
                new_hashes[term_str] = row_hash
                
                if processed_count % 100 == 0:
                    logger.info(f"Generated SQL for {processed_count} terms...")
        
        # SQL footer
        sql_statements.extend([
            "COMMIT;",
            "",
            f"-- Import complete: {processed_count} terms processed ({changed_count} new/changed)"
        ])
        
        # Save SQL file
        if not dry_run:
            with open(sql_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(sql_statements))
            
            # Save hashes for next run
            save_hashes(new_hashes)
            
            # Save summary
            summary = {
                "input_file": csv_file,
                "sql_file": sql_file,
                "total_terms": len(new_hashes),
                "processed_terms": processed_count,
                "changed_terms": changed_count,
                "timestamp": datetime.now().isoformat()
            }
            
            with open(IMPORT_LOG, 'w') as f:
                json.dump(summary, f, indent=2)
        
        logger.info(f"✅ Import preparation complete!")
        logger.info(f"   Total terms: {len(new_hashes)}")
        logger.info(f"   Changed/new terms: {changed_count}")
        logger.info(f"   SQL file: {sql_file}")
        
        if not dry_run:
            print(f"\n📋 Next steps:")
            print(f"1. Review the SQL file: {sql_file}")
            print(f"2. Execute against your database:")
            print(f"   psql -d aiglossary -f {sql_file}")
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()