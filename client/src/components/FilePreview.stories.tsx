import type { Meta, StoryObj } from '@storybook/react';
import FilePreview from './FilePreview';

const meta = {
  title: 'Components/FilePreview',
  component: FilePreview,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FilePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileKey: 'sample-file.csv',
    fileName: 'sample-data.csv',
    fileSize: 1024,
    contentType: 'text/csv',
  },
};

export const WithProps: Story = {
  args: {
    fileKey: 'large-dataset.xlsx',
    fileName: 'large-dataset.xlsx',
    fileSize: 5242880, // 5MB
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    onClose: () => console.log('Close clicked'),
    onDownload: () => console.log('Download clicked'),
  },
};
