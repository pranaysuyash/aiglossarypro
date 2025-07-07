import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Clock, Users, BookOpen, TrendingUp, Filter, Search } from 'lucide-react';

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
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLearningPaths();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchLearningPaths = async () => {
    try {
      const response = await fetch('/api/learning-paths');
      if (!response.ok) throw new Error('Failed to fetch learning paths');
      const data = await response.json();
      setPaths(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/learning-paths/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user progress');
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

    try {
      const response = await fetch(`/api/learning-paths/${pathId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to start learning path');
      
      await fetchUserProgress();
      alert('Learning path started successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start learning path');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredPaths = paths.filter(path => {
    const matchesSearch = path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         path.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'official') return matchesSearch && path.is_official;
    if (filter === 'beginner') return matchesSearch && path.difficulty_level === 'beginner';
    if (filter === 'intermediate') return matchesSearch && path.difficulty_level === 'intermediate';
    if (filter === 'advanced') return matchesSearch && path.difficulty_level === 'advanced';
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
              {userProgress.map((progress) => (
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
                        <span>
                          {progress.completed_at ? 'Completed' : 'In Progress'}
                        </span>
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
        {filteredPaths.map((path) => {
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
                    <Link to={`/learning-paths/${path.id}`}>
                      <Button className="w-full" variant="outline">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
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
            {searchTerm ? 'Try adjusting your search terms' : 'Learning paths are coming soon!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningPaths;