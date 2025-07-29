// Enhanced components exports

// Pages
export { default as EnhancedTermDetail } from '../pages/EnhancedTermDetail';
export { default as AIContentFeedback } from './AIContentFeedback';
export { default as CategoryCard } from './CategoryCard';
export { default as EnhancedTermCard } from './EnhancedTermCard';
export { default as Footer } from './Footer';
export { default as Header } from './Header';
export { default as CodeBlock } from './interactive/CodeBlock';
export { default as InteractiveElementsManager } from './interactive/InteractiveElementsManager';
export { default as InteractiveQuiz } from './interactive/InteractiveQuiz';
// Interactive components
export { default as MermaidDiagram } from './interactive/MermaidDiagram';
// Mobile components
export {
  default as MobileOptimizedLayout,
  MobileExpandableSection,
  ResponsiveContainer,
  ResponsiveText,
  useResponsiveCardLayout,
} from './mobile/MobileOptimizedLayout';
export { default as ProgressTracker } from './ProgressTracker';
export { default as SearchBar } from './SearchBar';
export { default as ShareMenu } from './ShareMenu';
export { default as Sidebar } from './Sidebar';
export { default as AdvancedSearch } from './search/AdvancedSearch';
// Section components
export { default as SectionDisplay } from './sections/SectionDisplay';
export { default as SectionLayoutManager } from './sections/SectionLayoutManager';
// Settings components
export { default as UserPersonalizationSettings } from './settings/UserPersonalizationSettings';
// Existing components (re-exports for convenience)
export { default as TermCard } from './TermCard';
export { ThemeProvider } from './ThemeProvider';
