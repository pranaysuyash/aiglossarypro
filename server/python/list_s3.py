#!/usr/bin/env python3
import boto3
import os

s3 = boto3.client(
    's3',
    region_name='ap-south-1',
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
)

print("Files in S3 bucket aimlglossary:")
response = s3.list_objects_v2(Bucket="aimlglossary")
for obj in response.get("Contents", []):
    print(f"- {obj['Key']} ({obj['Size']} bytes)")
