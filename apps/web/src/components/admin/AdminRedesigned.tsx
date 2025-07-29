import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import React, { useState } from 'react';
// Import existing components
import { AdvancedAnalyticsDashboard } from '@/components/admin/AdvancedAnalyticsDashboard';
import { ColumnBatchOperationsDashboard } from '@/components/admin/ColumnBatchOperationsDashboard';
import ContentImportDashboard from '@/components/admin/ContentImportDashboard';
import ContentModerationDashboard from '@/components/admin/ContentModerationDashboard';
import { EmergencyStopControls } from '@/components/admin/EmergencyStopControls';
import { EnhancedContentGenerationV2 } from '@/components/admin/EnhancedContentGenerationV2';
import GenerationStatsDashboard from '@/components/admin/GenerationStatsDashboard';
import { ModelComparison } from '@/components/admin/ModelComparison';
import { QualityEvaluationDashboard } from '@/components/admin/QualityEvaluationDashboard';
import TemplateManagement from '@/components/admin/TemplateManagement';
import UserManagementDashboard from '@/components/admin/UserManagementDashboard';
import S3FileBrowser from '@/components/S3FileBrowser';
import AdminNewsletterDashboard from '@/pages/admin/AdminNewsletterDashboard';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import AdminHeader from './AdminHeader';
// Import new components
import AdminSidebar, { defaultSidebarSections } from './AdminSidebar';
import CodeExamplesManagement from './CodeExamplesManagement';
import ContentManagementTools from './ContentManagementTools';
import ContentOverview from './ContentOverview';
import { LearningPathsManagement } from './LearningPathsManagement';
import { PerformanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard';

export default function AdminRedesigned() {
  const { isAuthenticated } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeView, setActiveView] = useState('dashboard');

  // Admin auth check
  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!isAuthenticated,
    retry: false,
  });

  const hasAccess = isAuthenticated && !isAdminLoading && adminData && !(adminData as any)?.error;

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);

    if (sectionId === 'dashboard') {
      setActiveView('dashboard');
    } else {
      // Set the first item as active view
      const section = defaultSidebarSections.find(s => s.id === sectionId);
      if (section?.items && section.items.length > 0) {
        setActiveView(section.items[0].id);
      } else {
        setActiveView(sectionId);
      }
    }
  };

  const handleViewClick = (viewId: string) => {
    setActiveView(viewId);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-term':
        setActiveSection('content');
        setActiveView('content-import');
        break;
      case 'generate-content':
        setActiveSection('ai-tools');
        setActiveView('ai-generation');
        break;
      case 'batch-operations':
        setActiveSection('ai-tools');
        setActiveView('ai-batch');
        break;
      case 'view-analytics':
        setActiveSection('analytics');
        setActiveView('analytics-performance');
        break;
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboard onQuickAction={handleQuickAction} />;

      // Content Operations
      case 'content-overview':
        return <ContentOverview />;
      case 'content-management':
        return <ContentManagementTools />;
      case 'content-import':
        return <ContentImportDashboard />;
      case 'content-analytics':
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Content Analytics</h3>
            <p className="text-gray-600">Content-specific analytics will be implemented here.</p>
          </div>
        );
      case 'content-moderation':
        return <ContentModerationDashboard />;
      case 'content-code-examples':
        return <CodeExamplesManagement />;
      case 'content-learning-paths':
        return <LearningPathsManagement />;

      // AI Tools
      case 'ai-generation':
        return <EnhancedContentGenerationV2 />;
      case 'ai-batch':
        return <ColumnBatchOperationsDashboard />;
      case 'ai-quality':
        return <QualityEvaluationDashboard />;
      case 'ai-comparison':
        return <ModelComparison />;
      case 'ai-templates':
        return <TemplateManagement />;

      // Analytics & Monitoring
      case 'analytics-performance':
        return <PerformanceAnalyticsDashboard />;
      case 'analytics-costs':
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cost Tracking</h3>
            <p className="text-gray-600">AI usage cost tracking will be implemented here.</p>
          </div>
        );
      case 'analytics-quality':
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Metrics</h3>
            <p className="text-gray-600">Quality metrics dashboard will be implemented here.</p>
          </div>
        );
      case 'analytics-advanced':
        return <AdvancedAnalyticsDashboard />;
      case 'analytics-system':
        return <PerformanceAnalyticsDashboard />;

      // Administration
      case 'admin-users':
        return <UserManagementDashboard />;
      case 'admin-system':
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">System configuration settings will be implemented here.</p>
          </div>
        );
      case 'admin-emergency':
        return <EmergencyStopControls />;
      case 'admin-newsletter':
        return <AdminNewsletterDashboard />;
      case 'admin-s3':
        return <S3FileBrowser />;

      default:
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}
            </h3>
            <p className="text-gray-600">
              This section showcases the improved navigation and layout structure.
            </p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="text-gray-600">Please log in to access admin features.</p>
        </div>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        expanded={sidebarExpanded}
        activeSection={activeSection}
        activeView={activeView}
        sections={defaultSidebarSections}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        onSectionClick={handleSectionClick}
        onViewClick={handleViewClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader currentView={activeView} currentSection={activeSection} />

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
