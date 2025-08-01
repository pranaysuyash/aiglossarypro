#!/bin/bash

# Fix imports in API source files
echo "Fixing imports in API source files..."

# Update imports to use the main export instead of subpaths
find apps/api/src -name "*.ts" -type f | while read file; do
  # Fix schema imports
  sed -i '' 's|@aiglossarypro/shared/schema|@aiglossarypro/shared|g' "$file"
  # Fix enhancedSchema imports
  sed -i '' 's|@aiglossarypro/shared/enhancedSchema|@aiglossarypro/shared|g' "$file"
  # Fix featureFlags imports
  sed -i '' 's|@aiglossarypro/shared/featureFlags|@aiglossarypro/shared|g' "$file"
  # Fix completeColumnStructure imports
  sed -i '' 's|@aiglossarypro/shared/completeColumnStructure|@aiglossarypro/shared|g' "$file"
done

# Fix config/redis imports
find apps/api/src -name "*.ts" -type f | while read file; do
  sed -i '' 's|@aiglossarypro/config/config/redis|@aiglossarypro/config|g' "$file"
done

# Fix database/support-schema imports
find apps/api/src -name "*.ts" -type f | while read file; do
  sed -i '' 's|@aiglossarypro/database/db/support-schema|@aiglossarypro/database|g' "$file"
done

echo "Import fixes complete!"
echo "Now run: pnpm build"