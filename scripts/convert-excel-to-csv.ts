#!/usr/bin/env tsx

/**
 * Excel to CSV Converter for AI Glossary Pro
 * 
 * This script helps convert Excel files to CSV format for bulk import.
 * Since the Excel processing functionality was removed from the project,
 * this provides alternative methods to convert Excel files.
 * 
 * Usage:
 * npx tsx scripts/convert-excel-to-csv.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface ConversionMethod {
  name: string;
  check: () => Promise<boolean>;
  convert: (input: string, output: string) => Promise<void>;
  install?: string;
}

class ExcelToCSVConverter {
  private methods: ConversionMethod[] = [
    {
      name: 'Python (pandas)',
      check: async () => {
        try {
          await execAsync('python3 --version');
          await execAsync('python3 -c "import pandas"');
          return true;
        } catch {
          return false;
        }
      },
      convert: async (input: string, output: string) => {
        const pythonScript = `
import pandas as pd
import sys

try:
    df = pd.read_excel(sys.argv[1], engine='openpyxl')
    df.to_csv(sys.argv[2], index=False, encoding='utf-8')
    print(f"Successfully converted {len(df)} rows")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;
        await fs.writeFile('temp_convert.py', pythonScript);
        const { stdout, stderr } = await execAsync(`python3 temp_convert.py "${input}" "${output}"`);
        await fs.unlink('temp_convert.py');
        
        if (stderr) throw new Error(stderr);
        console.log(stdout);
      },
      install: 'pip install pandas openpyxl',
    },
    {
      name: 'Node.js (xlsx)',
      check: async () => {
        try {
          require.resolve('xlsx');
          return true;
        } catch {
          return false;
        }
      },
      convert: async (input: string, output: string) => {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(input);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        await fs.writeFile(output, csv, 'utf-8');
        console.log(`Successfully converted ${csv.split('\n').length} rows`);
      },
      install: 'npm install xlsx',
    },
    {
      name: 'LibreOffice (command line)',
      check: async () => {
        try {
          await execAsync('soffice --version');
          return true;
        } catch {
          return false;
        }
      },
      convert: async (input: string, output: string) => {
        const outputDir = path.dirname(output);
        const outputName = path.basename(output, '.csv');
        
        // LibreOffice outputs to a directory with automatic naming
        await execAsync(`soffice --headless --convert-to csv --outdir "${outputDir}" "${input}"`);
        
        // Rename to desired output name
        const expectedOutput = path.join(outputDir, path.basename(input, path.extname(input)) + '.csv');
        if (expectedOutput !== output) {
          await fs.rename(expectedOutput, output);
        }
        
        console.log('Successfully converted using LibreOffice');
      },
      install: 'Download from https://www.libreoffice.org/',
    },
    {
      name: 'ssconvert (Gnumeric)',
      check: async () => {
        try {
          await execAsync('ssconvert --version');
          return true;
        } catch {
          return false;
        }
      },
      convert: async (input: string, output: string) => {
        await execAsync(`ssconvert "${input}" "${output}"`);
        console.log('Successfully converted using ssconvert');
      },
      install: 'brew install gnumeric (Mac) or apt-get install gnumeric (Linux)',
    },
  ];

  async findAvailableMethod(): Promise<ConversionMethod | null> {
    console.log('🔍 Checking available conversion methods...\n');
    
    for (const method of this.methods) {
      process.stdout.write(`Checking ${method.name}... `);
      const available = await method.check();
      console.log(available ? '✅' : '❌');
      
      if (available) {
        return method;
      }
    }
    
    return null;
  }

  async convert(inputFile: string, outputFile: string): Promise<void> {
    // Check if input file exists
    try {
      await fs.access(inputFile);
    } catch {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    // Find available conversion method
    const method = await this.findAvailableMethod();
    
    if (!method) {
      console.log('\n❌ No conversion method available!');
      console.log('\nPlease install one of the following:');
      this.methods.forEach(m => {
        if (m.install) {
          console.log(`\n${m.name}:`);
          console.log(`  ${m.install}`);
        }
      });
      throw new Error('No conversion method available');
    }

    console.log(`\n✅ Using ${method.name} for conversion`);
    
    // Perform conversion
    await method.convert(inputFile, outputFile);
    
    // Verify output
    const stats = await fs.stat(outputFile);
    console.log(`\n✅ Conversion complete!`);
    console.log(`📄 Output file: ${outputFile}`);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  }

  async installNodePackage(): Promise<void> {
    console.log('📦 Installing xlsx package...');
    try {
      await execAsync('npm install xlsx');
      console.log('✅ Package installed successfully');
    } catch (error) {
      console.error('❌ Failed to install package:', error);
      throw error;
    }
  }

  async createSamplePythonScript(): Promise<void> {
    const script = `#!/usr/bin/env python3
"""
Excel to CSV Converter Script
Converts Excel files to CSV format for AI Glossary Pro import
"""

import pandas as pd
import sys
import os

def convert_excel_to_csv(input_file, output_file=None):
    try:
        # Read Excel file
        print(f"Reading {input_file}...")
        df = pd.read_excel(input_file, engine='openpyxl')
        
        # Generate output filename if not provided
        if output_file is None:
            base = os.path.splitext(input_file)[0]
            output_file = f"{base}.csv"
        
        # Save as CSV
        print(f"Writing {output_file}...")
        df.to_csv(output_file, index=False, encoding='utf-8')
        
        print(f"✅ Successfully converted {len(df)} rows and {len(df.columns)} columns")
        print(f"📄 Output saved to: {output_file}")
        
        # Show sample of data
        print("\\nFirst 5 rows:")
        print(df.head())
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_excel.py input.xlsx [output.csv]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    convert_excel_to_csv(input_file, output_file)
`;

    await fs.writeFile('convert_excel.py', script);
    console.log('📄 Created convert_excel.py - Python conversion script');
  }
}

async function main() {
  console.log('🔄 Excel to CSV Converter for AI Glossary Pro');
  console.log('=============================================\n');

  const converter = new ExcelToCSVConverter();
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx tsx scripts/convert-excel-to-csv.ts [input.xlsx] [output.csv]

Options:
  --install-node    Install Node.js xlsx package
  --create-python   Create standalone Python conversion script
  --help, -h        Show this help message

Examples:
  # Convert Excel file to CSV
  npx tsx scripts/convert-excel-to-csv.ts data/aiml.xlsx data/aiml.csv
  
  # Install Node.js package for conversion
  npx tsx scripts/convert-excel-to-csv.ts --install-node
  
  # Create Python script for conversion
  npx tsx scripts/convert-excel-to-csv.ts --create-python
    `);
    process.exit(0);
  }

  if (args.includes('--install-node')) {
    await converter.installNodePackage();
    return;
  }

  if (args.includes('--create-python')) {
    await converter.createSamplePythonScript();
    return;
  }

  // Check data directory for Excel files
  const dataDir = path.join(process.cwd(), 'data');
  const files = await fs.readdir(dataDir);
  const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  
  if (excelFiles.length === 0) {
    console.log('❌ No Excel files found in data directory');
    return;
  }

  console.log(`Found ${excelFiles.length} Excel file(s) in data directory:`);
  excelFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Convert based on arguments or automatically
  if (args.length >= 1) {
    const input = args[0];
    const output = args[1] || input.replace(/\.xlsx?$/i, '.csv');
    
    await converter.convert(input, output);
  } else {
    // Convert all Excel files found
    for (const excelFile of excelFiles) {
      const inputPath = path.join(dataDir, excelFile);
      const outputPath = path.join(dataDir, excelFile.replace(/\.xlsx?$/i, '.csv'));
      
      console.log(`\n📄 Converting ${excelFile}...`);
      
      try {
        await converter.convert(inputPath, outputPath);
      } catch (error) {
        console.error(`❌ Failed to convert ${excelFile}:`, error);
      }
    }
  }

  console.log('\n✅ Conversion process complete!');
  console.log('\nNext steps:');
  console.log('1. Verify the CSV file(s) in the data directory');
  console.log('2. Run the bulk import script:');
  console.log('   npx tsx scripts/import-bulk-terms.ts --source data/aiml.csv --format csv');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { ExcelToCSVConverter };