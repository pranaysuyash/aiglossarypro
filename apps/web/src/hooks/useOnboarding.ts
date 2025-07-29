import { useState } from 'react';

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Don't use useAuth here to avoid QueryClient dependency issues
  // Will be handled by the component that uses this hook

  const completeOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const dismissOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setShowOnboarding(true);
  };

  const checkAndShowOnboarding = (isAuthenticated: boolean) => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

    // Show onboarding for new authenticated users who haven't seen it
    if (isAuthenticated && !hasSeenOnboarding) {
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  };

  return {
    showOnboarding,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
    checkAndShowOnboarding,
  };
}