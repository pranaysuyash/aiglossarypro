import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Mic,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { OptimizedImage } from './ui/optimized-image';

interface SearchResult {
  id: string;
  title: string;
  definition: string;
  category: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  isFavorite?: boolean;
  popularity?: number;
  lastViewed?: string;
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick?: (result: SearchResult) => void;
  onFavoriteToggle?: (resultId: string) => void;
  placeholder?: string;
  showVoiceSearch?: boolean;
  initialQuery?: string;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  onResultClick,
  onFavoriteToggle,
  placeholder = 'Search 10,000+ AI/ML terms...',
  showVoiceSearch = true,
  initialQuery = '',
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Mock search results for demonstration
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Neural Network',
      definition:
        'A computing system inspired by biological neural networks that process information through interconnected nodes.',
      category: 'Deep Learning',
      complexity: 'Intermediate',
      tags: ['Deep Learning', 'AI', 'Machine Learning'],
      popularity: 95,
      isFavorite: false,
    },
    {
      id: '2',
      title: 'Machine Learning',
      definition:
        'A subset of AI that enables computers to learn and improve from experience without being explicitly programmed.',
      category: 'AI Fundamentals',
      complexity: 'Beginner',
      tags: ['AI', 'Learning', 'Algorithms'],
      popularity: 100,
      isFavorite: true,
    },
    {
      id: '3',
      title: 'Transformer Architecture',
      definition:
        'A neural network architecture that revolutionized NLP by using self-attention mechanisms.',
      category: 'Deep Learning',
      complexity: 'Advanced',
      tags: ['Transformers', 'NLP', 'Attention'],
      popularity: 85,
      isFavorite: false,
    },
    {
      id: '4',
      title: 'Gradient Descent',
      definition:
        'An optimization algorithm used to minimize the loss function in machine learning models.',
      category: 'Optimization',
      complexity: 'Intermediate',
      tags: ['Optimization', 'Training', 'Algorithms'],
      popularity: 78,
      isFavorite: false,
    },
    {
      id: '5',
      title: 'Convolutional Neural Network',
      definition:
        'A deep learning algorithm particularly effective for image recognition and computer vision tasks.',
      category: 'Computer Vision',
      complexity: 'Advanced',
      tags: ['CNN', 'Computer Vision', 'Deep Learning'],
      popularity: 88,
      isFavorite: true,
    },
  ];

  const categories = ['AI Fundamentals', 'Deep Learning', 'Computer Vision', 'NLP', 'Optimization'];
  const complexityLevels = ['Beginner', 'Intermediate', 'Advanced'];

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mobile_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filter mock results based on query
      const filteredResults = mockResults.filter(
        result =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setResults(filteredResults);
      setIsLoading(false);

      // Save to recent searches
      if (searchQuery.trim()) {
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('mobile_recent_searches', JSON.stringify(updated));
      }
    },
    [recentSearches]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  // Handle voice search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: 'Voice search not supported',
        description: 'Your browser does not support voice recognition.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsVoiceListening(true);

    recognition.onresult = (event: Response) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      performSearch(transcript);
      setIsVoiceListening(false);
    };

    recognition.onerror = () => {
      toast({
        title: 'Voice search failed',
        description: 'Please try again or use text search.',
        variant: 'destructive',
      });
      setIsVoiceListening(false);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.start();
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    onClose();
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (resultId: string) => {
    setResults(prev =>
      prev.map(result =>
        result.id === resultId ? { ...result, isFavorite: !result.isFavorite } : result
      )
    );
    onFavoriteToggle?.(resultId);
  };

  // Get complexity color
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-20 h-12 text-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />

              {/* Voice Search Button */}
              {showVoiceSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceSearch}
                  disabled={isVoiceListening}
                  className={`absolute right-12 top-1/2 transform -translate-y-1/2 ${
                    isVoiceListening ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  <Mic className={`w-5 h-5 ${isVoiceListening ? 'animate-pulse' : ''}`} />
                </Button>
              )}

              {/* Clear Button */}
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Button
              variant={showFilters ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="p-4 space-y-3">
                  {/* Category Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Badge
                          key={category}
                          variant={selectedFilters.includes(category) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedFilters(prev =>
                              prev.includes(category)
                                ? prev.filter(f => f !== category)
                                : [...prev, category]
                            );
                          }}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Complexity Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complexity
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {complexityLevels.map(level => (
                        <Badge
                          key={level}
                          variant={selectedFilters.includes(level) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedFilters(prev =>
                              prev.includes(level)
                                ? prev.filter(f => f !== level)
                                : [...prev, level]
                            );
                          }}
                        >
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Empty State / Recent Searches */}
            {!query && (
              <div className="p-4 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-500" />
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchChange(search)}
                          className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-gray-900 dark:text-gray-100">{search}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Terms */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                    Popular Terms
                  </h3>
                  <div className="grid gap-3">
                    {mockResults.slice(0, 3).map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.category}
                          </p>
                        </div>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {query && (
              <div className="h-full overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {results.map(result => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => handleResultClick(result)}
                            className="flex-1 text-left"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {result.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                              {result.definition}
                            </p>
                          </button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFavoriteToggle(result.id)}
                            className={`ml-2 flex-shrink-0 ${
                              result.isFavorite ? 'text-red-500' : 'text-gray-400'
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${result.isFavorite ? 'fill-current' : ''}`}
                            />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                            <Badge className={`text-xs ${getComplexityColor(result.complexity)}`}>
                              {result.complexity}
                            </Badge>
                          </div>

                          {result.popularity && (
                            <div className="flex items-center text-xs text-gray-500">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {result.popularity}%
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Load More Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        toast({
                          title: 'Loading more results...',
                          description: 'This would load additional search results.',
                        });
                      }}
                    >
                      Load More Results
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                    <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Try adjusting your search terms or filters
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setSelectedFilters([]);
                      }}
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MobileSearchOverlay;
