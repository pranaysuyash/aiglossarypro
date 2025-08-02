const meta = {
    title: 'Documentation/Component Index',
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'AI Glossary Pro Component Library - Comprehensive documentation and testing for all components.',
            },
            page: () => (<div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">AI Glossary Pro - Component Library</h1>

          <p className="text-lg text-gray-600 mb-8">
            Welcome to the AI Glossary Pro component library! This Storybook contains comprehensive
            documentation and testing for all components in our application.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-600">📚 Component Categories</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">Core Application Components</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-800">Navigation & Layout</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>Header</strong> - Main application header with search and
                          navigation
                        </li>
                        <li>
                          <strong>Footer</strong> - Application footer with links and information
                        </li>
                        <li>
                          <strong>Sidebar</strong> - Navigation sidebar for categories and filters
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Content Display</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>EnhancedTermCard</strong> - Advanced term cards with rich metadata
                        </li>
                        <li>
                          <strong>TermCard</strong> - Basic term display cards
                        </li>
                        <li>
                          <strong>CategoryCard</strong> - Category overview cards with term counts
                        </li>
                        <li>
                          <strong>VirtualizedTermList</strong> - Performance-optimized term lists
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Search & Discovery</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>SearchBar</strong> - Intelligent search with autocomplete
                        </li>
                        <li>
                          <strong>AdvancedSearch</strong> - Detailed search with filters
                        </li>
                        <li>
                          <strong>AISemanticSearch</strong> - AI-powered semantic search
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3">UI Foundation Components</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-800">Form Controls</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>Input</strong> - Text inputs with validation states
                        </li>
                        <li>
                          <strong>Button</strong> - Buttons with multiple variants and states
                        </li>
                        <li>
                          <strong>Textarea</strong> - Multi-line text inputs
                        </li>
                        <li>
                          <strong>Select</strong> - Dropdown selections
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Layout & Structure</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>Card</strong> - Flexible content containers
                        </li>
                        <li>
                          <strong>Accordion</strong> - Collapsible content sections
                        </li>
                        <li>
                          <strong>Tabs</strong> - Tabbed content organization
                        </li>
                        <li>
                          <strong>Dialog</strong> - Modal dialogs and overlays
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Feedback & Status</h4>
                      <ul className="text-sm text-gray-600 ml-4 list-disc">
                        <li>
                          <strong>Alert</strong> - Status messages and notifications
                        </li>
                        <li>
                          <strong>Toast</strong> - Temporary notifications
                        </li>
                        <li>
                          <strong>Progress</strong> - Progress indicators
                        </li>
                        <li>
                          <strong>Badge</strong> - Status and category indicators
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-green-600">🎨 Design System</h2>
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Theme Support</h4>
                    <p className="text-sm text-gray-600">
                      All components support both light and dark themes with consistent styling.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Responsive Design</h4>
                    <p className="text-sm text-gray-600">
                      Optimized for Mobile (320px+), Tablet (768px+), and Desktop (1024px+).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Accessibility</h4>
                    <p className="text-sm text-gray-600">
                      WCAG 2.1 AA compliance with keyboard navigation and screen reader support.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-purple-600">🧪 Testing Strategies</h2>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  Each component includes stories for:
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      ✅ <strong>Default State</strong> - Standard component appearance
                    </li>
                    <li>
                      ✅ <strong>Variants</strong> - Different visual styles and configurations
                    </li>
                    <li>
                      ✅ <strong>States</strong> - Loading, error, disabled, focused states
                    </li>
                    <li>
                      ✅ <strong>Data Scenarios</strong> - Empty, populated, edge cases
                    </li>
                  </ul>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      ✅ <strong>Responsive</strong> - Mobile, tablet, desktop views
                    </li>
                    <li>
                      ✅ <strong>Dark Mode</strong> - Theme variations
                    </li>
                    <li>
                      ✅ <strong>Interactive</strong> - User interaction scenarios
                    </li>
                    <li>
                      ✅ <strong>Accessibility</strong> - Focus and keyboard navigation
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">🚀 Getting Started</h2>
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Quick Start</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                      <li>
                        <strong>Browse Components</strong> - Explore the component library
                      </li>
                      <li>
                        <strong>View Stories</strong> - See components in different states
                      </li>
                      <li>
                        <strong>Check Code</strong> - View implementation details
                      </li>
                      <li>
                        <strong>Test Interactions</strong> - Try interactive features
                      </li>
                      <li>
                        <strong>Copy Examples</strong> - Use code snippets in your work
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Usage Example</h4>
                    <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
                      <div>import {'{ Button }'} from '@/components/ui/button';</div>
                      <div>import {'{ Card }'} from '@/components/ui/card';</div>
                      <br />
                      <div>function Example() {'{'}</div>
                      <div>&nbsp;&nbsp;return {'<Card><Button>Click me</Button></Card>'}</div>
                      <div>{'}'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="text-center">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  📊 Implementation Status
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">8+</div>
                    <div className="text-sm text-gray-600">Story Files</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">60+</div>
                    <div className="text-sm text-gray-600">Story Variants</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-sm text-gray-600">Core Components</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              This component library is continuously updated with new components and improvements.
              Check back regularly for the latest additions and enhancements.
            </p>
          </footer>
        </div>),
        },
    },
    tags: ['autodocs'],
};
export default meta;
export const ComponentLibraryIndex = {
    render: () => <div>See the Docs tab for the complete component library index.</div>,
    parameters: {
        docs: {
            description: {
                story: 'Complete overview of the AI Glossary Pro component library with organized categories, testing strategies, and usage guidelines.',
            },
        },
    },
};
