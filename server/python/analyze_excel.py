#!/usr/bin/env python3
import pandas as pd
import os

try:
    excel_path = "/home/runner/workspace/temp/s3_aiml2_xlsx.xlsx"
    print(f"Analyzing Excel file: {excel_path}")
    print(f"File size: {os.path.getsize(excel_path) / (1024*1024):.2f} MB")
    
    # Use low_memory option and limit rows/columns
    print("Reading Excel file headers only...")
    xl = pd.ExcelFile(excel_path)
    
    print(f"Excel file has {len(xl.sheet_names)} sheets: {xl.sheet_names}")
    
    # Read just the first few rows of the first sheet
    print("Reading first 5 rows and 10 columns...")
    df = pd.read_excel(xl, sheet_name=0, nrows=5, usecols=range(10))
    
    # Display column headers
    print("\nColumn headers:")
    for i, col in enumerate(df.columns):
        print(f"  Column {i}: {col}")
    
    # Display the first few rows
    print("\nFirst 5 rows:")
    for i, row in df.iterrows():
        print(f"  Row {i}: {row[0]}")
        
    print("\nComplete first row:")
    for i, val in enumerate(df.iloc[0]):
        print(f"  Column {i}: {val}")
except Exception as e:
    print(f"Error analyzing Excel: {str(e)}")
    import traceback
    traceback.print_exc()
