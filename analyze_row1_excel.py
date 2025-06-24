#!/usr/bin/env python3
"""Analyze the row1.xlsx file to understand the 42-section structure"""

import openpyxl
import json

def analyze_excel_structure(file_path):
    """Analyze the Excel file structure and content"""
    
    # Load the workbook
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    sheet = wb.active
    
    # Get column headers (first row)
    headers = []
    for cell in sheet[1]:
        if cell.value:
            headers.append(str(cell.value))
    
    # Get the first data row (second row)
    first_row_data = {}
    for idx, cell in enumerate(sheet[2]):
        if idx < len(headers) and cell.value:
            first_row_data[headers[idx]] = str(cell.value)
    
    # Analyze section structure
    sections = {}
    current_section = None
    
    # Group columns by section patterns
    for header in headers:
        # Identify section patterns
        if '1.' in header and '1.1' not in header:
            current_section = '1. Introduction'
            sections[current_section] = []
        elif '2.' in header and '2.1' not in header:
            current_section = '2. Core Concepts'
            sections[current_section] = []
        elif '3.' in header and '3.1' not in header:
            current_section = '3. Technical Details'
            sections[current_section] = []
        elif '4.' in header and '4.1' not in header:
            current_section = '4. Applications'
            sections[current_section] = []
        elif '5.' in header and '5.1' not in header:
            current_section = '5. Implementation'
            sections[current_section] = []
        # Add more section patterns as needed
        
        if current_section and current_section in sections:
            sections[current_section].append(header)
    
    # Print analysis
    print(f"Excel File Analysis: {file_path}")
    print("=" * 80)
    print(f"Total Columns: {len(headers)}")
    print(f"Data Rows: {sheet.max_row - 1}")  # Minus header row
    
    print("\nFirst 20 Column Headers:")
    for i, header in enumerate(headers[:20]):
        print(f"{i+1:3d}. {header}")
    
    print("\n... (middle columns omitted) ...\n")
    
    print(f"Last 20 Column Headers:")
    for i, header in enumerate(headers[-20:], start=len(headers)-20):
        print(f"{i+1:3d}. {header}")
    
    # Print first term data
    term_name = first_row_data.get('Term', 'Unknown')
    print(f"\nFirst Term: {term_name}")
    print("-" * 80)
    
    # Print non-empty fields for the first term
    print("\nNon-empty fields for first term:")
    non_empty_count = 0
    for key, value in first_row_data.items():
        if value and value.strip() and value != 'nan':
            non_empty_count += 1
            print(f"\n{key}:")
            # Truncate long values
            if len(value) > 200:
                print(f"  {value[:200]}...")
            else:
                print(f"  {value}")
    
    print(f"\nTotal non-empty fields: {non_empty_count} out of {len(headers)}")
    
    # Save structured data for further analysis
    output_data = {
        "total_columns": len(headers),
        "headers": headers,
        "first_term": term_name,
        "first_term_data": first_row_data,
        "sections": sections
    }
    
    with open('data/row1_structure_analysis.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\nDetailed analysis saved to: data/row1_structure_analysis.json")
    
    wb.close()
    return headers, first_row_data

if __name__ == "__main__":
    analyze_excel_structure('data/row1.xlsx')