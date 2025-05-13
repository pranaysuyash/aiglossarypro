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
