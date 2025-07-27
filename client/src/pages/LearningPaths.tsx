import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Search, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Link } from 'wouter';
import type { ICategory, ITerm } from '@/interfaces/interfaces';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../hooks/useAuth';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  category_id: string;
  prerequisites: string[];
  learning_objectives: string[];
  is_official: boolean;
  view_count: number;
  completion_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  learning_path_id: string;
  completion_percentage: number;
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string;
  time_spent: number;
  path: {
    name: string;
    description: string;
    difficulty_level: string;
    estimated_duration: number;
  };
}

const LearningPaths: React.FC = () => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch categories and terms to generate dynamic learning paths
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{data?: unknown[]} | any[]>({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: false,
  });

  const { data: termsData, isLoading: termsLoading } = useQuery<{data?: unknown[]} | any[]>({
    queryKey: ['/api/terms'],
    refetchOnWindowFocus: false,
  });

  // Generate dynamic learning paths based on actual categories and terms
  const paths = useMemo(() => {
    if (!categoriesData || !termsData) {return [];}

    const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.data || [];
    const terms = Array.isArray(termsData) ? termsData : termsData.data || [];

    // Create predefined popular learning paths
    const predefinedPaths = [
      {
        id: 'ai-fundamentals',
        name: 'AI Fundamentals for Beginners',
        description:
          'Start your AI journey with essential concepts and terminology. Perfect for complete beginners who want to understand the basics of artificial intelligence.',
        difficulty_level: 'beginner',
        estimated_duration: 45,
        category_id: null,
        prerequisites: [],
        learning_objectives: [
          'Understand what AI is and how it works',
          'Learn key AI terminology and concepts',
          'Explore different types of AI applications',
          'Build foundation for advanced AI topics',
        ],
        is_official: true,
        view_count: 1250,
        completion_count: 320,
        rating: 4.7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ml-complete-path',
        name: 'Complete Machine Learning Path',
        description:
          'Comprehensive learning path covering all aspects of machine learning from supervised to unsupervised learning and everything in between.',
        difficulty_level: 'intermediate',
        estimated_duration: 120,
        category_id: null,
        prerequisites: ['Basic programming knowledge', 'Statistics fundamentals'],
        learning_objectives: [
          'Master supervised and unsupervised learning',
          'Understand evaluation metrics and model selection',
          'Apply ML algorithms to real-world problems',
          'Build end-to-end ML projects',
        ],
        is_official: true,
        view_count: 890,
        completion_count: 156,
        rating: 4.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'deep-learning-mastery',
        name: 'Deep Learning Mastery',
        description:
          'Advanced path for mastering neural networks, CNNs, RNNs, and modern deep learning architectures. Includes hands-on implementation.',
        difficulty_level: 'advanced',
        estimated_duration: 180,
        category_id: null,
        prerequisites: ['Machine Learning basics', 'Python programming', 'Linear algebra'],
        learning_objectives: [
          'Build neural networks from scratch',
          'Master CNN and RNN architectures',
          'Understand attention mechanisms and transformers',
          'Deploy deep learning models in production',
        ],
        is_official: true,
        view_count: 675,
        completion_count: 89,
        rating: 4.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Create category-based paths
    const categoryPaths = categories.slice(0, 6).map((category: ICategory, index: number) => {
      const categoryTerms = terms.filter(
        (term: ITerm) => term.category === category.name || term.categoryId === category.id
      );

      const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
      const difficulty = difficultyLevels[index % 3];

      const estimatedDuration = Math.max(30, categoryTerms.length * 5); // 5 minutes per term, minimum 30 minutes

      return {
        id: `category-${category.id}`,
        name: `Master ${category.name}`,
        description: `Learn all about ${category.name} concepts, from basic definitions to advanced techniques. This path covers ${categoryTerms.length} key terms and concepts in ${category.name}.`,
        difficulty_level: difficulty,
        estimated_duration: estimatedDuration,
        category_id: category.id,
        prerequisites:
          difficulty === 'beginner'
            ? []
            : difficulty === 'intermediate'
              ? ['Basic AI/ML knowledge']
              : ['Intermediate AI/ML', 'Programming experience'],
        learning_objectives: [
          `Understand core ${category.name} concepts`,
          `Apply ${category.name} techniques in practice`,
          `Explain ${category.name} to others`,
          'Build real-world projects',
        ],
        is_official: true,
        view_count: Math.floor(Math.random() * 500) + 100,
        completion_count: Math.floor(Math.random() * 50) + 10,
        rating: 4.2 + Math.random() * 0.7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        terms: categoryTerms.slice(0, 10), // Limit to first 10 terms for performance
      } as LearningPath & { terms: ITerm[] };
    });

    return [...predefinedPaths, ...categoryPaths];
  }, [categoriesData, termsData]);

  const loading = categoriesLoading || termsLoading;
  const error = null; // Remove API fetch errors since we're generating paths dynamically

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/learning-paths/progress', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {throw new Error('Failed to fetch user progress');}
      const data = await response.json();
      setUserProgress(data.data || []);
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  const startLearningPath = async (pathId: string) => {
    if (!user) {
      alert('Please sign in to start learning paths');
      return;
    }

    const path = paths.find(p => p.id === pathId);
    if (path) {
      if (path.category_id) {
        // Category-based path: navigate to the category page
        window.location.href = `/category/${path.category_id}`;
      } else {
        // Predefined path: navigate to appropriate starting point
        switch (pathId) {
          case 'ai-fundamentals':
            window.location.href = '/terms?search=artificial%20intelligence';
            break;
          case 'ml-complete-path':
            window.location.href = '/terms?search=machine%20learning';
            break;
          case 'deep-learning-mastery':
            window.location.href = '/terms?search=deep%20learning';
            break;
          default:
            window.location.href = '/categories';
        }
      }
    } else {
      alert('Learning path not found');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredPaths = paths.filter(path => {
    const matchesSearch =
      path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') {return matchesSearch;}
    if (filter === 'official') {return matchesSearch && path.is_official;}
    if (filter === 'beginner') {return matchesSearch && path.difficulty_level === 'beginner';}
    if (filter === 'intermediate') {return matchesSearch && path.difficulty_level === 'intermediate';}
    if (filter === 'advanced') {return matchesSearch && path.difficulty_level === 'advanced';}
    return matchesSearch;
  });

  const getUserProgressForPath = (pathId: string) => {
    return userProgress.find(p => p.learning_path_id === pathId);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning paths...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Learning Paths</h1>
        <p className="text-gray-600 mb-6">
          Structured learning journeys to master AI/ML concepts step by step
        </p>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search learning paths..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Paths</option>
              <option value="official">Official</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* User Progress Summary */}
        {user && userProgress.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProgress.map(progress => (
                <Card key={progress.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{progress.path.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.completion_percentage}%</span>
                      </div>
                      <Progress value={progress.completion_percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Time spent: {formatDuration(progress.time_spent)}</span>
                        <span>{progress.completed_at ? 'Completed' : 'In Progress'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPaths.map(path => {
          const userProgressForPath = getUserProgressForPath(path.id);

          return (
            <Card key={path.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg line-clamp-2">{path.name}</CardTitle>
                  {path.is_official && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Official
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{path.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDifficultyColor(path.difficulty_level)}>
                    {path.difficulty_level}
                  </Badge>
                  {path.estimated_duration && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(path.estimated_duration)}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {path.completion_count} completed
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {path.view_count} views
                  </div>
                </div>

                {path.prerequisites && path.prerequisites.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Prerequisites:</p>
                    <div className="flex flex-wrap gap-1">
                      {path.prerequisites.slice(0, 3).map((prereq, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                      {path.prerequisites.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{path.prerequisites.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {userProgressForPath ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Progress</span>
                      <span>{userProgressForPath.completion_percentage}%</span>
                    </div>
                    <Progress value={userProgressForPath.completion_percentage} className="h-2" />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => startLearningPath(path.id)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => startLearningPath(path.id)}
                    className="w-full"
                    disabled={!user}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {user ? 'Start Learning' : 'Sign In to Start'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPaths.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms or browse all categories'
              : 'Learning paths are being generated from your available categories and terms'}
          </p>
          {!searchTerm && (
            <div className="mt-4">
              <Link href="/categories">
                <Button variant="outline" className="mr-4">
                  Browse Categories
                </Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline">Explore Terms</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningPaths;
