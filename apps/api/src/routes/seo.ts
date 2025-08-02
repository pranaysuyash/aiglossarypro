/**
 * SEO Optimization Routes
 * Provides meta tags, structured data, and SEO-related endpoints
 */

import { eq, sql } from 'drizzle-orm';
import { type Express, type Request, type Response, Router } from 'express';
// TODO: Move sampleTermsSeoUtils to shared package
// import { sampleTermsSeoUtils } // TODO: Move from client - src/utils/sampleTermsSitemap;
const sampleTermsSeoUtils = { getSitemapPaths: () => [] }; // Temporary placeholder
import { categories, terms } from '@aiglossarypro/shared/schema';
import type { ApiResponse } from '@aiglossarypro/shared';
import { db } from '@aiglossarypro/database';
import { log as logger } from '../utils/logger';

// SEO-specific type definitions
interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  url: string;
  type: string;
  image: string;
  siteName: string;
  locale: string;
  article: {
    publishedTime?: string;
    modifiedTime?: string;
    section: string;
    tags: string[];
  };
  twitter: {
    card: string;
    site: string;
    creator: string;
  };
}

interface StructuredDataResponse {
  structuredData: Array<Record<string, unknown>>;
  jsonLd: string;
}

interface SeoAnalytics {
  totalTerms: number;
  seoIssues: {
    missingShortDescriptions: number;
    missingImages: number;
    shortDefinitions: number;
    missingReferences: number;
  };
  seoScore: {
    descriptions: number;
    images: number;
    content: number;
    references: number;
  };
  overallScore?: number;
}

interface DatabaseCountResult {
  count: number;
}

const seoRouter = Router();

// Generate sitemap.xml
seoRouter.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://aiglossarypro.com';

    // Get all published terms
    const allTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        updatedAt: terms.updatedAt,
        categoryId: terms.categoryId,
      })
      .from(terms)
      .orderBy(terms.updatedAt);

    // Get all categories
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .orderBy(categories.updatedAt);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Categories page -->
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Search page -->
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Sample terms page -->
  <url>
    <loc>${baseUrl}/sample</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Add category pages
    allCategories.forEach(category => {
      const categorySlug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      sitemap += `
  <url>
    <loc>${baseUrl}/category/${categorySlug}</loc>
    <lastmod>${category.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add term pages
    allTerms.forEach(term => {
      const termSlug = term.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      sitemap += `
  <url>
    <loc>${baseUrl}/term/${termSlug}</loc>
    <lastmod>${term.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // Add sample term pages
    const sampleTerms = sampleTermsSeoUtils.generateSitemap(baseUrl);
    sampleTerms.forEach(sampleTerm => {
      // Skip the main /sample page as it's already added above
      if (!sampleTerm.url.endsWith('/sample')) {
        sitemap += `
  <url>
    <loc>${sampleTerm.url}</loc>
    <lastmod>${sampleTerm.lastModified.split('T')[0]}</lastmod>
    <changefreq>${sampleTerm.changeFrequency}</changefreq>
    <priority>${sampleTerm.priority}</priority>
  </url>`;
      }
    });

    sitemap += '\n</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    logger.error('Sitemap generation error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap generation failed</error>');
  }
});

// Generate sample terms sitemap.xml
seoRouter.get('/sitemap-sample-terms.xml', async (_req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://aiglossarypro.com';

    // Generate XML sitemap specifically for sample terms
    const sampleTermsXml = sampleTermsSeoUtils.generateXmlSitemap(baseUrl);

    res.setHeader('Content-Type', 'application/xml');
    res.send(sampleTermsXml);

    logger.info('Sample terms sitemap generated successfully', {
      termCount: sampleTermsSeoUtils.getSampleTermsCount(),
      baseUrl,
    });
  } catch (error) {
    logger.error('Sample terms sitemap generation error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .send(
        '<?xml version="1.0" encoding="UTF-8"?><error>Sample terms sitemap generation failed</error>'
      );
  }
});

// Generate robots.txt
seoRouter.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'https://aiglossarypro.com';

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /uploads/

# Prioritize sample terms for SEO
Allow: /sample/
Allow: /sample

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-sample-terms.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// Get SEO metadata for specific term
seoRouter.get('/meta/term/:id', async (req: Request, res: Response<ApiResponse<SeoMetadata>>) => {
  try {
    const { id } = req.params;

    const [term] = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        categoryId: terms.categoryId,
        categoryName: categories.name,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(terms.id, id))
      .limit(1);

    if (!term) {
      return res.status(404).json({
        success: false,
        error: 'Term not found',
      });
    }

    const baseUrl = process.env.BASE_URL || 'https://aiglossarypro.com';
    const termSlug = term.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const termUrl = `${baseUrl}/term/${termSlug}`;

    // Generate meta description
    const metaDescription =
      term.shortDefinition ||
      (term.definition.length > 160 ? `${term.definition.substring(0, 157)}...` : term.definition);

    // Generate keywords
    const keywords = [
      term.name,
      'AI glossary',
      'machine learning',
      'artificial intelligence',
      term.categoryName,
      ...(term.characteristics || []),
    ]
      .filter(Boolean)
      .join(', ');

    // OpenGraph and Twitter Card data
    const seoData = {
      title: `${term.name} - AI Glossary Pro`,
      description: metaDescription,
      keywords: keywords,
      url: termUrl,
      type: 'article',
      image: term.visualUrl || `${baseUrl}/default-term-image.jpg`,
      siteName: 'AI Glossary Pro',
      locale: 'en_US',
      article: {
        publishedTime: term.updatedAt?.toISOString(),
        modifiedTime: term.updatedAt?.toISOString(),
        section: term.categoryName || 'General',
        tags: [term.name, term.categoryName, 'AI', 'Machine Learning'].filter(Boolean),
      },
      twitter: {
        card: 'summary_large_image',
        site: '@aiglossarypro',
        creator: '@aiglossarypro',
      },
    };

    res.json({
      success: true,
      data: seoData,
    });
  } catch (error) {
    logger.error('SEO meta generation error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate SEO metadata',
    });
  }
});

// Get structured data (JSON-LD) for term
seoRouter.get(
  '/structured-data/term/:id',
  async (req: Request, res: Response<ApiResponse<StructuredDataResponse>>) => {
    try {
      const { id } = req.params;

      const [term] = await db
        .select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          characteristics: terms.characteristics,
          applications: terms.applications,
          references: terms.references,
          visualUrl: terms.visualUrl,
          categoryName: categories.name,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(eq(terms.id, id))
        .limit(1);

      if (!term) {
        return res.status(404).json({
          success: false,
          error: 'Term not found',
        });
      }

      const baseUrl = process.env.BASE_URL || 'https://aiglossarypro.com';
      const termSlug = term.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Generate Schema.org DefinedTerm structured data
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: term.name,
        description: term.definition,
        identifier: term.id,
        url: `${baseUrl}/term/${termSlug}`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'AI Glossary Pro',
          description: 'Comprehensive glossary of AI and Machine Learning terms',
          url: baseUrl,
          publisher: {
            '@type': 'Organization',
            name: 'AI Glossary Pro',
            url: baseUrl,
          },
        },
        mainEntity: {
          '@type': 'Thing',
          name: term.name,
          description: term.definition,
          category: term.categoryName,
          properties:
            term.characteristics?.map(char => ({
              '@type': 'PropertyValue',
              name: 'characteristic',
              value: char,
            })) || [],
          applicationCategory: term.applications || [],
          image: term.visualUrl,
          dateCreated: term.createdAt?.toISOString(),
          dateModified: term.updatedAt?.toISOString(),
        },
        citation:
          term.references?.map((ref, index) => ({
            '@type': 'WebPage',
            name: `Reference ${index + 1}`,
            url: ref,
          })) || [],
      };

      // Add BreadcrumbList for better navigation
      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Terms',
            item: `${baseUrl}/terms`,
          },
          ...(term.categoryName
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: term.categoryName,
                  item: `${baseUrl}/category/${term.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                },
              ]
            : []),
          {
            '@type': 'ListItem',
            position: term.categoryName ? 4 : 3,
            name: term.name,
            item: `${baseUrl}/term/${termSlug}`,
          },
        ],
      };

      res.json({
        success: true,
        data: {
          structuredData: [structuredData, breadcrumbData],
          jsonLd: JSON.stringify([structuredData, breadcrumbData], null, 2),
        },
      });
    } catch (error) {
      logger.error('Structured data generation error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate structured data',
      });
    }
  }
);

// Get SEO analytics and suggestions
seoRouter.get('/analytics', async (_req: Request, res: Response<ApiResponse<SeoAnalytics>>) => {
  try {
    // Get terms without descriptions (SEO issue)
    const termsWithoutShortDesc = await db.execute(sql`
      SELECT COUNT(*) as count FROM terms WHERE short_definition IS NULL OR short_definition = ''
    `);

    // Get terms without images (SEO opportunity)
    const termsWithoutImages = await db.execute(sql`
      SELECT COUNT(*) as count FROM terms WHERE visual_url IS NULL OR visual_url = ''
    `);

    // Get terms with very short definitions (< 50 chars)
    const termsWithShortDefs = await db.execute(sql`
      SELECT COUNT(*) as count FROM terms WHERE LENGTH(definition) < 50
    `);

    // Get terms without references
    const termsWithoutRefs = await db.execute(sql`
      SELECT COUNT(*) as count FROM terms WHERE references IS NULL OR ARRAY_LENGTH(references, 1) IS NULL
    `);

    // Get total terms count
    const totalTerms = await db.execute(sql`
      SELECT COUNT(*) as count FROM terms
    `);

    const totalTermsCount = Number((totalTerms.rows[0] as unknown as DatabaseCountResult)?.count || 0);
    const missingShortDescCount = Number((termsWithoutShortDesc.rows[0] as unknown as DatabaseCountResult)?.count || 0);
    const missingImagesCount = Number((termsWithoutImages.rows[0] as unknown as DatabaseCountResult)?.count || 0);
    const shortDefsCount = Number((termsWithShortDefs.rows[0] as unknown as DatabaseCountResult)?.count || 0);
    const missingRefsCount = Number((termsWithoutRefs.rows[0] as unknown as DatabaseCountResult)?.count || 0);

    const analytics: SeoAnalytics = {
      totalTerms: totalTermsCount,
      seoIssues: {
        missingShortDescriptions: missingShortDescCount,
        missingImages: missingImagesCount,
        shortDefinitions: shortDefsCount,
        missingReferences: missingRefsCount,
      },
      seoScore: {
        descriptions: Math.round(
          (1 - missingShortDescCount / Math.max(totalTermsCount, 1)) * 100
        ),
        images: Math.round(
          (1 - missingImagesCount / Math.max(totalTermsCount, 1)) * 100
        ),
        content: Math.round(
          (1 - shortDefsCount / Math.max(totalTermsCount, 1)) * 100
        ),
        references: Math.round(
          (1 - missingRefsCount / Math.max(totalTermsCount, 1)) * 100
        ),
      },
    };

    // Calculate overall SEO score
    const scores = Object.values(analytics.seoScore) as number[];
    analytics.overallScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('SEO analytics error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate SEO analytics',
    });
  }
});

// Register SEO routes
export function registerSeoRoutes(app: Express): void {
  app.use('/api/seo', seoRouter);

  // Mount sitemap and robots at root level for direct access
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    req.url = '/sitemap.xml';
    seoRouter(req, res, () => {});
  });

  app.get('/sitemap-sample-terms.xml', async (req: Request, res: Response) => {
    req.url = '/sitemap-sample-terms.xml';
    seoRouter(req, res, () => {});
  });

  app.get('/robots.txt', async (req: Request, res: Response) => {
    req.url = '/robots.txt';
    seoRouter(req, res, () => {});
  });

  logger.info('SEO optimization routes registered');
}

export { seoRouter };
