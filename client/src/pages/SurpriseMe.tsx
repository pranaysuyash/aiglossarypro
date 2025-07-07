import React from 'react';
import { useLocation } from 'wouter';
import SurpriseMe from '@/components/SurpriseMe';
import { ITerm } from '@/interfaces/interfaces';

export default function SurpriseMePage() {
  const [, setLocation] = useLocation();

  const handleTermSelect = (term: ITerm) => {
    setLocation(`/terms/${term.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SurpriseMe 
        showModeSelector={true}
        compact={false}
        onTermSelect={handleTermSelect}
        maxResults={3}
      />
    </div>
  );
}