import {
  AlertTriangle,
  BarChart3,
  Code,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilePreviewProps {
  fileKey: string;
  fileName: string;
  fileSize: number;
  contentType?: string;
  onClose?: () => void;
  onDownload?: () => void;
}

interface PreviewData {
  type: 'excel' | 'csv' | 'json' | 'text' | 'unsupported';
  data?: any;
  headers?: string[];
  rows?: any[][];
  preview?: string;
  metadata?: {
    sheets?: string[];
    totalRows?: number;
    totalColumns?: number;
    estimatedSize?: string;
  };
}

export default function FilePreview({
  fileKey,
  fileName,
  fileSize,
  contentType,
  onClose,
  onDownload,
}: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  const getFileType = (fileName: string, _contentType?: string): PreviewData['type'] => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'txt':
        return 'text';
      default:
        return 'unsupported';
    }
  };

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const fileType = getFileType(fileName, contentType);

      if (fileType === 'unsupported') {
        setPreviewData({
          type: 'unsupported',
          preview: 'File type not supported for preview',
        });
        setLoading(false);
        return;
      }

      // Get presigned URL for file access
      const urlResponse = await fetch('/api/s3/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: fileKey,
          operation: 'getObject',
          expiresIn: 300, // 5 minutes
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get file access URL');
      }

      const { url } = await urlResponse.json();

      // Fetch file content
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file content');
      }

      const content = await fileResponse.text();

      // Process based on file type
      let preview: PreviewData;

      switch (fileType) {
        case 'csv':
          preview = await processCSVPreview(content);
          break;
        case 'json':
          preview = await processJSONPreview(content);
          break;
        case 'text':
          preview = await processTextPreview(content);
          break;
        case 'excel':
          // For Excel files, we'd need a different approach since they're binary
          preview = {
            type: 'excel',
            preview:
              'Excel file preview requires server-side processing. Use the download option to view the full file.',
            metadata: {
              estimatedSize: formatFileSize(fileSize),
            },
          };
          break;
        default:
          preview = {
            type: 'unsupported',
            preview: 'File type not supported for preview',
          };
      }

      setPreviewData(preview);
    } catch (err) {
      console.error('Error loading file preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const processCSVPreview = async (content: string): Promise<PreviewData> => {
    const lines = content.split('\n').filter((line) => line.trim());
    const headers = lines[0]?.split(',').map((h) => h.trim().replace(/"/g, '')) || [];
    const rows = lines
      .slice(1, 11)
      .map((line) => line.split(',').map((cell) => cell.trim().replace(/"/g, '')));

    return {
      type: 'csv',
      headers,
      rows,
      preview: lines.slice(0, 10).join('\n'),
      metadata: {
        totalRows: lines.length - 1,
        totalColumns: headers.length,
        estimatedSize: formatFileSize(content.length),
      },
    };
  };

  const processJSONPreview = async (content: string): Promise<PreviewData> => {
    try {
      const data = JSON.parse(content);
      const preview = JSON.stringify(data, null, 2);

      // Truncate if too long
      const truncatedPreview =
        preview.length > 2000 ? `${preview.substring(0, 2000)}\n... (truncated)` : preview;

      return {
        type: 'json',
        data,
        preview: truncatedPreview,
        metadata: {
          estimatedSize: formatFileSize(content.length),
        },
      };
    } catch (_err) {
      return {
        type: 'json',
        preview: 'Invalid JSON format',
        metadata: {
          estimatedSize: formatFileSize(content.length),
        },
      };
    }
  };

  const processTextPreview = async (content: string): Promise<PreviewData> => {
    const lines = content.split('\n');
    const preview = lines.slice(0, 50).join('\n');
    const truncatedPreview =
      preview.length > 2000 ? `${preview.substring(0, 2000)}\n... (truncated)` : preview;

    return {
      type: 'text',
      preview: truncatedPreview,
      metadata: {
        totalRows: lines.length,
        estimatedSize: formatFileSize(content.length),
      },
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = () => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
      case 'json':
        return <Code className="h-5 w-5 text-yellow-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getFileTypeBadge = () => {
    if (!previewData) return null;

    const badgeMap = {
      excel: { color: 'bg-green-100 text-green-800', label: 'Excel' },
      csv: { color: 'bg-blue-100 text-blue-800', label: 'CSV' },
      json: { color: 'bg-yellow-100 text-yellow-800', label: 'JSON' },
      text: { color: 'bg-gray-100 text-gray-800', label: 'Text' },
      unsupported: { color: 'bg-red-100 text-red-800', label: 'Unsupported' },
    };

    const badge = badgeMap[previewData.type];
    return (
      <Badge variant="outline" className={badge.color}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <CardTitle className="text-lg">{fileName}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                {getFileTypeBadge()}
                <span className="text-sm text-gray-500">{formatFileSize(fileSize)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading preview...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertTriangle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        ) : previewData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>

              {previewData.type === 'csv' && (
                <TabsTrigger value="data">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data
                </TabsTrigger>
              )}

              {previewData.metadata && (
                <TabsTrigger value="metadata">
                  <FileText className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              {previewData.type === 'unsupported' ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{previewData.preview}</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                    {previewData.preview}
                  </pre>
                </div>
              )}
            </TabsContent>

            {previewData.type === 'csv' && previewData.headers && previewData.rows && (
              <TabsContent value="data" className="mt-4">
                <div className="border rounded-lg overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {previewData.headers.map((header, index) => (
                          <th
                            key={index}
                            className="px-3 py-2 text-left font-medium text-gray-700 border-b"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 border-b text-gray-600">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.metadata?.totalRows && previewData.metadata.totalRows > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border-t">
                      Showing first 10 rows of {previewData.metadata.totalRows} total rows
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {previewData.metadata && (
              <TabsContent value="metadata" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">File Information</h4>
                    <div className="bg-gray-50 p-3 rounded border space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">File Name:</span>
                        <span className="text-sm font-medium">{fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">File Size:</span>
                        <span className="text-sm font-medium">{formatFileSize(fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm font-medium capitalize">{previewData.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Content Information</h4>
                    <div className="bg-gray-50 p-3 rounded border space-y-1">
                      {previewData.metadata.totalRows && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Rows:</span>
                          <span className="text-sm font-medium">
                            {previewData.metadata.totalRows.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {previewData.metadata.totalColumns && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Columns:</span>
                          <span className="text-sm font-medium">
                            {previewData.metadata.totalColumns}
                          </span>
                        </div>
                      )}
                      {previewData.metadata.sheets && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sheets:</span>
                          <span className="text-sm font-medium">
                            {previewData.metadata.sheets.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
}
