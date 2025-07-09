import { useQuery } from '@tanstack/react-query';
import type {
  IEnhancedTerm,
  IEnhancedUserSettings,
  IInteractiveElement,
  ITerm,
  ITermSection,
} from '@/interfaces/interfaces';
import { apiRequest } from '@/lib/queryClient';

export function useTermData(id: string | undefined, isAuthenticated: boolean) {
  // Try enhanced term first
  const { data: enhancedTerm, isLoading: termLoading } = useQuery<IEnhancedTerm>({
    queryKey: [`/api/enhanced/terms/${id}`],
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!id,
  });

  // Fallback to regular term if enhanced fails
  const { data: regularTerm, isLoading: regularLoading } = useQuery<ITerm>({
    queryKey: [`/api/terms/${id}`],
    refetchOnWindowFocus: false,
    enabled: !enhancedTerm && !termLoading && !!id,
  });

  // Use enhanced data if available, otherwise regular term data
  const term = enhancedTerm || regularTerm;
  const isEnhanced = !!enhancedTerm;

  // Fetch term sections (only if enhanced)
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<ITermSection[]>({
    queryKey: [`/api/terms/${id}/sections`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced && !!id,
  });

  // Fetch interactive elements (only if enhanced)
  const { data: interactiveElements = [], isLoading: elementsLoading } = useQuery<
    IInteractiveElement[]
  >({
    queryKey: [`/api/enhanced/terms/${id}/interactive`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced && !!id,
  });

  // Fetch term relationships (only if enhanced)
  const { data: relationships = [] } = useQuery<ITerm[]>({
    queryKey: [`/api/enhanced/terms/${id}/relationships`],
    refetchOnWindowFocus: false,
    enabled: isEnhanced && !!id,
  });

  // Fetch recommended terms (try enhanced first, fallback to regular)
  const { data: recommended = [] } = useQuery<ITerm[]>({
    queryKey: isEnhanced
      ? [`/api/enhanced/terms/${id}/recommended`]
      : [`/api/terms/${id}/recommended`],
    refetchOnWindowFocus: false,
    enabled: !!id,
  });

  // Fetch user settings
  const { data: userSettings } = useQuery<IEnhancedUserSettings>({
    queryKey: [`/api/user/enhanced-settings`],
    enabled: isAuthenticated,
  });

  // Check if term is in user's favorites
  const { data: favorite, isLoading: favoriteLoading } = useQuery<boolean>({
    queryKey: [`/api/favorites/${id}`],
    enabled: isAuthenticated && !!id,
  });

  // Check if term is marked as learned
  const { data: learned, isLoading: learnedLoading } = useQuery<boolean>({
    queryKey: [`/api/progress/${id}`],
    enabled: isAuthenticated && !!id,
  });

  const isLoading =
    termLoading || regularLoading || (isEnhanced && (sectionsLoading || elementsLoading));

  return {
    term,
    isEnhanced,
    sections,
    interactiveElements,
    relationships,
    recommended,
    userSettings,
    favorite,
    favoriteLoading,
    learned,
    learnedLoading,
    isLoading,
  };
}

export function useTermActions(id: string | undefined, _isAuthenticated: boolean) {
  const trackView = async () => {
    if (!id) return;
    try {
      await apiRequest('POST', `/api/enhanced/terms/${id}/view`, null);
    } catch (error) {
      console.error('Failed to log term view', error);
    }
  };

  const handleSectionInteraction = (sectionId: string, interactionType: string, data?: any) => {
    apiRequest('POST', `/api/enhanced/sections/${sectionId}/interaction`, {
      type: interactionType,
      data,
    }).catch(console.error);
  };

  const handleInteractiveElementInteraction = (elementId: string, type: string, data?: any) => {
    apiRequest('POST', `/api/enhanced/interactive/${elementId}/interaction`, {
      type,
      data,
    }).catch(console.error);
  };

  return {
    trackView,
    handleSectionInteraction,
    handleInteractiveElementInteraction,
  };
}
