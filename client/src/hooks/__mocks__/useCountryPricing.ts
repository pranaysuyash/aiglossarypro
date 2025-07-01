import { useState, useEffect } from 'react';

interface CountryPricing {
  basePrice: number;
  localPrice: number;
  discount: number;
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  loading: boolean;
  annualSavings: number;
  localCompetitor: string;
}

// Default mock pricing
const defaultMockPricing: CountryPricing = {
  basePrice: 299,
  localPrice: 249,
  discount: 17,
  countryName: 'United States',
  countryCode: 'US',
  flag: '🇺🇸',
  currency: 'USD',
  loading: false,
  annualSavings: 351,
  localCompetitor: 'DataCamp',
};

// This variable will hold the current mock value
let currentMockPricing: CountryPricing = defaultMockPricing;

// Function to set the mock value for tests/stories
export const setMockCountryPricing = (mock: Partial<CountryPricing>) => {
  currentMockPricing = { ...defaultMockPricing, ...mock };
};

// The mocked useCountryPricing hook
export function useCountryPricing(): CountryPricing {
  // In a real mock, you might return a static value or a value from a context
  // For Storybook, we'll use the `currentMockPricing` set by `setMockCountryPricing`
  return currentMockPricing;
}
