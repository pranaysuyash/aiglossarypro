#!/usr/bin/env python3
import pandas as pd
import os

try:
    csv_path = "/home/runner/workspace/temp/s3_1747126254809_aiml2.csv"
    print(f"Analyzing CSV file: {csv_path}")
    print(f"File size: {os.path.getsize(csv_path) / (1024*1024):.2f} MB")
    
    # Just read the first few lines to get column headers
    print("Reading first 10 lines to extract headers...")
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i == 0:
                print(f"Header line: {line[:100]}...")  # Print first 100 chars of header
            elif i < 3:
                print(f"Data line {i}: {line[:100]}...")
            if i >= 2:
                break
                
    # Read just a few columns and rows for analysis
    print("\nReading first 5 rows and estimating columns...")
    df = pd.read_csv(csv_path, nrows=5)
    
    print(f"CSV has {len(df.columns)} columns")
    
    # Print first 10 column names
    print("\nFirst 10 column names:")
    for i, col in enumerate(df.columns[:10]):
        print(f"  {i}: {col}")
        
    # Print first row data for first few columns
    print("\nFirst row data (first 5 columns):")
    for i, val in enumerate(df.iloc[0, :5]):
        colname = df.columns[i] if i < len(df.columns) else "Unknown"
        print(f"  {colname}: {val}")
except Exception as e:
    print(f"Error analyzing CSV: {str(e)}")
    import traceback
    traceback.print_exc()
