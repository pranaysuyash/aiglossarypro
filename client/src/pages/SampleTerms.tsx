import { Search, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { SAMPLE_TERMS } from '../data/sampleTerms';

export default function SampleTerms() {
  // Set SEO metadata for the sample terms index page
  useEffect(() => {
    document.title = 'Free AI/ML Sample Terms | AI Glossary Pro';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Explore our curated collection of AI and Machine Learning definitions. Free sample terms from our comprehensive 10,000+ term glossary.'
      );
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute(
        'content',
        'AI glossary, machine learning definitions, artificial intelligence terms, free AI dictionary, sample terms'
      );
    }
  }, []);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const groupedTerms = SAMPLE_TERMS.reduce(
    (acc, term) => {
      if (!acc[term.category]) {
        acc[term.category] = [];
      }
      acc[term.category].push(term);
      return acc;
    },
    {} as Record<string, typeof SAMPLE_TERMS>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Free AI/ML Sample Terms
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Explore our curated collection of essential AI and Machine Learning definitions
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {SAMPLE_TERMS.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sample Terms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  10,000+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Terms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">50</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily Free Access</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Want Access to All 10,000+ Terms?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a free account to access 50 terms daily, or upgrade for unlimited lifetime
                access
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Start Free Account
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {Object.entries(groupedTerms).map(([category, terms]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mr-3">
                {category}
              </h2>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              >
                {terms.length} term{terms.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {terms.map(term => (
                <Card
                  key={term.id}
                  className="border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100 leading-tight">
                        {term.title}
                      </CardTitle>
                      <Badge
                        className={`ml-2 text-xs ${getComplexityColor(term.complexity)} flex-shrink-0`}
                      >
                        {term.complexity}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {term.definition.slice(0, 150)}...
                    </CardDescription>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {term.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {term.tags.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        >
                          +{term.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Link href={`/sample/${term.slug}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Read Definition
                        </Button>
                      </Link>

                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to Explore More?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            These {SAMPLE_TERMS.length} terms are just a tiny sample of our comprehensive AI/ML
            glossary. Get access to 10,000+ definitions, examples, and use cases.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Search className="w-5 h-5 mr-2" />
              Create Free Account
            </Button>
            <Button variant="outline" size="lg">
              View Pricing
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            ✅ 50 terms per day • ✅ No credit card required • ✅ Instant access
          </p>
        </div>
      </div>
    </div>
  );
}
