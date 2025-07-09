import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import DragDropUploader from './DragDropUploader';

const meta: Meta<typeof DragDropUploader> = {
  title: 'Components/DragDropUploader',
  component: DragDropUploader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive drag-and-drop file uploader with progress tracking, validation, and multiple file support.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-4xl mx-auto">
        <Story />
      </div>
    ),
  ],
  args: {
    acceptedTypes: ['.xlsx', '.xls', '.csv', '.json', '.txt'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    enableCompression: false,
    showPreview: true,
  },
  argTypes: {
    acceptedTypes: {
      control: { type: 'object' },
      description: 'Array of accepted file extensions',
    },
    maxFileSize: {
      control: { type: 'number' },
      description: 'Maximum file size in bytes',
    },
    maxFiles: {
      control: { type: 'number' },
      description: 'Maximum number of files allowed',
    },
    enableCompression: {
      control: { type: 'boolean' },
      description: 'Enable file compression during upload',
    },
    showPreview: {
      control: { type: 'boolean' },
      description: 'Show upload options and preview',
    },
    onUploadComplete: { action: 'upload-complete' },
    onUploadError: { action: 'upload-error' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default drag-and-drop uploader with standard settings for Excel, CSV, and text files.',
      },
    },
  },
};

export const ImagesOnly: Story = {
  args: {
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'File uploader configured for image files only with smaller size limit.',
      },
    },
  },
};

export const DocumentsOnly: Story = {
  args: {
    acceptedTypes: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 20,
  },
  parameters: {
    docs: {
      description: {
        story: 'File uploader configured for document files with higher file count limit.',
      },
    },
  },
};

export const SingleFileUpload: Story = {
  args: {
    acceptedTypes: ['.csv'],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single file uploader for CSV files only.',
      },
    },
  },
};

export const WithCompression: Story = {
  args: {
    enableCompression: true,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    acceptedTypes: ['.xlsx', '.xls', '.csv', '.json', '.xml', '.zip', '.gz'],
  },
  parameters: {
    docs: {
      description: {
        story: 'File uploader with compression enabled for larger files.',
      },
    },
  },
};

export const MinimalInterface: Story = {
  args: {
    showPreview: false,
    maxFiles: 3,
    acceptedTypes: ['.csv', '.json'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal uploader interface without preview options.',
      },
    },
  },
};

export const LargeFileSupport: Story = {
  args: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxFiles: 5,
    enableCompression: true,
    acceptedTypes: ['.xlsx', '.csv', '.json', '.xml', '.zip', '.gz'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration for handling large files up to 1GB with compression.',
      },
    },
  },
};

export const RestrictiveSettings: Story = {
  args: {
    maxFileSize: 1024 * 1024, // 1MB
    maxFiles: 2,
    acceptedTypes: ['.txt'],
    enableCompression: false,
    showPreview: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Very restrictive settings with small file size limit and minimal file types.',
      },
    },
  },
};

export const WithCallbacks: Story = {
  args: {
    onUploadComplete: (results) => {
      console.log('Upload completed:', results);
      alert(`Successfully uploaded ${results.length} file(s)!`);
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'File uploader with success and error callback handlers.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [uploadResults, setUploadResults] = React.useState<any[]>([]);
    const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);

    const handleUploadComplete = (results: any[]) => {
      setUploadResults((prev) => [...prev, ...results]);
      console.log('Upload completed:', results);
    };

    const handleUploadError = (error: string) => {
      setUploadErrors((prev) => [...prev, error]);
      console.error('Upload error:', error);
    };

    return (
      <div className="space-y-6">
        <DragDropUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          acceptedTypes={['.xlsx', '.xls', '.csv', '.json', '.txt']}
          maxFileSize={50 * 1024 * 1024} // 50MB
          maxFiles={8}
          enableCompression={true}
          showPreview={true}
        />

        {/* Results Display */}
        {uploadResults.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Upload Results ({uploadResults.length})
            </h3>
            <div className="space-y-1">
              {uploadResults.map((_result, index) => (
                <div key={index} className="text-sm text-green-700">
                  ✓ File {index + 1}: Upload successful
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors Display */}
        {uploadErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">
              Upload Errors ({uploadErrors.length})
            </h3>
            <div className="space-y-1">
              {uploadErrors.map((error, index) => (
                <div key={index} className="text-sm text-red-700">
                  ✗ Error {index + 1}: {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        {(uploadResults.length > 0 || uploadErrors.length > 0) && (
          <div className="text-center">
            <button
              onClick={() => {
                setUploadResults([]);
                setUploadErrors([]);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing upload results and error handling in real-time.',
      },
    },
  },
};

export const AllFileTypes: Story = {
  args: {
    acceptedTypes: [
      '.xlsx',
      '.xls',
      '.csv',
      '.json',
      '.xml',
      '.txt',
      '.rtf',
      '.pdf',
      '.doc',
      '.docx',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.zip',
      '.gz',
      '.tar',
      '.rar',
    ],
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxFiles: 15,
    enableCompression: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'File uploader that accepts a wide variety of file types including documents, images, and archives.',
      },
    },
  },
};

export const ProductionConfig: Story = {
  args: {
    acceptedTypes: ['.xlsx', '.xls', '.csv'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    enableCompression: true,
    showPreview: true,
    onUploadComplete: (results) => {
      console.log('Production upload completed:', results);
      // In production, this would handle the uploaded files
    },
    onUploadError: (error) => {
      console.error('Production upload error:', error);
      // In production, this would handle error reporting
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Production-ready configuration with appropriate limits and error handling.',
      },
    },
  },
};

export const ErrorStates: Story = {
  render: () => {
    const [simulateError, setSimulateError] = React.useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
            />
            <span>Simulate upload errors</span>
          </label>
        </div>

        <DragDropUploader
          acceptedTypes={['.csv', '.json']}
          maxFileSize={5 * 1024 * 1024} // 5MB - small to test size errors
          maxFiles={3} // Small number to test max files error
          onUploadComplete={(results) => {
            if (simulateError) {
              console.log('Simulated success despite error flag');
            } else {
              console.log('Upload completed:', results);
            }
          }}
          onUploadError={(error) => {
            console.error('Upload error:', error);
          }}
        />

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>To test error states:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Try uploading files larger than 5MB (size limit error)</li>
            <li>Try uploading more than 3 files (max files error)</li>
            <li>Try uploading unsupported file types (type error)</li>
            <li>Try uploading the same file twice (duplicate error)</li>
            <li>Enable the checkbox above to simulate upload errors</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of various error states and validation messages.',
      },
    },
  },
};

export const MobileOptimized: Story = {
  args: {
    acceptedTypes: ['.jpg', '.jpeg', '.png'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    showPreview: false, // Simplified for mobile
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized configuration with image files and simplified interface.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    acceptedTypes: ['.xlsx', '.csv', '.json'],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 8,
    enableCompression: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'File uploader in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-4xl mx-auto dark">
        <Story />
      </div>
    ),
  ],
};

export const CustomizationExample: Story = {
  render: () => {
    const [config, setConfig] = React.useState({
      maxFileSize: 25 * 1024 * 1024, // 25MB
      maxFiles: 5,
      enableCompression: false,
      showPreview: true,
      acceptedTypes: ['.csv', '.json', '.xlsx'],
    });

    const handleConfigChange = (key: string, value: any) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <div className="space-y-6">
        {/* Configuration Panel */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Uploader Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
              <input
                type="number"
                value={config.maxFileSize / (1024 * 1024)}
                onChange={(e) =>
                  handleConfigChange('maxFileSize', Number(e.target.value) * 1024 * 1024)
                }
                className="w-full px-3 py-2 border rounded"
                min="1"
                max="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Files</label>
              <input
                type="number"
                value={config.maxFiles}
                onChange={(e) => handleConfigChange('maxFiles', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableCompression}
                  onChange={(e) => handleConfigChange('enableCompression', e.target.checked)}
                />
                <span className="text-sm">Enable Compression</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.showPreview}
                  onChange={(e) => handleConfigChange('showPreview', e.target.checked)}
                />
                <span className="text-sm">Show Preview</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Uploader */}
        <DragDropUploader
          {...config}
          onUploadComplete={(results) => console.log('Dynamic upload completed:', results)}
          onUploadError={(error) => console.error('Dynamic upload error:', error)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing how to customize uploader settings dynamically.',
      },
    },
  },
};
