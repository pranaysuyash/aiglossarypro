import type { Meta, StoryObj } from '@storybook/react';
import SampleTerms from './SampleTerms';

const meta: Meta<typeof SampleTerms> = {
  title: 'Pages/SampleTerms',
  component: SampleTerms,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sample terms index page showcasing all available free AI/ML definitions for SEO discovery',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SampleTerms>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default sample terms index page with all curated AI/ML definitions',
      },
    },
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized view of the sample terms index',
      },
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet view with responsive grid layout',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Dark mode variant of the sample terms index',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - click on any term card to navigate to the detailed definition',
      },
    },
  },
};
