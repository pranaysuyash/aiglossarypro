import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Plus, Command, Eye, Edit, MoreHorizontal, 
  Sparkles, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Term {
  id: string;
  name: string;
  shortDefinition?: string;
  category: string;
  status: 'verified' | 'unverified' | 'flagged';
  quality: number;
  aiGenerated: boolean;
  updated: string;
}

interface ContentOverviewProps {
  onTermSelect?: (term: Term) => void;
  onBulkAction?: (action: string, termIds: string[]) => void;
}

export default function ContentOverview({ onTermSelect, onBulkAction }: ContentOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set('search', searchQuery);
  if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
  if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
  queryParams.set('limit', '50'); // Show more terms for admin view

  // Fetch terms with filtering
  const { data: termsData, isLoading } = useQuery<{ terms: Term[], total: number }>({
    queryKey: ['/api/admin/terms', { search: searchQuery, category: selectedCategory, status: selectedStatus }],
    queryFn: async () => {
      const response = await fetch(`/api/admin/terms?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch terms');
      }
      
      return response.json();
    },
    enabled: !!user?.token,
  });

  // Fetch categories for filter
  const { data: categories } = useQuery<string[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.json();
    },
    enabled: !!user?.token,
  });

  const handleTermClick = (term: Term) => {
    setSelectedTerm(term);
    onTermSelect?.(term);
  };

  const handleTermSelect = (termId: string, selected: boolean) => {
    setSelectedTerms(prev => 
      selected 
        ? [...prev, termId]
        : prev.filter(id => id !== termId)
    );
  };

  // Bulk action mutations
  const bulkVerifyMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      const response = await fetch('/api/admin/terms/bulk-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ termIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify terms');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      setSelectedTerms([]);
    },
  });

  const bulkFlagMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      const response = await fetch('/api/admin/terms/bulk-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ termIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to flag terms');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      setSelectedTerms([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      const response = await fetch('/api/admin/terms/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ termIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete terms');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      setSelectedTerms([]);
    },
  });

  const bulkQualityCheckMutation = useMutation({
    mutationFn: async (termIds: string[]) => {
      const response = await fetch('/api/admin/terms/bulk-quality-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ termIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run quality check');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      setSelectedTerms([]);
    },
  });

  const handleBulkAction = async (action: string) => {
    if (selectedTerms.length === 0) return;

    try {
      switch (action) {
        case 'verify':
          await bulkVerifyMutation.mutateAsync(selectedTerms);
          break;
        case 'flag':
          await bulkFlagMutation.mutateAsync(selectedTerms);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedTerms.length} terms? This action cannot be undone.`)) {
            await bulkDeleteMutation.mutateAsync(selectedTerms);
          }
          break;
        case 'quality-check':
          await bulkQualityCheckMutation.mutateAsync(selectedTerms);
          break;
      }
      onBulkAction?.(action, selectedTerms);
    } catch (error) {
      // Handle bulk action error silently
      // You might want to show a toast notification here
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      verified: 'bg-green-100 text-green-800',
      unverified: 'bg-yellow-100 text-yellow-800',
      flagged: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'bg-green-500';
    if (quality >= 80) return 'bg-blue-500';
    if (quality >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredTerms = termsData?.terms || [];
  const totalTerms = termsData?.total || 0;

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
          <h2 className="text-2xl font-bold text-gray-900">Content Overview</h2>
          <p className="text-gray-600">Manage and moderate your glossary content</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedTerms.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedTerms.length} selected</span>
              <select 
                onChange={(e) => handleBulkAction(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                defaultValue=""
              >
                <option value="" disabled>Bulk Actions</option>
                <option value="verify">Verify</option>
                <option value="flag">Flag</option>
                <option value="delete">Delete</option>
                <option value="quality-check">Quality Check</option>
              </select>
            </div>
          )}
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Term
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search terms, definitions, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories?.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex space-x-6">
        {/* Terms Table */}
        <div className={`bg-white rounded-lg border overflow-hidden ${selectedTerm ? 'flex-1' : 'w-full'}`}>
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Terms ({totalTerms})</h3>
              <div className="flex items-center space-x-2">
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  <Command className="w-4 h-4 inline mr-1" />
                  Bulk Actions
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedTerms.length === filteredTerms.length}
                      onChange={(e) => setSelectedTerms(
                        e.target.checked ? filteredTerms.map(t => t.id) : []
                      )}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTerms.map((term) => (
                  <tr 
                    key={term.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedTerm?.id === term.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleTermClick(term)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedTerms.includes(term.id)}
                        onChange={(e) => handleTermSelect(term.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{term.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {term.shortDefinition}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {term.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(term.status)}`}>
                        {term.status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {term.status === 'flagged' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {term.status === 'unverified' && <Clock className="w-3 h-3 mr-1" />}
                        {term.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${getQualityColor(term.quality)}`}
                            style={{ width: `${term.quality}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{term.quality}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {term.aiGenerated ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {term.updated}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Term Details Panel */}
        {selectedTerm && (
          <div className="w-80 bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Term Details</h3>
              <button 
                onClick={() => setSelectedTerm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Name</div>
                <div className="text-lg font-semibold">{selectedTerm.name}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Definition</div>
                <div className="text-sm text-gray-600">{selectedTerm.shortDefinition}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Category</div>
                <div className="text-sm">{selectedTerm.category}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Quality Score</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full ${getQualityColor(selectedTerm.quality)}`}
                      style={{ width: `${selectedTerm.quality}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{selectedTerm.quality}%</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTerm.status)}`}>
                  {selectedTerm.status}
                </span>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Edit Content
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Actions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}