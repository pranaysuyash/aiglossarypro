import { lazy } from 'react';
import { RouteConfig } from './types';

// Lazy load all route components
const Home = lazy(() => import('@/pages/Home'));
const FirebaseLoginPage = lazy(() => import('@/components/FirebaseLoginPage'));
const PurchaseSuccess = lazy(() => import('@/pages/PurchaseSuccess'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Marketing pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Lifetime = lazy(() => import('@/pages/Lifetime'));
const About = lazy(() => import('@/pages/About'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));

// Content pages
const Terms = lazy(() => import('@/pages/Terms'));
const Categories = lazy(() => import('@/pages/Categories'));
const Subcategories = lazy(() => import('@/pages/Subcategories'));
const SubcategoryDetail = lazy(() => import('@/pages/SubcategoryDetail'));
const EnhancedTermDetail = lazy(() => import('@/pages/EnhancedTermDetail'));
const Trending = lazy(() => import('@/pages/Trending'));

// User pages (authenticated)
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const UserProgressDashboard = lazy(() => import('@/pages/UserProgressDashboard'));

// Admin pages
const Admin = lazy(() => import('@/pages/Admin'));
const AnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard'));
const AdminSupportCenter = lazy(() => import('@/components/admin/AdminSupportCenter'));

// AI/ML features
const AITools = lazy(() => import('@/pages/AITools'));
const AISearch = lazy(() => import('@/pages/AISearch'));
const Discovery = lazy(() => import('@/pages/Discovery'));
const SurpriseMe = lazy(() => import('@/pages/SurpriseMe'));

// Learning features
const LearningPaths = lazy(() => import('@/pages/LearningPaths'));
const LearningPathDetail = lazy(() => import('@/pages/LearningPathDetail'));
const CodeExamples = lazy(() => import('@/pages/CodeExamples'));

// Sample terms for SEO
const SampleTerms = lazy(() => import('@/pages/SampleTerms'));
const SampleTerm = lazy(() => import('@/pages/SampleTerm'));

// 3D/VR/AR features (heaviest components)
const ThreeDVisualization = lazy(() => import('@/pages/3DVisualization'));

// Route configuration with metadata
export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/',
    component: LandingPage,
    exact: true,
    preload: true,
    meta: {
      title: 'AI/ML Glossary Pro - Comprehensive AI & ML Terms Database',
      description: 'Learn AI and ML concepts with our comprehensive glossary',
    },
  },
  {
    path: '/app',
    component: Home,
    exact: true,
    preload: true,
    meta: {
      title: 'Browse AI/ML Terms',
    },
  },
  {
    path: '/browse',
    component: Home,
    exact: true,
    alias: '/app',
  },
  {
    path: '/login',
    component: FirebaseLoginPage,
    exact: true,
    meta: {
      title: 'Sign In',
    },
  },
  {
    path: '/purchase-success',
    component: PurchaseSuccess,
    exact: true,
    meta: {
      title: 'Purchase Successful',
    },
  },
  {
    path: '/lifetime',
    component: Lifetime,
    exact: true,
    meta: {
      title: 'Lifetime Access',
    },
  },

  // Content routes
  {
    path: '/terms',
    component: Terms,
    exact: true,
    preload: 'hover',
    meta: {
      title: 'All Terms',
    },
  },
  {
    path: '/term/:id',
    component: EnhancedTermDetail,
    exact: true,
    meta: {
      title: 'Term Details',
    },
  },
  {
    path: '/enhanced/terms/:id',
    component: EnhancedTermDetail,
    exact: true,
    alias: '/term/:id',
  },
  {
    path: '/categories',
    component: Categories,
    exact: true,
    preload: 'hover',
    meta: {
      title: 'Categories',
    },
  },
  {
    path: '/category/:id',
    component: Categories,
    exact: true,
  },
  {
    path: '/subcategories',
    component: Subcategories,
    exact: true,
  },
  {
    path: '/subcategories/:id',
    component: SubcategoryDetail,
    exact: true,
  },
  {
    path: '/categories/:categoryId/subcategories',
    component: Subcategories,
    exact: true,
  },
  {
    path: '/trending',
    component: Trending,
    exact: true,
    preload: 'hover',
    meta: {
      title: 'Trending Terms',
    },
  },

  // Sample terms for SEO discovery
  {
    path: '/sample',
    component: SampleTerms,
    exact: true,
    preload: true,
    meta: {
      title: 'Free AI/ML Sample Terms | AI Glossary Pro',
      description:
        'Explore our curated collection of AI and Machine Learning definitions. Free sample terms from our comprehensive 10,000+ term glossary.',
    },
  },
  {
    path: '/sample/:slug',
    component: SampleTerm,
    exact: true,
    preload: 'hover',
    meta: {
      title: 'AI/ML Term Definition',
      description: 'Learn AI and ML concepts with detailed definitions, examples, and use cases.',
    },
  },

  // Protected routes
  {
    path: '/dashboard',
    component: Dashboard,
    exact: true,
    protected: true,
    meta: {
      title: 'Dashboard',
    },
  },
  {
    path: '/favorites',
    component: Favorites,
    exact: true,
    protected: true,
    meta: {
      title: 'My Favorites',
    },
  },
  {
    path: '/settings',
    component: Settings,
    exact: true,
    protected: true,
    meta: {
      title: 'Settings',
    },
  },
  {
    path: '/profile',
    component: Profile,
    exact: true,
    protected: true,
    meta: {
      title: 'Profile',
    },
  },
  {
    path: '/progress',
    component: UserProgressDashboard,
    exact: true,
    protected: true,
    meta: {
      title: 'My Progress',
    },
  },

  // Admin routes
  {
    path: '/admin',
    component: Admin,
    exact: true,
    protected: true,
    roles: ['admin'],
    meta: {
      title: 'Admin Dashboard',
    },
  },
  {
    path: '/analytics',
    component: AnalyticsDashboard,
    exact: true,
    protected: true,
    roles: ['admin'],
    meta: {
      title: 'Analytics',
    },
  },
  {
    path: '/admin/support',
    component: AdminSupportCenter,
    exact: true,
    protected: true,
    roles: ['admin'],
    meta: {
      title: 'Support Center',
    },
  },

  // AI/ML features
  {
    path: '/ai-tools',
    component: AITools,
    exact: true,
    preload: 'idle',
    meta: {
      title: 'AI Tools',
    },
  },
  {
    path: '/ai-search',
    component: AISearch,
    exact: true,
    preload: 'idle',
    meta: {
      title: 'AI Search',
    },
  },
  {
    path: '/discovery',
    component: Discovery,
    exact: true,
    preload: 'idle',
    meta: {
      title: 'Discover',
    },
  },
  {
    path: '/discovery/:termId',
    component: Discovery,
    exact: true,
  },
  {
    path: '/surprise-me',
    component: SurpriseMe,
    exact: true,
    meta: {
      title: 'Surprise Me',
    },
  },

  // Learning features
  {
    path: '/learning-paths',
    component: LearningPaths,
    exact: true,
    preload: 'idle',
    meta: {
      title: 'Learning Paths',
    },
  },
  {
    path: '/learning-paths/:id',
    component: LearningPathDetail,
    exact: true,
  },
  {
    path: '/code-examples',
    component: CodeExamples,
    exact: true,
    preload: 'idle',
    meta: {
      title: 'Code Examples',
    },
  },

  // Heavy features (lazy load only when needed)
  {
    path: '/3d-visualization',
    component: ThreeDVisualization,
    exact: true,
    preload: false,
    meta: {
      title: '3D Visualization',
    },
  },

  // Legal pages
  {
    path: '/about',
    component: About,
    exact: true,
    meta: {
      title: 'About Us',
    },
  },
  {
    path: '/privacy',
    component: PrivacyPolicy,
    exact: true,
    meta: {
      title: 'Privacy Policy',
    },
  },
  {
    path: '/terms',
    component: TermsOfService,
    exact: true,
    meta: {
      title: 'Terms of Service',
    },
  },

  // 404 - must be last
  {
    path: '*',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
    },
  },
];

// Preload strategies
export const preloadStrategies = {
  // Preload on app start
  immediate: [() => import('@/pages/Home'), () => import('@/components/FirebaseLoginPage')],

  // Preload when user is authenticated
  authenticated: [
    () => import('@/pages/Dashboard'),
    () => import('@/pages/Favorites'),
    () => import('@/pages/UserProgressDashboard'),
  ],

  // Preload for admin users
  admin: [() => import('@/pages/Admin'), () => import('@/pages/AnalyticsDashboard')],

  // Preload on idle
  idle: [
    () => import('@/pages/Terms'),
    () => import('@/pages/Categories'),
    () => import('@/pages/Trending'),
    () => import('@/pages/AITools'),
  ],
};

// Route types
export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<any>;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  preload?: boolean | 'hover' | 'idle';
  alias?: string;
  meta?: {
    title?: string | undefined;
    description?: string | undefined;
  };
}
