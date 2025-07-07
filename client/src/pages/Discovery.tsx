import React from 'react';
import { ConceptDiscovery } from '../components/discovery/ConceptDiscovery';
import { useParams } from 'wouter';

export default function Discovery() {
  const { termId } = useParams<{ termId?: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ConceptDiscovery initialTermId={termId} />
    </div>
  );
}