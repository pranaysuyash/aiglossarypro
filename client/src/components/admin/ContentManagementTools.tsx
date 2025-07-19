/**
 * Content Management Tools
 *
 * Admin interface for bulk content operations, quality validation,
 * and AI-assisted content generation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  HardDriveDownload, 
  HardDriveUpload, 
  Play, 
  Pause, 
  Users, 
  FileUp, 
  FileDown, 
  Server, 
  Database, 
  BrainCircuit 
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ContentStats {
  totalTerms: number;
  completedTerms: number;
  missingDefinitions: number;
  missingShortDefinitions: number;
  uncategorizedTerms: number;
  lowQualityTerms: number;
  termsWithCodeExamples: number;
  termsWithInteractiveElements: number;
  averageCompleteness: number;
  qualityDistribution: Record<string, number>;
}

interface BulkOperation {
  id: string;
  type: 'generate-definitions' | 'enhance-content' | 'validate-quality' | 'categorize-terms';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt?: string;
  completedAt?: string;
  results?: any;
  errors?: string[];
}

interface ContentValidationResult {
  termId: string;
  termName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
  qualityScore: number;
}

export function ContentManagementTools() {
  const { toast } = useToast();

  // Fetch content statistics
  const { data: contentStats, isLoading: statsLoading } = useQuery<ContentStats>({
    queryKey: ['contentStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/content/stats');
      if (!response.ok) {throw new Error('Failed to fetch content stats');}
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Bulk operation mutations
  const startBulkOperation = useMutation({
    mutationFn: async ({ type, options }: { type: string; options?: any }) => {
      const response = await fetch('/api/admin/content/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, options }),
      });
      if (!response.ok) {throw new Error('Failed to start bulk operation');}
      return response.json();
    },
    onSuccess: data => {
      setBulkOperations(prev => [...prev, data.data]);
    },
  });

  const validateContent = useMutation({
    mutationFn: async (options: { scope: 'all' | 'sample'; sampleSize?: number }) => {
      const response = await fetch('/api/admin/content/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) {throw new Error('Failed to validate content');}
      return response.json();
    },
    onSuccess: data => {
      setValidationResults(data.data.results);
    },
  });

  // Poll for bulk operation status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const runningOps = bulkOperations.filter(op => op.status === 'running');

      for (const op of runningOps) {
        try {
          const response = await fetch(`/api/admin/content/bulk-operations/${op.id}`);
          if (response.ok) {
            const result = await response.json();
            setBulkOperations(prev =>
              prev.map(prevOp => (prevOp.id === op.id ? result.data : prevOp))
            );
          }
        } catch (error: any) {
          console.error('Error polling operation status:', error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [bulkOperations]);

  const handleBulkOperation = (type: string, options?: any) => {
    startBulkOperation.mutate({ type, options });
  };

  const handleValidateContent = (scope: 'all' | 'sample', sampleSize?: number) => {
    const params: { scope: 'all' | 'sample'; sampleSize?: number } = { scope };
    if (sampleSize) {
      params.sampleSize = sampleSize;
    }
    validateContent.mutate(params);
  };

  const getOperationIcon = (type: string) => {
    const icons = {
      'generate-definitions': FileText,
      'enhance-content': RefreshCw,
      'validate-quality': Check,
      'categorize-terms': Target,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      running: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management Tools</h1>
        <p className="text-gray-600">
          Manage and enhance your AI/ML glossary content with powerful automation tools
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'bulk-ops', label: 'Bulk Operations', icon: Settings },
            { id: 'validation', label: 'Quality Validation', icon: Check },
            { id: 'generation', label: 'AI Generation', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : contentStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Total Terms</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{contentStats.totalTerms}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{contentStats.completedTerms}</p>
                  <p className="text-xs text-gray-500">
                    {((contentStats.completedTerms / contentStats.totalTerms) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Missing Definitions</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {contentStats.missingDefinitions}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Avg. Completeness</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {contentStats.averageCompleteness.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Uncategorized</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {contentStats.uncategorizedTerms}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Code className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">With Code</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {contentStats.termsWithCodeExamples}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Interactive</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {contentStats.termsWithInteractiveElements}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">Low Quality</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {contentStats.lowQualityTerms}
                  </p>
                </div>
              </div>

              {/* Quality Distribution Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(contentStats.qualityDistribution).map(([quality, count]) => (
                    <div key={quality} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {quality}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / contentStats.totalTerms) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Failed to load content statistics</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Operations Tab */}
      {activeTab === 'bulk-ops' && (
        <div className="space-y-6">
          {/* Operation Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Bulk Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleBulkOperation('generate-definitions')}
                disabled={startBulkOperation.isPending}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">Generate Definitions</h4>
                  <p className="text-sm text-gray-600">Auto-generate missing term definitions</p>
                </div>
              </button>

              <button
                onClick={() => handleBulkOperation('enhance-content')}
                disabled={startBulkOperation.isPending}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">Enhance Content</h4>
                  <p className="text-sm text-gray-600">Improve existing content quality</p>
                </div>
              </button>

              <button
                onClick={() => handleBulkOperation('categorize-terms')}
                disabled={startBulkOperation.isPending}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Target className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">Categorize Terms</h4>
                  <p className="text-sm text-gray-600">
                    Auto-assign categories to uncategorized terms
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleBulkOperation('validate-quality')}
                disabled={startBulkOperation.isPending}
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Check className="w-6 h-6 text-orange-600" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">Quality Validation</h4>
                  <p className="text-sm text-gray-600">Run comprehensive quality checks</p>
                </div>
              </button>
            </div>
          </div>

          {/* Active Operations */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operation Status</h3>
            {bulkOperations.length === 0 ? (
              <p className="text-gray-600">No bulk operations running</p>
            ) : (
              <div className="space-y-4">
                {bulkOperations.slice(-5).map(operation => (
                  <div key={operation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getOperationIcon(operation.type)}
                        <span className="font-medium text-gray-900 capitalize">
                          {operation.type.replace('-', ' ')}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(operation.status)}`}
                        >
                          {operation.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {operation.processedItems}/{operation.totalItems}
                      </span>
                    </div>

                    {operation.status === 'running' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operation.progress}%` }}
                        ></div>
                      </div>
                    )}

                    {operation.errors && operation.errors.length > 0 && (
                      <div className="text-sm text-red-600 mt-2">
                        <p>Errors: {operation.errors.length}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-6">
          {/* Validation Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Validation</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleValidateContent('sample', 50)}
                disabled={validateContent.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {validateContent.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Validate Sample (50 terms)
              </button>

              <button
                onClick={() => handleValidateContent('all')}
                disabled={validateContent.isPending}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Validate All Terms
              </button>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Validation Results ({validationResults.length} terms)
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {validationResults.map(result => (
                  <div key={result.termId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{result.termName}</h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(result.severity)}`}
                        >
                          {result.severity}
                        </span>
                        <span className="text-sm text-gray-600">
                          Score: {result.qualityScore}/100
                        </span>
                      </div>
                    </div>

                    {result.issues.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Issues:</h5>
                        <ul className="text-sm text-red-600 space-y-1">
                          {result.issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Suggestions:</h5>
                        <ul className="text-sm text-blue-600 space-y-1">
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Generation Tab */}
      {activeTab === 'generation' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI-Assisted Content Generation
            </h3>
            <p className="text-gray-600 mb-6">
              Use AI to automatically generate high-quality content for your terms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Generation Options</h4>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Generate missing definitions</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Create short summaries</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Add code examples</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Generate interactive elements</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Quality Settings</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Quality Threshold</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option value="60">Standard (60%)</option>
                      <option value="70">High (70%)</option>
                      <option value="80">Premium (80%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Batch Size</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option value="10">10 terms</option>
                      <option value="25">25 terms</option>
                      <option value="50">50 terms</option>
                      <option value="100">100 terms</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors">
                <Zap className="w-4 h-4 mr-2 inline" />
                Start AI Generation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementTools;
