import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserManagementDashboard from './UserManagementDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof UserManagementDashboard> = {
  title: 'Admin/UserManagementDashboard',
  component: UserManagementDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'User management dashboard for admins to manage user accounts, permissions, subscriptions, and user activity.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserManagementDashboard>;

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/admin/users')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            isPremium: true,
            isAdmin: false,
            createdAt: '2024-01-15T10:30:00Z',
            lastLoginAt: '2024-01-20T14:45:00Z',
            subscription: {
              status: 'active',
              plan: 'lifetime',
              expiresAt: null
            },
            activity: {
              totalSearches: 156,
              totalViews: 1240,
              lastActive: '2024-01-20T14:45:00Z'
            }
          },
          {
            id: '2',
            email: 'jane.smith@company.com',
            firstName: 'Jane',
            lastName: 'Smith',
            isPremium: false,
            isAdmin: true,
            createdAt: '2024-01-10T09:15:00Z',
            lastLoginAt: '2024-01-19T16:20:00Z',
            subscription: null,
            activity: {
              totalSearches: 89,
              totalViews: 567,
              lastActive: '2024-01-19T16:20:00Z'
            }
          },
          {
            id: '3',
            email: 'mike.johnson@tech.co',
            firstName: 'Mike',
            lastName: 'Johnson',
            isPremium: true,
            isAdmin: false,
            createdAt: '2024-01-05T11:45:00Z',
            lastLoginAt: '2024-01-18T13:30:00Z',
            subscription: {
              status: 'active',
              plan: 'lifetime',
              expiresAt: null
            },
            activity: {
              totalSearches: 203,
              totalViews: 1856,
              lastActive: '2024-01-18T13:30:00Z'
            }
          },
          {
            id: '4',
            email: 'sarah.wilson@startup.io',
            firstName: 'Sarah',
            lastName: 'Wilson',
            isPremium: false,
            isAdmin: false,
            createdAt: '2024-01-12T14:20:00Z',
            lastLoginAt: null,
            subscription: null,
            activity: {
              totalSearches: 12,
              totalViews: 34,
              lastActive: '2024-01-12T15:00:00Z'
            }
          },
          {
            id: '5',
            email: 'admin@aimlglossary.com',
            firstName: 'Admin',
            lastName: 'User',
            isPremium: true,
            isAdmin: true,
            createdAt: '2024-01-01T00:00:00Z',
            lastLoginAt: '2024-01-20T18:00:00Z',
            subscription: {
              status: 'active',
              plan: 'admin',
              expiresAt: null
            },
            activity: {
              totalSearches: 456,
              totalViews: 2890,
              lastActive: '2024-01-20T18:00:00Z'
            }
          }
        ],
        total: 5,
        page: 1,
        limit: 20
      })
    });
  }
  
  if (url.includes('/api/admin/users/1/activity')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: {
          totalSearches: 156,
          totalViews: 1240,
          lastActive: '2024-01-20T14:45:00Z',
          recentSearches: [
            { query: 'machine learning', timestamp: '2024-01-20T14:45:00Z' },
            { query: 'deep learning', timestamp: '2024-01-20T14:30:00Z' },
            { query: 'neural networks', timestamp: '2024-01-20T14:15:00Z' }
          ],
          weeklyActivity: [
            { date: '2024-01-14', searches: 12, views: 89 },
            { date: '2024-01-15', searches: 18, views: 134 },
            { date: '2024-01-16', searches: 15, views: 102 },
            { date: '2024-01-17', searches: 22, views: 156 },
            { date: '2024-01-18', searches: 19, views: 127 },
            { date: '2024-01-19', searches: 24, views: 178 },
            { date: '2024-01-20', searches: 16, views: 134 }
          ]
        }
      })
    });
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

// Override fetch for Storybook
global.fetch = mockFetch as any;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view of the UserManagementDashboard with a list of users showing different roles and subscription statuses.',
      },
    },
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      const loadingQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            enabled: false, // Disable queries to show loading state
          },
        },
      });
      return (
        <QueryClientProvider client={loadingQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching user data.',
      },
    },
  },
};

export const EmptyUsers: Story = {
  decorators: [
    (Story) => {
      const emptyQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock empty response
      global.fetch = ((url: string) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [],
              total: 0,
              page: 1,
              limit: 20
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={emptyQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no users are found.',
      },
    },
  },
};

export const PremiumUsers: Story = {
  decorators: [
    (Story) => {
      const premiumQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock premium users only response
      global.fetch = ((url: string) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                {
                  id: '1',
                  email: 'premium.user1@example.com',
                  firstName: 'Premium',
                  lastName: 'User',
                  isPremium: true,
                  isAdmin: false,
                  createdAt: '2024-01-15T10:30:00Z',
                  lastLoginAt: '2024-01-20T14:45:00Z',
                  subscription: {
                    status: 'active',
                    plan: 'lifetime',
                    expiresAt: null
                  }
                },
                {
                  id: '2',
                  email: 'premium.user2@company.com',
                  firstName: 'Another',
                  lastName: 'Premium',
                  isPremium: true,
                  isAdmin: false,
                  createdAt: '2024-01-10T09:15:00Z',
                  lastLoginAt: '2024-01-19T16:20:00Z',
                  subscription: {
                    status: 'active',
                    plan: 'lifetime',
                    expiresAt: null
                  }
                }
              ],
              total: 2,
              page: 1,
              limit: 20
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={premiumQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'UserManagementDashboard showing only premium users.',
      },
    },
  },
};

export const AdminUsers: Story = {
  decorators: [
    (Story) => {
      const adminQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock admin users only response
      global.fetch = ((url: string) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                {
                  id: '1',
                  email: 'admin1@aimlglossary.com',
                  firstName: 'Admin',
                  lastName: 'One',
                  isPremium: true,
                  isAdmin: true,
                  createdAt: '2024-01-01T00:00:00Z',
                  lastLoginAt: '2024-01-20T18:00:00Z',
                  subscription: {
                    status: 'active',
                    plan: 'admin',
                    expiresAt: null
                  }
                },
                {
                  id: '2',
                  email: 'admin2@aimlglossary.com',
                  firstName: 'Admin',
                  lastName: 'Two',
                  isPremium: true,
                  isAdmin: true,
                  createdAt: '2024-01-02T00:00:00Z',
                  lastLoginAt: '2024-01-19T17:30:00Z',
                  subscription: {
                    status: 'active',
                    plan: 'admin',
                    expiresAt: null
                  }
                }
              ],
              total: 2,
              page: 1,
              limit: 20
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={adminQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'UserManagementDashboard showing only admin users.',
      },
    },
  },
};