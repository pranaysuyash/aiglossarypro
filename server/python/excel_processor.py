#!/usr/bin/env python3
"""
Excel Processor for AI/ML Glossary
This script processes Excel files efficiently using pandas with memory optimization
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
        # Clean up common endings
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    # Pattern 3: "falls under [category name]"
    pattern3 = r"falls under(?:\s+the)?\s+(?:main\s+category\s+of\s+)?([^,\n\.]+)"
    match = re.search(pattern3, text, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    # Pattern 4: "belongs to [category name]"
    pattern4 = r"belongs to(?:\s+the)?\s+(?:main\s+category\s+of\s+)?([^,\n\.]+)"
    match = re.search(pattern4, text, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    # Pattern 5: "category of [category name]"
    pattern5 = r"category of\s+([^,\n\.]+)"
    match = re.search(pattern5, text, re.IGNORECASE)
    if match:
        category = match.group(1).strip()
        category = re.sub(r'\s+(within|in|and|or)\s+.*$', '', category, flags=re.IGNORECASE)
        return category
    
    # If no pattern matches, try to extract the first meaningful phrase
    # Look for quoted categories
    quoted_match = re.search(r"['\"]([^'\"]+)['\"]", text)
    if quoted_match:
        return quoted_match.group(1).strip()
    
    # Fallback: return empty string
    return ""

def extract_subcategory_from_text(text: str) -> list:
    """Extract subcategories from natural language description"""
    if not text or pd.isna(text):
        return []
    
    text = str(text).strip()
    subcategories = []
    
    # Pattern 1: "Sub-category: [subcategory name]"
    pattern1 = r"Sub-category:\s*([^;,\n]+)"
    match = re.search(pattern1, text, re.IGNORECASE)
    if match:
        subcategories.append(match.group(1).strip())
    
    # Pattern 2: "sub-category of [subcategory name]"
    pattern2 = r"sub-category of\s+([^,\n\.]+)"
    match = re.search(pattern2, text, re.IGNORECASE)
    if match:
        subcat = match.group(1).strip()
        subcat = re.sub(r'\s+(within|in|and|or)\s+.*$', '', subcat, flags=re.IGNORECASE)
        subcategories.append(subcat)
    
    # Pattern 3: Look for quoted subcategories
    quoted_matches = re.findall(r"['\"]([^'\"]+)['\"]", text)
    for match in quoted_matches:
        if len(match.strip()) > 3:  # Avoid short meaningless matches
            subcategories.append(match.strip())
    
    return subcategories

def clean_category_name(name: str) -> str:
    """Clean and truncate category name to fit database constraints"""
    if not name or pd.isna(name):
        return ""
    
    # Clean the name
    cleaned = str(name).strip()
    
    # Remove common unnecessary words/phrases
    cleaned = re.sub(r'\s+within\s+.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+in\s+.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+and\s+.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+or\s+.*$', '', cleaned, flags=re.IGNORECASE)
    
    # Title case for consistency
    cleaned = cleaned.title()
    
    # Truncate to fit database constraint (100 characters)
    if len(cleaned) > 100:
        cleaned = cleaned[:97] + "..."
    
    return cleaned

def process_excel_file(excel_path: str, output_path: str, max_chunks: Optional[int] = None) -> Dict[str, Any]:
    """Process an Excel file with chunking for memory efficiency"""
    logger.info(f"Processing Excel file: {excel_path}")
    
    # Initialize variables
    terms = []
    categories = {}
    subcategories = {}
    chunks_processed = 0
    chunk_size = 100
    
    # Convert max_chunks to integer if it's not None
    if max_chunks is not None:
        try:
            max_chunks = int(max_chunks)
            logger.info(f"Will process a maximum of {max_chunks} chunks")
        except (ValueError, TypeError):
            logger.warning(f"Invalid max_chunks value: {max_chunks}, using default")
            max_chunks = None
    
    try:
        # First, just extract the column headers to create our section mapping
        logger.info("Reading Excel file information...")
        excel = pd.ExcelFile(excel_path)
        
        if not excel.sheet_names:
            raise ValueError("Excel file has no sheets")
            
        sheet_name = excel.sheet_names[0]
        logger.info(f"Using sheet: {sheet_name}")
        
        # Read just the headers
        headers_df = pd.read_excel(excel, sheet_name=sheet_name, nrows=0)
        headers = list(headers_df.columns)
        
        logger.info(f"Found {len(headers)} columns")
        
        # Create section mapping from headers
        section_map = {}
        for col in headers[1:]:  # Skip the Term column
            col_str = str(col).strip()
            
            # Skip empty column names
            if not col_str:
                continue
            
            # Extract section and subsection using the dash separator
            if '–' in col_str:  # en dash
                parts = col_str.split('–', 1)
                section = parts[0].strip()
                subsection = parts[1].strip() if len(parts) > 1 else ""
            elif '-' in col_str:  # regular hyphen as fallback
                parts = col_str.split('-', 1)
                section = parts[0].strip()
                subsection = parts[1].strip() if len(parts) > 1 else ""
            else:
                # No separator, use whole name as section
                section = col_str
                subsection = ""
            
            # Initialize the section if not already there
            if section not in section_map:
                section_map[section] = {}
            
            # Add the subsection with its column reference
            if subsection:
                section_map[section][subsection] = col
        
        # Print sections found
        logger.info(f"Found {len(section_map)} main sections:")
        for section, subsections in section_map.items():
            logger.info(f"  {section}: {len(subsections)} subsections")
        
        # Start processing in chunks to save memory
        categories = []
        subcategories = []
        terms = []
        
        # Track categories and subcategories we've seen
        category_map = {}  # name -> id
        subcategory_map = {}  # (category_id, name) -> id
        
        # Don't create categories from sections - we'll create them from actual data
        logger.info("Categories will be created from actual data, not from column headers")
        
        # Find key columns
        main_cat_col = None
        subcat_col = None
        definition_col = None
        
        # Find important columns - use both Introduction and Tags columns
        intro_cat_col = None
        intro_subcat_col = None
        tags_cat_col = None
        tags_subcat_col = None
        
        for section, subsections in section_map.items():
            for subsection, col in subsections.items():
                if section == "Introduction" and "Definition and Overview" in subsection:
                    definition_col = col
                elif section == "Introduction" and "Main Category" in subsection:
                    intro_cat_col = col
                elif section == "Introduction" and "Sub-category" in subsection:
                    intro_subcat_col = col
                elif section == "Tags and Keywords" and "Main Category" in subsection:
                    tags_cat_col = col
                elif section == "Tags and Keywords" and "Sub-category" in subsection:
                    tags_subcat_col = col
        
        # Use Tags columns as primary (they have better structured data)
        main_cat_col = tags_cat_col or intro_cat_col
        subcat_col = tags_subcat_col or intro_subcat_col
        
        logger.info(f"Key columns - Definition: {definition_col}, Main Category: {main_cat_col}, Subcategory: {subcat_col}")
        
        # Process file in chunks using pandas
        chunk_size = 100  # Process 100 rows at a time
        total_processed = 0
        chunks_processed = 0
        
        logger.info("Processing data in chunks...")
        
        # Create list of columns we actually need to process to reduce memory usage
        needed_columns = ["Term"]
        if definition_col:
            needed_columns.append(definition_col)
        if main_cat_col:
            needed_columns.append(main_cat_col)
        if subcat_col:
            needed_columns.append(subcat_col)
        
        # Read the Excel file (pandas read_excel doesn't support chunking)
        # So we'll read the whole file and then process it in memory chunks
        df = pd.read_excel(
            excel,
            sheet_name=sheet_name,
            usecols=needed_columns
        )
        
        # Get total number of rows
        total_rows = len(df)
        chunks = []
        
        # Create chunks manually
        for i in range(0, total_rows, chunk_size):
            chunk_df = df.iloc[i:i+chunk_size]
            chunks.append(chunk_df)
        
        # Limit chunks based on max_chunks parameter
        if max_chunks is not None and max_chunks > 0 and max_chunks < len(chunks):
            logger.info(f"Limiting to {max_chunks} chunks out of {len(chunks)} total chunks")
            chunks = chunks[:max_chunks]
        
        # Process each chunk
        total_chunks = len(chunks)
        for chunk_df in chunks:
            chunks_processed += 1
            logger.info(f"Processing chunk {chunks_processed} of {total_chunks}")
            
            for idx, row in chunk_df.iterrows():
                # Skip rows with empty term names
                term_name = row["Term"]
                if pd.isna(term_name) or str(term_name).strip() == "":
                    continue
                    
                term_id = str(uuid.uuid4())
                
                # Basic term data
                term_data = {
                    "id": term_id,
                    "name": str(term_name).strip(),
                    "definition": "",
                    "categoryId": None,
                    "subcategoryIds": []
                }
                
                # Extract definition
                if definition_col in row and not pd.isna(row[definition_col]):
                    term_data["definition"] = str(row[definition_col]).strip()
                
                # Extract category information
                if main_cat_col and main_cat_col in row and not pd.isna(row[main_cat_col]):
                    raw_cat_text = str(row[main_cat_col]).strip()
                    
                    # Check if this looks like Tags column (comma-separated) or Introduction column (natural language)
                    if ',' in raw_cat_text and len(raw_cat_text.split(',')) > 2:
                        # Tags column - use first few categories
                        cat_parts = [c.strip() for c in raw_cat_text.split(',')][:3]  # Take first 3 categories
                        # Use the first one as primary category
                        primary_cat = clean_category_name(cat_parts[0])
                        if primary_cat and primary_cat not in category_map:
                            cat_id = str(uuid.uuid4())
                            categories.append({
                                "id": cat_id,
                                "name": primary_cat
                            })
                            category_map[primary_cat] = cat_id
                        if primary_cat:
                            term_data["categoryId"] = category_map[primary_cat]
                    else:
                        # Introduction column - use NLP extraction
                        extracted_cat = extract_category_from_text(raw_cat_text)
                        cat_name = clean_category_name(extracted_cat)
                        
                        if cat_name and cat_name not in category_map:
                            cat_id = str(uuid.uuid4())
                            categories.append({
                                "id": cat_id,
                                "name": cat_name
                            })
                            category_map[cat_name] = cat_id
                        
                        if cat_name:
                            term_data["categoryId"] = category_map[cat_name]
                
                # Extract subcategory
                if subcat_col and subcat_col in row and not pd.isna(row[subcat_col]) and term_data["categoryId"]:
                    raw_subcat_text = str(row[subcat_col]).strip()
                    
                    # Check if this looks like Tags column (comma-separated) or Introduction column (natural language)
                    if ',' in raw_subcat_text and len(raw_subcat_text.split(',')) > 2:
                        # Tags column - use comma-separated values
                        extracted_subcats = [s.strip() for s in raw_subcat_text.split(',') if s.strip()][:5]  # Limit to 5
                    else:
                        # Introduction column - use NLP extraction first
                        extracted_subcats = extract_subcategory_from_text(raw_subcat_text)
                        
                        # If no subcategories found with NLP, try simple splitting
                        if not extracted_subcats:
                            if ',' in raw_subcat_text:
                                extracted_subcats = [s.strip() for s in raw_subcat_text.split(',') if s.strip()]
                            elif ';' in raw_subcat_text:
                                extracted_subcats = [s.strip() for s in raw_subcat_text.split(';') if s.strip()]
                            else:
                                extracted_subcats = [raw_subcat_text]
                    
                    for raw_subcat_name in extracted_subcats:
                        subcat_name = clean_category_name(raw_subcat_name)
                        if subcat_name:
                            key = (term_data["categoryId"], subcat_name)
                            if key not in subcategory_map:
                                subcat_id = str(uuid.uuid4())
                                subcategories.append({
                                    "id": subcat_id,
                                    "name": subcat_name,
                                    "categoryId": term_data["categoryId"]
                                })
                                subcategory_map[key] = subcat_id
                            
                            term_data["subcategoryIds"].append(subcategory_map[key])
                
                terms.append(term_data)
                total_processed += 1
            
            # Print progress
            if chunks_processed % 5 == 0:
                logger.info(f"Processed {total_processed} terms in {chunks_processed} chunks")
            
            # For testing, limit the number of chunks if specified
            if max_chunks and chunks_processed >= max_chunks:
                logger.info(f"Reached maximum chunks {max_chunks}, stopping")
                break
        
        # Save results to JSON
        results = {
            "categories": categories,
            "subcategories": subcategories,
            "terms": terms
        }
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Processing complete: {total_processed} terms, {len(categories)} categories, {len(subcategories)} subcategories")
        logger.info(f"Results saved to {output_path}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing Excel: {str(e)}", exc_info=True)
        raise

def main():
    """Main function to process Excel file"""
    parser = argparse.ArgumentParser(description="Process Excel file for the AI/ML Glossary")
    parser.add_argument("--input", required=True, help="Input Excel file path")
    parser.add_argument("--output", required=True, help="Output JSON file path")
    parser.add_argument("--max-chunks", type=int, help="Maximum number of chunks to process (for testing)")
    
    args = parser.parse_args()
    
    try:
        # Process the Excel file
        results = process_excel_file(args.input, args.output, args.max_chunks)
        
        # Print a summary
        print(json.dumps({
            "success": True,
            "categories": len(results["categories"]),
            "subcategories": len(results["subcategories"]),
            "terms": len(results["terms"]),
            "output_path": args.output
        }))
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {e}", exc_info=True)
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
