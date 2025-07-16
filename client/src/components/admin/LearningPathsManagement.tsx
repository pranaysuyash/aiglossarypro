import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  GraduationCap,
  Pause,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  category_id?: string;
  prerequisites: string[];
  learning_objectives: string[];
  is_official: boolean;
  is_published: boolean;
  view_count: number;
  completion_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  steps?: LearningPathStep[];
}

interface LearningPathStep {
  id: string;
  step_order: number;
  is_optional: boolean;
  estimated_time: number;
  step_type: 'concept' | 'exercise' | 'quiz' | 'project';
  content: Record<string, unknown>;
  term?: {
    id: string;
    name: string;
    shortDefinition: string;
  };
}

interface LearningPathsManagementProps {
  onPathSelect?: (path: LearningPath) => void;
}

export default function LearningPathsManagement({ onPathSelect }: LearningPathsManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedDifficulty !== 'all') {queryParams.set('difficulty', selectedDifficulty);}
  if (selectedCategory !== 'all') {queryParams.set('category', selectedCategory);}
  queryParams.set('limit', '50');

  // Fetch learning paths
  const { data: pathsData, isLoading } = useQuery<{ data: LearningPath[]; pagination: any }>({
    queryKey: [
      '/api/learning-paths',
      { difficulty: selectedDifficulty, category: selectedCategory },
    ],
    queryFn: async () => {
      const response = await fetch(`/api/learning-paths?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch learning paths');
      }

      return response.json();
    },
    enabled: !!user?.token,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (pathId: string) => {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete learning path');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
      setSelectedPath(null);
    },
    onError: () => {
      // Handle delete error silently
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ pathId, isPublished }: { pathId: string; isPublished: boolean }) => {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ is_published: !isPublished }),
      });

      if (!response.ok) {
        throw new Error('Failed to update learning path');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
    },
  });

  const handlePathClick = (path: LearningPath) => {
    setSelectedPath(path);
    onPathSelect?.(path);
  };

  const handleDeletePath = async (pathId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this learning path? This action cannot be undone.'
      )
    ) {
      try {
        await deleteMutation.mutateAsync(pathId);
      } catch (error: any) {
        // Handle delete error silently
      }
    }
  };

  const handleTogglePublish = async (path: LearningPath) => {
    try {
      await togglePublishMutation.mutateAsync({
        pathId: path.id,
        isPublished: path.is_published,
      });
    } catch (error: any) {
      // Handle toggle error silently
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (path: LearningPath) => {
    if (path.is_published) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Pause className="w-4 h-4 text-yellow-600" />;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes}m`;}
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getCompletionRate = (path: LearningPath) => {
    if (path.view_count === 0) {return 0;}
    return Math.round((path.completion_count / path.view_count) * 100);
  };

  const filteredPaths =
    pathsData?.data?.filter(path => {
      const matchesSearch =
        !searchQuery ||
        path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'published' && path.is_published) ||
        (selectedStatus === 'draft' && !path.is_published) ||
        (selectedStatus === 'official' && path.is_official);

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
          <h2 className="text-2xl font-bold text-gray-900">Learning Paths Management</h2>
          <p className="text-gray-600">Create and manage structured learning journeys</p>
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
            Create Path
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search learning paths..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="machine-learning">Machine Learning</option>
            <option value="deep-learning">Deep Learning</option>
            <option value="nlp">Natural Language Processing</option>
            <option value="computer-vision">Computer Vision</option>
          </select>

          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="official">Official</option>
          </select>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex space-x-6">
        {/* Paths Table */}
        <div
          className={`bg-white rounded-lg border overflow-hidden ${selectedPath ? 'flex-1' : 'w-full'}`}
        >
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Learning Paths ({filteredPaths.length})</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPaths.map(path => (
                  <tr
                    key={path.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedPath?.id === path.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handlePathClick(path)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900 truncate">{path.name}</div>
                            {path.is_official && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                <Star className="w-3 h-3 mr-1" />
                                Official
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {path.description}
                          </div>
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                            <span>{path.learning_objectives?.length || 0} objectives</span>
                            <span>{path.prerequisites?.length || 0} prerequisites</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty_level)}`}
                      >
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {path.difficulty_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDuration(path.estimated_duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(path)}
                        <span className="ml-2 text-sm text-gray-600">
                          {path.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Eye className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-gray-900">{path.view_count}</span>
                          <span className="text-gray-500 ml-1">views</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-gray-900">{path.completion_count}</span>
                          <span className="text-gray-500 ml-1">completed</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-900">{getCompletionRate(path)}%</span>
                          <span className="text-gray-500 ml-1">completion rate</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Star className="w-4 h-4 mr-1 text-yellow-400" />
                          <span className="text-gray-900">{path.rating.toFixed(1)}</span>
                          <span className="text-gray-500 ml-1">rating</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleTogglePublish(path)}
                          className={`text-gray-400 hover:${path.is_published ? 'text-yellow-600' : 'text-green-600'}`}
                          title={path.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {path.is_published ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button className="text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePath(path.id)}
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

        {/* Path Details Panel */}
        {selectedPath && (
          <div className="w-96 bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Path Details</h3>
              <button
                onClick={() => setSelectedPath(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Name</div>
                <div className="text-lg font-semibold">{selectedPath.name}</div>
                {selectedPath.is_official && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 mt-1">
                    <Star className="w-3 h-3 mr-1" />
                    Official Path
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700">Description</div>
                <div className="text-sm text-gray-600">{selectedPath.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Difficulty</div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(selectedPath.difficulty_level)}`}
                  >
                    {selectedPath.difficulty_level}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Duration</div>
                  <div className="text-sm text-gray-900">
                    {formatDuration(selectedPath.estimated_duration)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700">Learning Objectives</div>
                <div className="space-y-1 mt-1">
                  {selectedPath.learning_objectives?.length > 0 ? (
                    selectedPath.learning_objectives.map((objective, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {objective}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">No objectives defined</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700">Prerequisites</div>
                <div className="space-y-1 mt-1">
                  {selectedPath.prerequisites?.length > 0 ? (
                    selectedPath.prerequisites.map((prereq, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {prereq}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">No prerequisites</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Views</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedPath.view_count}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Completions</div>
                  <div className="text-lg font-semibold text-green-600">
                    {selectedPath.completion_count}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700">Completion Rate</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getCompletionRate(selectedPath)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getCompletionRate(selectedPath)}%</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Edit Path
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  View Steps
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
