import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  BookOpen, 
  ArrowLeft, 
  Target,
  Users,
  Calendar,
  Trophy
} from 'lucide-react';

interface LearningPathStep {
  id: string;
  step_order: number;
  is_optional: boolean;
  estimated_time: number;
  step_type: string;
  content: any;
  term: {
    id: string;
    name: string;
    shortDefinition: string;
  };
}

interface LearningPathDetail {
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
  steps: LearningPathStep[];
}

interface StepCompletion {
  step_id: string;
  completed_at: string;
  time_spent: number;
  notes: string;
}

const LearningPathDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [completedSteps, setCompletedSteps] = useState<StepCompletion[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (id) {
      fetchLearningPath();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user && path) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 60000); // Track time in minutes
    }
    return () => clearInterval(interval);
  }, [user, path]);

  const fetchLearningPath = async () => {
    try {
      const response = await fetch(`/api/learning-paths/${id}`);
      if (!response.ok) throw new Error('Failed to fetch learning path');
      const data = await response.json();
      setPath(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!user || !path) return;

    try {
      const response = await fetch(`/api/learning-paths/${path.id}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_spent: timeSpent,
          notes: notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete step');
      
      const data = await response.json();
      setCompletedSteps([...completedSteps, { step_id: stepId, completed_at: new Date().toISOString(), time_spent: timeSpent, notes }]);
      setNotes('');
      setTimeSpent(0);
      
      if (data.data.path_completed) {
        alert('Congratulations! You have completed this learning path!');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to complete step');
    }
  };

  const isStepCompleted = (stepId: string) => {
    return completedSteps.some(completion => completion.step_id === stepId);
  };

  const getCompletionPercentage = () => {
    if (!path) return 0;
    return Math.round((completedSteps.length / path.steps.length) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'concept': return <BookOpen className="w-5 h-5" />;
      case 'practice': return <Target className="w-5 h-5" />;
      case 'assessment': return <Trophy className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error || 'Learning path not found'}
          </div>
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

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/learning-paths" className="mb-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Paths
          </Button>
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{path.name}</h1>
            <p className="text-gray-600 mb-4">{path.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getDifficultyColor(path.difficulty_level)}>
                {path.difficulty_level}
              </Badge>
              {path.is_official && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Official
                </Badge>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(path.estimated_duration)}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {path.completion_count} completed
              </div>
            </div>

            {path.prerequisites && path.prerequisites.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Prerequisites:</h3>
                <div className="flex flex-wrap gap-2">
                  {path.prerequisites.map((prereq, index) => (
                    <Badge key={index} variant="outline">
                      {prereq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {path.learning_objectives && path.learning_objectives.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Learning Objectives:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {path.learning_objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Progress Card */}
          {user && (
            <Card className="w-full lg:w-80">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion</span>
                      <span>{getCompletionPercentage()}%</span>
                    </div>
                    <Progress value={getCompletionPercentage()} className="h-2" />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Steps completed:</span>
                      <span>{completedSteps.length} / {path.steps.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time spent:</span>
                      <span>{formatDuration(timeSpent)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Learning Steps</h2>
        
        {path.steps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const isCurrent = index === currentStep && !completed;
          
          return (
            <Card key={step.id} className={`${isCurrent ? 'border-blue-500 bg-blue-50' : ''} ${completed ? 'bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 mr-3" />
                    )}
                    <span className="text-sm text-gray-500 mr-2">Step {step.step_order}</span>
                    {getStepTypeIcon(step.step_type)}
                    <span className="ml-2">{step.term.name}</span>
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    {step.is_optional && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(step.estimated_time)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 mb-4">{step.term.shortDefinition}</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={`/terms/${step.term.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Study Term
                    </Button>
                  </Link>
                  
                  {user && !completed && (
                    <div className="flex-1">
                      <div className="mb-2">
                        <Textarea
                          placeholder="Add notes about this step (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <Button
                        onClick={() => completeStep(step.id)}
                        className="w-full"
                        disabled={!user}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
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
                    {completedSteps.find(c => c.step_id === step.id)?.notes && (
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Notes:</strong> {completedSteps.find(c => c.step_id === step.id)?.notes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!user && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Sign in to track your progress</h3>
          <p className="text-gray-600 mb-4">
            Create an account to save your progress and unlock additional features
          </p>
          <Button>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default LearningPathDetail;