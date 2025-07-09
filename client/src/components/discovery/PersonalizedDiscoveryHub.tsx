import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  Sparkles, 
  Target, 
  Users,
  BookOpen,
  Zap,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Star,
  Clock,
  BarChart3,
  Lightbulb,
  Compass,
  Heart,
  Globe,
  Route
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PersonalizedRecommendation {
  id: string;
  termId: string;
  termName: string;
  type: 'trending' | 'personalized' | 'prerequisite' | 'related' | 'advanced';
  reason: string;
  confidence: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedReadTime: number;
  categories: string[];
  description: string;
  userInteractionScore: number;
  popularityScore: number;
  recencyScore: number;
}

interface DiscoveryPath {
  id: string;
  name: string;
  description: string;
  termIds: string[];
  estimatedTime: number;
  difficulty: string;
  completionRate: number;
  userProgress: number;
  tags: string[];
  type: 'guided' | 'flexible' | 'challenge';
}

interface TrendingTopic {
  termId: string;
  termName: string;
  weeklyGrowth: number;
  viewCount: number;
  category: string;
  trendReason: string;
}

export function PersonalizedDiscoveryHub() {
  const [activeTab, setActiveTab] = useState('personalized');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch personalized recommendations
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['personalized-recommendations', difficultyFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/discovery/personalized?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    }
  });

  // Fetch discovery paths
  const { data: discoveryPaths, isLoading: loadingPaths } = useQuery({
    queryKey: ['discovery-paths'],
    queryFn: async () => {
      const response = await fetch('/api/discovery/paths');
      if (!response.ok) throw new Error('Failed to fetch discovery paths');
      return response.json();
    }
  });

  // Fetch trending topics
  const { data: trendingTopics, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/trending');
      if (!response.ok) throw new Error('Failed to fetch trending topics');
      return response.json();
    }
  });

  // Fetch user's interests for context
  const { data: userContext } = useQuery({
    queryKey: ['user-context'],
    queryFn: async () => {
      const response = await fetch('/api/users/context');
      if (!response.ok) throw new Error('Failed to fetch user context');
      return response.json();
    }
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'personalized': return <Brain className="w-4 h-4" />;
      case 'prerequisite': return <Target className="w-4 h-4" />;
      case 'related': return <Globe className="w-4 h-4" />;
      case 'advanced': return <Zap className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trending': return 'bg-red-100 text-red-800';
      case 'personalized': return 'bg-blue-100 text-blue-800';
      case 'prerequisite': return 'bg-orange-100 text-orange-800';
      case 'related': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with Context */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Discover Your Learning Journey
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          AI-powered recommendations tailored to your interests, learning style, and goals
        </p>
        
        {userContext && (
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{userContext.favoriteCategories?.length || 0} favorite topics</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{userContext.totalLearningTime || 0} hours learned</span>
            </span>
            <span className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>{userContext.skillLevel || 'intermediate'} level</span>
            </span>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Discovery Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="machine-learning">Machine Learning</SelectItem>
                  <SelectItem value="deep-learning">Deep Learning</SelectItem>
                  <SelectItem value="nlp">Natural Language Processing</SelectItem>
                  <SelectItem value="computer-vision">Computer Vision</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Time Available</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Duration</SelectItem>
                  <SelectItem value="quick">Quick Read (5-15 min)</SelectItem>
                  <SelectItem value="medium">Medium Read (15-30 min)</SelectItem>
                  <SelectItem value="deep">Deep Dive (30+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Smart Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Discovery Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personalized" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>For You</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="paths" className="flex items-center space-x-2">
            <Route className="w-4 h-4" />
            <span>Learning Paths</span>
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex items-center space-x-2">
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </TabsTrigger>
        </TabsList>

        {/* Personalized Recommendations */}
        <TabsContent value="personalized">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Personalized for You</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode('grid')}>
                  Grid
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>
                  List
                </Button>
              </div>
            </div>
            
            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {recommendations?.map((rec: PersonalizedRecommendation) => (
                  <Card key={rec.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getRecommendationIcon(rec.type)}
                          <Badge className={getTypeColor(rec.type)}>
                            {rec.type}
                          </Badge>
                        </div>
                        <Badge className={getDifficultyColor(rec.difficulty)}>
                          {rec.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        <Link to={`/app/terms/${rec.termId}`} className="hover:text-blue-600">
                          {rec.termName}
                        </Link>
                      </CardTitle>
                      <CardDescription>{rec.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          💡 {rec.reason}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{rec.estimatedReadTime} min read</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{Math.round(rec.confidence * 100)}% match</span>
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {rec.categories.slice(0, 3).map(category => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button className="w-full" size="sm">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Start Learning
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Trending Topics */}
        <TabsContent value="trending">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Trending in AI/ML</h2>
            
            {loadingTrending ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {trendingTopics?.map((topic: TrendingTopic, index: number) => (
                  <Card key={topic.termId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <Link to={`/app/terms/${topic.termId}`} className="text-lg font-semibold hover:text-blue-600">
                              {topic.termName}
                            </Link>
                            <p className="text-sm text-gray-600">{topic.trendReason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-semibold">+{topic.weeklyGrowth}%</span>
                          </div>
                          <p className="text-sm text-gray-500">{topic.viewCount.toLocaleString()} views</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Discovery Paths */}
        <TabsContent value="paths">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Guided Learning Paths</h2>
            
            {loadingPaths ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {discoveryPaths?.map((path: DiscoveryPath) => (
                  <Card key={path.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                        <Badge variant="outline">{path.type}</Badge>
                      </div>
                      <CardTitle>{path.name}</CardTitle>
                      <CardDescription>{path.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{path.termIds.length} concepts</span>
                          <span>{formatTime(path.estimatedTime)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Your Progress</span>
                            <span>{path.userProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${path.userProgress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {path.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button className="w-full">
                          {path.userProgress > 0 ? 'Continue Path' : 'Start Path'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Advanced Exploration */}
        <TabsContent value="explore">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Advanced Exploration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <CardTitle>Knowledge Graph</CardTitle>
                  </div>
                  <CardDescription>
                    Explore concepts in an interactive 3D knowledge graph
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Launch 3D Explorer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <CardTitle>Surprise Me</CardTitle>
                  </div>
                  <CardDescription>
                    Discover unexpected connections and hidden gems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Find Surprises
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <CardTitle>Concept Radar</CardTitle>
                  </div>
                  <CardDescription>
                    Visual analysis of concept relationships and importance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open Radar
                    <Eye className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}