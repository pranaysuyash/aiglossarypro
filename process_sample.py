#!/usr/bin/env python3
import pandas as pd
import json
import os
import uuid

print("Creating a smaller sample from the Excel file for testing...")
excel_path = "/home/runner/workspace/temp/s3_aiml2_xlsx.xlsx"

# Create sample output
output_dir = "/home/runner/workspace/temp"
os.makedirs(output_dir, exist_ok=True)
sample_output = os.path.join(output_dir, "sample_output.json")

# Process a small sample
try:
    # Load the Excel file
    print(f"Loading Excel file: {excel_path}")
    df = pd.read_excel(excel_path, nrows=20)  # Just get the first 20 rows
    
    # Print column structure
    print("\nColumn names:")
    for i, col in enumerate(df.columns[:10]):
        print(f"{i}: {col}")
    
    # Print data structure
    print("\nSample data (first 5 rows, first column):")
    for i in range(min(5, len(df))):
        print(f"Row {i}: {df.iloc[i, 0]}")
    
    # Create sample output
    terms = []
    categories = []
    subcategories = []
    
    # Process first few columns for categories and subcategories
    category_map = {}  # name -> id
    subcat_map = {}    # (category_id, name) -> id
    
    # Extract section mapping from the column names
    section_map = {}
    for col in df.columns[1:]:  # Skip the Term column
        col_str = str(col).strip()
        
        # Skip empty column names
        if not col_str:
            continue
        
        # Extract section and subsection using the dash separator
        # Example: "Introduction – Definition and Overview" -> section="Introduction", subsection="Definition and Overview"
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
    
    print("\nDetected sections:")
    for section, subsections in section_map.items():
        print(f"  Section: {section} with {len(subsections)} subsections")
        if len(subsections) > 0:
            sample_subsections = list(subsections.keys())[:3]
            print(f"    Sample subsections: {sample_subsections}")
    
    # Create categories based on sections
    for section_name in section_map.keys():
        cat_id = str(uuid.uuid4())
        categories.append({
            "id": cat_id,
            "name": section_name
        })
        category_map[section_name] = cat_id
    
    # Process rows for terms
    term_column = df.columns[0]
    for idx, row in df.iterrows():
        # Skip empty rows
        if pd.isna(row[term_column]) or str(row[term_column]).strip() == "":
            continue
            
        term_name = str(row[term_column]).strip()
        term_id = str(uuid.uuid4())
            
        # Create basic term data
        term_data = {
            "id": term_id,
            "name": term_name,
            "definition": "",
            "categoryId": None,
            "subcategoryIds": []
        }
            
        # Extract definition from "Introduction – Definition and Overview"
        if "Introduction" in section_map and "Definition and Overview" in section_map["Introduction"]:
            col = section_map["Introduction"]["Definition and Overview"]
            if not pd.isna(row[col]):
                term_data["definition"] = str(row[col]).strip()
                
        # Extract category from main category field
        for section, subsections in section_map.items():
            for subsection, col in subsections.items():
                if "Main Category" in subsection:
                    if not pd.isna(row[col]):
                        cat_name = str(row[col]).strip()
                        # Find or create category
                        if cat_name not in category_map:
                            cat_id = str(uuid.uuid4())
                            categories.append({
                                "id": cat_id,
                                "name": cat_name
                            })
                            category_map[cat_name] = cat_id
                        term_data["categoryId"] = category_map[cat_name]
                        break
                        
        # Extract subcategories
        for section, subsections in section_map.items():
            for subsection, col in subsections.items():
                if "Sub-category" in subsection:
                    if not pd.isna(row[col]):
                        subcat_text = str(row[col]).strip()
                        # Handle multiple subcategories
                        if ',' in subcat_text:
                            subcat_names = [s.strip() for s in subcat_text.split(',') if s.strip()]
                        elif ';' in subcat_text:
                            subcat_names = [s.strip() for s in subcat_text.split(';') if s.strip()]
                        else:
                            subcat_names = [subcat_text]
                            
                        for subcat_name in subcat_names:
                            if not term_data["categoryId"]:
                                continue
                                
                            # Create key for subcategory map
                            key = (term_data["categoryId"], subcat_name)
                            
                            if key not in subcat_map:
                                subcat_id = str(uuid.uuid4())
                                subcategories.append({
                                    "id": subcat_id,
                                    "name": subcat_name,
                                    "categoryId": term_data["categoryId"]
                                })
                                subcat_map[key] = subcat_id
                            else:
                                subcat_id = subcat_map[key]
                                
                            term_data["subcategoryIds"].append(subcat_id)
        
        # Add term to results
        terms.append(term_data)
    
    # Save results to JSON
    result = {
        "categories": categories,
        "subcategories": subcategories,
        "terms": terms
    }
    
    with open(sample_output, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\nProcessed {len(terms)} terms, {len(categories)} categories, and {len(subcategories)} subcategories")
    print(f"Sample data saved to {sample_output}")
except Exception as e:
    print(f"Error processing Excel sample: {str(e)}")
    import traceback
    traceback.print_exc()
