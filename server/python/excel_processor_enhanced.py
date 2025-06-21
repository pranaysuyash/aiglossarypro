#!/usr/bin/env python3
"""
Enhanced Excel Processor for AI/ML Glossary with Chunking Support
This script processes Excel files efficiently using pandas with memory optimization and chunking
"""

import os
import sys
import json
import logging
import argparse
import re
import uuid
from typing import Dict, List, Any, Optional, Set, Tuple
import pandas as pd
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def extract_category_from_text(text: str) -> str:
    """Extract the main category from natural language description"""
    if not text or pd.isna(text):
        return ""
    
    text = str(text).strip()
    
    # Pattern 1: "Main Category: [category name]"
    pattern1 = r"Main Category:\s*([^;,\n]+)"
    match = re.search(pattern1, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Pattern 2: "main category of [category name]"
    pattern2 = r"main category of\s+([^,\n\.]+)"
    match = re.search(pattern2, text, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    # Pattern 3: "falls under [category name]"
    pattern3 = r"falls under(?:\s+the)?\s+(?:main\s+category\s+of\s+)?([^,\n\.]+)"
    match = re.search(pattern3, text, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    return ""

def clean_category_name(name: str) -> str:
    """Clean and truncate category name to fit database constraints"""
    if not name or pd.isna(name):
        return ""
    
    cleaned = str(name).strip()
    cleaned = re.sub(r'\s+within\s+.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+in\s+.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.title()
    
    if len(cleaned) > 100:
        cleaned = cleaned[:97] + "..."
    
    return cleaned

def process_excel_file_chunked(excel_path: str, output_path: str, chunk_size: int = 500) -> Dict[str, Any]:
    """Process an Excel file with chunking for memory efficiency"""
    logger.info(f"Processing Excel file with chunks: {excel_path}")
    logger.info(f"Chunk size: {chunk_size} rows")
    
    # Initialize variables
    all_terms = []
    all_categories = {}
    all_subcategories = {}
    chunks_processed = 0
    
    try:
        # Read Excel file info
        excel = pd.ExcelFile(excel_path)
        if not excel.sheet_names:
            raise ValueError("Excel file has no sheets")
            
        sheet_name = excel.sheet_names[0]
        logger.info(f"Using sheet: {sheet_name}")
        
        # Get total rows for progress tracking
        temp_df = pd.read_excel(excel, sheet_name=sheet_name, nrows=1)
        total_rows = len(pd.read_excel(excel, sheet_name=sheet_name))
        total_chunks = (total_rows - 1) // chunk_size + 1  # -1 for header
        
        logger.info(f"Total rows: {total_rows}")
        logger.info(f"Total chunks: {total_chunks}")
        
        # Read headers first
        headers_df = pd.read_excel(excel, sheet_name=sheet_name, nrows=0)
        headers = list(headers_df.columns)
        
        # Create section mapping
        section_map = {}
        for col in headers[1:]:  # Skip the Term column
            col_str = str(col).strip()
            if not col_str:
                continue
                
            if '–' in col_str:
                parts = col_str.split('–', 1)
                section = parts[0].strip()
                subsection = parts[1].strip() if len(parts) > 1 else ""
            elif '-' in col_str:
                parts = col_str.split('-', 1)
                section = parts[0].strip()
                subsection = parts[1].strip() if len(parts) > 1 else ""
            else:
                section = col_str
                subsection = ""
            
            if section not in section_map:
                section_map[section] = {}
            
            if subsection:
                section_map[section][subsection] = col
        
        logger.info(f"Found {len(section_map)} main sections")
        
        # Process data in chunks
        logger.info("Processing data in chunks...")
        
        for chunk_num in range(total_chunks):
            skip_rows = chunk_num * chunk_size + 1  # +1 to skip header except for first chunk
            nrows = chunk_size
            
            if chunk_num == 0:
                skip_rows = 0  # Include header for first chunk
                nrows = chunk_size + 1
            
            logger.info(f"Processing chunk {chunk_num + 1} of {total_chunks}")
            
            try:
                # Read chunk
                chunk_df = pd.read_excel(
                    excel, 
                    sheet_name=sheet_name, 
                    skiprows=skip_rows if chunk_num > 0 else None,
                    nrows=nrows,
                    header=0 if chunk_num == 0 else None
                )
                
                if chunk_num > 0:
                    chunk_df.columns = headers
                
                # Process each row in the chunk
                for _, row in chunk_df.iterrows():
                    term_name = str(row.iloc[0]).strip() if not pd.isna(row.iloc[0]) else ""
                    
                    if not term_name or term_name == 'nan':
                        continue
                    
                    # Extract category information
                    category_text = ""
                    subcategory_text = ""
                    
                    # Look for category in specific columns
                    for col in headers[1:]:
                        if 'categor' in col.lower() and not pd.isna(row[col]):
                            if 'main' in col.lower() or 'primary' in col.lower():
                                category_text = str(row[col])
                            elif 'sub' in col.lower():
                                subcategory_text = str(row[col])
                    
                    # Extract category
                    category_name = extract_category_from_text(category_text)
                    if not category_name and category_text:
                        category_name = clean_category_name(category_text[:100])
                    if not category_name:
                        category_name = "General"
                    
                    category_name = clean_category_name(category_name)
                    
                    # Create or get category
                    if category_name not in all_categories:
                        all_categories[category_name] = {
                            "id": str(uuid.uuid4()),
                            "name": category_name,
                            "description": f"Category for {category_name} related terms"
                        }
                    
                    category_id = all_categories[category_name]["id"]
                    
                    # Build term content sections
                    sections = {}
                    for section_name, subsections in section_map.items():
                        section_content = {}
                        
                        if isinstance(subsections, dict):
                            for subsection_name, col_name in subsections.items():
                                if col_name in row.index and not pd.isna(row[col_name]):
                                    content = str(row[col_name]).strip()
                                    if content and content != 'nan':
                                        section_content[subsection_name] = content
                        
                        if section_content:
                            sections[section_name] = section_content
                    
                    # Create term object
                    term_data = {
                        "id": str(uuid.uuid4()),
                        "name": term_name,
                        "shortDefinition": "",
                        "definition": "",
                        "categoryId": category_id,
                        "sections": sections,
                        "viewCount": 0
                    }
                    
                    # Extract definition from sections
                    for section_name, section_content in sections.items():
                        if 'definition' in section_name.lower() or 'introduction' in section_name.lower():
                            for subsection_name, content in section_content.items():
                                if 'definition' in subsection_name.lower():
                                    term_data["definition"] = content[:500]  # Limit length
                                    term_data["shortDefinition"] = content[:200]
                                    break
                            if term_data["definition"]:
                                break
                    
                    # Fallback for definition
                    if not term_data["definition"]:
                        for section_content in sections.values():
                            if isinstance(section_content, dict):
                                for content in section_content.values():
                                    if len(content) > 50:  # Use first substantial content as definition
                                        term_data["definition"] = content[:500]
                                        term_data["shortDefinition"] = content[:200]
                                        break
                                if term_data["definition"]:
                                    break
                    
                    all_terms.append(term_data)
                
                chunks_processed += 1
                
                # Progress reporting
                if chunks_processed % 5 == 0:
                    logger.info(f"Processed {len(all_terms)} terms in {chunks_processed} chunks")
                    
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_num + 1}: {e}")
                continue
        
        logger.info(f"Processing complete: {len(all_terms)} terms, {len(all_categories)} categories, {len(all_subcategories)} subcategories")
        
        # Prepare output data
        output_data = {
            "terms": all_terms,
            "categories": all_categories,
            "subcategories": all_subcategories,
            "metadata": {
                "total_chunks": chunks_processed,
                "chunk_size": chunk_size,
                "processed_at": pd.Timestamp.now().isoformat()
            }
        }
        
        # Save to file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Results saved to {output_path}")
        
        return {
            "success": True,
            "terms": len(all_terms),
            "categories": len(all_categories),
            "subcategories": len(all_subcategories),
            "chunks_processed": chunks_processed,
            "output_path": output_path
        }
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {e}")
        return {
            "success": False,
            "error": str(e),
            "terms": 0,
            "categories": 0,
            "subcategories": 0,
            "chunks_processed": chunks_processed
        }

def main():
    parser = argparse.ArgumentParser(description='Enhanced Excel Processor with Chunking')
    parser.add_argument('--input', required=True, help='Input Excel file path')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--chunk-size', type=int, default=500, help='Number of rows per chunk')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.input):
        result = {"success": False, "error": f"Input file not found: {args.input}"}
        print(json.dumps(result))
        sys.exit(1)
    
    # Process the file
    result = process_excel_file_chunked(args.input, args.output, args.chunk_size)
    
    # Output result as JSON
    print(json.dumps(result))
    
    if result["success"]:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 