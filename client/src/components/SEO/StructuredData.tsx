import { useEffect } from 'react';

interface Term {
  id: string;
  name: string;
  definition: string;
  longDefinition?: string;
  category?: string;
  tags?: string[];
  isPreview?: boolean;
}

interface StructuredDataProps {
  term?: Term;
  type?: 'term' | 'glossary' | 'category';
  category?: string;
  terms?: Term[];
}

export function StructuredData({ term, type = 'term', category, terms }: StructuredDataProps) {
  useEffect(() => {
    // Remove any existing structured data script
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    let structuredData: any = null;

    if (type === 'term' && term) {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": term.name,
        "description": term.definition,
        "identifier": term.id,
        "inDefinedTermSet": {
          "@type": "DefinedTermSet",
          "name": "AI/ML Glossary Pro",
          "description": "Comprehensive glossary of artificial intelligence and machine learning terms",
          "url": window.location.origin,
        },
        "url": window.location.href,
        ...(term.category && {
          "termCode": term.category,
        }),
        ...(term.tags && term.tags.length > 0 && {
          "sameAs": term.tags.map(tag => `${window.location.origin}/search?q=${encodeURIComponent(tag)}`),
        }),
      };

      // Add more detailed definition if available and not preview
      if (term.longDefinition && !term.isPreview) {
        structuredData.additionalProperty = {
          "@type": "PropertyValue",
          "name": "detailedDefinition",
          "value": term.longDefinition,
        };
      }
    } else if (type === 'glossary') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "name": "AI/ML Glossary Pro",
        "description": "Comprehensive glossary of artificial intelligence and machine learning terms with over 10,000 definitions",
        "url": window.location.origin,
        "publisher": {
          "@type": "Organization",
          "name": "AI/ML Glossary Pro",
          "url": window.location.origin,
        },
        "dateModified": new Date().toISOString(),
        "inLanguage": "en-US",
        "hasDefinedTerm": terms?.slice(0, 10).map(t => ({
          "@type": "DefinedTerm",
          "name": t.name,
          "description": t.definition,
          "url": `${window.location.origin}/term/${t.id}`,
        })) || [],
      };
    } else if (type === 'category' && category) {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${category} - AI/ML Glossary Terms`,
        "description": `Explore AI and ML terms in the ${category} category`,
        "url": window.location.href,
        "isPartOf": {
          "@type": "WebSite",
          "name": "AI/ML Glossary Pro",
          "url": window.location.origin,
        },
        "mainEntity": {
          "@type": "DefinedTermSet",
          "name": `${category} Terms`,
          "description": `Collection of ${category} related AI/ML terms`,
          "hasDefinedTerm": terms?.map(t => ({
            "@type": "DefinedTerm",
            "name": t.name,
            "description": t.definition,
            "url": `${window.location.origin}/term/${t.id}`,
          })) || [],
        },
      };
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup on unmount
      const script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.remove();
      }
    };
  }, [term, type, category, terms]);

  return null; // This component doesn't render anything visible
}

// SEO Meta Tags Component
interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
}

export function SEOMeta({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogType = 'website', 
  ogImage 
}: SEOMetaProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
    }

    if (keywords && keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    if (canonical) {
      let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.rel = 'canonical';
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.href = canonical;
    }

    // Open Graph tags
    updateMetaTag('og:title', title || document.title, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', window.location.href, true);
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title || document.title, true);
    
    if (description) {
      updateMetaTag('twitter:description', description, true);
    }
  }, [title, description, keywords, canonical, ogType, ogImage]);

  return null;
}