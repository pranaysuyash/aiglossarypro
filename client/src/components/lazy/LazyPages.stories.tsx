import { Meta, StoryObj } from '@storybook/react';
import { LazyTerms, LazyTermsPage } from './LazyPages';

const meta = {
  title: 'Components/LazyPages',
  component: LazyTermsPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LazyTermsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LazyTermsStory: Story = {
  render: () => (
    <div className="h-screen w-full">
      <LazyTermsPage />
    </div>
  ),
};

export const LazyTermsRaw: Story = {
  render: () => (
    <div className="h-screen w-full">
      <LazyTerms />
    </div>
  ),
};
