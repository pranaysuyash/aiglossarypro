/**
 * Predictive Analytics Component
 * Displays learning outcome predictions, insights, and personalized recommendations
 */

import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Lightbulb,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import usePredictiveAnalytics from '../hooks/usePredictiveAnalytics';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface PredictiveAnalyticsProps {
  userId: string;
  className?: string | undefined;
  compact?: boolean;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  userId,
  className = '',
  compact = false,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const {
    outcomes,
    profile,
    insights,
    recommendations,
    milestones,
    isLoadingOutcomes,
    isLoadingProfile,
    isLoadingInsights,
    outcomesError,
    profileError,
    insightsError,
    refreshAll,
    getScoreColor,
    getScoreLabel,
    getSeverityColor,
    getPriorityColor,
  } = usePredictiveAnalytics(userId, {
    includeInsights: true,
    includeRecommendations: true,
    includeMilestones: true,
    timeframe: selectedTimeframe,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshAll();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;
  const formatTime = (minutes: number) => {
    if (minutes < 60) {return `${Math.round(minutes)}m`;}
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  if (outcomesError || profileError || insightsError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load predictive analytics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Compact Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Learning Insights</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing || isLoadingOutcomes}
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoadingOutcomes ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : outcomes ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <Badge variant={outcomes.predictedCompletionRate > 0.7 ? 'default' : 'secondary'}>
                    {formatPercentage(outcomes.predictedCompletionRate)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <span
                    className={`text-sm font-medium ${getScoreColor(outcomes.engagementScore)}`}
                  >
                    {getScoreLabel(outcomes.engagementScore)}
                  </span>
                </div>
                {outcomes.nextBestActions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Next Action:</p>
                    <p className="text-sm text-gray-900">{outcomes.nextBestActions[0]}</p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-purple-600" />
            Predictive Analytics
          </h2>
          <p className="text-gray-600">AI-powered insights into your learning journey</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || isLoadingOutcomes}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingOutcomes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : outcomes ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPercentage(outcomes.predictedCompletionRate)}
                        </p>
                        <p className={`text-xs ${getScoreColor(outcomes.predictedCompletionRate)}`}>
                          {getScoreLabel(outcomes.predictedCompletionRate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Est. Learning Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatTime(outcomes.estimatedLearningTime)}
                        </p>
                        <p className="text-xs text-gray-500">per topic</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Zap className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Engagement</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPercentage(outcomes.engagementScore)}
                        </p>
                        <p className={`text-xs ${getScoreColor(outcomes.engagementScore)}`}>
                          {getScoreLabel(outcomes.engagementScore)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Retention</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPercentage(outcomes.retentionProbability)}
                        </p>
                        <p className={`text-xs ${getScoreColor(outcomes.retentionProbability)}`}>
                          probability
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Alignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Difficulty Alignment</span>
                          <span className={getScoreColor(outcomes.difficultyAlignment)}>
                            {formatPercentage(outcomes.difficultyAlignment)}
                          </span>
                        </div>
                        <Progress value={outcomes.difficultyAlignment * 100} className="h-2 mt-1" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Prediction Confidence</span>
                          <span className={getScoreColor(outcomes.confidenceScore)}>
                            {formatPercentage(outcomes.confidenceScore)}
                          </span>
                        </div>
                        <Progress value={outcomes.confidenceScore * 100} className="h-2 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                        <div className="flex flex-wrap gap-1">
                          {outcomes.strengthAreas.map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-orange-700 mb-2">
                          Improvement Areas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {outcomes.improvementAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Best Actions */}
              {outcomes.nextBestActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                      Recommended Next Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {outcomes.nextBestActions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Learning Path */}
              {outcomes.recommendedLearningPath && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                      Recommended Learning Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium text-gray-900">
                      {outcomes.recommendedLearningPath}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This path is optimized for your learning style and current progress.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No analytics data available yet.</p>
              <p className="text-sm text-gray-500">Start learning to see predictions!</p>
            </div>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {isLoadingProfile ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Session</span>
                      <span className="font-medium">
                        {formatTime(profile.sessionPatterns.averageSessionLength)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sessions/Week</span>
                      <span className="font-medium">
                        {profile.sessionPatterns.sessionsPerWeek.toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Consistency Score</span>
                      <Progress
                        value={profile.sessionPatterns.consistencyScore * 100}
                        className="h-2 mt-1"
                      />
                      <span className="text-xs text-gray-500">
                        {formatPercentage(profile.sessionPatterns.consistencyScore)}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Preferred Times</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.sessionPatterns.preferredTimeSlots.map((slot, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Difficulty Level</span>
                      <Badge variant="secondary">{profile.preferredDifficulty}</Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Learning Velocity</span>
                      <span className="font-medium">
                        {profile.learningVelocity.toFixed(1)} terms/session
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Comprehension Rate</span>
                      <Progress value={profile.comprehensionRate * 100} className="h-2 mt-1" />
                      <span className="text-xs text-gray-500">
                        {formatPercentage(profile.comprehensionRate)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Session Duration</span>
                      <span className="font-medium">{profile.sessionDurationPreference} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Focus Areas */}
              <Card>
                <CardHeader>
                  <CardTitle>Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.focusAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{area}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.max(30, 100 - index * 20)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conceptual Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle>Conceptual Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.conceptualStrengths.map((strength, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No profile data available yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {isLoadingInsights ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : insights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.riskFactors.length > 0 ? (
                    <div className="space-y-3">
                      {insights.riskFactors.map((risk, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${getSeverityColor(risk.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{risk.factor}</h4>
                            <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{risk.description}</p>
                          <p className="text-xs font-medium">Mitigation: {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-green-600 text-sm">
                      No significant risk factors identified!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Opportunity Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.opportunityFactors.length > 0 ? (
                    <div className="space-y-3">
                      {insights.opportunityFactors.map((opportunity, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-green-900">{opportunity.factor}</h4>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              {opportunity.potential}
                            </Badge>
                          </div>
                          <p className="text-sm text-green-800 mb-2">{opportunity.description}</p>
                          <p className="text-xs font-medium text-green-900">
                            Action: {opportunity.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">Continue current learning approach!</p>
                  )}
                </CardContent>
              </Card>

              {/* Learning Efficiency */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    Learning Efficiency Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <Progress value={insights.learningEfficiencyScore * 100} className="h-4" />
                    </div>
                    <div className="ml-4">
                      <span
                        className={`text-lg font-bold ${getScoreColor(insights.learningEfficiencyScore)}`}
                      >
                        {formatPercentage(insights.learningEfficiencyScore)}
                      </span>
                      <p className="text-xs text-gray-500">efficiency</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Your learning efficiency measures how effectively you absorb and retain
                    information relative to time invested.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No insights available yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                      Expected improvement: {rec.expectedImprovement}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recommendations available yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          {milestones.length > 0 ? (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{milestone.milestone}</h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Probability</span>
                        <span className={getScoreColor(milestone.probability)}>
                          {formatPercentage(milestone.probability)}
                        </span>
                      </div>
                      <Progress value={milestone.probability * 100} className="h-2" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">Requirements:</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {milestone.requirements.map((req, reqIndex) => (
                          <li key={reqIndex} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No milestones predicted yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
