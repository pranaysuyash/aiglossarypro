import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InteractiveDemo from '../client/src/components/interactive/InteractiveDemo';

// Mock the CodeBlock component since it might have complex dependencies
jest.mock('../client/src/components/interactive/CodeBlock', () => {
  return function MockCodeBlock({ title, code, language, description }: any) {
    return (
      <div data-testid="code-block">
        <h3>{title}</h3>
        <code>{code}</code>
        <p>{description}</p>
      </div>
    );
  };
});

describe('InteractiveDemo', () => {
  it('renders the demo with all 5 terms', () => {
    render(<InteractiveDemo />);
    
    // Check if the main heading is present
    expect(screen.getByText('Interactive AI Glossary Demo')).toBeInTheDocument();
    
    // Check if search box is present
    expect(screen.getByPlaceholderText('Search AI/ML terms...')).toBeInTheDocument();
    
    // Check if all 5 demo terms are rendered
    expect(screen.getByText('Neural Network')).toBeInTheDocument();
    expect(screen.getByText('Transformer')).toBeInTheDocument();
    expect(screen.getByText('Gradient Descent')).toBeInTheDocument();
    expect(screen.getByText('Reinforcement Learning')).toBeInTheDocument();
    expect(screen.getByText('Convolutional Neural Network (CNN)')).toBeInTheDocument();
  });

  it('filters terms based on search input', () => {
    render(<InteractiveDemo />);
    
    const searchInput = screen.getByPlaceholderText('Search AI/ML terms...');
    
    // Search for "neural"
    fireEvent.change(searchInput, { target: { value: 'neural' } });
    
    // Should show Neural Network and CNN
    expect(screen.getByText('Neural Network')).toBeInTheDocument();
    expect(screen.getByText('Convolutional Neural Network (CNN)')).toBeInTheDocument();
    
    // Should not show other terms
    expect(screen.queryByText('Transformer')).not.toBeInTheDocument();
    expect(screen.queryByText('Gradient Descent')).not.toBeInTheDocument();
    expect(screen.queryByText('Reinforcement Learning')).not.toBeInTheDocument();
  });

  it('shows no results message when search yields no matches', () => {
    render(<InteractiveDemo />);
    
    const searchInput = screen.getByPlaceholderText('Search AI/ML terms...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find any terms matching "nonexistent"/)).toBeInTheDocument();
  });

  it('navigates to term detail when term is clicked', () => {
    render(<InteractiveDemo />);
    
    // Click on Neural Network term
    const neuralNetworkCard = screen.getByText('Neural Network').closest('div');
    fireEvent.click(neuralNetworkCard!);
    
    // Should show the detail view
    expect(screen.getByText('← Back to Demo')).toBeInTheDocument();
    expect(screen.getByText('Technical Definition')).toBeInTheDocument();
    expect(screen.getByText('Plain English Explanation')).toBeInTheDocument();
    expect(screen.getByText('Real-World Use Cases')).toBeInTheDocument();
  });

  it('shows search suggestions when no results found', () => {
    render(<InteractiveDemo />);
    
    const searchInput = screen.getByPlaceholderText('Search AI/ML terms...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'xyz' } });
    
    // Should show search suggestions
    expect(screen.getByText('neural network')).toBeInTheDocument();
    expect(screen.getByText('transformer')).toBeInTheDocument();
    expect(screen.getByText('machine learning')).toBeInTheDocument();
    expect(screen.getByText('deep learning')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('navigates back to term list from detail view', () => {
    render(<InteractiveDemo />);
    
    // Click on Neural Network term
    const neuralNetworkCard = screen.getByText('Neural Network').closest('div');
    fireEvent.click(neuralNetworkCard!);
    
    // Should show the detail view
    expect(screen.getByText('← Back to Demo')).toBeInTheDocument();
    
    // Click back button
    fireEvent.click(screen.getByText('← Back to Demo'));
    
    // Should be back to the main demo view
    expect(screen.getByText('Interactive AI Glossary Demo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search AI/ML terms...')).toBeInTheDocument();
  });
});