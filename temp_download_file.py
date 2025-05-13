    def download_file(self, bucket_name: str, key: str, local_path: str) -> str:
        """Download a file from S3 to local storage"""
        logger.info(f"Downloading {key} from bucket {bucket_name} to {local_path}")
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
            
            # Download the file
            self.s3_client.download_file(bucket_name, key, local_path)
            
            logger.info(f"File downloaded successfully to {local_path}")
            return local_path
            
        except ClientError as e:
            logger.error(f"Error downloading {key} from {bucket_name}: {e}")
            raise
