import type { Meta, StoryObj } from '@storybook/react';
import SkipLinks from './SkipLinks';

const meta: Meta<typeof SkipLinks> = {
  title: 'Accessibility/SkipLinks',
  component: SkipLinks,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Skip links component that provides keyboard users quick navigation to main content areas. Essential for accessibility.',
      },
    },
  },
  args: {},
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <SkipLinks />
      
      {/* Mock page layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">How to Test Skip Links</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Click in this area first to focus the page</p>
            <p>2. Press <kbd className="px-2 py-1 bg-blue-200 rounded">Tab</kbd> to reveal skip links</p>
            <p>3. Use arrow keys or continue tabbing to navigate between skip links</p>
            <p>4. Press <kbd className="px-2 py-1 bg-blue-200 rounded">Enter</kbd> to activate a skip link</p>
          </div>
        </div>
        
        <header className="mb-8">
          <nav id="navigation" className="mb-4 p-4 bg-white border rounded">
            <h2 className="text-lg font-semibold mb-3">Navigation</h2>
            <ul className="flex space-x-4">
              <li><a href="#" className="text-blue-600 hover:underline">Home</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">About</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">Services</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">Contact</a></li>
            </ul>
          </nav>
          
          <div id="search" className="p-4 bg-white border rounded">
            <h2 className="text-lg font-semibold mb-3">Search</h2>
            <div className="flex space-x-2">
              <input 
                type="search" 
                placeholder="Search..." 
                className="flex-1 px-3 py-2 border rounded"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>
        </header>
        
        <main id="main-content" className="bg-white border rounded p-6">
          <h1 className="text-2xl font-bold mb-4">Main Content Area</h1>
          <div className="prose max-w-none">
            <p className="mb-4">
              This is the main content area. Users can skip directly here using the skip links,
              bypassing the navigation and search areas.
            </p>
            <p className="mb-4">
              Skip links are essential for keyboard users and screen reader users who want to
              quickly navigate to the main content without having to tab through all the
              navigation elements.
            </p>
            <p className="mb-4">
              The skip links are hidden by default but become visible when focused, typically
              by pressing the Tab key when the page loads.
            </p>
          </div>
        </main>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default skip links with a mock page layout showing navigation, search, and main content areas.',
      },
    },
  },
};

export const FocusDemo: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <SkipLinks />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-2">Focus Demonstration</h2>
          <p className="text-sm text-yellow-700 mb-3">
            The skip links are currently hidden but will appear when focused.
            Try tabbing from this text to see them appear.
          </p>
          <button className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
            Start here and press Tab
          </button>
        </div>
        
        {/* Long navigation to demonstrate skip utility */}
        <nav id="navigation" className="mb-6 p-4 bg-white border rounded">
          <h2 className="text-lg font-semibold mb-3">Extensive Navigation Menu</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 16 }, (_, i) => (
              <a 
                key={i} 
                href="#" 
                className="text-blue-600 hover:underline p-2 border rounded text-center"
              >
                Nav Item {i + 1}
              </a>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Without skip links, keyboard users would need to tab through all 16 navigation items
            to reach the main content.
          </p>
        </nav>
        
        <div id="search" className="mb-6 p-4 bg-white border rounded">
          <h2 className="text-lg font-semibold mb-3">Search Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Search term" className="px-3 py-2 border rounded" />
            <select className="px-3 py-2 border rounded">
              <option>All Categories</option>
              <option>Articles</option>
              <option>Products</option>
              <option>Services</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
        
        <main id="main-content" className="bg-white border rounded p-6">
          <h1 className="text-2xl font-bold mb-4">Main Content</h1>
          <p className="text-gray-700">
            This main content area can be reached directly using the skip links,
            saving keyboard users from tabbing through all the navigation and search elements above.
          </p>
        </main>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the utility of skip links with extensive navigation that would be tedious to tab through.',
      },
    },
  },
};

export const CustomSkipLinks: Story = {
  render: () => {
    const CustomSkipLinks = () => (
      <nav className="sr-only focus-within:not-sr-only" aria-label="Skip navigation">
        <div className="fixed top-0 left-0 z-50 bg-green-600 text-white p-4 rounded-br-md">
          <h2 className="sr-only">Skip Navigation Links</h2>
          <ul className="flex space-x-4">
            <li>
              <a
                href="#header"
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 underline hover:no-underline"
              >
                Skip to header
              </a>
            </li>
            <li>
              <a
                href="#sidebar"
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 underline hover:no-underline"
              >
                Skip to sidebar
              </a>
            </li>
            <li>
              <a
                href="#main-content"
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 underline hover:no-underline"
              >
                Skip to content
              </a>
            </li>
            <li>
              <a
                href="#footer"
                className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 underline hover:no-underline"
              >
                Skip to footer
              </a>
            </li>
          </ul>
        </div>
      </nav>
    );
    
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomSkipLinks />
        
        <div className="container mx-auto px-4 py-8">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-green-800 mb-2">Custom Skip Links</h2>
            <p className="text-sm text-green-700">
              This example shows customized skip links with different styling and additional targets.
            </p>
          </div>
          
          <header id="header" className="mb-6 p-4 bg-white border rounded">
            <h1 className="text-xl font-bold">Header Section</h1>
            <p className="text-gray-600">Site header with logo and user controls</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside id="sidebar" className="md:col-span-1 p-4 bg-white border rounded">
              <h2 className="text-lg font-semibold mb-3">Sidebar</h2>
              <ul className="space-y-2">
                <li><a href="#" className="text-blue-600 hover:underline">Link 1</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Link 2</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Link 3</a></li>
                <li><a href="#" className="text-blue-600 hover:underline">Link 4</a></li>
              </ul>
            </aside>
            
            <main id="main-content" className="md:col-span-3 p-6 bg-white border rounded">
              <h1 className="text-2xl font-bold mb-4">Main Content Area</h1>
              <p className="mb-4">
                This layout demonstrates custom skip links that allow users to jump to
                different sections of the page including header, sidebar, main content, and footer.
              </p>
              <p>
                The custom styling uses a green background instead of the default primary color.
              </p>
            </main>
          </div>
          
          <footer id="footer" className="mt-6 p-4 bg-white border rounded">
            <h2 className="text-lg font-semibold mb-2">Footer</h2>
            <p className="text-gray-600">Footer content with additional links and information</p>
          </footer>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of customized skip links with different styling and additional navigation targets.',
      },
    },
  },
};

export const MinimalLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <SkipLinks />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">Minimal Layout</h2>
          <p className="text-sm text-blue-700">
            Even simple layouts benefit from skip links for accessibility.
          </p>
        </div>
        
        <nav id="navigation" className="mb-4">
          <ul className="flex space-x-4">
            <li><a href="#" className="text-blue-600 hover:underline">Home</a></li>
            <li><a href="#" className="text-blue-600 hover:underline">About</a></li>
            <li><a href="#" className="text-blue-600 hover:underline">Contact</a></li>
          </ul>
        </nav>
        
        <main id="main-content" className="bg-white border rounded p-6">
          <h1 className="text-2xl font-bold mb-4">Simple Page</h1>
          <p>
            This simple layout still includes skip links to ensure accessibility
            for all users, even when the navigation is minimal.
          </p>
        </main>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skip links in a minimal layout - still important for accessibility even with simple navigation.',
      },
    },
  },
};

export const AccessibilityGuideline: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <SkipLinks />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-purple-800 mb-4">Skip Links Accessibility Guidelines</h2>
          <div className="text-sm text-purple-700 space-y-3">
            <div>
              <h3 className="font-semibold">WCAG 2.1 Compliance:</h3>
              <p>Skip links help meet Success Criterion 2.4.1 (Bypass Blocks) - Level A</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Best Practices:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Should be the first focusable element on the page</li>
                <li>Must be visible when focused</li>
                <li>Should use descriptive link text</li>
                <li>Target elements should have matching IDs</li>
                <li>Consider adding focus indicators on target elements</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold">Common Targets:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Main content area</li>
                <li>Primary navigation</li>
                <li>Search functionality</li>
                <li>Page footer</li>
              </ul>
            </div>
          </div>
        </div>
        
        <nav id="navigation" className="mb-6 p-4 bg-white border rounded">
          <h2 className="text-lg font-semibold mb-3">Navigation</h2>
          <p className="text-sm text-gray-600 mb-3">
            This navigation section can be skipped using the skip links above.
          </p>
          <ul className="flex flex-wrap space-x-4">
            <li><a href="#" className="text-blue-600 hover:underline">Guidelines</a></li>
            <li><a href="#" className="text-blue-600 hover:underline">Techniques</a></li>
            <li><a href="#" className="text-blue-600 hover:underline">Testing</a></li>
            <li><a href="#" className="text-blue-600 hover:underline">Resources</a></li>
          </ul>
        </nav>
        
        <main id="main-content" className="bg-white border rounded p-6">
          <h1 className="text-2xl font-bold mb-4">Accessibility Documentation</h1>
          <p className="mb-4">
            Skip links are a crucial accessibility feature that allows keyboard and screen reader
            users to bypass repetitive navigation and jump directly to the main content.
          </p>
          <p>
            This component implements WCAG 2.1 guidelines and provides a smooth user experience
            for assistive technology users.
          </p>
        </main>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Documentation example showing accessibility guidelines and best practices for skip links.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <SkipLinks />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-2">Dark Mode Skip Links</h2>
          <p className="text-sm text-gray-300">
            Skip links work in dark mode with appropriate contrast for accessibility.
          </p>
        </div>
        
        <nav id="navigation" className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded">
          <h2 className="text-lg font-semibold mb-3">Navigation</h2>
          <ul className="flex space-x-4">
            <li><a href="#" className="text-blue-400 hover:underline">Home</a></li>
            <li><a href="#" className="text-blue-400 hover:underline">Features</a></li>
            <li><a href="#" className="text-blue-400 hover:underline">Docs</a></li>
            <li><a href="#" className="text-blue-400 hover:underline">Support</a></li>
          </ul>
        </nav>
        
        <main id="main-content" className="bg-gray-800 border border-gray-600 rounded p-6">
          <h1 className="text-2xl font-bold mb-4">Dark Mode Content</h1>
          <p className="text-gray-300">
            Skip links maintain proper contrast ratios in dark mode to ensure accessibility
            for all users regardless of their preferred color scheme.
          </p>
        </main>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Skip links in dark mode with proper contrast for accessibility.',
      },
    },
  },
};
