/**
 * Enhanced Simple API Server with Database Integration
 * 
 * This version can work with either sample data or real database data
 * depending on environment configuration and database availability.
 * 
 * Set DB_ENABLED=true to use database, or leave undefined for sample data
 */

import express from 'express';

const app = express();
app.use(express.json());

// Database integration (optional)
let dbQueries = null;
let useDatabase = false;

// Try to load database functions if DB_ENABLED is set
if (process.env.DB_ENABLED === 'true') {
  try {
    const dbModule = await import('./database-queries.js');
    dbQueries = dbModule.default;
    
    // Test database connection
    const connectionTest = await dbQueries.testDatabaseConnection();
    if (connectionTest.success) {
      useDatabase = true;
      console.log('✅ Database connection successful - using real data');
    } else {
      console.warn('⚠️ Database connection failed - using sample data:', connectionTest.message);
    }
  } catch (error) {
    console.warn('⚠️ Database module not available - using sample data:', error.message);
  }
}

// Sample data (fallback)
const sampleTerms = [
  {
    id: 1,
    name: 'Artificial Intelligence',
    shortDefinition: 'The simulation of human intelligence in machines',
    definition: 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It encompasses various subfields including machine learning, natural language processing, computer vision, and robotics.',
    category: 'AI Fundamentals',
    viewCount: 1250,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 2,
    name: 'Machine Learning',
    shortDefinition: 'A subset of AI that enables computers to learn without explicit programming',
    definition: 'Machine Learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.',
    category: 'Machine Learning',
    viewCount: 2100,
    createdAt: new Date('2024-01-20').toISOString()
  },
  {
    id: 3,
    name: 'Neural Network',
    shortDefinition: 'Computing systems inspired by biological neural networks',
    definition: 'A neural network is a computing system inspired by the biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) that work together to solve specific problems.',
    category: 'Deep Learning',
    viewCount: 890,
    createdAt: new Date('2024-01-25').toISOString()
  },
  {
    id: 4,
    name: 'Deep Learning',
    shortDefinition: 'Machine learning using deep neural networks',
    definition: 'Deep Learning is a subset of machine learning that uses neural networks with three or more layers. These neural networks attempt to simulate the behavior of the human brain to learn from large amounts of data.',
    category: 'Deep Learning',
    viewCount: 1680,
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 5,
    name: 'Natural Language Processing',
    shortDefinition: 'AI field focused on interaction between computers and human language',
    definition: 'Natural Language Processing (NLP) is a branch of artificial intelligence that helps computers understand, interpret and manipulate human language. NLP draws from many disciplines including computer science and computational linguistics.',
    category: 'NLP',
    viewCount: 756,
    createdAt: new Date('2024-02-05').toISOString()
  }
];

const sampleCategories = [
  {
    id: 1,
    name: 'AI Fundamentals',
    description: 'Basic concepts and principles of artificial intelligence',
    termCount: 8,
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 2,
    name: 'Machine Learning',
    description: 'Algorithms and techniques for machine learning',
    termCount: 15,
    createdAt: new Date('2024-01-02').toISOString()
  },
  {
    id: 3,
    name: 'Deep Learning',
    description: 'Deep neural networks and advanced architectures',
    termCount: 12,
    createdAt: new Date('2024-01-03').toISOString()
  },
  {
    id: 4,
    name: 'NLP',
    description: 'Natural language processing and understanding',
    termCount: 10,
    createdAt: new Date('2024-01-04').toISOString()
  },
  {
    id: 5,
    name: 'Computer Vision',
    description: 'Image and video analysis using AI',
    termCount: 9,
    createdAt: new Date('2024-01-05').toISOString()
  }
];

// Utility functions
function parseIntWithDefault(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function filterAndSearchTerms(terms, search, category) {
  let filtered = terms;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(term =>
      term.name.toLowerCase().includes(searchLower) ||
      term.definition.toLowerCase().includes(searchLower) ||
      (term.shortDefinition && term.shortDefinition.toLowerCase().includes(searchLower))
    );
  }
  
  if (category) {
    filtered = filtered.filter(term => 
      term.category === category || 
      term.categoryId === category
    );
  }
  
  return filtered;
}

function paginateResults(items, page, limit) {
  const offset = (page - 1) * limit;
  return {
    data: items.slice(offset, offset + limit),
    total: items.length,
    page,
    limit,
    hasMore: offset + limit < items.length,
    pagination: {
      totalPages: Math.ceil(items.length / limit),
      hasNext: offset + limit < items.length,
      hasPrev: page > 1
    }
  };
}

// Health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: {
      enabled: useDatabase,
      status: useDatabase ? 'connected' : 'using_sample_data'
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: {
      enabled: useDatabase,
      status: useDatabase ? 'connected' : 'using_sample_data'
    }
  });
});

// Database status endpoint
app.get('/api/db-status', async (_req, res) => {
  if (!useDatabase) {
    return res.json({
      success: true,
      database: {
        enabled: false,
        status: 'using_sample_data',
        message: 'Set DB_ENABLED=true environment variable to use database'
      }
    });
  }

  try {
    const stats = await dbQueries.getDatabaseStats();
    const connectionTest = await dbQueries.testDatabaseConnection();
    
    res.json({
      success: true,
      database: {
        enabled: true,
        status: 'connected',
        connection: connectionTest,
        statistics: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: {
        enabled: true,
        status: 'error',
        error: error.message
      }
    });
  }
});

// Terms endpoints
app.get('/api/terms', async (req, res) => {
  try {
    const page = parseIntWithDefault(req.query.page, 1);
    const limit = Math.min(parseIntWithDefault(req.query.limit, 24), 100);
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'asc';

    let result;

    if (useDatabase) {
      // Use real database
      result = await dbQueries.getTermsFromDatabase({
        limit,
        offset: (page - 1) * limit,
        searchTerm: search || null,
        categoryId: category || null,
        sortBy,
        sortOrder
      });
      
      result = {
        success: true,
        data: result.terms,
        total: result.total,
        page,
        limit,
        hasMore: (page - 1) * limit + result.terms.length < result.total,
        pagination: {
          totalPages: Math.ceil(result.total / limit),
          hasNext: (page - 1) * limit + result.terms.length < result.total,
          hasPrev: page > 1
        },
        source: 'database'
      };
    } else {
      // Use sample data
      const filtered = filterAndSearchTerms(sampleTerms, search, category);
      
      // Sort sample data
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (sortOrder === 'desc') {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });

      const paginated = paginateResults(filtered, page, limit);
      result = {
        success: true,
        ...paginated,
        source: 'sample_data'
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terms',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

// Single term endpoint
app.get('/api/terms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let term = null;

    if (useDatabase) {
      // Use real database
      term = await dbQueries.getTermById(id);
    } else {
      // Use sample data
      term = sampleTerms.find(t => t.id.toString() === id || t.id === parseInt(id));
    }

    if (!term) {
      return res.status(404).json({
        success: false,
        error: 'Term not found',
        source: useDatabase ? 'database' : 'sample_data'
      });
    }

    res.json({
      success: true,
      data: term,
      source: useDatabase ? 'database' : 'sample_data'
    });
  } catch (error) {
    console.error('Error fetching term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch term',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

// Trending terms endpoint
app.get('/api/terms/trending', async (req, res) => {
  try {
    const limit = Math.min(parseIntWithDefault(req.query.limit, 10), 50);
    
    let terms = [];

    if (useDatabase) {
      // Use real database
      terms = await dbQueries.getTrendingTerms(limit);
    } else {
      // Use sample data - sort by view count
      terms = [...sampleTerms]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, limit);
    }

    res.json({
      success: true,
      data: terms,
      source: useDatabase ? 'database' : 'sample_data'
    });
  } catch (error) {
    console.error('Error fetching trending terms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending terms',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const page = parseIntWithDefault(req.query.page, 1);
    const limit = Math.min(parseIntWithDefault(req.query.limit, 100), 500);
    const search = req.query.search || '';
    const includeStats = req.query.includeStats === 'true';

    let result;

    if (useDatabase) {
      // Use real database
      const dbResult = await dbQueries.getCategoriesFromDatabase({
        limit,
        offset: (page - 1) * limit,
        includeTermCount: includeStats,
        searchTerm: search || null
      });

      result = {
        success: true,
        data: dbResult.categories,
        pagination: {
          page,
          limit,
          total: dbResult.total,
          hasMore: (page - 1) * limit + dbResult.categories.length < dbResult.total,
          pages: Math.ceil(dbResult.total / limit)
        },
        source: 'database'
      };
    } else {
      // Use sample data
      let filtered = sampleCategories;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(cat =>
          cat.name.toLowerCase().includes(searchLower) ||
          (cat.description && cat.description.toLowerCase().includes(searchLower))
        );
      }

      const paginated = paginateResults(filtered, page, limit);
      result = {
        success: true,
        data: paginated.data,
        pagination: {
          page,
          limit,
          total: paginated.total,
          hasMore: paginated.hasMore,
          pages: paginated.pagination.totalPages
        },
        source: 'sample_data'
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

// Single category endpoint
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let category = null;

    if (useDatabase) {
      // Use real database
      category = await dbQueries.getCategoryById(id);
    } else {
      // Use sample data
      category = sampleCategories.find(c => c.id.toString() === id || c.id === parseInt(id));
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        source: useDatabase ? 'database' : 'sample_data'
      });
    }

    res.json({
      success: true,
      data: category,
      source: useDatabase ? 'database' : 'sample_data'
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const page = parseIntWithDefault(req.query.page, 1);
    const limit = Math.min(parseIntWithDefault(req.query.limit, 20), 50);
    const category = req.query.category || '';

    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let result;

    if (useDatabase) {
      // Use real database
      const searchResult = await dbQueries.searchTerms(query, {
        limit,
        offset: (page - 1) * limit,
        categoryId: category || null
      });

      result = {
        success: true,
        data: searchResult.data,
        total: searchResult.total,
        page,
        limit,
        hasMore: (page - 1) * limit + searchResult.data.length < searchResult.total,
        query,
        source: 'database'
      };
    } else {
      // Use sample data
      const filtered = filterAndSearchTerms(sampleTerms, query, category);
      const paginated = paginateResults(filtered, page, limit);
      
      result = {
        success: true,
        ...paginated,
        query,
        source: 'sample_data'
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message,
      source: useDatabase ? 'database' : 'sample_data'
    });
  }
});

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(port, host, () => {
  console.log(`[HTTP] Server listening on ${host}:${port}`);
  console.log(`✅ API endpoints ready:`);
  console.log(`  - Health: /health, /api/health`);
  console.log(`  - Database Status: /api/db-status`);
  console.log(`  - Terms: /api/terms, /api/terms/:id, /api/terms/trending`);
  console.log(`  - Categories: /api/categories, /api/categories/:id`);
  console.log(`  - Search: /api/search?q=query`);
  console.log(`  - Data Source: ${useDatabase ? '🗄️  PostgreSQL Database' : '📋 Sample Data'}`);
  
  if (!useDatabase) {
    console.log(`  - 💡 To use database: Set DB_ENABLED=true environment variable`);
  }
});