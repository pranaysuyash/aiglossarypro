#!/usr/bin/env python3
"""
Excel Processor for AI/ML Glossary
This script processes Excel files from S3 and creates a structured JSON output
with proper hierarchical relationships.
"""

import os
import sys
import json
import logging
import argparse
from typing import Dict, List, Any, Optional, Set, Tuple
import boto3
import pandas as pd
from botocore.exceptions import ClientError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ExcelProcessor:
    """Process Excel files with flattened hierarchical column names"""
    
    def __init__(self, region_name='ap-south-1'):
        """Initialize the processor with AWS region"""
        self.region_name = region_name
        self.s3_client = self._create_s3_client()
        
    def _create_s3_client(self):
        """Create an S3 client"""
        try:
            return boto3.client(
                's3',
                region_name=self.region_name,
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
            )
        except Exception as e:
            logger.error(f"Failed to create S3 client: {e}")
            raise
    

    def list_excel_files(self, bucket_name: str, file_extensions: List[str] = None) -> List[str]:
        """List Excel or CSV files in the S3 bucket"""
        if file_extensions is None:
            file_extensions = ['.xlsx', '.xls', '.csv']
            
        logger.info(f"Listing files with extensions {file_extensions} in bucket {bucket_name}")
        
        try:
            # List objects in the bucket
            response = self.s3_client.list_objects_v2(Bucket=bucket_name)
            
            # Filter objects by extension
            files = []
            if 'Contents' in response:
                for item in response['Contents']:
                    key = item['Key']
                    for ext in file_extensions:
                        if key.lower().endswith(ext):
                            files.append(key)
                            break
            
            logger.info(f"Found {len(files)} matching files in bucket {bucket_name}")
            return files
            
        except Exception as e:
            logger.error(f"Error listing files in bucket {bucket_name}: {str(e)}")
            raise



































































































































































































































































































































































































































































































































































































































































































































































































def main():
    """Main function to process Excel files from S3"""
    parser = argparse.ArgumentParser(description='Process Excel files for AI/ML Glossary')
    parser.add_argument('--bucket', type=str, help='S3 bucket name', default=os.environ.get('S3_BUCKET_NAME'))
    parser.add_argument('--region', type=str, help='AWS region name', default='ap-south-1')
    parser.add_argument('--output', type=str, help='Output JSON file path', default='output.json')
    parser.add_argument('--file-key', type=str, help='Specific S3 file key to process')
    args = parser.parse_args()
    
    if not args.bucket:
        logger.error("S3 bucket name is required")
        sys.exit(1)
    
    # Create temp directory if it doesn't exist
    temp_dir = os.path.join(os.getcwd(), 'temp')
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    processor = ExcelProcessor(region_name=args.region)
    
    try:
        if args.file_key:
            files = [args.file_key]
        else:
            files = processor.list_excel_files(args.bucket)
        
        if not files:
            logger.warning(f"No Excel files found in bucket {args.bucket}")
            return
        
        logger.info(f"Found {len(files)} Excel files in bucket {args.bucket}")
        
        # Process the first file
        file_key = files[0]
        local_path = os.path.join(temp_dir, f"s3_{os.path.basename(file_key)}")
        
        processor.download_file(args.bucket, file_key, local_path)
        result = processor.process_excel_file(local_path, args.output)
        
        # Clean up
        try:
            os.remove(local_path)
        except:
            pass
        
        # Print a summary
        print(json.dumps({
            "success": True,
            "categories": len(result["categories"]),
            "subcategories": len(result["subcategories"]),
            "terms": len(result["terms"]),
            "output_path": args.output
        }))
        
    except Exception as e:
        logger.error(f"Error processing Excel files: {e}")
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()