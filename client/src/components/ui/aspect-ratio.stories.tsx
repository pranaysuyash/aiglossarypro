import { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from './aspect-ratio';

const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={1} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&dpr=2&q=80"
          alt="Photo by Marvin Meyer"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={9 / 16} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1605030753481-bb38b08c384a?w=800&dpr=2&q=80"
          alt="Photo by Brooke Cagle"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-gray-200 rounded-md flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">16:9 Aspect Ratio</div>
        </div>
      </AspectRatio>
    </div>
  ),
};