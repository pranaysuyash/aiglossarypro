# Converting Excel to CSV for Processing

## Manual Conversion Steps

### Option 1: Using Excel/LibreOffice
1. Open aiml.xlsx in Excel or LibreOffice Calc
2. File → Save As → CSV (Comma delimited)
3. Save as "aiml.csv" in the data folder
4. Encoding: UTF-8 (important for special characters)

### Option 2: Using Command Line (Mac/Linux)
```bash
# Install ssconvert (part of gnumeric)
brew install gnumeric  # Mac
sudo apt-get install gnumeric  # Ubuntu/Debian

# Convert to CSV
ssconvert data/aiml.xlsx data/aiml.csv
```

### Option 3: Using Python (if pandas available)
```python
import pandas as pd
df = pd.read_excel('data/aiml.xlsx')
df.to_csv('data/aiml.csv', index=False, encoding='utf-8')
```

### Option 4: Online Converters
- https://convertio.co/xlsx-csv/
- https://cloudconvert.com/xlsx-to-csv
- Google Sheets (Import → Export as CSV)

## After Conversion
Run: `npx tsx csv_streaming_processor.ts`
