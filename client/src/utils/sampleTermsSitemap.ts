import { getSampleTermsForSitemap, SAMPLE_TERMS } from '../data/sampleTerms';

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Generate sitemap entries for sample terms
 */
export function generateSampleTermsSitemap(baseUrl: string = 'https://aiglossarypro.com'): SitemapEntry[] {
  const sampleTermsData = getSampleTermsForSitemap();
  
  const entries: SitemapEntry[] = [
    // Sample terms index page
    {
      url: `${baseUrl}/sample`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Individual sample term pages
    ...sampleTermsData.map(term => ({
      url: `${baseUrl}${term.url}`,
      lastModified: term.lastModified,
      changeFrequency: term.changeFrequency,
      priority: term.priority,
    }))
  ];

  return entries;
}

/**
 * Generate XML sitemap content for sample terms
 */
export function generateSampleTermsXmlSitemap(baseUrl: string = 'https://aiglossarypro.com'): string {
  const entries = generateSampleTermsSitemap(baseUrl);
  
  const xmlEntries = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generate robots.txt entries for sample terms
 */
export function generateRobotsTxtEntries(baseUrl: string = 'https://aiglossarypro.com'): string {
  return `
# Sample terms sitemap
Sitemap: ${baseUrl}/sitemap-sample-terms.xml

# Allow all search engines to index sample terms
User-agent: *
Allow: /sample/
Allow: /sample

# Prioritize sample terms for crawling
Crawl-delay: 1
`;
}

/**
 * Generate structured data for sample terms
 */
export function generateSampleTermsStructuredData(baseUrl: string = 'https://aiglossarypro.com') {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    'name': 'AI/ML Glossary Pro - Sample Terms',
    'description': 'Curated collection of essential AI and Machine Learning definitions with examples and use cases',
    'url': `${baseUrl}/sample`,
    'license': 'https://creativecommons.org/licenses/by/4.0/',
    'creator': {
      '@type': 'Organization',
      'name': 'AI Glossary Pro',
      'url': baseUrl
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AI Glossary Pro',
      'url': baseUrl
    },
    'dateCreated': '2025-07-12',
    'dateModified': new Date().toISOString(),
    'keywords': [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'AI glossary',
      'ML definitions',
      'AI terms',
      'machine learning dictionary'
    ],
    'mainEntity': SAMPLE_TERMS.map(term => ({
      '@type': 'DefinedTerm',
      'name': term.title,
      'description': term.definition,
      'url': `${baseUrl}/sample/${term.slug}`,
      'identifier': term.id,
      'inDefinedTermSet': {
        '@type': 'DefinedTermSet',
        'name': 'AI Glossary Pro',
        'description': 'Comprehensive AI and Machine Learning Glossary',
        'url': baseUrl
      },
      'additionalType': term.category,
      'audience': {
        '@type': 'Audience',
        'audienceType': 'AI Professionals, Students, Researchers'
      },
      'educationalLevel': term.complexity,
      'keywords': term.tags
    }))
  };

  return JSON.stringify(structuredData, null, 2);
}

/**
 * Export functions for use in build scripts or server-side generation
 */
export const sampleTermsSeoUtils = {
  generateSitemap: generateSampleTermsSitemap,
  generateXmlSitemap: generateSampleTermsXmlSitemap,
  generateRobotsTxt: generateRobotsTxtEntries,
  generateStructuredData: generateSampleTermsStructuredData,
  getSampleTermsCount: () => SAMPLE_TERMS.length,
  getSampleTermSlugs: () => SAMPLE_TERMS.map(term => term.slug),
};