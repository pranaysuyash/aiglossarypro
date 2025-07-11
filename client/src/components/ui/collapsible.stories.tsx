import { Meta, StoryObj } from '@storybook/react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between space-x-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
        <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
        <span className="text-xs text-gray-500">Toggle</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4">
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/primitives
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between space-x-4 px-4 py-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
        <h4 className="text-sm font-semibold text-blue-900">Expandable Section</h4>
        <span className="text-xs text-blue-600">Click to expand</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4">
        <div className="rounded-md border border-blue-200 px-4 py-3 text-sm bg-blue-50">
          This is collapsible content that can be shown or hidden.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};