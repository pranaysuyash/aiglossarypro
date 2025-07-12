import { BookOpen, Lock, Search, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface SampleTerm {
  id: string;
  title: string;
  definition: string;
  category: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  relatedTerms: Array<{
    id: string;
    title: string;
    category: string;
    locked: boolean;
  }>;
  examples: string[];
  useCases: string[];
}

interface SampleTermPageProps {
  term: SampleTerm;
  onSignupWall?: () => void;
}

export function SampleTermPage({ term, onSignupWall }: SampleTermPageProps) {
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  const handleLockedTermClick = () => {
    setSignupModalOpen(true);
    onSignupWall?.();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* SEO-Optimized Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {term.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  AI/ML Glossary • {term.category}
                </p>
              </div>
            </div>
            <Badge className={getComplexityColor(term.complexity)}>
              {term.complexity}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Definition Card */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                  Definition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {term.definition}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {term.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Examples */}
            {term.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-900 dark:text-green-100">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Real-World Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {term.examples.map((example, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Use Cases */}
            {term.useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Common Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {term.useCases.map((useCase, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Terms */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  Related Terms
                </CardTitle>
                <CardDescription>
                  Explore connected concepts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {term.relatedTerms.map((relatedTerm) => (
                    <div
                      key={relatedTerm.id}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        relatedTerm.locked
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600'
                          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                      onClick={relatedTerm.locked ? handleLockedTermClick : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {relatedTerm.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {relatedTerm.category}
                          </p>
                        </div>
                        {relatedTerm.locked && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signup Wall CTA */}
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Unlock 9,990+ More Terms
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  Create a free account to access our complete AI/ML glossary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    ✅ 50 terms per day<br />
                    ✅ Advanced search & filtering<br />
                    ✅ Bookmark favorites<br />
                    ✅ Track learning progress
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    onClick={handleLockedTermClick}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Create Free Account
                  </Button>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                    No credit card required • Instant access
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Explore More
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/categories">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse All Categories
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Advanced Search
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Signup Wall Modal */}
      {signupModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white dark:bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                Unlock Full Access
              </CardTitle>
              <CardDescription>
                Create a free account to view 9,990+ AI/ML definitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">terms per day</div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Sign Up Free
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setSignupModalOpen(false)}
              >
                Maybe Later
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SampleTermPage;