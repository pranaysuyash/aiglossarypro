import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermCard from '../../client/src/components/TermCard';

// Mock term data
const mockTerm = {
  id: '1',
  name: 'Machine Learning',
  shortDefinition: 'A method of data analysis that automates analytical model building',
  definition: 'Machine Learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.',
  category: 'AI/ML',
  subcategories: ['Supervised Learning', 'Unsupervised Learning'],
  viewCount: 142,
  isFavorite: false,
  isLearned: false,
};

describe('TermCard Component', () => {
  it('renders term card with basic information', () => {
    render(<TermCard term={mockTerm} />);
    
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText(/A method of data analysis/)).toBeInTheDocument();
  });

  it('displays view count correctly', () => {
    render(<TermCard term={mockTerm} />);
    
    expect(screen.getByText(/142/)).toBeInTheDocument();
  });

  it('shows category information', () => {
    render(<TermCard term={mockTerm} />);
    
    expect(screen.getByText('AI/ML')).toBeInTheDocument();
  });

  it('renders favorite state correctly', () => {
    const favoriteTerm = { ...mockTerm, isFavorite: true };
    render(<TermCard term={favoriteTerm} />);
    
    // Check for favorite indicator (star icon or similar)
    const favoriteIndicator = screen.getByRole('button', { name: /favorite/i });
    expect(favoriteIndicator).toBeInTheDocument();
  });

  it('renders learned state correctly', () => {
    const learnedTerm = { ...mockTerm, isLearned: true };
    render(<TermCard term={learnedTerm} />);
    
    // Check for learned indicator
    const learnedIndicator = screen.getByRole('button', { name: /learned/i });
    expect(learnedIndicator).toBeInTheDocument();
  });

  it('matches visual snapshot', () => {
    const { container } = render(<TermCard term={mockTerm} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches visual snapshot with favorite and learned states', () => {
    const stateTerm = { ...mockTerm, isFavorite: true, isLearned: true };
    const { container } = render(<TermCard term={stateTerm} />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 