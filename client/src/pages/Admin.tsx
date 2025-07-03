import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Zap, Sparkles, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import S3FileBrowser from "@/components/S3FileBrowser";
import { AIAdminDashboard } from "@/components/AIAdminDashboard";
import AdminNewsletterDashboard from "@/pages/admin/AdminNewsletterDashboard";
import AdminContactsDashboard from "@/pages/admin/AdminContactsDashboard";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [maxChunks, setMaxChunks] = useState<number | undefined>(undefined);
  
  // AI Processing Options State
  const [aiOptions, setAiOptions] = useState({
    enableAI: false,
    mode: 'none' as 'none' | 'basic' | 'full' | 'selective',
    sections: [] as string[],
    costOptimization: true,
    processor: 'typescript' as 'typescript' | 'python' | 'hybrid',
    importStrategy: 'incremental' as 'full' | 'incremental' | 'resume'
  });

  const availableSections = [
    'definition', 'examples', 'applications', 'advantages', 'disadvantages',
    'prerequisites', 'theoretical_concepts', 'how_it_works', 'variants',
    'implementation', 'evaluation', 'ethics', 'historical_context',
    'case_studies', 'tutorials', 'tools_frameworks', 'future_directions'
  ];
  
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
      formData.append('aiOptions', JSON.stringify(aiOptions));
      
      const queryParams = new URLSearchParams();
      if (maxChunks) {
        queryParams.append('maxChunks', maxChunks.toString());
      }
      
      const response = await fetch(`/api/admin/import-advanced?${queryParams.toString()}`, {
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
          <TabsTrigger value="upload">Basic Upload</TabsTrigger>
          <TabsTrigger value="advanced">
            <Sparkles className="w-4 h-4 mr-1" />
            Advanced Processing
          </TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
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

        <TabsContent value="advanced" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* File Upload Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  File & Processing
                </CardTitle>
                <CardDescription>Configure file processing options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="advanced-file">Excel/CSV File</Label>
                  <Input
                    id="advanced-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label>Processor Type</Label>
                  <Select value={aiOptions.processor} onValueChange={(value: any) => 
                    setAiOptions(prev => ({ ...prev, processor: value }))
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript (Fast, &lt;500MB)</SelectItem>
                      <SelectItem value="python">Python (Robust, Large Files)</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Auto-detect)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Import Strategy</Label>
                  <Select value={aiOptions.importStrategy} onValueChange={(value: any) => 
                    setAiOptions(prev => ({ ...prev, importStrategy: value }))
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Replace</SelectItem>
                      <SelectItem value="incremental">Incremental Merge</SelectItem>
                      <SelectItem value="resume">Resume Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Options Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Content Generation
                </CardTitle>
                <CardDescription>Configure AI-powered content enhancement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-ai"
                    checked={aiOptions.enableAI}
                    onCheckedChange={(checked) => 
                      setAiOptions(prev => ({ ...prev, enableAI: !!checked }))
                    }
                  />
                  <Label htmlFor="enable-ai">Enable AI Content Generation</Label>
                </div>
                
                {aiOptions.enableAI && (
                  <>
                    <div>
                      <Label>AI Generation Mode</Label>
                      <Select value={aiOptions.mode} onValueChange={(value: any) => 
                        setAiOptions(prev => ({ ...prev, mode: value }))
                      }>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No AI Generation</SelectItem>
                          <SelectItem value="basic">Basic Sections Only</SelectItem>
                          <SelectItem value="full">Complete 42 Sections</SelectItem>
                          <SelectItem value="selective">Custom Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {aiOptions.mode === 'selective' && (
                      <div>
                        <Label>Select Sections to Generate</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                          {availableSections.map(section => (
                            <div key={section} className="flex items-center space-x-2">
                              <Checkbox
                                id={`section-${section}`}
                                checked={aiOptions.sections.includes(section)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAiOptions(prev => ({
                                      ...prev,
                                      sections: [...prev.sections, section]
                                    }));
                                  } else {
                                    setAiOptions(prev => ({
                                      ...prev,
                                      sections: prev.sections.filter(s => s !== section)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`section-${section}`} className="text-xs">
                                {section.replace('_', ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cost-optimization"
                        checked={aiOptions.costOptimization}
                        onCheckedChange={(checked) => 
                          setAiOptions(prev => ({ ...prev, costOptimization: !!checked }))
                        }
                      />
                      <Label htmlFor="cost-optimization">Enable Cost Optimization (85% savings)</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Status & Results Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>Current processing status and results</CardDescription>
              </CardHeader>
              <CardContent>
                {aiOptions.enableAI && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AI Processing Enabled</AlertTitle>
                    <AlertDescription>
                      Mode: <Badge variant="secondary">{aiOptions.mode}</Badge>
                      {aiOptions.mode === 'selective' && (
                        <div className="mt-2">
                          Sections: {aiOptions.sections.length} selected
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2 mb-4">
                  <Button
                    onClick={handleProcessFile}
                    disabled={!file || processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Advanced Processing
                      </>
                    )}
                  </Button>
                </div>
                
                {result && (
                  <div className="mt-4">
                    <Label>Results</Label>
                    <div className="mt-2 p-3 bg-slate-50 rounded-md text-xs max-h-48 overflow-auto">
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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