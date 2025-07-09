import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Cloud,
  Download,
  Eye,
  FileSpreadsheet,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface S3File {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  key: string;
  stage: 'initializing' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

interface FileValidation {
  isValid: boolean;
  fileType: string;
  size: number;
  securityCheck: 'safe' | 'suspicious' | 'dangerous';
  issues: string[];
}

export default function S3FileManagerDashboard() {
  // States
  const [files, setFiles] = useState<S3File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<S3File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'lastModified'>('lastModified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, FileValidation>>({});

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time progress
  const sessionId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/s3/progress?sessionId=${sessionId}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'upload-progress' || data.type === 'bulk-upload-progress') {
        setUploadProgress((prev) => ({
          ...prev,
          [data.data.key || `file-${data.data.fileIndex}`]: data.data,
        }));
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Filter files based on search and filters
  useEffect(() => {
    let filtered = [...files];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((file) =>
        file.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter((file) => {
        const extension = file.key.split('.').pop()?.toLowerCase();
        switch (fileTypeFilter) {
          case 'excel':
            return extension === 'xlsx' || extension === 'xls';
          case 'csv':
            return extension === 'csv';
          case 'json':
            return extension === 'json';
          case 'compressed':
            return extension === 'gz' || extension === 'zip';
          default:
            return true;
        }
      });
    }

    // Sort files
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'name':
          aValue = a.key.toLowerCase();
          bValue = b.key.toLowerCase();
          break;
        default:
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredFiles(filtered);
  }, [files, searchQuery, fileTypeFilter, sortBy, sortOrder]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/s3/files');
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!files.length) return;

      setUploading(true);
      setUploadProgress({});

      try {
        const formData = new FormData();

        Array.from(files).forEach((file, _index) => {
          formData.append('files', file);
        });

        if (compressionEnabled) {
          formData.append('compress', 'true');
        }

        const response = await fetch('/api/s3/upload/bulk', {
          method: 'POST',
          headers: {
            'X-Session-ID': sessionId,
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success || result.results?.length > 0) {
          await loadFiles(); // Reload files list

          if (result.errors?.length > 0) {
            setError(
              `Upload completed with errors: ${result.errors.map((e: any) => e.error).join(', ')}`
            );
          }
        } else {
          setError(result.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress({});
      }
    },
    [sessionId, compressionEnabled, loadFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback((key: string, selected: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedFiles(new Set(filteredFiles.map((f) => f.key)));
      } else {
        setSelectedFiles(new Set());
      }
    },
    [filteredFiles]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) {
      return;
    }

    try {
      const response = await fetch('/api/s3/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: Array.from(selectedFiles),
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadFiles();
        setSelectedFiles(new Set());
      } else {
        setError(result.error || 'Bulk delete failed');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError(err instanceof Error ? err.message : 'Bulk delete failed');
    }
  }, [selectedFiles, loadFiles]);

  const handleCreateArchive = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    try {
      const response = await fetch('/api/s3/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: Array.from(selectedFiles),
          archiveName: `files_${new Date().toISOString().split('T')[0]}.zip`,
          format: 'zip',
        }),
      });

      if (response.ok) {
        // Response is the archive file itself
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `files_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Archive creation failed');
      }
    } catch (err) {
      console.error('Archive creation error:', err);
      setError(err instanceof Error ? err.message : 'Archive creation failed');
    }
  }, [selectedFiles]);

  const validateFile = useCallback(async (key: string) => {
    try {
      const response = await fetch('/api/s3/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationResults((prev) => ({
          ...prev,
          [key]: result.validation,
        }));
      }
    } catch (err) {
      console.error('File validation error:', err);
    }
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      case 'json':
        return <FileSpreadsheet className="h-4 w-4 text-yellow-500" />;
      case 'gz':
      case 'zip':
        return <Archive className="h-4 w-4 text-purple-500" />;
      default:
        return <FileSpreadsheet className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getSecurityBadge = useCallback((validation?: FileValidation) => {
    if (!validation) return null;

    switch (validation.securityCheck) {
      case 'safe':
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Safe
          </Badge>
        );
      case 'suspicious':
        return (
          <Badge variant="outline" className="text-yellow-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspicious
          </Badge>
        );
      case 'dangerous':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Dangerous
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const selectedSize = Array.from(selectedFiles).reduce((sum, key) => {
      const file = files.find((f) => f.key === key);
      return sum + (file?.size || 0);
    }, 0);

    return {
      totalFiles,
      totalSize,
      selectedFiles: selectedFiles.size,
      selectedSize,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0,
    };
  }, [files, selectedFiles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Manager</h2>
          <p className="text-muted-foreground">Manage your S3 files with advanced features</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadFiles} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">{formatFileSize(stats.totalSize)} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.selectedFiles}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats.selectedSize)} selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Size</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.averageFileSize)}</div>
            <p className="text-xs text-muted-foreground">per file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload Progress</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uploading ? `${Object.keys(uploadProgress).length}` : '0'}
            </div>
            <p className="text-xs text-muted-foreground">active uploads</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="files" className="w-full">
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="File type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="excel">Excel Files</SelectItem>
                <SelectItem value="csv">CSV Files</SelectItem>
                <SelectItem value="json">JSON Files</SelectItem>
                <SelectItem value="compressed">Compressed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastModified">Last Modified</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedFiles.size} files selected</span>
              <div className="flex gap-2 ml-auto">
                <Button onClick={handleCreateArchive} variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Files Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Files ({filteredFiles.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      selectedFiles.size === filteredFiles.length && filteredFiles.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading files...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No files found.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          Select
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          File
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          Size
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          Modified
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          Security
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredFiles.map((file) => (
                        <tr key={file.key} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedFiles.has(file.key)}
                              onCheckedChange={(checked) =>
                                handleFileSelect(file.key, checked as boolean)
                              }
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {getFileIcon(file.key)}
                              <span className="ml-2 text-sm">{file.key.split('/').pop()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{formatFileSize(file.size)}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(file.lastModified)}</td>
                          <td className="py-3 px-4">
                            {getSecurityBadge(validationResults[file.key])}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => validateFile(file.key)}
                                variant="ghost"
                                size="sm"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = `/api/s3/download/${encodeURIComponent(file.key)}`;
                                  a.download = file.key;
                                  a.click();
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Drag and drop files here or click to browse. Supports Excel, CSV, and JSON files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={dragRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum file size: 100MB. Supported formats: Excel, CSV, JSON
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Files
                    </>
                  )}
                </Button>
              </div>

              {/* Advanced Upload Options */}
              {showAdvancedOptions && (
                <div className="mt-4 p-4 border rounded-lg space-y-4">
                  <h4 className="font-medium">Upload Options</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={compressionEnabled}
                      onCheckedChange={(checked) => setCompressionEnabled(checked === true)}
                    />
                    <Label htmlFor="compression">Enable compression</Label>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Upload Progress</h4>
                  {Object.entries(uploadProgress).map(([key, progress]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{progress.key || key}</span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <Progress value={progress.percentage} />
                      <p className="text-xs text-gray-500">
                        {progress.stage}: {progress.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cleanup Tools</CardTitle>
                <CardDescription>Clean up old files and manage storage</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clean Old Files
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archive Tools</CardTitle>
                <CardDescription>Create archives of multiple files</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled={selectedFiles.size === 0}>
                  <Archive className="h-4 w-4 mr-2" />
                  Create Archive
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
