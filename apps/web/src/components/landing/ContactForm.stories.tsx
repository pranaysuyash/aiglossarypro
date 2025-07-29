import type { Meta, StoryObj } from '@storybook/react';
import { ContactForm } from './ContactForm';

const meta: Meta<typeof ContactForm> = {
  title: 'Landing/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Contact form component for the landing page with form validation, UTM tracking, and responsive design.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the form container',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContactForm>;

// Mock fetch for Storybook
const mockFetch = (url: string, options: Record<string, unknown>) => {
  if (url.includes('/api/newsletter/contact')) {
    const body = JSON.parse(options.body);

    // Simulate different responses based on email
    if (body.email === 'error@example.com') {
      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Failed to send message. Please try again.',
          }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message: "Thank you for your message! We'll get back to you within 24 hours.",
        }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
};

// Override fetch for Storybook
global.fetch = mockFetch as any;

export const Default: Story = {
  args: {
    className: 'max-w-2xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default contact form with all fields and standard styling.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    className: 'max-w-md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact version of the contact form with reduced width.',
      },
    },
  },
};

export const FullWidth: Story = {
  args: {
    className: 'w-full',
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-width contact form for wider layouts.',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  args: {
    className: 'max-w-2xl border-2 border-purple-200 shadow-2xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Contact form with custom styling and enhanced border/shadow.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    className: 'max-w-2xl',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing form validation and submission. Try submitting with different email addresses.',
      },
    },
  },
  play: async ({ canvasElement: _ }) => {
    // This story is meant for manual interaction
    console.log('Try filling out the form and submitting it!');
    console.log('Use "error@example.com" to test error handling.');
  },
};

export const Mobile: Story = {
  args: {
    className: 'max-w-sm',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Contact form optimized for mobile viewing with touch-friendly inputs.',
      },
    },
  },
};

export const Tablet: Story = {
  args: {
    className: 'max-w-xl',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Contact form optimized for tablet viewing.',
      },
    },
  },
};
