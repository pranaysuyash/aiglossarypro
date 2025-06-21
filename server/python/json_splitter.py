#!/usr/bin/env python3
"""
JSON File Splitter for Large Datasets
Splits a large JSON file into smaller, manageable chunks
"""

import json
import os
import sys
import argparse
from pathlib import Path

def split_json_file(input_path, output_dir, chunk_size=1000):
    """
    Split a large JSON file into smaller chunks
    
    Args:
        input_path: Path to the large JSON file
        output_dir: Directory to save the chunks
        chunk_size: Number of items per chunk
    """
    print(f"📂 Splitting JSON file: {input_path}", file=sys.stderr)
    print(f"📁 Output directory: {output_dir}", file=sys.stderr)
    print(f"📦 Chunk size: {chunk_size}", file=sys.stderr)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Read the large JSON file in chunks
    with open(input_path, 'r', encoding='utf-8') as f:
        print("📖 Loading JSON data...", file=sys.stderr)
        data = json.load(f)
    
    total_categories = len(data.get('categories', []))
    total_subcategories = len(data.get('subcategories', []))
    total_terms = len(data.get('terms', []))
    
    print(f"📊 Dataset overview:", file=sys.stderr)
    print(f"   📂 {total_categories} categories", file=sys.stderr)
    print(f"   📋 {total_subcategories} subcategories", file=sys.stderr)
    print(f"   📄 {total_terms} terms", file=sys.stderr)
    
    chunks_created = 0
    
    # Split categories
    if data.get('categories'):
        categories = data['categories']
        for i in range(0, len(categories), chunk_size):
            chunk = categories[i:i + chunk_size]
            chunk_file = os.path.join(output_dir, f'categories_chunk_{i//chunk_size + 1}.json')
            
            with open(chunk_file, 'w', encoding='utf-8') as f:
                json.dump({'categories': chunk}, f, ensure_ascii=False, indent=2)
            
            print(f"   📂 Created categories chunk {i//chunk_size + 1}: {len(chunk)} items", file=sys.stderr)
            chunks_created += 1
    
    # Split subcategories
    if data.get('subcategories'):
        subcategories = data['subcategories']
        for i in range(0, len(subcategories), chunk_size):
            chunk = subcategories[i:i + chunk_size]
            chunk_file = os.path.join(output_dir, f'subcategories_chunk_{i//chunk_size + 1}.json')
            
            with open(chunk_file, 'w', encoding='utf-8') as f:
                json.dump({'subcategories': chunk}, f, ensure_ascii=False, indent=2)
            
            print(f"   📋 Created subcategories chunk {i//chunk_size + 1}: {len(chunk)} items", file=sys.stderr)
            chunks_created += 1
    
    # Split terms
    if data.get('terms'):
        terms = data['terms']
        for i in range(0, len(terms), chunk_size):
            chunk = terms[i:i + chunk_size]
            chunk_file = os.path.join(output_dir, f'terms_chunk_{i//chunk_size + 1}.json')
            
            with open(chunk_file, 'w', encoding='utf-8') as f:
                json.dump({'terms': chunk}, f, ensure_ascii=False, indent=2)
            
            print(f"   📄 Created terms chunk {i//chunk_size + 1}: {len(chunk)} items", file=sys.stderr)
            chunks_created += 1
    
    print(f"\n✅ JSON splitting complete!", file=sys.stderr)
    print(f"   🔄 {chunks_created} chunks created", file=sys.stderr)
    print(f"   📁 Output directory: {output_dir}", file=sys.stderr)
    
    return {
        'success': True,
        'chunks_created': chunks_created,
        'output_dir': output_dir,
        'total_categories': total_categories,
        'total_subcategories': total_subcategories,
        'total_terms': total_terms
    }

def main():
    parser = argparse.ArgumentParser(description='Split large JSON files into manageable chunks')
    parser.add_argument('--input', required=True, help='Input JSON file path')
    parser.add_argument('--output', required=True, help='Output directory for chunks')
    parser.add_argument('--chunk-size', type=int, default=1000, help='Number of items per chunk')
    
    args = parser.parse_args()
    
    try:
        result = split_json_file(args.input, args.output, args.chunk_size)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main() 