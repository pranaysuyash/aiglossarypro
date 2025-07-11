import { Meta, StoryObj } from '@storybook/react';
import { useFocusTrap } from './useFocusTrap';
import { useRef } from 'react';

// Demo component to showcase the hook
const FocusTrapDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);

  return (
    <div
      ref={ref}
      className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50 max-w-md"
    >
      <h3 className="text-lg font-semibold mb-4">Focus Trap Demo</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tab navigation is trapped within this container
      </p>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="First input"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Second input"
          className="w-full p-2 border rounded"
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Button
        </button>
      </div>
    </div>
  );
};

const meta = {
  title: 'Hooks/useFocusTrap',
  component: FocusTrapDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FocusTrapDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4">useFocusTrap Hook</h2>
      <p className="text-gray-600 mb-4">
        A React hook that traps focus within a specific element, useful for modals and dialogs.
      </p>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
        {`const ref = useRef<HTMLDivElement>(null);
useFocusTrap(ref);

return <div ref={ref}>...</div>;`}
      </pre>
    </div>
  ),
};