import { Activity, ChevronRight, Search } from 'lucide-react';
import React from 'react';

interface AdminHeaderProps {
  currentView: string;
  currentSection: string;
  onSearch?: (query: string) => void;
}

export default function AdminHeader({ currentView, currentSection, onSearch }: AdminHeaderProps) {
  const getBreadcrumbs = () => {
    const sectionNames: Record<string, string> = {
      dashboard: 'Dashboard',
      content: 'Content Operations',
      'ai-tools': 'AI Tools',
      analytics: 'Analytics & Monitoring',
      administration: 'Administration',
    };

    const viewNames: Record<string, string> = {
      dashboard: 'Dashboard',
      'content-overview': 'Content Overview',
      'content-import': 'Import & Export',
      'content-analytics': 'Content Analytics',
      'content-moderation': 'Content Moderation',
      'ai-generation': 'Content Generation',
      'ai-batch': 'Batch Operations',
      'ai-quality': 'Quality Evaluation',
      'ai-comparison': 'Model Comparison',
      'ai-templates': 'Templates',
      'analytics-performance': 'Performance Dashboard',
      'analytics-costs': 'Cost Tracking',
      'analytics-quality': 'Quality Metrics',
      'analytics-advanced': 'Advanced Analytics',
      'admin-users': 'User Management',
      'admin-system': 'System Settings',
      'admin-emergency': 'Emergency Controls',
      'admin-newsletter': 'Newsletter',
      'admin-s3': 'File Browser',
    };

    if (currentView === 'dashboard') {
      return ['Admin', 'Dashboard'];
    }

    return [
      'Admin',
      sectionNames[currentSection] || currentSection,
      viewNames[currentView] || currentView,
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                <span
                  className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search admin..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onChange={e => onSearch?.(e.target.value)}
            />
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <Activity className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
        </div>
      </div>
    </div>
  );
}
