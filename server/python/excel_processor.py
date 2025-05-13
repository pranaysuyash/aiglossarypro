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
import uuid
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
    
    def process_excel_file(self, file_path: str, output_path: str, is_csv: bool = False) -> Dict[str, Any]:
        """Process the Excel or CSV file and extract structured data"""
        logger.info(f"Processing {'CSV' if is_csv else 'Excel'} file: {file_path}")
        
        try:
            # Store results
            result = {
                "categories": [],
                "subcategories": [],
                "terms": []
            }
            
            if is_csv:
                # Process CSV file
                logger.info(f"Opening CSV file with pandas, size: {os.path.getsize(file_path)} bytes")
                # Read with explicit encoding and handle potential errors
                try:
                    df = pd.read_csv(file_path, encoding='utf-8', low_memory=False)
                except UnicodeDecodeError:
                    logger.info("UTF-8 encoding failed, trying with ISO-8859-1")
                    df = pd.read_csv(file_path, encoding='ISO-8859-1', low_memory=False)
                
                logger.info(f"CSV file loaded, shape: {df.shape}")
                
                # Debug: Check column names to understand structure
                logger.info(f"First 10 column names: {list(df.columns[:10])}")
                
                # Debug: Check the first few rows
                logger.info(f"First 5 rows of first column: {df.iloc[:5, 0].tolist() if not df.empty else []}")
                
                # Process the dataframe directly
                sheet_data = self._process_tabular_structure(df, "CSV Data")
                
                # Log the results
                logger.info(f"CSV processing yielded {len(sheet_data[0])} categories, " +
                           f"{len(sheet_data[1])} subcategories, and {len(sheet_data[2])} terms")
                
                # Add results
                result["categories"].extend(sheet_data[0])
                result["subcategories"].extend(sheet_data[1])
                result["terms"].extend(sheet_data[2])
            else:
                # Process Excel file
                logger.info(f"Opening Excel file with pandas, size: {os.path.getsize(file_path)} bytes")
                excel_data = pd.ExcelFile(file_path)
                logger.info(f"Excel file loaded, found sheets: {excel_data.sheet_names}")
                
                # Debug: print some information about the file before processing
                logger.info(f"Excel information: {excel_data.engine} engine, sheets: {len(excel_data.sheet_names)}")
                
                # Process each sheet
                for sheet_name in excel_data.sheet_names:
                    logger.info(f"Processing sheet: {sheet_name}")
                    
                    # Read the sheet
                    df = pd.read_excel(excel_data, sheet_name=sheet_name)
                    logger.info(f"Sheet loaded, shape: {df.shape}")
                    
                    # Debug: Check column names to understand structure
                    logger.info(f"First 10 column names: {list(df.columns[:10])}")
                    
                    # Debug: Check the first few rows
                    logger.info(f"First 5 rows of first column: {df.iloc[:5, 0].tolist() if not df.empty else []}")
                    
                    # Process the sheet data
                    sheet_data = self._process_tabular_structure(df, sheet_name)
                    
                    # Log the results from this sheet
                    logger.info(f"Sheet {sheet_name} yielded {len(sheet_data[0])} categories, " +
                               f"{len(sheet_data[1])} subcategories, and {len(sheet_data[2])} terms")
                    
                    # Merge results
                    result["categories"].extend(sheet_data[0])
                    result["subcategories"].extend(sheet_data[1])
                    result["terms"].extend(sheet_data[2])
            
            # Write the results to JSON
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            logger.info(f"Results written to {output_path}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}", exc_info=True)
            raise
    
    def _is_hierarchical_structure(self, df: pd.DataFrame) -> bool:
        """Determine if the Excel sheet has a hierarchical structure"""
        logger.info("Checking if sheet has hierarchical structure")
        
        # Check column names for hierarchical indicators or numbered sections
        hierarchical_indicators = ['-', '.', '/', '\\', '>']
        section_pattern = r'^\d+(\.\d+)*\s'  # E.g., "1. " or "1.1. " or "1.1.1. "
        
        # Count column names with hierarchical patterns
        hierarchical_columns = 0
        for col in df.columns:
            col_str = str(col)
            # Check for hierarchical separators
            for indicator in hierarchical_indicators:
                if indicator in col_str:
                    hierarchical_columns += 1
                    logger.info(f"Found hierarchical indicator '{indicator}' in column: {col_str}")
                    break
            
            # Check for numbered sections (like "1. Introduction")
            import re
            if re.match(section_pattern, col_str):
                hierarchical_columns += 1
                logger.info(f"Found numbered section pattern in column: {col_str}")
        
        logger.info(f"Found {hierarchical_columns} hierarchical column names out of {len(df.columns)}")
        
        # If we have a significant number of hierarchical columns, consider it a hierarchical structure
        if hierarchical_columns > 5 or (hierarchical_columns > 0 and hierarchical_columns / len(df.columns) > 0.1):
            return True
        
        # Look for markdown-style headers (# Header) in the first column
        if not df.empty:
            first_col = df.iloc[:, 0]
            header_pattern = r'^#+\s'
            header_count = first_col.astype(str).str.match(header_pattern).sum()
            logger.info(f"Found {header_count} markdown-style headers in first column")
            if header_count > 0:
                return True
        
        # Check first few columns for structured content that might indicate a hierarchical format
        try:
            # Check if we have numeric columns followed by category or term columns
            if len(df.columns) > 3:
                first_values = df.iloc[:5, 0].astype(str).tolist()
                second_values = df.iloc[:5, 1].astype(str).tolist()
                logger.info(f"First column values: {first_values}")
                logger.info(f"Second column values: {second_values}")
                
                # Check if first column has terms and second has definitions
                non_empty_values = [v for v in first_values if v and v.strip() and v.strip().lower() != 'nan']
                if len(non_empty_values) > 2:
                    logger.info("First column has several non-empty values, might be term names")
                    return False  # This is more likely a tabular structure with terms
        except Exception as e:
            logger.warning(f"Error checking column structure: {e}")
        
        # If we couldn't clearly determine, default behavior based on your content structure
        # Given the hierarchical structure in the content guide, let's assume hierarchical unless clearly tabular
        return True
    
    def _process_hierarchical_structure(self, df: pd.DataFrame, sheet_name: str) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Process a sheet with hierarchical structure"""
        logger.info("Processing hierarchical structure")
        
        categories = []
        subcategories = []
        terms = []
        
        # Implementation for hierarchical structure
        # This would handle the case where sections are in rows rather than columns
        
        return categories, subcategories, terms
    
    def _process_tabular_structure(self, df: pd.DataFrame, sheet_name: str) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Process a sheet with tabular structure (columns with values)"""
        logger.info("Processing tabular structure")
        
        categories = []
        subcategories = []
        terms = []
        
        # Basic checks
        if df.empty:
            logger.warning("Empty dataframe, skipping")
            return categories, subcategories, terms
        
        try:
            logger.info(f"DataFrame shape: {df.shape}, columns: {len(df.columns)}")
            logger.info(f"First few columns: {list(df.columns[:5])}")
            
            # Check if the first column is 'Term'
            first_col_name = str(df.columns[0])
            logger.info(f"First column name: '{first_col_name}'")
            
            if first_col_name.lower() != 'term' and 'term' not in first_col_name.lower():
                logger.warning(f"First column doesn't appear to be 'Term', it's '{first_col_name}'. Will use it as term name column anyway.")
            
            term_column = df.columns[0]
            
            # Create a mapping of columns to their hierarchical structure using the dash separator pattern
            section_map = {}
            for col in df.columns[1:]:  # Skip the Term column
                col_str = str(col).strip()
                
                # Skip empty column names
                if not col_str:
                    continue
                
                # Extract section and subsection using the dash separator
                # Example: "Introduction – Definition and Overview" -> section="Introduction", subsection="Definition and Overview"
                if '–' in col_str:  # en dash
                    parts = col_str.split('–', 1)
                    section = parts[0].strip()
                    subsection = parts[1].strip() if len(parts) > 1 else ""
                elif '-' in col_str:  # regular hyphen as fallback
                    parts = col_str.split('-', 1)
                    section = parts[0].strip()
                    subsection = parts[1].strip() if len(parts) > 1 else ""
                else:
                    # No separator, use whole name as section
                    section = col_str
                    subsection = ""
                
                # Initialize the section if not already there
                if section not in section_map:
                    section_map[section] = {}
                
                # Add the subsection with its column reference
                if subsection:
                    section_map[section][subsection] = col
            
            logger.info(f"Identified {len(section_map)} main sections in column headers")
            for section, subsections in list(section_map.items())[:3]:
                logger.info(f"  Section '{section}' has {len(subsections)} subsections")
                sample_subsections = list(subsections.keys())[:3]
                logger.info(f"  Sample subsections: {sample_subsections}")
            
            # Create categories from main sections
            for section_name in section_map.keys():
                if section_name not in [c["name"] for c in categories]:
                    category_id = str(uuid.uuid4())
                    categories.append({
                        "id": category_id,
                        "name": section_name
                    })
            
            # Process each row as a term
            term_count = 0
            for idx, row in df.iterrows():
                # Skip header rows or empty rows
                if idx == 0 or pd.isna(row[term_column]) or str(row[term_column]).strip() == "" or str(row[term_column]) == str(term_column):
                    continue
                
                # Get term name
                term_name = str(row[term_column]).strip()
                term_id = str(uuid.uuid4())
                logger.debug(f"Processing term: {term_name}")
                
                # Initialize term data
                term_data = {
                    "id": term_id,
                    "name": term_name,
                    "definition": "",
                    "shortDefinition": "",
                    "categoryId": None,
                    "subcategoryIds": []
                }
                
                # Extract full definition from "Introduction – Definition and Overview" if available
                if "Introduction" in section_map and "Definition and Overview" in section_map["Introduction"]:
                    col = section_map["Introduction"]["Definition and Overview"]
                    if not pd.isna(row[col]):
                        term_data["definition"] = str(row[col]).strip()
                
                # Extract category from "Introduction – Category and Sub-category of the Term – Main Category"
                category_id = None
                category_name = None
                for section, subsections in section_map.items():
                    for subsection, col in subsections.items():
                        if ("Category" in subsection and "Main Category" in subsection) or "Main Category" in subsection:
                            if not pd.isna(row[col]):
                                category_name = str(row[col]).strip()
                                break
                
                if category_name:
                    # Find or create the category
                    found = False
                    for cat in categories:
                        if cat["name"] == category_name:
                            category_id = cat["id"]
                            found = True
                            break
                    
                    if not found:
                        category_id = str(uuid.uuid4())
                        categories.append({
                            "id": category_id,
                            "name": category_name
                        })
                    
                    term_data["categoryId"] = category_id
                
                # Extract subcategories from "Introduction – Category and Sub-category of the Term – Sub-category"
                subcategory_names = []
                for section, subsections in section_map.items():
                    for subsection, col in subsections.items():
                        if ("Category" in subsection and "Sub-category" in subsection) or "Sub-category" in subsection:
                            if not pd.isna(row[col]):
                                subcat_text = str(row[col]).strip()
                                
                                # Handle multiple subcategories separated by comma or semicolon
                                if ',' in subcat_text:
                                    subcategory_names.extend([s.strip() for s in subcat_text.split(',') if s.strip()])
                                elif ';' in subcat_text:
                                    subcategory_names.extend([s.strip() for s in subcat_text.split(';') if s.strip()])
                                else:
                                    subcategory_names.append(subcat_text)
                
                # Process subcategories if we have a valid category
                if category_id and subcategory_names:
                    for subcat_name in subcategory_names:
                        # Find existing subcategory or create new one
                        found = False
                        subcat_id = None
                        
                        for subcat in subcategories:
                            if subcat["name"] == subcat_name and subcat.get("categoryId") == category_id:
                                subcat_id = subcat["id"]
                                found = True
                                break
                        
                        if not found:
                            subcat_id = str(uuid.uuid4())
                            subcategories.append({
                                "id": subcat_id,
                                "name": subcat_name,
                                "categoryId": category_id
                            })
                        
                        if subcat_id and subcat_id not in term_data["subcategoryIds"]:
                            term_data["subcategoryIds"].append(subcat_id)
                
                # Store all content from all sections as structured JSON
                structured_content = {}
                for section, subsections in section_map.items():
                    structured_content[section] = {}
                    for subsection, col in subsections.items():
                        if not pd.isna(row[col]) and str(row[col]).strip():
                            structured_content[section][subsection] = str(row[col]).strip()
                
                # Add structured content
                term_data["structuredContent"] = structured_content
                
                # Extract other specific fields
                # 1. Check for mathematical formulation
                if "Theoretical Concepts" in section_map:
                    for subsection, col in section_map["Theoretical Concepts"].items():
                        if "Math" in subsection and not pd.isna(row[col]):
                            term_data["mathFormulation"] = str(row[col]).strip()
                            break
                
                # 2. Check for visual URL or diagram
                if "Illustration or Diagram" in section_map:
                    for subsection, col in section_map["Illustration or Diagram"].items():
                        if "Visual" in subsection and not pd.isna(row[col]):
                            term_data["visualUrl"] = str(row[col]).strip()
                            break
                
                # 3. Check for characteristics
                characteristics = []
                if "Introduction" in section_map:
                    for subsection, col in section_map["Introduction"].items():
                        if "Key Concepts" in subsection and not pd.isna(row[col]):
                            # Split by commas or semicolons if they exist
                            text = str(row[col]).strip()
                            if "," in text:
                                characteristics.extend([c.strip() for c in text.split(",") if c.strip()])
                            elif ";" in text:
                                characteristics.extend([c.strip() for c in text.split(";") if c.strip()])
                            else:
                                characteristics.append(text)
                
                if characteristics:
                    term_data["characteristics"] = characteristics
                
                # Add the term to our result
                terms.append(term_data)
                term_count += 1
                
                # Log progress periodically
                if term_count % 100 == 0:
                    logger.info(f"Processed {term_count} terms")
            
            logger.info(f"Processed {term_count} terms, {len(categories)} categories, and {len(subcategories)} subcategories from tabular structure")
            
        except Exception as e:
            logger.error(f"Error processing tabular structure: {str(e)}", exc_info=True)
        
        return categories, subcategories, terms


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


if __name__ == "__main__":
    main()
