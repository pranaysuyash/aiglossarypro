import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { SampleTermPage } from '../components/SampleTermPage';
import { getSampleTermBySlug, type SampleTerm } from '../data/sampleTerms';
import { useToast } from '../hooks/use-toast';

// SEO Meta component for sample terms
function SEOMeta({ term }: { term: SampleTerm }) {
  useEffect(() => {
    // Update document title
    document.title = term.seoMetadata.metaTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', term.seoMetadata.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = term.seoMetadata.metaDescription;
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', term.seoMetadata.keywords.join(', '));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = term.seoMetadata.keywords.join(', ');
      document.head.appendChild(meta);
    }

    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', window.location.origin + term.seoMetadata.canonicalUrl);
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = window.location.origin + term.seoMetadata.canonicalUrl;
      document.head.appendChild(link);
    }

    // Add structured data for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: term.title,
      description: term.definition,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'AI Glossary Pro',
        description: 'Comprehensive AI and Machine Learning Glossary',
        url: window.location.origin,
      },
      termCode: term.id,
      url: window.location.href,
      sameAs: term.seoMetadata.canonicalUrl,
      additionalType: term.category,
      audience: {
        '@type': 'Audience',
        audienceType: 'AI Professionals, Students, Researchers',
      },
      educationalLevel: term.complexity,
      keywords: term.tags,
      publisher: {
        '@type': 'Organization',
        name: 'AI Glossary Pro',
        url: window.location.origin,
      },
    };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify(structuredData);
    document.head.appendChild(scriptTag);

    // Cleanup function
    return () => {
      // Remove structured data script when component unmounts
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => {
        if (script.textContent?.includes(term.title)) {
          script.remove();
        }
      });
    };
  }, [term]);

  return null;
}

export default function SampleTerm() {
  const { slug } = useParams();
  const [term, setTerm] = useState<SampleTerm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    // Get the sample term by slug
    const foundTerm = getSampleTermBySlug(slug);

    if (foundTerm) {
      setTerm(foundTerm);

      // Track sample term view for analytics
      console.log('Sample term view:', {
        termId: foundTerm.id,
        slug: foundTerm.slug,
        category: foundTerm.category,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      });
    } else {
      setTerm(null);
    }

    setIsLoading(false);
  }, [slug]);

  const handleSignupWall = () => {
    // Track signup wall trigger
    console.log('Signup wall triggered from sample term:', {
      termId: term?.id,
      slug: term?.slug,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: '🔓 Unlock 9,990+ More Terms',
      description:
        'Create your free account to access the complete AI/ML glossary with 50 terms daily.',
      duration: 5000,
    });

    // In a real implementation, this would open the signup modal
    // For now, we'll redirect to the signup page
    window.location.href = `/signup?ref=sample-term&term=${  term?.slug || ''}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading term definition...</p>
        </div>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Term Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The sample term you're looking for doesn't exist. Check out our available sample terms
            below.
          </p>
          <div className="space-y-2">
            <a
              href="/sample/neural-network"
              className="block text-blue-600 hover:text-blue-700 underline"
            >
              Neural Network
            </a>
            <a
              href="/sample/machine-learning"
              className="block text-blue-600 hover:text-blue-700 underline"
            >
              Machine Learning
            </a>
            <a
              href="/sample/artificial-intelligence"
              className="block text-blue-600 hover:text-blue-700 underline"
            >
              Artificial Intelligence
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta term={term} />
      <SampleTermPage term={term} onSignupWall={handleSignupWall} />
    </>
  );
}
