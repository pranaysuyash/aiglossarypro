# Datasets Repository Implementation Guide

## Quick Start Implementation Plan

This guide provides a detailed technical implementation plan for the Datasets Repository feature, the recommended first post-launch feature.

---

## Database Schema

### 1. Core Tables

```sql
-- Main datasets table
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    source_url VARCHAR(500),
    source_organization VARCHAR(255),
    version VARCHAR(50),
    size_bytes BIGINT,
    size_readable VARCHAR(20), -- "1.2 GB", "500 MB"
    format VARCHAR(50), -- 'csv', 'json', 'parquet', 'tfrecord'
    license VARCHAR(100),
    citation TEXT,
    download_url VARCHAR(500),
    preview_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- Metadata
    num_examples INTEGER,
    num_features INTEGER,
    task_type VARCHAR(100), -- 'classification', 'regression', 'nlp', etc
    modality VARCHAR(100), -- 'text', 'image', 'audio', 'tabular', 'multimodal'
    languages TEXT[], -- ['en', 'es', 'fr']
    
    -- Stats
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    requires_auth BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP
);

-- Dataset categories (many-to-many)
CREATE TABLE dataset_categories (
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (dataset_id, category_id)
);

-- Dataset tags
CREATE TABLE dataset_tags (
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    tag VARCHAR(50),
    PRIMARY KEY (dataset_id, tag)
);

-- Related terms
CREATE TABLE dataset_terms (
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    term_id UUID REFERENCES enhanced_terms(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    PRIMARY KEY (dataset_id, term_id)
);

-- Usage examples
CREATE TABLE dataset_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'python', -- 'python', 'r', 'julia'
    framework VARCHAR(50), -- 'tensorflow', 'pytorch', 'sklearn'
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Download tracking
CREATE TABLE dataset_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    ip_hash VARCHAR(64),
    user_agent TEXT,
    download_size BIGINT,
    download_duration INTEGER, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User ratings
CREATE TABLE dataset_ratings (
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dataset_id, user_id)
);
```

### 2. Indexes for Performance

```sql
CREATE INDEX idx_datasets_format ON datasets(format);
CREATE INDEX idx_datasets_modality ON datasets(modality);
CREATE INDEX idx_datasets_task_type ON datasets(task_type);
CREATE INDEX idx_datasets_download_count ON datasets(download_count DESC);
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX idx_dataset_tags_tag ON dataset_tags(tag);
CREATE INDEX idx_dataset_downloads_created ON dataset_downloads(created_at);
```

---

## API Endpoints

### 1. Dataset Browsing & Search

```typescript
// GET /api/datasets
interface DatasetsQuery {
  page?: number;
  limit?: number;
  search?: string;
  format?: string[];
  modality?: string[];
  task_type?: string[];
  min_size?: number;
  max_size?: number;
  license?: string[];
  sort_by?: 'popular' | 'recent' | 'rating' | 'size';
}

// GET /api/datasets/:id
// Returns full dataset details with examples

// GET /api/datasets/:id/related
// Returns related datasets based on tags and categories

// GET /api/datasets/featured
// Returns featured datasets for homepage
```

### 2. Dataset Interaction

```typescript
// POST /api/datasets/:id/download
interface DownloadRequest {
  format?: string; // Optional format conversion
  sample?: boolean; // Download sample only
}

// POST /api/datasets/:id/rate
interface RatingRequest {
  rating: number; // 1-5
  review?: string;
}

// GET /api/datasets/:id/examples
// Returns code examples with syntax highlighting
```

### 3. Admin Endpoints

```typescript
// POST /api/admin/datasets
// Create new dataset entry

// PUT /api/admin/datasets/:id
// Update dataset information

// POST /api/admin/datasets/:id/verify
// Verify dataset availability and update metadata
```

---

## Frontend Components

### 1. Dataset Explorer Page

```tsx
// src/pages/Datasets.tsx
interface DatasetExplorerProps {
  initialFilters?: DatasetFilters;
}

const DatasetExplorer: React.FC<DatasetExplorerProps> = () => {
  // Features:
  // - Advanced filtering sidebar
  // - Grid/List view toggle
  // - Sort options
  // - Pagination
  // - Quick preview on hover
  // - Download stats
};
```

### 2. Dataset Detail Page

```tsx
// src/pages/DatasetDetail.tsx
const DatasetDetail: React.FC = () => {
  // Sections:
  // - Overview with key stats
  // - Preview data table (first 10 rows)
  // - Usage examples with tabs for different frameworks
  // - Related terms and learning paths
  // - Similar datasets
  // - Reviews and ratings
  // - Download options
};
```

### 3. Dataset Card Component

```tsx
// src/components/DatasetCard.tsx
interface DatasetCardProps {
  dataset: Dataset;
  view: 'grid' | 'list';
  showPreview?: boolean;
}

const DatasetCard: React.FC<DatasetCardProps> = () => {
  // Shows:
  // - Name, description
  // - Size, format, examples count
  // - Download count, rating
  // - Quick actions (preview, download)
};
```

---

## S3 Storage Structure

```
aiglosspro-datasets/
├── metadata/
│   ├── {dataset-id}/
│   │   ├── info.json
│   │   ├── preview.json (first 100 rows)
│   │   └── schema.json
├── full/
│   ├── {dataset-id}/
│   │   ├── data.csv
│   │   ├── data.parquet
│   │   └── data.json
├── samples/
│   ├── {dataset-id}/
│   │   └── sample.csv (1000 rows)
└── thumbnails/
    ├── {dataset-id}.png
```

---

## Implementation Steps

### Week 1-2: Backend Foundation
1. Create database migrations
2. Implement core API endpoints
3. Set up S3 buckets and permissions
4. Create download service with streaming

### Week 3-4: Frontend Development
1. Build dataset explorer page
2. Create dataset detail page
3. Implement filtering and search
4. Add code example viewer

### Week 5: Integration & Polish
1. Connect datasets to existing terms
2. Add to learning paths where relevant
3. Implement caching for popular datasets
4. Add analytics tracking

### Week 6: Content & Launch
1. Import initial 100 datasets
2. Write usage examples
3. Beta test with users
4. Launch with announcement

---

## Sample Data Import Script

```javascript
// scripts/import-datasets.js
const datasets = [
  {
    name: "MNIST Handwritten Digits",
    slug: "mnist",
    description: "Classic dataset of 70,000 handwritten digits",
    source_organization: "Yann LeCun",
    format: "csv",
    modality: "image",
    task_type: "classification",
    size_bytes: 11594722,
    num_examples: 70000,
    num_features: 784,
    license: "CC0",
    tags: ["computer-vision", "beginner-friendly", "classification"],
    related_terms: ["Computer Vision", "Image Classification", "Neural Networks"],
    examples: [
      {
        title: "Load MNIST with TensorFlow",
        language: "python",
        framework: "tensorflow",
        code: `import tensorflow as tf\n\n# Load MNIST dataset\n(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()\n\n# Normalize pixel values\nx_train = x_train / 255.0\nx_test = x_test / 255.0`
      }
    ]
  },
  // ... more datasets
];
```

---

## Performance Considerations

1. **Caching Strategy**
   - Cache dataset metadata in Redis
   - Use CDN for preview data
   - Implement pagination for large datasets

2. **Download Optimization**
   - Stream large files instead of loading in memory
   - Implement resume capability for large downloads
   - Use signed S3 URLs for direct downloads

3. **Search Performance**
   - Add full-text search indexes
   - Consider Elasticsearch for advanced search
   - Cache popular search results

---

## Security Considerations

1. **Access Control**
   - Some datasets may require authentication
   - Implement rate limiting for downloads
   - Track usage for abuse prevention

2. **Data Privacy**
   - Ensure datasets comply with privacy laws
   - Add disclaimers for sensitive datasets
   - Implement data usage agreements

3. **License Compliance**
   - Clearly display license information
   - Enforce citation requirements
   - Track commercial vs academic usage

---

## Success Metrics

- **Adoption**: Number of unique users downloading datasets
- **Engagement**: Average datasets viewed per session
- **Quality**: Average rating of datasets
- **Integration**: Datasets used in learning paths
- **Performance**: Average download speed