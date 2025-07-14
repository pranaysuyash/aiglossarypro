import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  FileText, CheckCircle, Bot, DollarSign, TrendingUp, TrendingDown,
  Plus, BarChart3, Layers, Sparkles, Clock
} from 'lucide-react';

interface DashboardMetrics {
  totalTerms: number;
  contentQuality: number;
  aiGenerated: number;
  monthlyCost: number;
  trends: {
    termsGrowth: number;
    qualityGrowth: number;
    aiGeneratedThisMonth: number;
    costChange: number;
  };
}

interface TrendData {
  month: string;
  generated: number;
  cost: number;
}

interface QualityData {
  name: string;
  value: number;
  color: string;
}

interface AdminDashboardProps {
  onQuickAction: (action: string) => void;
}

export default function AdminDashboard({ onQuickAction }: AdminDashboardProps) {
  // Fetch dashboard metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/admin/dashboard/metrics'],
    queryFn: async () => {
      // For now, return mock data. In production, this would call the API
      return {
        totalTerms: 1247,
        contentQuality: 92,
        aiGenerated: 5340,
        monthlyCost: 19.25,
        trends: {
          termsGrowth: 12,
          qualityGrowth: 5,
          aiGeneratedThisMonth: 428,
          costChange: -10
        }
      };
    }
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading } = useQuery<TrendData[]>({
    queryKey: ['/api/admin/dashboard/trends'],
    queryFn: async () => {
      // Mock trend data
      return [
        { month: 'Oct', generated: 245, cost: 12.50 },
        { month: 'Nov', generated: 312, cost: 15.80 },
        { month: 'Dec', generated: 428, cost: 21.40 },
        { month: 'Jan', generated: 385, cost: 19.25 }
      ];
    }
  });

  // Fetch quality distribution
  const { data: qualityData, isLoading: qualityLoading } = useQuery<QualityData[]>({
    queryKey: ['/api/admin/dashboard/quality'],
    queryFn: async () => {
      // Mock quality data
      return [
        { name: 'Excellent (90-100)', value: 35, color: '#10B981' },
        { name: 'Good (80-89)', value: 42, color: '#3B82F6' },
        { name: 'Average (70-79)', value: 18, color: '#F59E0B' },
        { name: 'Poor (<70)', value: 5, color: '#EF4444' }
      ];
    }
  });

  if (metricsLoading || trendLoading || qualityLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = metricsData!;
  const trends = trendData!;
  const quality = qualityData!;

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm">Total Terms</div>
              <div className="text-3xl font-bold">{metrics.totalTerms.toLocaleString()}</div>
              <div className="text-blue-100 text-sm flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{metrics.trends.termsGrowth}% this month
              </div>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 text-sm">Content Quality</div>
              <div className="text-3xl font-bold">{metrics.contentQuality}%</div>
              <div className="text-green-100 text-sm flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{metrics.trends.qualityGrowth}% this week
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-100 text-sm">AI Generated</div>
              <div className="text-3xl font-bold">{metrics.aiGenerated.toLocaleString()}</div>
              <div className="text-purple-100 text-sm flex items-center mt-1">
                <Sparkles className="w-4 h-4 mr-1" />
                {metrics.trends.aiGeneratedThisMonth} this month
              </div>
            </div>
            <Bot className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-100 text-sm">Monthly Cost</div>
              <div className="text-3xl font-bold">${metrics.monthlyCost}</div>
              <div className="text-orange-100 text-sm flex items-center mt-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                {metrics.trends.costChange}% vs last month
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Content Generation Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="generated" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Content Generated"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Quality Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={quality}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {quality.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {quality.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onQuickAction('add-term')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500" />
              <div className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Add Term</div>
            </div>
          </button>
          
          <button 
            onClick={() => onQuickAction('generate-content')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
          >
            <div className="text-center">
              <Bot className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-purple-500" />
              <div className="text-sm font-medium text-gray-600 group-hover:text-purple-600">Generate Content</div>
            </div>
          </button>
          
          <button 
            onClick={() => onQuickAction('batch-operations')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <div className="text-center">
              <Layers className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-green-500" />
              <div className="text-sm font-medium text-gray-600 group-hover:text-green-600">Batch Operations</div>
            </div>
          </button>
          
          <button 
            onClick={() => onQuickAction('view-analytics')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <div className="text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-orange-500" />
              <div className="text-sm font-medium text-gray-600 group-hover:text-orange-600">View Analytics</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-500">5 minutes ago</span>
            <span>AI generated definition for "Transformer Architecture"</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-500">12 minutes ago</span>
            <span>Quality evaluation completed for 15 terms</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-500">1 hour ago</span>
            <span>Batch import completed: 23 new terms added</span>
          </div>
        </div>
      </div>
    </div>
  );
}