import { Check, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queryClient } from '@/lib/queryClient';

interface S3File {
  key: string;
  size: number;
  lastModified: string;
}

export default function S3FileBrowser() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<S3File[]>([]);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [maxChunks, setMaxChunks] = useState<number | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the files from S3 when the component mounts
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the optimized S3 endpoint with enhanced features
        const response = await fetch(
          '/api/s3-optimized/files?sortBy=lastModified&sortOrder=desc&maxKeys=50'
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
        }

        // Check if we got HTML instead of JSON (error)
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          throw new Error('Received HTML instead of JSON. API endpoint may be misconfigured.');
        }

        const data = await response.json();
        console.log('Files API response:', data);

        if (Array.isArray(data)) {
          // Original endpoint format (/api/s3/files)
          setFiles(
            data.map(file => ({
              key: file.key,
              size: file.size,
              lastModified: file.lastModified,
            }))
          );
        } else if (data.success && Array.isArray(data.files)) {
          // New endpoint format (/api/s3/list-files)
          setFiles(data.files);
        } else {
          setError(data.message || 'Failed to fetch files');
          setFiles([]);
        }
      } catch (err) {
        console.error('Error fetching S3 files:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleSelectFile = (file: S3File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {return `${bytes} bytes`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileName = (key: string) => {
    const parts = key.split('/');
    return parts[parts.length - 1];
  };

  const handleProcessFile = async (shouldImport = false) => {
    if (!selectedFile) {return;}

    setProcessing(true);
    setResult(null);
    setError(null);

    try {
      // Build the query parameters
      const params = new URLSearchParams();
      params.append('fileKey', selectedFile.key);

      if (maxChunks) {
        params.append('maxChunks', maxChunks.toString());
      }

      // Make the API request
      const response = await fetch(`/api/s3/python-import?${params.toString()}`);

      // Check if we got HTML instead of JSON (error)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        throw new Error('Received HTML instead of JSON. API endpoint may be misconfigured.');
      }

      const data = await response.json();
      console.log('Processing response:', data);

      setResult(data);

      // If successful and we should import, invalidate the relevant queries
      if (data.success && shouldImport) {
        await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/terms/featured'] });
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setError(
        `Error: ${err instanceof Error ? err.message : 'Unknown error while processing file'}`
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>S3 File Browser</CardTitle>
          <CardDescription>Select an Excel or CSV file from your S3 bucket</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading files...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">
              <p>Error: {error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No Excel or CSV files found in your S3 bucket.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[300px] border rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                      File Name
                    </th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Size</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                      Last Modified
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {files.map(file => (
                    <tr
                      key={file.key}
                      onClick={() => handleSelectFile(file)}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedFile?.key === file.key ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-3 px-4 flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{getFileName(file.key)}</span>
                        {selectedFile?.key === file.key && (
                          <Check className="h-4 w-4 ml-2 text-green-500" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatFileSize(file.size)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(file.lastModified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Selected File:</h3>
              <p className="text-sm">{selectedFile.key}</p>
              <div className="grid gap-2 mt-4">
                <Label htmlFor="max-chunks">Max Chunks (optional)</Label>
                <Input
                  id="max-chunks"
                  type="number"
                  placeholder="Leave empty to process all"
                  value={maxChunks || ''}
                  onChange={e =>
                    setMaxChunks(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
                <p className="text-xs text-gray-500">
                  Limit the number of chunks to process. Each chunk is 100 rows. For testing, try
                  with 5-10 chunks first.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => handleProcessFile(false)}
            disabled={!selectedFile || processing}
            className="mr-2"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Process File
              </>
            )}
          </Button>
          <Button
            onClick={() => handleProcessFile(true)}
            disabled={!selectedFile || processing}
            variant="secondary"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Process & Import
              </>
            )}
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
              No results yet. Select a file and click Process.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
