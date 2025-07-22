import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { queryClient } from '@/lib/queryClient';

interface ImportJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  termsProcessed: number;
  totalTerms: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export default function ContentImportDashboard() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [singleTermData, setSingleTermData] = useState({
    name: '',
    shortDefinition: '',
    definition: '',
    category: '',
    useAI: false,
  });

  // Fetch active import jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ['/api/admin/jobs/imports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/jobs/imports');
      if (!response.ok) {throw new Error('Failed to fetch import jobs');}
      return response.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'aiOptions',
        JSON.stringify({
          enableAI: true,
          mode: 'selective',
          costOptimization: true,
        })
      );

      const response = await fetch('/api/admin/import?async=true', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {throw new Error('Failed to upload file');}
      return response.json();
    },
    onSuccess: data => {
      toast({
        title: 'Import started',
        description: `Import job ${data.data.jobId} has been queued`,
      });
      setSelectedFile(null);
      refetchJobs();
    },
    onError: error => {
      toast({
        title: 'Import failed',
        description: error?.message,
        variant: 'destructive',
      });
    },
  });

  // Single term creation mutation
  const createTermMutation = useMutation({
    mutationFn: async (termData: typeof singleTermData) => {
      const response = await fetch('/api/admin/terms/create-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });

      if (!response.ok) {throw new Error('Failed to create term');}
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Term created',
        description: 'The term has been created successfully',
      });
      setSingleTermData({
        name: '',
        shortDefinition: '',
        definition: '',
        category: '',
        useAI: false,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
    },
    onError: error => {
      toast({
        title: 'Creation failed',
        description: error?.message,
        variant: 'destructive',
      });
    },
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const handleCreateSingleTerm = () => {
    createTermMutation.mutate(singleTermData);
  };

  const activeJobs = jobsData?.data || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Bulk Import</TabsTrigger>
          <TabsTrigger value="single">Single Term</TabsTrigger>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Term Import
              </CardTitle>
              <CardDescription>
                Upload Excel or CSV files to import multiple terms at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                  <p>Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports Excel (.xlsx, .xls) and CSV files
                    </p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleFileUpload} disabled={uploadFileMutation.isPending}>
                      {uploadFileMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Start Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium mb-2">Import Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automatic AI content generation for missing sections
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Real-time progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Supports files up to 50MB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automatic duplicate detection
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Single Term
              </CardTitle>
              <CardDescription>Create individual terms with optional AI assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="term-name">Term Name</Label>
                <Input
                  id="term-name"
                  value={singleTermData.name}
                  onChange={e => setSingleTermData({ ...singleTermData, name: e.target.value })}
                  placeholder="e.g., Machine Learning"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={singleTermData.category}
                  onChange={e => setSingleTermData({ ...singleTermData, category: e.target.value })}
                  placeholder="e.g., Artificial Intelligence"
                />
              </div>

              <div>
                <Label htmlFor="short-definition">Short Definition</Label>
                <Input
                  id="short-definition"
                  value={singleTermData.shortDefinition}
                  onChange={e =>
                    setSingleTermData({
                      ...singleTermData,
                      shortDefinition: e.target.value,
                    })
                  }
                  placeholder="Brief one-line definition"
                />
              </div>

              <div>
                <Label htmlFor="definition">Full Definition</Label>
                <Textarea
                  id="definition"
                  value={singleTermData.definition}
                  onChange={e =>
                    setSingleTermData({ ...singleTermData, definition: e.target.value })
                  }
                  placeholder="Detailed definition..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-ai"
                  checked={singleTermData.useAI}
                  onChange={e => setSingleTermData({ ...singleTermData, useAI: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="use-ai" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Use AI to generate additional content sections
                  </div>
                </Label>
              </div>

              {singleTermData.useAI && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    AI will automatically generate examples, applications, advantages,
                    disadvantages, and other relevant sections for this term.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateSingleTerm}
                disabled={
                  !singleTermData.name || !singleTermData.category || createTermMutation.isPending
                }
                className="w-full"
              >
                {createTermMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Term
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Import Jobs
                  </CardTitle>
                  <CardDescription>Monitor the progress of your import jobs</CardDescription>
                </div>
                <Button onClick={() => refetchJobs()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No import jobs running</div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job: ImportJob) => (
                    <div key={job.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="font-medium">{job.fileName}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">Job ID: {job.id}</div>
                        </div>
                        <Badge
                          variant={
                            job.status === 'completed'
                              ? 'default'
                              : job.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {job.status === 'processing' && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {job.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {job.status}
                        </Badge>
                      </div>

                      {job.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {job.termsProcessed} / {job.totalTerms} terms
                            </span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}

                      {job.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{job.error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="text-sm text-gray-500">
                        Started: {new Date(job.startedAt).toLocaleString()}
                        {job.completedAt && (
                          <span className="ml-2">
                            • Completed: {new Date(job.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
