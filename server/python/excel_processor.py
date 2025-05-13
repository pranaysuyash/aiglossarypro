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
    
    def list_excel_files(self, bucket_name: str) -> List[str]:
        """List all Excel files in the S3 bucket"""
        try:
            response = self.s3_client.list_objects_v2(Bucket=bucket_name)
            files = []
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    if key.endswith('.xlsx') or key.endswith('.xls'):
                        files.append(key)
            
            return files
        except ClientError as e:
            logger.error(f"Error listing objects in bucket {bucket_name}: {e}")
            raise
    
    def download_file(self, bucket_name: str, key: str, local_path: str) -> str:
        """Download a file from S3 to local storage"""
        try:
            logger.info(f"Downloading {key} from bucket {bucket_name} to {local_path}")
            self.s3_client.download_file(bucket_name, key, local_path)
            return local_path
        except ClientError as e:
            logger.error(f"Error downloading {key} from {bucket_name}: {e}")
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
                sheet_data = self._process_sheet(df, "CSV Data")
                
                # Log the results
                logger.info(f"CSV processing yielded {len(sheet_data['categories'])} categories, " +
                           f"{len(sheet_data['subcategories'])} subcategories, and {len(sheet_data['terms'])} terms")
                
                # Add results
                result["categories"].extend(sheet_data["categories"])
                result["subcategories"].extend(sheet_data["subcategories"])
                result["terms"].extend(sheet_data["terms"])
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
                    sheet_data = self._process_sheet(df, sheet_name)
                    
                    # Log the results from this sheet
                    logger.info(f"Sheet {sheet_name} yielded {len(sheet_data['categories'])} categories, " +
                               f"{len(sheet_data['subcategories'])} subcategories, and {len(sheet_data['terms'])} terms")
                    
                    # Merge results
                    result["categories"].extend(sheet_data["categories"])
                    result["subcategories"].extend(sheet_data["subcategories"])
                    result["terms"].extend(sheet_data["terms"])
            
            # Write the results to JSON
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            logger.info(f"Processing complete. Output saved to {output_path}")
            return result
                
        except Exception as e:
            logger.error(f"Error processing Excel file: {e}")
            raise
    
    def _process_sheet(self, df: pd.DataFrame, sheet_name: str) -> Dict[str, List[Dict[str, Any]]]:
        """Process a single sheet and extract hierarchical data"""
        logger.info(f"Analyzing sheet structure: {sheet_name}")
        
        # Initialize results
        categories = []
        subcategories = []
        terms = []
        
        # Track existing categories/subcategories to avoid duplicates
        category_ids = set()
        subcategory_ids = {}  # Maps category_id -> set of subcategory names
        
        # Calculate number of rows and columns
        num_rows, num_cols = df.shape
        logger.info(f"Sheet has {num_rows} rows and {num_cols} columns")
        
        # Check if we have a hierarchical or tabular structure
        if self._is_hierarchical_structure(df):
            categories, subcategories, terms = self._process_hierarchical_structure(df, sheet_name)
        else:
            categories, subcategories, terms = self._process_tabular_structure(df, sheet_name)
        
        return {
            "categories": categories,
            "subcategories": subcategories,
            "terms": terms
        }
    
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
        
        # Track the current category and subcategory context
        current_category = None
        current_subcategory = None
        category_map = {}  # name -> id
        subcategory_map = {}  # (category_id, name) -> id
        
        # Generate unique IDs
        import uuid
        
        # Process each row
        for i, row in df.iterrows():
            row_values = row.values
            
            # Skip empty rows
            if all(pd.isna(val) for val in row_values):
                continue
            
            # Get the first non-empty value
            first_value = None
            for val in row_values:
                if not pd.isna(val):
                    first_value = str(val).strip()
                    break
            
            if not first_value:
                continue
                
            # Check if this is a header
            header_match = False
            header_level = 0
            
            if first_value.startswith('#'):
                # Count the number of # to determine the level
                for char in first_value:
                    if char == '#':
                        header_level += 1
                    else:
                        break
                header_match = True
                first_value = first_value[header_level:].strip()
            
            if header_match:
                if header_level == 1:
                    # This is a main category
                    category_id = str(uuid.uuid4())
                    current_category = {"id": category_id, "name": first_value}
                    category_map[first_value] = category_id
                    categories.append(current_category)
                    current_subcategory = None
                elif header_level > 1 and current_category:
                    # This is a subcategory
                    subcategory_id = str(uuid.uuid4())
                    current_subcategory = {
                        "id": subcategory_id, 
                        "name": first_value, 
                        "categoryId": current_category["id"]
                    }
                    subcategory_map[(current_category["id"], first_value)] = subcategory_id
                    subcategories.append(current_subcategory)
            elif len(row_values) >= 2 and not pd.isna(row_values[1]):
                # This is a term
                if current_category:
                    term = {
                        "id": str(uuid.uuid4()),
                        "name": first_value,
                        "definition": str(row_values[1]),
                        "shortDefinition": str(row_values[1])[:150] + ('...' if len(str(row_values[1])) > 150 else ''),
                        "categoryId": current_category["id"]
                    }
                    
                    # Add subcategory reference if available
                    if current_subcategory:
                        term["subcategoryIds"] = [current_subcategory["id"]]
                    
                    terms.append(term)
        
        logger.info(f"Extracted {len(categories)} categories, {len(subcategories)} subcategories, and {len(terms)} terms")
        return categories, subcategories, terms
    
    def _process_tabular_structure(self, df: pd.DataFrame, sheet_name: str) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Process a sheet with tabular structure (columns with values)"""
        logger.info("Processing tabular structure")
        
        categories = []
        subcategories = []
        terms = []
        
        # Generate unique IDs
        import uuid
        
        # Map for the hierarchical structure from the content outline
        # This is based on the provided content structure for AI/ML terms
        hierarchical_map = {
            1: "Introduction",
            2: "Prerequisites",
            3: "Theoretical Concepts",
            4: "How It Works",
            5: "Variants or Extensions",
            6: "Applications",
            7: "Implementation",
            8: "Evaluation and Metrics",
            9: "Advantages and Disadvantages",
            10: "Ethics and Responsible AI",
            11: "Historical Context",
            12: "Illustration or Diagram",
            13: "Related Concepts",
            14: "Case Studies",
            15: "Interviews with Experts",
            16: "Hands-on Tutorials",
            17: "Interactive Elements",
            18: "Industry Insights",
            19: "Common Challenges and Pitfalls",
            20: "Real-world Datasets and Benchmarks",
            21: "Tools and Frameworks",
            22: "Did You Know?",
            23: "Quick Quiz",
            24: "Further Reading",
            25: "Project Suggestions",
            26: "Recommended Websites and Courses",
            27: "Collaboration and Community",
            28: "Research Papers",
            29: "Career Guidance",
            30: "Future Directions",
            31: "Glossary",
            32: "FAQs",
            33: "Tags and Keywords",
            34: "Appendices",
            35: "Index",
            36: "References",
            37: "Conclusion",
            38: "Metadata"
        }
        
        # Try to identify the column structure
        name_col = None
        definition_col = None
        category_col = None
        subcategory_col = None
        
        # Process column names with hierarchical structure (e.g., "1. Introduction", "1.1. Definition and Overview")
        # This specifically addresses the flattened JSON structure in Excel column names
        hierarchical_columns = {}
        for col in df.columns:
            col_str = str(col)
            
            # Check if the column name has the format "X. Name" or "X.Y. Name"
            parts = col_str.split('. ', 1)
            if len(parts) == 2:
                numbering, name = parts
                
                # Check if it's a main section (e.g., "1") or subsection (e.g., "1.1")
                if '.' in numbering:
                    # This is a subsection
                    main_section = numbering.split('.')[0]
                    hierarchical_columns[col] = {
                        'type': 'subsection',
                        'main_section': main_section,
                        'numbering': numbering,
                        'name': name
                    }
                else:
                    # This is a main section
                    hierarchical_columns[col] = {
                        'type': 'section',
                        'numbering': numbering,
                        'name': name
                    }
        
        logger.info(f"Identified {len(hierarchical_columns)} hierarchical columns")
        
        # Look for common column names for the main data fields
        for col in df.columns:
            col_lower = str(col).lower()
            if col_lower in ['term', 'name', 'concept']:
                name_col = col
            elif col_lower in ['definition', 'description', 'meaning']:
                definition_col = col
            elif col_lower in ['category', 'topic', 'section']:
                category_col = col
            elif col_lower in ['subcategory', 'subtopic', 'subsection']:
                subcategory_col = col
        
        # If we can't identify columns by name, use position
        if name_col is None and len(df.columns) >= 1:
            name_col = df.columns[0]
        if definition_col is None and len(df.columns) >= 2:
            definition_col = df.columns[1]
        
        # Track categories and subcategories we've seen
        category_map = {}  # name -> id
        subcategory_map = {}  # (category_id, name) -> id
        
        # Create main categories based on the hierarchical map
        for section_num, section_name in hierarchical_map.items():
            category_id = str(uuid.uuid4())
            categories.append({"id": category_id, "name": section_name})
            category_map[section_name] = category_id
            category_map[str(section_num)] = category_id  # Also map by number
        
        logger.info(f"Created {len(categories)} main categories based on structure")
        
        # Process hierarchical columns to create subcategories
        for col, col_info in hierarchical_columns.items():
            if col_info['type'] == 'subsection':
                main_section = col_info['main_section']
                if main_section in category_map:
                    parent_category_id = category_map[main_section]
                    subcategory_id = str(uuid.uuid4())
                    subcategory_name = col_info['name']
                    
                    subcategories.append({
                        "id": subcategory_id,
                        "name": subcategory_name,
                        "categoryId": parent_category_id
                    })
                    
                    subcategory_map[(parent_category_id, subcategory_name)] = subcategory_id
                    logger.info(f"Created subcategory: {subcategory_name} under {main_section}")
        
        # Process each row to create terms
        for i, row in df.iterrows():
            # Skip rows without name or definition
            if name_col is None or definition_col is None or pd.isna(row.get(name_col)) or pd.isna(row.get(definition_col)):
                continue
            
            term_name = str(row[name_col]).strip()
            definition = str(row[definition_col]).strip()
            
            # Initialize the term
            term = {
                "id": str(uuid.uuid4()),
                "name": term_name,
                "definition": definition,
                "shortDefinition": definition[:150] + ('...' if len(definition) > 150 else '')
            }
            
            # Process category based on hierarchical structure or explicit category column
            category_id = None
            
            # First try to use explicit category column
            if category_col and not pd.isna(row.get(category_col)):
                category_name = str(row[category_col]).strip()
                
                # Handle hierarchical category values (e.g., "Main-Sub")
                hierarchical_split = None
                for separator in ['-', '/', '.', '>', '\\']:
                    if separator in category_name:
                        hierarchical_split = separator
                        break
                
                if hierarchical_split:
                    parts = [p.strip() for p in category_name.split(hierarchical_split)]
                    category_name = parts[0]
                
                # Check if this category exists or create it
                if category_name in category_map:
                    category_id = category_map[category_name]
                else:
                    # Try to match with our hierarchical map
                    matched = False
                    for section_num, section_name in hierarchical_map.items():
                        if section_name.lower() in category_name.lower() or category_name.lower() in section_name.lower():
                            category_id = category_map[section_name]
                            matched = True
                            break
                    
                    if not matched:
                        # Create a new category
                        category_id = str(uuid.uuid4())
                        category_map[category_name] = category_id
                        categories.append({"id": category_id, "name": category_name})
            
            # Add structured data from hierarchical columns
            structured_data = {}
            
            for col, col_info in hierarchical_columns.items():
                if not pd.isna(row.get(col)) and row[col]:
                    section_data = str(row[col]).strip()
                    
                    if col_info['type'] == 'section':
                        # This is a main section - use it to assign a category if we don't have one
                        if category_id is None and col_info['numbering'] in category_map:
                            category_id = category_map[col_info['numbering']]
                            
                    # Add to structured data
                    section_key = f"{col_info['numbering']}. {col_info['name']}"
                    structured_data[section_key] = section_data
            
            # If we still don't have a category, use a default
            if category_id is None and categories:
                category_id = categories[0]["id"]  # Use the first category as default
            
            # Process subcategories
            subcategory_ids = []
            
            # First try explicit subcategory column
            if subcategory_col and not pd.isna(row.get(subcategory_col)) and category_id:
                subcategory_name = str(row[subcategory_col]).strip()
                subcat_key = (category_id, subcategory_name)
                
                if subcat_key in subcategory_map:
                    subcategory_ids.append(subcategory_map[subcat_key])
                else:
                    subcategory_id = str(uuid.uuid4())
                    subcategory_map[subcat_key] = subcategory_id
                    subcategories.append({
                        "id": subcategory_id,
                        "name": subcategory_name,
                        "categoryId": category_id
                    })
                    subcategory_ids.append(subcategory_id)
            
            # Then check for hierarchical subcategories
            for col, col_info in hierarchical_columns.items():
                if col_info['type'] == 'subsection' and not pd.isna(row.get(col)) and row[col] and category_id:
                    main_section = col_info['main_section']
                    if main_section in category_map and category_map[main_section] == category_id:
                        subcategory_name = col_info['name']
                        subcat_key = (category_id, subcategory_name)
                        
                        if subcat_key in subcategory_map:
                            subcategory_id = subcategory_map[subcat_key]
                            if subcategory_id not in subcategory_ids:
                                subcategory_ids.append(subcategory_id)
            
            # Add category and subcategory references to the term
            if category_id:
                term["categoryId"] = category_id
            
            if subcategory_ids:
                term["subcategoryIds"] = subcategory_ids
            
            # Add structured data if available
            if structured_data:
                term["structuredData"] = structured_data
            
            terms.append(term)
            logger.info(f"Processed term: {term_name}")
        
        logger.info(f"Extracted {len(categories)} categories, {len(subcategories)} subcategories, and {len(terms)} terms")
        return categories, subcategories, terms

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