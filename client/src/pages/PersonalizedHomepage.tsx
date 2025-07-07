/**
 * Personalized Homepage
 * AI-powered adaptive homepage with personalized content and navigation
 */

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PersonalizedDashboard from '../components/PersonalizedDashboard';
import RecommendedForYou from '../components/RecommendedForYou';
import TrendingWidget from '../components/TrendingWidget';
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