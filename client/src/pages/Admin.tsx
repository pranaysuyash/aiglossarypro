import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import S3FileBrowser from "@/components/S3FileBrowser";
import { AIAdminDashboard } from "@/components/AIAdminDashboard";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [maxChunks, setMaxChunks] = useState<number | undefined>(undefined);
  
  // Make a test query for categories to check admin status
  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!isAuthenticated,
    retry: false
  });
  
  const isAdmin = !isAdminLoading && adminData && !(adminData as any)?.error;
  
  // For simplicity during development, allow all authenticated users to access the admin panel
  const hasAccess = isAuthenticated;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  const handleProcessFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const queryParams = new URLSearchParams();
      if (maxChunks) {
        queryParams.append('maxChunks', maxChunks.toString());
      }
      
      const response = await fetch(`/api/admin/import?${queryParams.toString()}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error processing file:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleImportData = async () => {
    if (!file) return;
    
    setProcessing(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
      
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/terms/featured'] });
    } catch (error) {
      console.error('Error importing data:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setProcessing(false);
    }
  };
  
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
      
      <Tabs defaultValue="s3" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="s3">Import from S3</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="ai">AI Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="s3" className="mt-4">
          <S3FileBrowser />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Process Excel/CSV File</CardTitle>
                <CardDescription>Upload a file to process with Python</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file">Select Excel or CSV File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max-chunks">Max Chunks (optional)</Label>
                    <Input
                      id="max-chunks"
                      type="number"
                      placeholder="Leave empty to process all"
                      value={maxChunks || ''}
                      onChange={(e) => setMaxChunks(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <p className="text-xs text-gray-500">
                      Limit the number of chunks to process. Each chunk is 100 rows.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={handleProcessFile}
                  disabled={!file || processing}
                  className="mr-2"
                >
                  {processing ? 'Processing...' : 'Process File'}
                </Button>
                <Button 
                  onClick={handleImportData}
                  disabled={!file || processing}
                  variant="secondary"
                >
                  {processing ? 'Importing...' : 'Process & Import'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Processing results will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                {result && (
                  <div className="overflow-auto max-h-[400px]">
                    <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!result && (
                  <div className="text-center p-6 text-gray-400">
                    No results yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <AIAdminDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}