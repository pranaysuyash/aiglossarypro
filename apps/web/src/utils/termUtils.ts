import type { IEnhancedTerm, IEnhancedUserSettings, ITerm } from '@/interfaces/interfaces';

export const getDifficultyColor = (level?: string): string => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'expert':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const getProgressPercentage = (
  userSettings?: IEnhancedUserSettings,
  term?: IEnhancedTerm | ITerm
): number => {
  if (!userSettings || !term) {return 0;}

  const userLevel = userSettings.experienceLevel || 'intermediate';
  const termLevel =
    'difficultyLevel' in term
      ? term.difficultyLevel?.toLowerCase() || 'intermediate'
      : 'intermediate';

  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const userIndex = levels.indexOf(userLevel);
  const termIndex = levels.indexOf(termLevel);

  if (userIndex >= termIndex) {return 100;}
  if (userIndex === termIndex - 1) {return 75;}
  if (userIndex === termIndex - 2) {return 50;}
  return 25;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) {return 'N/A';}
  return new Date(dateString).toLocaleDateString();
};

export const formatViewCount = (count?: number): string => {
  if (!count) {return '0';}
  if (count < 1000) {return count.toString();}
  if (count < 1000000) {return `${(count / 1000).toFixed(1)}k`;}
  return `${(count / 1000000).toFixed(1)}m`;
};

// Type guard to check if a term is enhanced
export const isEnhancedTerm = (term: IEnhancedTerm | ITerm): term is IEnhancedTerm => {
  return 'mainCategories' in term && 'difficultyLevel' in term;
};

// Helper to safely get main categories from any term
export const getMainCategories = (term?: IEnhancedTerm | ITerm): string[] => {
  if (!term) {return [];}
  return isEnhancedTerm(term) ? term.mainCategories : [];
};

// Helper to safely get difficulty level from any term
export const getDifficultyLevel = (term?: IEnhancedTerm | ITerm): string | undefined => {
  if (!term) {return undefined;}
  return isEnhancedTerm(term) ? term.difficultyLevel : undefined;
};

// Helper to safely get short definition from any term
export const getShortDefinition = (term?: IEnhancedTerm | ITerm): string | undefined => {
  if (!term) {return undefined;}
  return isEnhancedTerm(term) ? term.shortDefinition : term.shortDefinition;
};
