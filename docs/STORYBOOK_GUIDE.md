# Storybook Visual Testing Guide

## Overview

Storybook has been successfully set up for the AI Glossary Pro project to enable visual testing and component development. This allows you to develop, test, and document React components in isolation.

## Getting Started

### Running Storybook

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`

### Building Storybook

```bash
npm run build-storybook
```

This creates a static build of Storybook in the `storybook-static` directory.

## Configuration

### Main Configuration (`.storybook/main.ts`)

- **Stories Location**: Stories are automatically discovered in:
  - `client/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)`
  - `client/src/components/**/*.mdx`
  - `stories/**/*.stories.@(js|jsx|mjs|ts|tsx)`

- **Addons Enabled**:
  - `@storybook/addon-docs` - Auto-generated documentation
  - `@storybook/addon-a11y` - Accessibility testing
  - `@storybook/addon-themes` - Light/dark theme switching
  - `@storybook/addon-vitest` - Testing integration
  - Built-in essential addons (controls, actions, viewport, backgrounds) - Now part of Storybook 9.0 core

### Preview Configuration (`.storybook/preview.tsx`)

- **Tailwind CSS Integration**: Automatically imports your project's CSS
- **Theme Support**: Light/dark theme switching with `withThemeByClassName`
- **Responsive Viewports**: Mobile, tablet, and desktop viewports
- **Accessibility Testing**: Enabled with 'todo' mode
- **React Query Support**: QueryClientProvider with mock data for components using useQuery
- **Router Support**: Router provider for components using wouter routing
- **Toast Support**: Toaster component for toast notifications

## Available Components

### UI Components (Ready for Testing)

1. **Button** (`client/src/components/ui/button.stories.tsx`)
   - All variants: default, secondary, destructive, outline, ghost, link
   - All sizes: default, sm, lg, icon
   - States: enabled, disabled
   - With icons example

2. **Card** (`client/src/components/ui/card.stories.tsx`)
   - Basic card layout
   - Card with footer
   - Simple card
   - Notification card example

3. **TermCard** (`client/src/components/TermCard.stories.tsx`)
   - Default term display
   - Favorited state
   - Simple vs complex terms
   - Grid layout example
   - Long title handling

## Creating New Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['option1', 'option2'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    prop1: 'value1',
    prop2: 'value2',
  },
};
```

### Best Practices

1. **Use Descriptive Titles**: Follow the pattern `Category/ComponentName`
2. **Include Multiple Variants**: Show different states and configurations
3. **Add Controls**: Use argTypes for interactive property testing
4. **Mock Data**: Create realistic mock data for complex components
5. **Document Edge Cases**: Include stories for loading states, errors, etc.

## Testing Workflows

### Visual Testing

1. **Component Isolation**: Test components without full application context
2. **Responsive Testing**: Use viewport addon to test different screen sizes
3. **Theme Testing**: Switch between light and dark themes
4. **Accessibility**: Use a11y addon to identify accessibility issues

### Development Workflow

1. **Component Development**: Build components in isolation
2. **Props Exploration**: Use controls to test different prop combinations
3. **Documentation**: Auto-generated docs from component props and stories
4. **Collaboration**: Share stories with team members for review

## Integration with Existing Testing

Storybook complements your existing testing setup:

- **Unit Tests**: Vitest for component logic
- **Component Tests**: Testing Library for component behavior
- **Visual Tests**: Playwright for end-to-end scenarios
- **Storybook**: Component development and visual regression testing

## Recommended Next Steps

1. **Create More Stories**: Add stories for remaining components:
   - `SearchBar`
   - `CategoryCard`
   - `Header`
   - `Footer`
   - UI components (Input, Select, etc.)

2. **Add Visual Regression Testing**: Consider integrating Chromatic or Percy for automated visual testing

3. **Document Design System**: Use Storybook to document your design tokens and component guidelines

4. **Team Collaboration**: Share Storybook builds with designers and stakeholders

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all imports use correct paths relative to the story file
2. **CSS Not Loading**: Check that `../client/src/index.css` is correctly imported in preview.tsx
3. **TypeScript Errors**: Verify component prop types match story args
4. **Theme Not Working**: Ensure className-based theming is properly configured
5. **QueryClient Errors**: Components using React Query require QueryClientProvider (already configured)
6. **Router Errors**: Components using wouter routing require Router provider (already configured)
7. **Toast Errors**: Components using toast notifications require Toaster component (already configured)
8. **Deprecated Addon Errors**: Storybook 9.0 consolidated many addons into core - remove old addon references from main.ts

### Fixed Issues

- **"No QueryClient set" error**: Fixed by adding QueryClientProvider with mock data in `.storybook/preview.tsx`
- **Router dependencies**: Added Router provider to support components using wouter routing
- **Toast functionality**: Added Toaster component to support toast notifications in stories
- **JSX Support**: Converted preview.ts to preview.tsx to support React components in configuration
- **Storybook 9.0 addon compatibility**: Removed deprecated addons that are now built into core (controls, actions, viewport, backgrounds)

### Getting Help

- Check the [Storybook Documentation](https://storybook.js.org/docs)
- Review existing stories for patterns and examples
- Use the browser console for debugging

## Conclusion

Storybook is now ready for visual component testing and development. You can:

✅ Develop components in isolation  
✅ Test different props and states  
✅ Verify responsive behavior  
✅ Check accessibility compliance  
✅ Switch between light/dark themes  
✅ Generate automatic documentation  

Start by running `npm run storybook` and exploring the existing stories at `http://localhost:6006`! 