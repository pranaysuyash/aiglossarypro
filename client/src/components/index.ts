// Enhanced components exports
export { default as EnhancedTermCard } from './EnhancedTermCard';
export { default as AdvancedSearch } from './search/AdvancedSearch';

// Interactive components
export { default as MermaidDiagram } from './interactive/MermaidDiagram';
export { default as CodeBlock } from './interactive/CodeBlock';
export { default as InteractiveQuiz } from './interactive/InteractiveQuiz';
export { default as InteractiveElementsManager } from './interactive/InteractiveElementsManager';

// Section components
export { default as SectionDisplay } from './sections/SectionDisplay';
export { default as SectionLayoutManager } from './sections/SectionLayoutManager';

// Settings components
export { default as UserPersonalizationSettings } from './settings/UserPersonalizationSettings';

// Mobile components
export { 
  default as MobileOptimizedLayout,
  useResponsiveCardLayout,
  ResponsiveText,
  ResponsiveContainer,
  MobileExpandableSection
} from './mobile/MobileOptimizedLayout';

// Pages
export { default as EnhancedTermDetail } from '../pages/EnhancedTermDetail';

// Existing components (re-exports for convenience)
export { default as TermCard } from './TermCard';
export { default as SearchBar } from './SearchBar';
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as Sidebar } from './Sidebar';
export { default as CategoryCard } from './CategoryCard';
export { default as ProgressTracker } from './ProgressTracker';
export { default as ShareMenu } from './ShareMenu';
export { ThemeProvider } from './ThemeProvider';