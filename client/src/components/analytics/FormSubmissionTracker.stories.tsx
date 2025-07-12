import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import FormSubmissionTracker from './FormSubmissionTracker';

const meta = {
  title: 'Components/FormSubmissionTracker',
  component: FormSubmissionTracker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FormSubmissionTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    formType: 'contact',
    formLocation: 'home-page',
    children: <div>Form content goes here</div>,
  },
};

export const WithProps: Story = {
  args: {
    formType: 'newsletter',
    formLocation: 'sidebar',
    formId: 'newsletter-signup',
    children: <div>Newsletter subscription form</div>,
    metadata: { source: 'sidebar-widget' },
  },
};
