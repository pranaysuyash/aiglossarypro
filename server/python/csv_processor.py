#!/usr/bin/env python3
"""
CSV Processor for AI/ML Glossary
This script processes large CSV files efficiently using chunking
"""

import os
import sys
import json
import logging
import argparse
import uuid
from typing import Dict, List, Any, Optional, Set, Tuple
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def process_csv_file(csv_path: str, output_path: str, max_chunks: int = None) -> Dict[str, Any]:
    """Process a CSV file with chunking for memory efficiency"""
    logger.info(f"Processing CSV file: {csv_path}")
    
    try:
        # First, just extract the column headers to create our section mapping
        logger.info("Reading column headers...")
        df_headers = pd.read_csv(csv_path, nrows=0)
        headers = list(df_headers.columns)
        
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
        
        # Now process in chunks to save memory
        chunk_size = 100  # Process 100 rows at a time
        categories = []
        subcategories = []
        terms = []
        
        # Track categories and subcategories we've seen
        category_map = {}  # name -> id
        subcategory_map = {}  # (category_id, name) -> id
        
        # Create base categories from main sections
        for section in section_map.keys():
            cat_id = str(uuid.uuid4())
            categories.append({
                "id": cat_id,
                "name": section
            })
            category_map[section] = cat_id
        
        logger.info(f"Created {len(categories)} base categories from sections")
        
        # Find key columns indices
        main_cat_col = None
        subcat_col = None
        definition_col = None
        
        # Find important columns
        for section, subsections in section_map.items():
            for subsection, col in subsections.items():
                if "Definition and Overview" in subsection and section == "Introduction":
                    definition_col = col
                if "Main Category" in subsection:
                    main_cat_col = col
                if "Sub-category" in subsection:
                    subcat_col = col
        
        logger.info(f"Key columns - Definition: {definition_col}, Main Category: {main_cat_col}, Subcategory: {subcat_col}")
        
        # Process file in chunks
        total_processed = 0
        chunks_processed = 0
        
        logger.info("Processing data in chunks...")
        for chunk in pd.read_csv(csv_path, chunksize=chunk_size):
            chunks_processed += 1
            
            for idx, row in chunk.iterrows():
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
                    cat_name = str(row[main_cat_col]).strip()
                    if cat_name not in category_map:
                        cat_id = str(uuid.uuid4())
                        categories.append({
                            "id": cat_id,
                            "name": cat_name
                        })
                        category_map[cat_name] = cat_id
                    term_data["categoryId"] = category_map[cat_name]
                
                # Extract subcategory
                if subcat_col and subcat_col in row and not pd.isna(row[subcat_col]) and term_data["categoryId"]:
                    subcat_text = str(row[subcat_col]).strip()
                    
                    # Handle multiple subcategories
                    if ',' in subcat_text:
                        subcat_names = [s.strip() for s in subcat_text.split(',') if s.strip()]
                    elif ';' in subcat_text:
                        subcat_names = [s.strip() for s in subcat_text.split(';') if s.strip()]
                    else:
                        subcat_names = [subcat_text]
                    
                    for subcat_name in subcat_names:
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
            if chunks_processed % 10 == 0:
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
        logger.error(f"Error processing CSV: {str(e)}", exc_info=True)
        raise

def main():
    """Main function to process CSV file"""
    parser = argparse.ArgumentParser(description="Process CSV file for the AI/ML Glossary")
    parser.add_argument("--input", required=True, help="Input CSV file path")
    parser.add_argument("--output", required=True, help="Output JSON file path")
    parser.add_argument("--max-chunks", type=int, help="Maximum number of chunks to process (for testing)")
    
    args = parser.parse_args()
    
    try:
        # Process the CSV file
        results = process_csv_file(args.input, args.output, args.max_chunks)
        
        # Print a summary
        print(json.dumps({
            "success": True,
            "categories": len(results["categories"]),
            "subcategories": len(results["subcategories"]),
            "terms": len(results["terms"]),
            "output_path": args.output
        }))
        
    except Exception as e:
        logger.error(f"Error processing CSV file: {e}", exc_info=True)
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
