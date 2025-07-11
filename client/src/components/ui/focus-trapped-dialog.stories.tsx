import { Meta, StoryObj } from '@storybook/react';
import { FocusTrappedDialog, FocusTrappedDialogTrigger, FocusTrappedDialogContent, FocusTrappedDialogHeader, FocusTrappedDialogTitle, FocusTrappedDialogDescription, FocusTrappedDialogFooter } from './focus-trapped-dialog';

const meta = {
  title: 'UI/FocusTrappedDialog',
  component: FocusTrappedDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FocusTrappedDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FocusTrappedDialog>
      <FocusTrappedDialogTrigger className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Open Focus Trapped Dialog
      </FocusTrappedDialogTrigger>
      <FocusTrappedDialogContent trapFocus={true}>
        <FocusTrappedDialogHeader>
          <FocusTrappedDialogTitle>Focus Trapped Dialog</FocusTrappedDialogTitle>
          <FocusTrappedDialogDescription>
            This dialog traps focus within its content. Try pressing Tab to see focus cycling.
          </FocusTrappedDialogDescription>
        </FocusTrappedDialogHeader>
        <FocusTrappedDialogFooter>
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2">
            First Button
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Second Button
          </button>
        </FocusTrappedDialogFooter>
      </FocusTrappedDialogContent>
    </FocusTrappedDialog>
  ),
};

export const WithoutTrap: Story = {
  render: () => (
    <FocusTrappedDialog>
      <FocusTrappedDialogTrigger className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        Open Without Focus Trap
      </FocusTrappedDialogTrigger>
      <FocusTrappedDialogContent trapFocus={false}>
        <FocusTrappedDialogHeader>
          <FocusTrappedDialogTitle>Regular Dialog</FocusTrappedDialogTitle>
          <FocusTrappedDialogDescription>
            This dialog does not trap focus. Focus can move outside the dialog.
          </FocusTrappedDialogDescription>
        </FocusTrappedDialogHeader>
        <FocusTrappedDialogFooter>
          <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2">
            Cancel
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Confirm
          </button>
        </FocusTrappedDialogFooter>
      </FocusTrappedDialogContent>
    </FocusTrappedDialog>
  ),
};
