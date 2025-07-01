import type { Meta, StoryObj } from '@storybook/react';
import S3FileManagerDashboard from './S3FileManagerDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof S3FileManagerDashboard> = {
  title: 'Admin/S3FileManagerDashboard',
  component: S3FileManagerDashboard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'S3 file management dashboard for uploading, organizing, and managing content assets, data files, and media resources.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockFiles = [
  {
    id: '1',
    name: 'ai-terms-dataset.csv',
    key: 'data/ai-terms-dataset.csv',
    size: 2453760,
    type: 'text/csv',
    lastModified: '2024-01-15T10:30:00Z',
    url: 'https://s3.amazonaws.com/ai-glossary/data/ai-terms-dataset.csv',
    metadata: {
      uploadedBy: 'admin@example.com',
      description: 'Primary AI terminology dataset',
      version: '2.1',
      records: 12543,
    },
    tags: ['dataset', 'production', 'ai-terms'],
  },
  {
    id: '2',
    name: 'neural-network-diagram.svg',
    key: 'assets/diagrams/neural-network-diagram.svg',
    size: 45120,
    type: 'image/svg+xml',
    lastModified: '2024-01-14T16:45:00Z',
    url: 'https://s3.amazonaws.com/ai-glossary/assets/diagrams/neural-network-diagram.svg',
    metadata: {
      uploadedBy: 'designer@example.com',
      description: 'Interactive neural network visualization',
      category: 'diagram',
      width: 800,
      height: 600,
    },
    tags: ['diagram', 'interactive', 'neural-networks'],
  },
  {
    id: '3',
    name: 'ml-algorithms-backup.json',
    key: 'backups/2024-01/ml-algorithms-backup.json',
    size: 856340,
    type: 'application/json',
    lastModified: '2024-01-13T08:15:00Z',
    url: 'https://s3.amazonaws.com/ai-glossary/backups/2024-01/ml-algorithms-backup.json',
    metadata: {
      uploadedBy: 'system',
      description: 'Weekly backup of ML algorithms definitions',
      backupType: 'weekly',
      entries: 2341,
    },
    tags: ['backup', 'ml-algorithms', 'system'],
  },
  {
    id: '4',
    name: 'user-feedback-analysis.xlsx',
    key: 'reports/user-feedback-analysis.xlsx',
    size: 124560,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    lastModified: '2024-01-12T14:20:00Z',
    url: 'https://s3.amazonaws.com/ai-glossary/reports/user-feedback-analysis.xlsx',
    metadata: {
      uploadedBy: 'analyst@example.com',
      description: 'Monthly user feedback analysis report',
      reportPeriod: '2024-01',
      responses: 1847,
    },
    tags: ['report', 'feedback', 'analytics'],
  },
];

const mockFolders = [
  {
    name: 'data',
    key: 'data/',
    fileCount: 23,
    totalSize: 45678912,
    lastModified: '2024-01-15T10:30:00Z',
  },
  {
    name: 'assets',
    key: 'assets/',
    fileCount: 156,
    totalSize: 23456789,
    lastModified: '2024-01-14T16:45:00Z',
  },
  {
    name: 'backups',
    key: 'backups/',
    fileCount: 78,
    totalSize: 123456789,
    lastModified: '2024-01-13T08:15:00Z',
  },
  {
    name: 'reports',
    key: 'reports/',
    fileCount: 34,
    totalSize: 5678901,
    lastModified: '2024-01-12T14:20:00Z',
  },
];

const mockStorageStats = {
  totalStorage: 1024 * 1024 * 1024 * 50, // 50GB
  usedStorage: 1024 * 1024 * 1024 * 23.4, // 23.4GB
  availableStorage: 1024 * 1024 * 1024 * 26.6, // 26.6GB
  totalFiles: 1247,
  totalFolders: 45,
  monthlyUpload: 1024 * 1024 * 1024 * 3.2, // 3.2GB
  monthlyDownload: 1024 * 1024 * 1024 * 12.8, // 12.8GB
  costThisMonth: 45.67,
};

export const Default: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onFileDelete: (fileId: string) => console.log('Delete file:', fileId),
    onFileDownload: (fileId: string) => console.log('Download file:', fileId),
    onFolderCreate: (name: string) => console.log('Create folder:', name),
    onNavigateToFolder: (path: string) => console.log('Navigate to:', path),
  },
};

export const FileUploadView: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: 'data/',
    showUploadModal: true,
    uploadProgress: [
      { id: '1', name: 'new-dataset.csv', progress: 67, status: 'uploading' },
      { id: '2', name: 'image.png', progress: 100, status: 'completed' },
      { id: '3', name: 'large-file.zip', progress: 23, status: 'uploading' },
    ],
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onFileUpload: (files: FileList) => console.log('Upload files:', files),
    onUploadCancel: (uploadId: string) => console.log('Cancel upload:', uploadId),
  },
};

export const BulkOperations: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    selectedFiles: ['1', '3'],
    bulkOperationsMode: true,
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onBulkDelete: (fileIds: string[]) => console.log('Bulk delete:', fileIds),
    onBulkMove: (fileIds: string[], destination: string) => console.log('Bulk move:', fileIds, destination),
    onBulkTag: (fileIds: string[], tags: string[]) => console.log('Bulk tag:', fileIds, tags),
  },
};

export const SearchAndFilter: Story = {
  args: {
    files: mockFiles.filter(f => f.type.includes('csv') || f.name.includes('analysis')),
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    searchQuery: 'analysis',
    activeFilters: {
      fileType: ['csv', 'xlsx'],
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
      tags: ['analytics'],
    },
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onSearch: (query: string) => console.log('Search:', query),
    onFilterChange: (filters: any) => console.log('Filters changed:', filters),
  },
};

export const FileDetailsView: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    selectedFile: mockFiles[0],
    showFileDetails: true,
    fileVersions: [
      {
        version: '2.1',
        size: 2453760,
        lastModified: '2024-01-15T10:30:00Z',
        uploadedBy: 'admin@example.com',
        isCurrent: true,
      },
      {
        version: '2.0',
        size: 2341234,
        lastModified: '2024-01-10T14:15:00Z',
        uploadedBy: 'admin@example.com',
        isCurrent: false,
      },
      {
        version: '1.9',
        size: 2198765,
        lastModified: '2024-01-05T09:45:00Z',
        uploadedBy: 'curator@example.com',
        isCurrent: false,
      },
    ],
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onVersionRestore: (version: string) => console.log('Restore version:', version),
    onMetadataUpdate: (metadata: any) => console.log('Update metadata:', metadata),
  },
};

export const StorageAnalytics: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: {
      ...mockStorageStats,
      usageByCategory: {
        datasets: 45.2,
        assets: 23.7,
        backups: 18.9,
        reports: 8.1,
        other: 4.1,
      },
      growthTrend: [
        { month: '2023-08', usage: 18.2 },
        { month: '2023-09', usage: 19.1 },
        { month: '2023-10', usage: 20.5 },
        { month: '2023-11', usage: 21.8 },
        { month: '2023-12', usage: 22.3 },
        { month: '2024-01', usage: 23.4 },
      ],
    },
    showAnalytics: true,
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
  },
};

export const AccessManagement: Story = {
  args: {
    files: mockFiles.map(file => ({
      ...file,
      permissions: {
        owner: 'admin@example.com',
        readers: ['team@example.com', 'analysts@example.com'],
        writers: ['admin@example.com', 'curator@example.com'],
        isPublic: file.name.includes('diagram'),
      },
    })),
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    showPermissions: true,
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onPermissionChange: (fileId: string, permissions: any) => console.log('Update permissions:', fileId, permissions),
    onShareLink: (fileId: string) => console.log('Generate share link:', fileId),
  },
};

export const BackupAndSync: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    backupStatus: {
      lastBackup: '2024-01-15T02:00:00Z',
      nextBackup: '2024-01-16T02:00:00Z',
      backupSize: 1024 * 1024 * 1024 * 12.3, // 12.3GB
      isAutoBackupEnabled: true,
      retentionPeriod: 90, // days
    },
    syncStatus: {
      isEnabled: true,
      lastSync: '2024-01-15T10:30:00Z',
      syncedFiles: 1247,
      failedFiles: 3,
      syncErrors: [
        { file: 'corrupted-file.csv', error: 'File corrupted during upload' },
        { file: 'large-dataset.zip', error: 'File size exceeds limit' },
      ],
    },
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onBackupNow: () => console.log('Start backup now'),
    onSyncNow: () => console.log('Start sync now'),
    onBackupSettings: () => console.log('Open backup settings'),
  },
};

export const CDNManagement: Story = {
  args: {
    files: mockFiles.map(file => ({
      ...file,
      cdn: {
        isEnabled: file.type.startsWith('image/') || file.type.includes('svg'),
        cdnUrl: `https://cdn.ai-glossary.com/${file.key}`,
        cacheStatus: 'cached',
        hitRate: 89.3,
        lastCacheRefresh: '2024-01-15T08:00:00Z',
      },
    })),
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    cdnStats: {
      totalRequests: 245789,
      cacheHitRate: 91.2,
      bandwidthSaved: 1024 * 1024 * 456, // 456MB
      costSavings: 123.45,
    },
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onCDNEnable: (fileId: string) => console.log('Enable CDN for:', fileId),
    onCachePurge: (fileId: string) => console.log('Purge cache for:', fileId),
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    loadingMessage: 'Loading files from S3...',
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to connect to S3. Please check your AWS credentials and try again.',
    onRetry: () => console.log('Retry S3 connection'),
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
  },
};

export const EmptyState: Story = {
  args: {
    files: [],
    folders: [],
    storageStats: {
      ...mockStorageStats,
      totalFiles: 0,
      usedStorage: 0,
    },
    currentPath: '',
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
    onFileUpload: (files: FileList) => console.log('Upload first files:', files),
  },
};

export const DarkMode: Story = {
  args: {
    files: mockFiles,
    folders: mockFolders,
    storageStats: mockStorageStats,
    currentPath: '',
    onFileSelect: (fileId: string) => console.log('File selected:', fileId),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
