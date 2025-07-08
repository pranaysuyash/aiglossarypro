import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import S3FileBrowser from "@/components/S3FileBrowser";
import { AIAdminDashboard } from "@/components/AIAdminDashboard";
import AdminNewsletterDashboard from "@/pages/admin/AdminNewsletterDashboard";
import AdminContactsDashboard from "@/pages/admin/AdminContactsDashboard";
import UserManagementDashboard from "@/components/admin/UserManagementDashboard";
import ContentImportDashboard from "@/components/admin/ContentImportDashboard";
import ContentModerationDashboard from "@/components/admin/ContentModerationDashboard";
import EnhancedContentGeneration from "@/components/admin/EnhancedContentGeneration";
import TemplateManagement from "@/components/admin/TemplateManagement";
import GenerationStatsDashboard from "@/components/admin/GenerationStatsDashboard";
import { ModelComparison } from "@/components/admin/ModelComparison";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  
  // Make a test query for categories to check admin status
  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!isAuthenticated,
    retry: false
  });
  
  const isAdmin = !isAdminLoading && adminData && !(adminData as any)?.error;
  
  // For simplicity during development, allow all authenticated users to access the admin panel
  const hasAccess = isAuthenticated;
  
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p>Please log in to access admin features.</p>
      </div>
    );
  }
  
  if (isAdminLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <Tabs defaultValue="enhanced-generation" className="mb-8">
        <TabsList className="mb-4 grid grid-cols-5 lg:grid-cols-11">
          <TabsTrigger value="enhanced-generation">Enhanced AI</TabsTrigger>
          <TabsTrigger value="model-comparison">Model Compare</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generation-stats">AI Stats</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="s3">S3 Files</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="ai">AI Legacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enhanced-generation" className="mt-4">
          <EnhancedContentGeneration />
        </TabsContent>
        
        <TabsContent value="model-comparison" className="mt-4">
          <ModelComparison />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-4">
          <TemplateManagement />
        </TabsContent>
        
        <TabsContent value="generation-stats" className="mt-4">
          <GenerationStatsDashboard />
        </TabsContent>
        
        <TabsContent value="import" className="mt-4">
          <ContentImportDashboard />
        </TabsContent>
        
        <TabsContent value="content" className="mt-4">
          <ContentModerationDashboard />
        </TabsContent>
        
        <TabsContent value="users" className="mt-4">
          <UserManagementDashboard />
        </TabsContent>
        
        <TabsContent value="s3" className="mt-4">
          <S3FileBrowser />
        </TabsContent>
        
        <TabsContent value="newsletter" className="mt-4">
          <AdminNewsletterDashboard />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <AdminContactsDashboard />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AIAdminDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}