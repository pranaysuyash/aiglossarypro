import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Edit, Trash2, Eye, ThumbsUp, ThumbsDown,
  Code, Play, ExternalLink, CheckCircle, Clock,
  Languages, BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface CodeExample {
  id: string;
  term_id: string;
  title: string;
  description?: string;
  language: string;
  code: string;
  expected_output?: string;
  libraries?: Record<string, unknown>;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  example_type: 'implementation' | 'tutorial' | 'snippet' | 'full_project';
  is_runnable: boolean;
  external_url?: string;
  is_verified: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  term?: {
    name: string;
    shortDefinition: string;
  };
}

interface CodeExamplesManagementProps {
  onExampleSelect?: (example: CodeExample) => void;
}

export default function CodeExamplesManagement({ onExampleSelect }: CodeExamplesManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedExample, setSelectedExample] = useState<CodeExample | null>(null);
  const [showCreateModal] = useState(false);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedLanguage !== 'all') queryParams.set('language', selectedLanguage);
  if (selectedDifficulty !== 'all') queryParams.set('difficulty', selectedDifficulty);
  if (selectedType !== 'all') queryParams.set('type', selectedType);
  queryParams.set('limit', '50');

  // Fetch code examples
  const { data: examplesData, isLoading } = useQuery<{ data: CodeExample[], pagination: any }>({
    queryKey: ['/api/code-examples', { language: selectedLanguage, difficulty: selectedDifficulty, type: selectedType }],
    queryFn: async () => {
      const response = await fetch(`/api/code-examples?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch code examples');
      }
      
      return response.json();
    },
    enabled: !!user?.token,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (exampleId: string) => {
      const response = await fetch(`/api/code-examples/${exampleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete code example');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/code-examples'] });
      setSelectedExample(null);
    },
  });

  const handleExampleClick = (example: CodeExample) => {
    setSelectedExample(example);
    onExampleSelect?.(example);
  };

  const handleDeleteExample = async (exampleId: string) => {
    if (window.confirm('Are you sure you want to delete this code example? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(exampleId);
      } catch (error) {
        // Handle delete error silently
      }
    }
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      python: 'bg-blue-100 text-blue-800',
      javascript: 'bg-yellow-100 text-yellow-800', 
      typescript: 'bg-blue-100 text-blue-800',
      r: 'bg-green-100 text-green-800',
      sql: 'bg-purple-100 text-purple-800',
      java: 'bg-red-100 text-red-800',
      cpp: 'bg-gray-100 text-gray-800',
      go: 'bg-cyan-100 text-cyan-800',
    };
    return colors[language.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (example: CodeExample) => {
    if (example.is_verified) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const filteredExamples = examplesData?.data?.filter(example => {
    const matchesSearch = !searchQuery || 
      example.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.term?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'verified' && example.is_verified) ||
      (selectedStatus === 'unverified' && !example.is_verified);
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Code Examples Management</h2>
          <p className="text-gray-600">Manage code examples across all terms</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Example
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search examples, terms, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="r">R</option>
            <option value="sql">SQL</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="implementation">Implementation</option>
            <option value="tutorial">Tutorial</option>
            <option value="snippet">Snippet</option>
            <option value="full_project">Full Project</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex space-x-6">
        {/* Examples Table */}
        <div className={`bg-white rounded-lg border overflow-hidden ${selectedExample ? 'flex-1' : 'w-full'}`}>
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Code Examples ({filteredExamples.length})</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Example
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExamples.map((example) => (
                  <tr 
                    key={example.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedExample?.id === example.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleExampleClick(example)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Code className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{example.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {example.description}
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            {example.is_runnable && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                <Play className="w-3 h-3 mr-1" />
                                Runnable
                              </span>
                            )}
                            {example.external_url && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                External
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{example.term?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {example.term?.shortDefinition}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLanguageColor(example.language)}`}>
                        <Languages className="w-3 h-3 mr-1" />
                        {example.language}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(example.difficulty_level)}`}>
                        {example.difficulty_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(example)}
                        <span className="ml-2 text-sm text-gray-600">
                          {example.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center text-green-600">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {example.upvotes}
                        </div>
                        <div className="flex items-center text-red-600">
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {example.downvotes}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExample(example.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example Details Panel */}
        {selectedExample && (
          <div className="w-96 bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Example Details</h3>
              <button 
                onClick={() => setSelectedExample(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Title</div>
                <div className="text-lg font-semibold">{selectedExample.title}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Description</div>
                <div className="text-sm text-gray-600">{selectedExample.description || 'No description'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Language</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLanguageColor(selectedExample.language)}`}>
                    {selectedExample.language}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Difficulty</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(selectedExample.difficulty_level)}`}>
                    {selectedExample.difficulty_level}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Code Preview</div>
                <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
                  {selectedExample.code.substring(0, 200)}
                  {selectedExample.code.length > 200 && '...'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Upvotes</div>
                  <div className="flex items-center text-green-600">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {selectedExample.upvotes}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Downvotes</div>
                  <div className="flex items-center text-red-600">
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {selectedExample.downvotes}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Edit Example
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  View Full
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}