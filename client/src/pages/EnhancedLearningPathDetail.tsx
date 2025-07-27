import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Download,
  Info,
  Lock,
  PlayCircle,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { Link, useParams } from 'wouter';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/useAuth';

interface LearningPathStep {
  id: string;
  path_id: string;
  term_id: string;
  order_index: number;
  title: string;
  description: string;
  estimated_duration: number;
  content_type: string;
  resources: string[];
  is_optional: boolean;
  metadata?: {
    difficulty?: string;
    hasInteractiveElements?: boolean;
    hasImplementation?: boolean;
  };
  term?: {
    id: string;
    name: string;
    shortDefinition: string;
    category: string;
    difficultyLevel?: string;
  };
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category_id: string;
  estimated_duration: number;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  prerequisites: string[];
  learning_outcomes: string[];
  metadata?: {
    version?: string;
    last_reviewed?: string;
    author?: string;
    total_steps?: number;
  };
  created_by: string;
  view_count: number;
  enrollment_count: number;
  completion_count: number;
  average_rating: number | null;
  total_ratings: number;
  created_at: string;
  updated_at: string;
  steps?: LearningPathStep[];
  category?: {
    id: string;
    name: string;
  };
  user_progress?: {
    id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    current_step_id: string | null;
    completed_steps: number;
    total_time_spent: number;
    last_accessed_at: string;
    started_at: string;
    completed_at: string | null;
  };
}

interface StepCompletion {
  id: string;
  progress_id: string;
  step_id: string;
  completed_at: string;
  time_spent: number;
  quiz_score?: number;
  notes?: string;
}

const EnhancedLearningPathDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);

  // Fetch learning path with all details
  const {
    data: pathData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/learning-paths/${id}`, user?.id],
    enabled: !!id,
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (user) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }
      const response = await fetch(`/api/learning-paths/${id}`, { headers });
      if (!response.ok) {throw new Error('Failed to fetch learning path');}
      return response.json();
    },
  });

  const path = pathData?.data as LearningPath | undefined;

  // Fetch related terms for the sidebar
  const { data: relatedTermsData } = useQuery({
    queryKey: [`/api/learning-paths/${id}/related-terms`],
    enabled: !!path?.category_id,
    queryFn: async () => {
      const response = await fetch(`/api/terms?category=${path?.category_id}&limit=10`);
      if (!response.ok) {throw new Error('Failed to fetch related terms');}
      return response.json();
    },
  });

  // Track session time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user && path) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 60000); // Track time in minutes
    }
    return () => clearInterval(interval);
  }, [user, path]);

  const startLearningPath = async () => {
    if (!user || !path) {return;}

    try {
      const response = await fetch(`/api/learning-paths/${path.id}/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {throw new Error('Failed to enroll in learning path');}
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start learning path');
    }
  };

  const completeStep = async (stepId: string) => {
    if (!user || !path) {return;}

    try {
      const response = await fetch(`/api/learning-paths/${path.id}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_spent: sessionTime,
          notes: notes,
        }),
      });

      if (!response.ok) {throw new Error('Failed to complete step');}

      const data = await response.json();
      setNotes('');
      refetch();

      if (data.data.path_completed) {
        setShowCertificate(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to complete step');
    }
  };

  const isStepCompleted = (stepId: string) => {
    return path?.user_progress?.current_step_id
      ? path.steps?.findIndex(s => s.id === stepId) <
          path.steps?.findIndex(s => s.id === path.user_progress?.current_step_id)
      : false;
  };

  const isStepAccessible = (step: LearningPathStep, index: number) => {
    if (!path?.user_progress) {return index === 0;}
    if (step.is_optional) {return true;}

    const currentIndex =
      path.steps?.findIndex(s => s.id === path.user_progress?.current_step_id) ?? -1;
    return index <= currentIndex + 1;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      expert: 'bg-purple-100 text-purple-800',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStepTypeIcon = (contentType: string) => {
    const icons = {
      term: <BookOpen className="w-5 h-5" />,
      video: <PlayCircle className="w-5 h-5" />,
      practice: <Target className="w-5 h-5" />,
      assessment: <Trophy className="w-5 h-5" />,
    };
    return icons[contentType as keyof typeof icons] || <BookOpen className="w-5 h-5" />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const downloadCertificate = () => {
    // In a real app, this would generate a PDF certificate
    alert('Certificate download feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : 'Learning path not found'}
            </AlertDescription>
          </Alert>
          <Link to="/learning-paths" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Paths
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = path.user_progress?.progress_percentage || 0;
  const isEnrolled = !!path.user_progress;
  const isCompleted = path.user_progress?.status === 'completed';

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/learning-paths" className="mb-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Paths
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{path.name}</h1>
            <p className="text-gray-600 mb-4">{path.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getDifficultyColor(path.difficulty_level)}>
                {path.difficulty_level}
              </Badge>
              {path.is_featured && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Featured
                </Badge>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(path.estimated_duration)}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {path.enrollment_count} enrolled
              </div>
              {path.average_rating && (
                <div className="flex items-center text-sm text-gray-500">
                  <Trophy className="w-4 h-4 mr-1" />
                  {path.average_rating.toFixed(1)} ({path.total_ratings} ratings)
                </div>
              )}
            </div>

            {path.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {path.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Progress Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Your Progress
                </span>
                {isCompleted && <Award className="w-6 h-6 text-yellow-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEnrolled ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Steps completed:</span>
                      <span>
                        {path.user_progress?.completed_steps || 0} / {path.steps?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time spent:</span>
                      <span>{formatDuration(path.user_progress?.total_time_spent || 0)}</span>
                    </div>
                    {path.user_progress?.started_at && (
                      <div className="flex justify-between">
                        <span>Started:</span>
                        <span>{new Date(path.user_progress.started_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {isCompleted && (
                    <Button onClick={downloadCertificate} className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    {user ? 'Start your learning journey' : 'Sign in to track progress'}
                  </p>
                  <Button onClick={startLearningPath} className="w-full" disabled={!user}>
                    {user ? 'Start Learning Path' : 'Sign In to Start'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Prerequisites */}
              {path.prerequisites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {path.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start">
                          <Info className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                          <span className="text-sm">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Learning Outcomes */}
              {path.learning_outcomes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What You'll Learn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {path.learning_outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                          <span className="text-sm">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Path Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Path Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {path.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <Link to={`/category/${path.category.id}`}>
                        <span className="text-blue-600 hover:underline">{path.category.name}</span>
                      </Link>
                    </div>
                  )}
                  {path.metadata?.author && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created by:</span>
                      <span>{path.metadata.author}</span>
                    </div>
                  )}
                  {path.metadata?.last_reviewed && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last reviewed:</span>
                      <span>{new Date(path.metadata.last_reviewed).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total steps:</span>
                    <span>{path.steps?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Related Terms Sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {relatedTermsData?.data?.slice(0, 10).map((term: any) => (
                        <Link key={term.id} to={`/terms/${term.id}`}>
                          <div className="p-2 rounded hover:bg-gray-100 transition-colors">
                            <p className="font-medium text-sm">{term.name}</p>
                            {term.shortDefinition && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {term.shortDefinition}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          {path.steps && path.steps.length > 0 ? (
            path.steps.map((step, index) => {
              const completed = isStepCompleted(step.id);
              const accessible = isStepAccessible(step, index);
              const isCurrent = path.user_progress?.current_step_id === step.id;

              return (
                <Card
                  key={step.id}
                  className={`${isCurrent ? 'border-blue-500 bg-blue-50' : ''} ${
                    completed ? 'bg-green-50' : ''
                  } ${!accessible && !completed ? 'opacity-60' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {completed ? (
                          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                        ) : accessible ? (
                          <Circle className="w-6 h-6 text-gray-400 mr-3" />
                        ) : (
                          <Lock className="w-6 h-6 text-gray-400 mr-3" />
                        )}
                        <span className="text-sm text-gray-500 mr-2">Step {step.order_index}</span>
                        {getStepTypeIcon(step.content_type)}
                        <span className="ml-2">{step.title}</span>
                      </CardTitle>

                      <div className="flex items-center gap-2">
                        {step.is_optional && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                        {step.metadata?.difficulty && (
                          <Badge
                            className={getDifficultyColor(step.metadata.difficulty)}
                            variant="outline"
                          >
                            {step.metadata.difficulty}
                          </Badge>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(step.estimated_duration)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {step.metadata?.hasInteractiveElements && (
                      <Badge variant="secondary" className="mb-2">
                        Interactive Content
                      </Badge>
                    )}

                    {step.resources && step.resources.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Resources:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {step.resources.map((resource, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      {step.term && (
                        <Link to={`/terms/${step.term.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={!accessible && !completed}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Study Term
                          </Button>
                        </Link>
                      )}

                      {user && accessible && !completed && (
                        <div className="flex-1">
                          {isCurrent && (
                            <div className="mb-2">
                              <Textarea
                                placeholder="Add notes about this step (optional)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="mb-2"
                              />
                            </div>
                          )}
                          <Button
                            onClick={() => completeStep(step.id)}
                            className="w-full"
                            disabled={!isCurrent}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isCurrent ? 'Mark as Complete' : 'Complete Previous Steps First'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {completed && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Completed</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Alert>
              <AlertDescription>
                No curriculum steps available for this learning path yet.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recommended Reading</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "Deep Learning" by Ian Goodfellow</li>
                    <li>• "Pattern Recognition and Machine Learning" by Christopher Bishop</li>
                    <li>• "The Elements of Statistical Learning" by Hastie et al.</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Online Resources</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      •{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Fast.ai Course
                      </a>
                    </li>
                    <li>
                      •{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Stanford CS231n
                      </a>
                    </li>
                    <li>
                      •{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Papers with Code
                      </a>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Practice Projects</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Build a neural network from scratch</li>
                    <li>• Implement a CNN for image classification</li>
                    <li>• Create a sentiment analysis model</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-6 h-6 mr-2 text-yellow-500" />
                Congratulations!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You've successfully completed the {path.name} learning path!</p>
              <div className="flex gap-2">
                <Button onClick={downloadCertificate} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
                <Button
                  onClick={() => setShowCertificate(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedLearningPathDetail;
