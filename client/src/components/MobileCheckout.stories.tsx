import type { Meta, StoryObj } from '@storybook/react';
import { MobileCheckout } from './MobileCheckout';

const meta: Meta<typeof MobileCheckout> = {
  title: 'Components/MobileCheckout',
  component: MobileCheckout,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component: 'Mobile-optimized checkout overlay with Gumroad integration, Apple Pay/Google Pay support',
      },
    },
  },
  argTypes: {
    onClose: { action: 'checkout closed' },
    onSuccess: { action: 'purchase successful' },
  },
};

export default meta;
type Story = StoryObj<typeof MobileCheckout>;

export const Default: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
};

export const Loading: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while the Gumroad checkout is being set up',
      },
    },
  },
};

export const Success: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
  play: async ({ canvasElement }) => {
    // Simulate successful purchase message
    setTimeout(() => {
      window.postMessage({
        type: 'gumroad:purchase_complete',
        data: { purchaseId: 'test_123' }
      }, '*');
    }, 1000);
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the success state after a completed purchase',
      },
    },
  },
};

export const Error: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
  play: async ({ canvasElement }) => {
    // Simulate failed purchase message
    setTimeout(() => {
      window.postMessage({
        type: 'gumroad:purchase_failed',
        data: { error: 'Payment method declined. Please try a different card.' }
      }, '*');
    }, 1000);
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the error state when a purchase fails',
      },
    },
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DarkMode: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://pranay4os.gumroad.com/l/ai-glossary-pro',
    price: '$249',
    productName: 'AI Glossary Pro Lifetime',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const CustomProduct: Story = {
  args: {
    isOpen: true,
    productUrl: 'https://example.gumroad.com/l/custom-product',
    price: '$99',
    productName: 'Custom AI Course',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with different product details',
      },
    },
  },
};