#!/usr/bin/env python3
"""
Python Excel Processor for Large Files

Uses pandas and openpyxl to efficiently process the 286MB Excel file
and export data in chunks that can be imported by the TypeScript processor.
"""

import pandas as pd
import json
import os
import sys
from pathlib import Path
import time
import gc

def process_large_excel(file_path, chunk_size=100, output_dir='temp/excel_chunks'):
    """Process large Excel file in chunks and save as JSON files."""
    
    print(f"🚀 Starting Python Excel Processing")
    print(f"📂 File: {file_path}")
    print(f"📊 Chunk size: {chunk_size} rows")
    
    start_time = time.time()
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    try:
        # Read Excel file in chunks
        print("🔄 Opening Excel file...")
        
        # First, get the column headers
        df_headers = pd.read_excel(file_path, nrows=1, engine='openpyxl')
        headers = df_headers.columns.tolist()
        print(f"✅ Found {len(headers)} columns")
        
        # Save headers for reference
        headers_file = os.path.join(output_dir, 'headers.json')
        with open(headers_file, 'w') as f:
            json.dump(headers, f, indent=2)
        print(f"💾 Saved headers to {headers_file}")
        
        # Process file in chunks
        chunk_num = 0
        total_rows = 0
        
        print("\n🔄 Processing data in chunks...")
        
        # Use chunksize parameter to read in chunks
        for chunk_df in pd.read_excel(file_path, chunksize=chunk_size, engine='openpyxl'):
            chunk_num += 1
            rows_in_chunk = len(chunk_df)
            
            if rows_in_chunk == 0:
                break
                
            print(f"\n📦 Processing chunk {chunk_num}: {rows_in_chunk} rows")
            
            # Convert chunk to list of dictionaries
            chunk_data = []
            for _, row in chunk_df.iterrows():
                # Filter out empty rows
                if pd.notna(row.iloc[0]):  # Check if first column (term name) is not empty
                    row_dict = {}
                    for col, value in row.items():
                        # Convert NaN to None and handle data types
                        if pd.isna(value):
                            row_dict[col] = None
                        elif isinstance(value, (int, float)):
                            row_dict[col] = str(value) if not pd.isna(value) else None
                        else:
                            row_dict[col] = str(value).strip() if value else None
                    chunk_data.append(row_dict)
            
            if chunk_data:
                # Save chunk as JSON
                chunk_file = os.path.join(output_dir, f'chunk_{chunk_num:04d}.json')
                with open(chunk_file, 'w', encoding='utf-8') as f:
                    json.dump(chunk_data, f, ensure_ascii=False, indent=2)
                
                total_rows += len(chunk_data)
                print(f"✅ Saved {len(chunk_data)} rows to {chunk_file}")
                print(f"📊 Total rows processed: {total_rows}")
            
            # Memory management
            if chunk_num % 10 == 0:
                gc.collect()
                print("🧹 Cleaned up memory")
        
        # Save metadata
        metadata = {
            'total_chunks': chunk_num,
            'total_rows': total_rows,
            'chunk_size': chunk_size,
            'source_file': file_path,
            'processing_time': time.time() - start_time,
            'column_count': len(headers)
        }
        
        metadata_file = os.path.join(output_dir, 'metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        processing_time = time.time() - start_time
        print(f"\n🎉 Processing Complete!")
        print(f"✅ Total chunks created: {chunk_num}")
        print(f"✅ Total rows processed: {total_rows}")
        print(f"⏱️  Processing time: {processing_time:.2f} seconds")
        print(f"📂 Output directory: {output_dir}")
        
        return True
        
    except Exception as e:
        print(f"💥 Error processing Excel file: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main execution function."""
    
    # Check if pandas and openpyxl are installed
    try:
        import pandas
        import openpyxl
    except ImportError:
        print("❌ Required packages not installed!")
        print("Please run: pip install pandas openpyxl")
        sys.exit(1)
    
    # File path
    file_path = 'data/aiml.xlsx'
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    # Get file size
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"📊 File size: {file_size_mb:.2f} MB")
    
    # Process the file
    success = process_large_excel(file_path, chunk_size=100)
    
    if success:
        print("\n✅ Ready for TypeScript import processing!")
        print("Next step: Run the TypeScript chunk importer")
    else:
        print("\n❌ Processing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()