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
