import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FileInput } from './file-input';

const meta = {
  title: 'UI/FileInput',
  component: FileInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FileInput
      label="Upload Document"
      accept=".pdf,.doc,.docx"
      helperText="PDF, DOC, or DOCX files up to 10MB"
      onFilesSelected={(files) => console.log('Files selected:', files)}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <FileInput
      label="Upload Image"
      accept="image/*"
      helperText="JPG, PNG, GIF files up to 5MB"
      error="File size exceeds 5MB limit"
      onFilesSelected={(files) => console.log('Files selected:', files)}
    />
  ),
};
