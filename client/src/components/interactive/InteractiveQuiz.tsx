import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Clock,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'multiple-select';
  options?: string[];
  correctAnswer: string | string[] | number;
  explanation?: string;
  points?: number;
}

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  timeLimit?: number; // in seconds
  showExplanations?: boolean;
  allowRetry?: boolean;
  onComplete?: (result: QuizResult) => void;
  className?: string;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  answers: {
    questionId: string;
    userAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }[];
}

export default function InteractiveQuiz({
  questions,
  title = 'Quiz',
  description,
  timeLimit,
  showExplanations = true,
  allowRetry = true,
  onComplete,
  className = ''
}: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit || 0);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timeLimit && timeRemaining > 0 && !isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLimit, timeRemaining, isCompleted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const isCorrectAnswer = (question: QuizQuestion, userAnswer: string | string[]): boolean => {
    if (question.type === 'multiple-select') {
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
      return correctAnswers.length === userAnswersArray.length &&
             correctAnswers.every(answer => userAnswersArray.includes(answer.toString()));
    }
    
    return userAnswer.toString().toLowerCase().trim() === 
           question.correctAnswer.toString().toLowerCase().trim();
  };

  const calculateResult = (): QuizResult => {
    const answers = questions.map(question => {
      const userAnswer = userAnswers[question.id] || '';
      const isCorrect = isCorrectAnswer(question, userAnswer);
      const points = isCorrect ? (question.points || 1) : 0;

      return {
        questionId: question.id,
        userAnswer,
        isCorrect,
        points
      };
    });

    const score = answers.reduce((total, answer) => total + answer.points, 0);
    const maxScore = questions.reduce((total, question) => total + (question.points || 1), 0);
    const percentage = (score / maxScore) * 100;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return {
      score,
      totalQuestions,
      percentage,
      timeSpent,
      answers
    };
  };

  const handleCompleteQuiz = () => {
    const quizResult = calculateResult();
    setResult(quizResult);
    setIsCompleted(true);
    setShowResults(true);
    
    if (onComplete) {
      onComplete(quizResult);
    }

    toast({
      title: 'Quiz completed!',
      description: `You scored ${quizResult.score}/${questions.length} (${Math.round(quizResult.percentage)}%)`,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setResult(null);
    setStartTime(Date.now());
    setTimeRemaining(timeLimit || 0);
    setShowResults(false);
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = userAnswers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={userAnswer as string || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="mt-4"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={userAnswer as string || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'fill-blank':
        return (
          <Input
            value={userAnswer as string || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="mt-4"
          />
        );

      case 'multiple-select':
        return (
          <div className="mt-4 space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(userAnswer) ? userAnswer.includes(option) : false}
                  onCheckedChange={(checked) => {
                    const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
                    if (checked) {
                      handleAnswerChange(question.id, [...currentAnswers, option]);
                    } else {
                      handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!result) return null;

    const getScoreColor = (percentage: number) => {
      if (percentage >= 80) return 'text-green-600 dark:text-green-400';
      if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.percentage)}`}>
            {Math.round(result.percentage)}%
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            You scored {result.score} out of {result.totalQuestions} questions correctly
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Time spent: {formatTime(result.timeSpent)}
          </p>
        </div>

        {showExplanations && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Review Your Answers</h4>
            {questions.map((question, index) => {
              const answer = result.answers.find(a => a.questionId === question.id);
              if (!answer) return null;

              return (
                <Card key={question.id} className="border-l-4 border-l-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Your answer: <span className="font-medium">{Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer}</span>
                        </p>
                        {!answer.isCorrect && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                            Correct answer: <span className="font-medium">
                              {Array.isArray(question.correctAnswer) 
                                ? question.correctAnswer.join(', ') 
                                : question.correctAnswer}
                            </span>
                          </p>
                        )}
                        {question.explanation && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-2">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {allowRetry && (
          <div className="flex justify-center">
            <Button onClick={handleRetry} className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (showResults) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title} - Results</CardTitle>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge variant="outline">
                {currentQuestionIndex + 1} of {totalQuestions}
              </Badge>
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {timeLimit && timeRemaining > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeRemaining <= 60 ? 'text-red-500 font-medium' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">
            {currentQuestion.question}
          </h3>
          {renderQuestion(currentQuestion)}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={!userAnswers[currentQuestion.id]}
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Complete Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}