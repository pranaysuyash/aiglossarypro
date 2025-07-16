import {
  AlertTriangle,
  Archive,
  Check,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/common-props';

interface FileUpload {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

interface DragDropUploaderProps extends BaseComponentProps {
  onUploadComplete?: (results: any[]) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  enableCompression?: boolean;
  showPreview?: boolean;
}

export default function DragDropUploader({
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['.csv', '.json', '.txt'], // Removed Excel support - using AI generation instead
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  enableCompression = false,
  showPreview = true,
  className,
  id,
  children,
}: DragDropUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { announce } = useLiveRegion();
  const prevErrorRef = useRef<string | null>(null);

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Announce error changes to screen readers
  React.useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      const errorCount = error.split('\n').length;
      announce(`File upload errors: ${errorCount} validation issues found`, 'assertive');
      prevErrorRef.current = error;
    } else if (!error && prevErrorRef.current) {
      prevErrorRef.current = null;
    }
  }, [error, announce]);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize) {
        return `File size exceeds maximum allowed size (${Math.round(maxFileSize / (1024 * 1024))}MB)`;
      }

      // Check file type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedTypes.includes(fileExtension)) {
        return `File type not supported. Allowed types: ${acceptedTypes.join(', ')}`;
      }

      // Check for suspicious file names
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|scr|pif|vbs|js)$/i,
        /^\./, // Hidden files
        /[<>:"|?*]/, // Invalid characters
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(file.name)) {
          return 'File name contains invalid or suspicious characters';
        }
      }

      return null;
    },
    [acceptedTypes, maxFileSize]
  );

  // Handle file selection
  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: FileUpload[] = [];
      const errors: string[] = [];

      // Convert FileList to Array
      const filesArray = Array.from(fileList);

      // Check max files limit
      if (files.length + filesArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed. Please remove some files before adding more.`);
        return;
      }

      filesArray.forEach(file => {
        const validationError = validateFile(file);

        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          // Check for duplicates
          const isDuplicate = files.some(
            f => f.file.name === file.name && f.file.size === file.size
          );
          if (!isDuplicate) {
            newFiles.push({
              id: generateId(),
              file,
              status: 'pending',
              progress: 0,
            });
          } else {
            errors.push(`${file.name}: Duplicate file`);
          }
        }
      });

      if (errors.length > 0) {
        const errorMessage = errors.join('\n');
        setError(errorMessage);
        // Announce file validation errors
        announce(`File validation errors: ${errors.length} files have issues`, 'assertive');
      } else {
        setError(null);
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    },
    [
      files,
      maxFiles,
      validateFile, // Announce file validation errors
      announce,
      generateId,
    ]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  // File input change handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {return;}

    setUploading(true);
    setError(null);

    const uploadPromises = files
      .filter(f => f.status === 'pending')
      .map(async fileUpload => {
        try {
          // Update status to uploading
          setFiles(prev =>
            prev.map(f => (f.id === fileUpload.id ? { ...f, status: 'uploading', progress: 0 } : f))
          );

          const formData = new FormData();
          formData.append('file', fileUpload.file);

          if (enableCompression) {
            formData.append('compress', 'true');
          }

          // Create XMLHttpRequest for progress tracking
          const xhr = new XMLHttpRequest();

          return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', e => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles(prev => prev.map(f => (f.id === fileUpload.id ? { ...f, progress } : f)));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                try {
                  const result = JSON.parse(xhr.responseText);
                  setFiles(prev =>
                    prev.map(f =>
                      f.id === fileUpload.id
                        ? { ...f, status: 'completed', progress: 100, result }
                        : f
                    )
                  );
                  resolve(result);
                } catch (_e) {
                  const error = 'Failed to parse response';
                  setFiles(prev =>
                    prev.map(f => (f.id === fileUpload.id ? { ...f, status: 'error', error } : f))
                  );
                  reject(new Error(error));
                }
              } else {
                const error = `Upload failed with status ${xhr.status}`;
                setFiles(prev =>
                  prev.map(f => (f.id === fileUpload.id ? { ...f, status: 'error', error } : f))
                );
                reject(new Error(error));
              }
            });

            xhr.addEventListener('error', () => {
              const error = 'Network error during upload';
              setFiles(prev =>
                prev.map(f => (f.id === fileUpload.id ? { ...f, status: 'error', error } : f))
              );
              reject(new Error(error));
            });

            xhr.open('POST', '/api/s3/upload');
            xhr.send(formData);
          });
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error?.message : 'Upload failed';
          setFiles(prev =>
            prev.map(f =>
              f.id === fileUpload.id ? { ...f, status: 'error', error: errorMessage } : f
            )
          );
          throw error;
        }
      });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      const failedUploads = results.filter(r => r.status === 'rejected');

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(r => (r as PromiseRejectedResult).reason.message);
        setError(`Some uploads failed: ${errorMessages.join(', ')}`);

        if (onUploadError) {
          onUploadError(errorMessages.join(', '));
        }
      }

      if (successfulResults.length > 0 && onUploadComplete) {
        onUploadComplete(successfulResults);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error?.message : 'Upload failed';
      setError(errorMessage);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  }, [files, enableCompression, onUploadComplete, onUploadError]);

  // Get file icon
  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
      case 'json':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'gz':
      case 'zip':
        return <Archive className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: FileUpload['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'uploading':
        return (
          <Badge variant="outline">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Uploading
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  const pendingFiles = files.filter(f => f.status === 'pending');
  const uploadingFiles = files.filter(f => f.status === 'uploading');
  const completedFiles = files.filter(f => f.status === 'completed');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <div id={id} className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <Upload
              className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`}
            />
            <h3 className="text-lg font-medium mb-2">
              {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
            <p className="text-xs text-gray-400 mb-4">
              Supported formats: {acceptedTypes.join(', ')} • Max size:{' '}
              {Math.round(maxFileSize / (1024 * 1024))}MB • Max files: {maxFiles}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Files ({files.length})</h3>
              <div className="flex space-x-2">
                {pendingFiles.length > 0 && (
                  <Button onClick={uploadFiles} disabled={uploading} size="sm">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={clearFiles} variant="outline" size="sm" disabled={uploading}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold">{pendingFiles.length}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold">{uploadingFiles.length}</div>
                <div className="text-xs text-gray-500">Uploading</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-bold">{completedFiles.length}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="text-lg font-bold">{errorFiles.length}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>

            {/* File Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map(fileUpload => (
                <div
                  key={fileUpload.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  {getFileIcon(fileUpload.file.name)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
                      {getStatusBadge(fileUpload.status)}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileUpload.file.size)}
                      </p>

                      {fileUpload.status === 'uploading' && (
                        <span className="text-xs text-gray-500">{fileUpload.progress}%</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fileUpload.status === 'uploading' && (
                      <Progress value={fileUpload.progress} className="mt-1 h-1" />
                    )}

                    {/* Error Message */}
                    {fileUpload.status === 'error' && fileUpload.error && (
                      <p className="text-xs text-red-600 mt-1">{fileUpload.error}</p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    onClick={() => removeFile(fileUpload.id)}
                    variant="ghost"
                    size="sm"
                    disabled={uploading && fileUpload.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Options */}
      {showPreview && files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Upload Options</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableCompression}
                  onChange={_e => {
                    // This would need to be passed from parent component
                    // or managed in state if compression is toggleable
                  }}
                  disabled={uploading}
                />
                <span className="text-sm">Enable compression for large files</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}
      {children}
    </div>
  );
}
