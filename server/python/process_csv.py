#!/usr/bin/env python3
import pandas as pd
import json
import os
import uuid

output_file = "/home/runner/workspace/temp/processed_terms.json"

try:
    csv_path = "/home/runner/workspace/temp/s3_1747126254809_aiml2.csv"
    print(f"Processing CSV file: {csv_path}")
    
    # First, just extract the column headers to create our section mapping
    print("Reading column headers...")
    df_headers = pd.read_csv(csv_path, nrows=0)
    headers = list(df_headers.columns)
    
    print(f"Found {len(headers)} columns")
    
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
    print(f"Found {len(section_map)} main sections:")
    for section, subsections in section_map.items():
        print(f"  {section}: {len(subsections)} subsections")
    
    # Now process in chunks to save memory
    chunk_size = 10  # Process 10 rows at a time
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
    
    print(f"Created {len(categories)} base categories from sections")
    
    # Process file in chunks
    total_processed = 0
    chunks_processed = 0
    
    print("Processing data in chunks...")
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
            if "Introduction" in section_map and "Definition and Overview" in section_map["Introduction"]:
                def_col = section_map["Introduction"]["Definition and Overview"]
                if def_col in row and not pd.isna(row[def_col]):
                    term_data["definition"] = str(row[def_col]).strip()
            
            # Extract category information
            main_cat_col = None
            for section, subsections in section_map.items():
                for subsection, col in subsections.items():
                    if "Main Category" in subsection:
                        main_cat_col = col
                        break
                if main_cat_col:
                    break
            
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
            subcat_col = None
            for section, subsections in section_map.items():
                for subsection, col in subsections.items():
                    if "Sub-category" in subsection:
                        subcat_col = col
                        break
                if subcat_col:
                    break
            
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
            print(f"Processed {total_processed} terms in {chunks_processed} chunks")
        
        # For testing, just process a few chunks
        if chunks_processed >= 50:  # Process ~500 terms max
            print("Reached maximum chunks for testing, stopping")
            break
    
    # Save results to JSON
    results = {
        "categories": categories,
        "subcategories": subcategories,
        "terms": terms
    }
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Processing complete: {total_processed} terms, {len(categories)} categories, {len(subcategories)} subcategories")
    print(f"Results saved to {output_file}")
    
except Exception as e:
    print(f"Error processing CSV: {str(e)}")
    import traceback
    traceback.print_exc()
