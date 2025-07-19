import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Layers,
  Settings,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';

export interface SidebarSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string | undefined }>;
  items?: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  title: string;
  badge?: string | undefined;
  icon?: React.ComponentType<{ className?: string | undefined }>;
}

interface AdminSidebarProps {
  expanded: boolean;
  activeSection: string;
  activeView: string;
  sections: SidebarSection[];
  onToggle: () => void;
  onSectionClick: (sectionId: string) => void;
  onViewClick: (viewId: string) => void;
}

export default function AdminSidebar({
  expanded,
  activeSection,
  activeView,
  sections,
  onToggle,
  onSectionClick,
  onViewClick,
}: AdminSidebarProps) {
  return (
    <div
      className={`bg-white border-r flex-shrink-0 transition-all duration-300 ${expanded ? 'w-64' : 'w-16'}`}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className={`font-bold text-xl text-gray-900 ${expanded ? 'block' : 'hidden'}`}>
            AI Glossary Pro
          </div>
          <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <ChevronRight
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {sections.map(section => (
          <div key={section.id}>
            <button
              onClick={() => onSectionClick(section.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <>
                  <span className="ml-3 flex-1">{section.title}</span>
                  {section.items && section.items.length > 0 && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeSection === section.id ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  )}
                </>
              )}
            </button>

            {/* Sub-items */}
            {expanded && section.items && activeSection === section.id && (
              <div className="ml-4 mt-1 space-y-1">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onViewClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

// Default sidebar configuration
export const defaultSidebarSections: SidebarSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    items: [],
  },
  {
    id: 'content',
    title: 'Content Operations',
    icon: FileText,
    items: [
      { id: 'content-overview', title: 'Content Overview', badge: '1.2k' },
      { id: 'content-management', title: 'Content Management', icon: Settings },
      { id: 'content-import', title: 'Import & Export' },
      { id: 'content-analytics', title: 'Content Analytics' },
      { id: 'content-moderation', title: 'Content Moderation' },
      { id: 'content-code-examples', title: 'Code Examples' },
      { id: 'content-learning-paths', title: 'Learning Paths' },
    ],
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    icon: Brain,
    items: [
      { id: 'ai-generation', title: 'Content Generation', icon: Bot },
      { id: 'ai-batch', title: 'Batch Operations', badge: '3', icon: Layers },
      { id: 'ai-quality', title: 'Quality Evaluation', icon: Activity },
      { id: 'ai-comparison', title: 'Model Comparison', icon: Zap },
      { id: 'ai-templates', title: 'Templates', icon: FileText },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Monitoring',
    icon: BarChart3,
    items: [
      { id: 'analytics-performance', title: 'System Performance', icon: Activity },
      { id: 'analytics-costs', title: 'Cost Tracking' },
      { id: 'analytics-quality', title: 'Quality Metrics' },
      { id: 'analytics-advanced', title: 'Advanced Analytics' },
      { id: 'analytics-system', title: 'Database & Pool', icon: Zap },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: Settings,
    items: [
      { id: 'admin-users', title: 'User Management', icon: Users },
      { id: 'admin-system', title: 'System Settings', icon: Settings },
      { id: 'admin-emergency', title: 'Emergency Controls', icon: Shield },
      { id: 'admin-newsletter', title: 'Newsletter', icon: FileText },
      { id: 'admin-s3', title: 'File Browser', icon: FileText },
    ],
  },
];
