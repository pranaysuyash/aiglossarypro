import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './command';

const meta: Meta<typeof Command> = {
  title: 'UI/Command',
  component: Command,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A command palette component for fast navigation and actions. Built with Radix UI and cmdk.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <span>Neural Networks</span>
          </CommandItem>
          <CommandItem>
            <span>Machine Learning</span>
          </CommandItem>
          <CommandItem>
            <span>Deep Learning</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Preferences</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Dialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <p className="text-sm text-muted-foreground">
          Press{' '}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Open Command Dialog
        </button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="AI Terms">
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Neural Networks</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Machine Learning</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Deep Learning</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Natural Language Processing</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Computer Vision</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Categories">
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Algorithms</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Mathematics</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Statistics</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Add to Favorites</span>
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Share Term</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <span>Take Quiz</span>
                <CommandShortcut>⌘Q</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const WithIcons: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search AI terms..." />
      <CommandList>
        <CommandEmpty>No terms found.</CommandEmpty>
        <CommandGroup heading="Popular Terms">
          <CommandItem>
            <span className="mr-2">🤖</span>
            <span>Artificial Intelligence</span>
          </CommandItem>
          <CommandItem>
            <span className="mr-2">🧠</span>
            <span>Neural Networks</span>
          </CommandItem>
          <CommandItem>
            <span className="mr-2">📊</span>
            <span>Machine Learning</span>
          </CommandItem>
          <CommandItem>
            <span className="mr-2">🔍</span>
            <span>Computer Vision</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Categories">
          <CommandItem>
            <span className="mr-2">📁</span>
            <span>Algorithms</span>
          </CommandItem>
          <CommandItem>
            <span className="mr-2">📈</span>
            <span>Statistics</span>
          </CommandItem>
          <CommandItem>
            <span className="mr-2">🔬</span>
            <span>Research</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const SearchResults: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const terms = [
      { name: 'Neural Networks', category: 'Deep Learning', description: 'Computational models inspired by biological neural networks' },
      { name: 'Gradient Descent', category: 'Optimization', description: 'Algorithm for finding minimum of a function' },
      { name: 'Transformer', category: 'NLP', description: 'Attention-based neural network architecture' },
      { name: 'Convolutional Neural Network', category: 'Computer Vision', description: 'Neural network designed for image processing' },
      { name: 'Random Forest', category: 'Machine Learning', description: 'Ensemble learning method using decision trees' },
    ];

    const filteredTerms = terms.filter(term =>
      term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Command className="rounded-lg border shadow-md max-w-2xl">
        <CommandInput 
          placeholder="Search AI/ML terms..." 
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>No terms found for "{searchTerm}"</CommandEmpty>
          {filteredTerms.length > 0 && (
            <CommandGroup heading={`${filteredTerms.length} Results`}>
              {filteredTerms.map((term) => (
                <CommandItem key={term.name} className="flex flex-col items-start">
                  <div className="flex items-center w-full">
                    <span className="font-medium">{term.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {term.category}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">
                    {term.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    );
  },
};

export const WithKeyboardShortcuts: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem>
            <span>Go to Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Browse Terms</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Search</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <span>Add New Term</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Favorites</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem>
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Logout</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Loading: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Loading..." disabled />
      <CommandList>
        <CommandGroup>
          <CommandItem disabled>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <span>Loading suggestions...</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search for anything..." />
      <CommandList>
        <CommandEmpty>
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm text-muted-foreground">No results found</div>
            <div className="text-xs text-muted-foreground mt-1">
              Try searching for AI terms, categories, or concepts
            </div>
          </div>
        </CommandEmpty>
      </CommandList>
    </Command>
  ),
};

export const RecentSearches: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('');
    const recentSearches = ['Neural Networks', 'Deep Learning', 'Gradient Descent', 'Transformer'];

    return (
      <Command className="rounded-lg border shadow-md max-w-md">
        <CommandInput 
          placeholder="Search AI terms..." 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchValue === '' && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search) => (
                <CommandItem key={search} onSelect={() => setSearchValue(search)}>
                  <span className="mr-2">🕒</span>
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchValue === '' && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                <CommandItem>
                  <span className="mr-2">⭐</span>
                  <span>View Favorites</span>
                </CommandItem>
                <CommandItem>
                  <span className="mr-2">📚</span>
                  <span>Browse All Terms</span>
                </CommandItem>
                <CommandItem>
                  <span className="mr-2">🎯</span>
                  <span>Take Quiz</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    );
  },
};

export const Categorized: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-lg">
      <CommandInput placeholder="Search or browse categories..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="🤖 Machine Learning">
          <CommandItem>
            <span>Supervised Learning</span>
          </CommandItem>
          <CommandItem>
            <span>Unsupervised Learning</span>
          </CommandItem>
          <CommandItem>
            <span>Reinforcement Learning</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="🧠 Deep Learning">
          <CommandItem>
            <span>Neural Networks</span>
          </CommandItem>
          <CommandItem>
            <span>Convolutional Networks</span>
          </CommandItem>
          <CommandItem>
            <span>Recurrent Networks</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="💬 Natural Language Processing">
          <CommandItem>
            <span>Tokenization</span>
          </CommandItem>
          <CommandItem>
            <span>Word Embeddings</span>
          </CommandItem>
          <CommandItem>
            <span>Transformer Architecture</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search in dark mode..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="AI Terms">
          <CommandItem>
            <span>🤖 Artificial Intelligence</span>
          </CommandItem>
          <CommandItem>
            <span>🧠 Machine Learning</span>
          </CommandItem>
          <CommandItem>
            <span>⚡ Deep Learning</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <span>⭐ Favorites</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>⚙️ Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
