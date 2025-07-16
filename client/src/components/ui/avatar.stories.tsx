import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A user avatar component with image support and fallback initials.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default avatar with image and fallback initials.',
      },
    },
  },
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatar showing only the fallback initials (no image).',
      },
    },
  },
};

export const BrokenImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://broken-image-url.jpg" alt="Broken Image" />
      <AvatarFallback>BI</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatar with broken image URL, showing fallback initials.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Avatar className="h-6 w-6">
        <AvatarImage src="https://github.com/shadcn.png" alt="Small Avatar" />
        <AvatarFallback className="text-xs">S</AvatarFallback>
      </Avatar>

      <Avatar className="h-8 w-8">
        <AvatarImage src="https://github.com/shadcn.png" alt="Medium Avatar" />
        <AvatarFallback className="text-sm">M</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Default Avatar" />
        <AvatarFallback>D</AvatarFallback>
      </Avatar>

      <Avatar className="h-12 w-12">
        <AvatarImage src="https://github.com/shadcn.png" alt="Large Avatar" />
        <AvatarFallback>L</AvatarFallback>
      </Avatar>

      <Avatar className="h-16 w-16">
        <AvatarImage src="https://github.com/shadcn.png" alt="XL Avatar" />
        <AvatarFallback className="text-lg">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars in different sizes from small to extra large.',
      },
    },
  },
};

export const MultipleUsers: Story = {
  render: () => (
    <div className="flex space-x-2">
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
          alt="John"
        />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108755-2616b8b8f36e?w=32&h=32&fit=crop&crop=face"
          alt="Sarah"
        />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
          alt="Mike"
        />
        <AvatarFallback>MJ</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple avatars representing a group of users.',
      },
    },
  },
};

export const WithBorder: Story = {
  render: () => (
    <div className="flex space-x-4">
      <Avatar className="border-2 border-white shadow-lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Bordered Avatar" />
        <AvatarFallback>BA</AvatarFallback>
      </Avatar>

      <Avatar className="border-2 border-primary">
        <AvatarImage src="https://github.com/shadcn.png" alt="Primary Border" />
        <AvatarFallback>PB</AvatarFallback>
      </Avatar>

      <Avatar className="border-2 border-green-500">
        <AvatarFallback className="bg-green-100 text-green-700">ON</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars with different border styles and colors.',
      },
    },
  },
};

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex space-x-6">
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Online user" />
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
      </div>

      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Away user" />
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-yellow-500"></div>
      </div>

      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Offline user" />
          <AvatarFallback>OF</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-gray-400"></div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars with status indicators for online, away, and offline states.',
      },
    },
  },
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex space-x-2">
      <Avatar>
        <AvatarFallback className="bg-red-500 text-white">R</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback className="bg-blue-500 text-white">B</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback className="bg-green-500 text-white">G</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback className="bg-purple-500 text-white">P</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback className="bg-orange-500 text-white">O</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatar fallbacks with custom background colors.',
      },
    },
  },
};

export const SquareVariant: Story = {
  render: () => (
    <div className="flex space-x-4">
      <Avatar className="rounded-lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Square Avatar" />
        <AvatarFallback>SQ</AvatarFallback>
      </Avatar>

      <Avatar className="rounded-md">
        <AvatarImage src="https://github.com/shadcn.png" alt="Rounded Square" />
        <AvatarFallback>RS</AvatarFallback>
      </Avatar>

      <Avatar className="rounded-none">
        <AvatarImage src="https://github.com/shadcn.png" alt="Sharp Square" />
        <AvatarFallback>SS</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatar variants with different border radius styles.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => (
    <Avatar className="cursor-pointer hover:scale-110 transition-transform duration-200">
      <AvatarImage src="https://github.com/shadcn.png" alt="Clickable Avatar" />
      <AvatarFallback>CL</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive avatar with hover effects.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="flex space-x-4">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Dark Mode Avatar" />
        <AvatarFallback>DM</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>

      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Online in dark" />
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500"></div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Avatar components in dark mode theme.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};
