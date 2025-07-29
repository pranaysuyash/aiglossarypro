import type { Meta, StoryObj } from '@storybook/react';
import { PersonalizedHomepage } from './PersonalizedHomepage';

const meta = {
  title: 'Pages/PersonalizedHomepage',
  component: PersonalizedHomepage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PersonalizedHomepage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
