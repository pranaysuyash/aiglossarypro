def main():
    """Main function to process Excel files from S3"""
    parser = argparse.ArgumentParser(description="Process Excel files from S3")
    parser.add_argument("--bucket", required=True, help="S3 bucket name")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--region", default="ap-south-1", help="AWS region name")
    parser.add_argument("--file-key", help="Specific file key in the S3 bucket")
    parser.add_argument("--csv", action="store_true", help="Process as CSV instead of Excel")
    
    args = parser.parse_args()
    
    temp_dir = os.path.join(os.getcwd(), 'temp')
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    processor = ExcelProcessor(region_name=args.region)
    
    try:
        # Determine whether to look for Excel files or CSV files
        file_extensions = ['.xlsx', '.xls']
        if args.csv:
            file_extensions = ['.csv']
        
        # Get files to process
        if args.file_key:
            files = [args.file_key]
        else:
            files = processor.list_excel_files(args.bucket, file_extensions)
        
        if not files:
            logger.warning(f"No files found in bucket {args.bucket} with extensions {file_extensions}")
            # Create empty result
            result = {
                "categories": [],
                "subcategories": [],
                "terms": []
            }
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
                
            print(json.dumps({
                "success": True,
                "categories": 0,
                "subcategories": 0,
                "terms": 0,
                "output_path": args.output
            }))
            return
        
        logger.info(f"Found {len(files)} files in bucket {args.bucket}")
        
        # Process the first file
        file_key = files[0]
        is_csv = file_key.lower().endswith('.csv') or args.csv
        file_extension = '.csv' if is_csv else '.xlsx'
        
        local_path = os.path.join(temp_dir, f"s3_{os.path.basename(file_key).replace('.', '_')}{file_extension}")
        
        # Download file
        processor.download_file(args.bucket, file_key, local_path)
        
        # Process file
        result = processor.process_excel_file(local_path, args.output, is_csv=is_csv)
        
        # Clean up
        try:
            os.remove(local_path)
        except Exception as e:
            logger.warning(f"Failed to remove temporary file: {e}")
        
        # Print a summary
        print(json.dumps({
            "success": True,
            "categories": len(result["categories"]),
            "subcategories": len(result["subcategories"]),
            "terms": len(result["terms"]),
            "output_path": args.output
        }))
        
    except Exception as e:
        logger.error(f"Error processing files: {e}", exc_info=True)
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)
