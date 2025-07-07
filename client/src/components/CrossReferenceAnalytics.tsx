/**
 * Cross-Reference Analytics Dashboard
 * Visualizes term relationships, user navigation patterns, and learning pathways
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterPlot, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Network, Route, Brain, Eye, ArrowRight, RotateCcw } from 'lucide-react';
import useCrossReferenceAnalytics from '../hooks/useCrossReferenceAnalytics';
import type {
  CrossReferenceMetrics,
  ReferenceFlow,
  LearningPathway,
  CrossReferenceInsights
} from '../../../shared/types/analytics';

interface CrossReferenceAnalyticsProps {
  className?: string;
  termIds?: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CrossReferenceAnalytics: React.FC<CrossReferenceAnalyticsProps> = ({ 
  className = '', 
  termIds 
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [minFrequency, setMinFrequency] = useState(5);
  const [selectedTab, setSelectedTab] = useState('overview');

  const analytics = useCrossReferenceAnalytics();
  
  const metricsQuery = analytics.useCrossReferenceMetrics(termIds);
  const flowsQuery = analytics.useReferenceFlows(timeRange);
  const pathwaysQuery = analytics.useLearningPathways(minFrequency);
  const insightsQuery = analytics.useCrossReferenceInsights();

  const isLoading = metricsQuery.isLoading || flowsQuery.isLoading || pathwaysQuery.isLoading || insightsQuery.isLoading;
  const hasError = metricsQuery.error || flowsQuery.error || pathwaysQuery.error || insightsQuery.error;

  // Processed data for visualizations
  const hubTermsData = useMemo(() => {
    if (!metricsQuery.data) return [];
    return analytics.getHubTerms(metricsQuery.data, 0.5)
      .slice(0, 10)
      .map(term => ({
        name: term.termName.slice(0, 20),
        hubScore: Math.round(term.hubScore * 100),
        incoming: term.incomingReferences,
        outgoing: term.outgoingReferences,
        total: term.incomingReferences + term.outgoingReferences
      }));
  }, [metricsQuery.data, analytics]);

  const flowsData = useMemo(() => {
    if (!flowsQuery.data) return [];
    return flowsQuery.data
      .slice(0, 15)
      .map(flow => ({
        name: `${flow.sourceTermName} → ${flow.targetTermName}`,
        flow: flow.flowCount,
        timeGap: Math.round(flow.averageTimeGap / 60), // Convert to minutes
        bridge: flow.categoryBridge,
        completion: Math.round(flow.completionRate * 100)
      }));
  }, [flowsQuery.data]);

  const pathwayTypeData = useMemo(() => {
    if (!pathwaysQuery.data) return [];
    const typeCount = pathwaysQuery.data.reduce((acc, pathway) => {
      acc[pathway.pathwayType] = (acc[pathway.pathwayType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: Math.round((count / pathwaysQuery.data.length) * 100)
    }));
  }, [pathwaysQuery.data]);

  const effectivenessData = useMemo(() => {
    if (!pathwaysQuery.data) return [];
    return pathwaysQuery.data
      .slice(0, 10)
      .map(pathway => ({
        name: pathway.termNames.slice(0, 3).join(' → '),
        effectiveness: Math.round(pathway.learningEffectiveness * 100),
        frequency: pathway.frequency,
        completion: Math.round(pathway.completionRate * 100),
        recommendation: Math.round(pathway.recommendationScore * 100)
      }));
  }, [pathwaysQuery.data]);

  if (hasError) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load cross-reference analytics</p>
            <Button 
              variant="outline" 
              onClick={analytics.refreshAnalytics}
              className="mt-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cross-Reference Analytics</h2>
          <p className="text-gray-600">Analyze term relationships and user navigation patterns</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={analytics.refreshAnalytics}
            disabled={isLoading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="networks">Network Analysis</TabsTrigger>
          <TabsTrigger value="flows">Navigation Flows</TabsTrigger>
          <TabsTrigger value="pathways">Learning Pathways</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {insightsQuery.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Network className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total References</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insightsQuery.data.totalCrossReferences.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Reference Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(insightsQuery.data.averageReferenceScore)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Route className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Learning Pathways</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insightsQuery.data.popularLearningPathways.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Brain className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Optimal Path Length</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insightsQuery.data.learningEfficiencyMetrics.optimalPathLength}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Patterns */}
          {insightsQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Navigation Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {insightsQuery.data.navigationPatterns.map((pattern, index) => (
                    <div key={pattern.patternType} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{pattern.patternType}</h4>
                        <Badge variant="secondary">{pattern.sessionCount}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Avg Path Length:</span>
                          <span>{pattern.averagePathLength.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Depth Score:</span>
                          <span>{Math.round(pattern.knowledgeDepth * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return Rate:</span>
                          <span>{Math.round(pattern.returnRate * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Analysis Tab */}
        <TabsContent value="networks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hub Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Hub Terms</CardTitle>
                <p className="text-sm text-gray-600">
                  Terms with the highest connectivity scores
                </p>
              </CardHeader>
              <CardContent>
                {hubTermsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hubTermsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'hubScore' ? 'Hub Score' : name]}
                      />
                      <Bar dataKey="hubScore" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No hub terms data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reference Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Reference Distribution</CardTitle>
                <p className="text-sm text-gray-600">
                  Incoming vs outgoing references
                </p>
              </CardHeader>
              <CardContent>
                {hubTermsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hubTermsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="incoming" fill="#10b981" name="Incoming" />
                      <Bar dataKey="outgoing" fill="#f59e0b" name="Outgoing" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No reference data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Flows Tab */}
        <TabsContent value="flows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Followed Reference Flows</CardTitle>
              <p className="text-sm text-gray-600">
                Common navigation patterns between terms
              </p>
            </CardHeader>
            <CardContent>
              {flowsData.length > 0 ? (
                <div className="space-y-3">
                  {flowsData.slice(0, 10).map((flow, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{flow.name}</span>
                          {flow.bridge && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Cross-Category
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {flow.flow} flows • {flow.timeGap}m avg gap • {flow.completion}% completion
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-3">
                          <div className="text-sm font-bold">{flow.flow}</div>
                          <div className="text-xs text-gray-500">flows</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isLoading ? 'Loading flows...' : 'No flow data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Pathways Tab */}
        <TabsContent value="pathways" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pathway Types */}
            <Card>
              <CardHeader>
                <CardTitle>Pathway Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pathwayTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pathwayTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pathwayTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} pathways`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-250 flex items-center justify-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No pathway data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pathway Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle>Pathway Effectiveness</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Min frequency:</span>
                  <Select 
                    value={minFrequency.toString()} 
                    onValueChange={(value) => setMinFrequency(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {effectivenessData.length > 0 ? (
                  <div className="space-y-4">
                    {effectivenessData.map((pathway, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{pathway.name}</span>
                          <Badge variant="secondary">{pathway.frequency}x</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Effectiveness:</span>
                            <span>{pathway.effectiveness}%</span>
                          </div>
                          <Progress value={pathway.effectiveness} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Completion: {pathway.completion}%</span>
                            <span>Recommendation: {pathway.recommendation}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {isLoading ? 'Loading pathways...' : 'No pathway data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrossReferenceAnalytics;