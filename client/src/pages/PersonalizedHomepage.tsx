/**
 * Personalized Homepage
 * AI-powered adaptive homepage with personalized content and navigation
 */

import type React from 'react';
import { useEffect } from 'react';
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import { useAuth } from '../hooks/useAuth';

const PersonalizedHomepage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect to regular homepage if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PersonalizedDashboard />
    </div>
  );
};

export default PersonalizedHomepage;
