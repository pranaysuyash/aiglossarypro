#!/bin/bash

# Fix relative imports in API

# Fix middleware/queryCache.ts - line 341
sed -i '' "s|await import('../../shared/schema')|await import('@aiglossarypro/shared/schema')|g" apps/api/src/middleware/queryCache.ts

# Fix dbBatchInsertProcessor.ts - line 245
sed -i '' "s|await import('../../../shared/enhancedSchema')|await import('@aiglossarypro/shared/enhancedSchema')|g" apps/api/src/jobs/processors/dbBatchInsertProcessor.ts

# Fix gumroadService.ts
sed -i '' "s|'../../shared/schema'|'@aiglossarypro/shared/schema'|g" apps/api/src/services/gumroadService.ts

# Fix gumroadWebhooks.ts
sed -i '' "s|'../../shared/schema'|'@aiglossarypro/shared/schema'|g" apps/api/src/routes/gumroadWebhooks.ts

echo "✅ Fixed all relative imports"