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
}

export function useCountryPricing() {
  const [pricing, setPricing] = useState<CountryPricing>({
    basePrice: 129,
    localPrice: 129,
    discount: 0,
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    loading: true,
  });

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Using ipapi.co for free IP geolocation
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const countryPricing = calculatePPPPricing(data.country_code, data.country_name);
        setPricing({
          ...countryPricing,
          loading: false,
        });
      } catch (error) {
        console.error('Country detection failed:', error);
        // Default to US pricing
        setPricing(prev => ({ ...prev, loading: false }));
      }
    };

    detectCountry();
  }, []);

  return pricing;
}

function calculatePPPPricing(countryCode: string, countryName: string): Omit<CountryPricing, 'loading'> {
  const basePrice = 129;
  
  // PPP discount rates based on Small Bets model
  const pppData: Record<string, { discount: number; flag: string; currency: string }> = {
    'IN': { discount: 60, flag: '🇮🇳', currency: 'USD' }, // India
    'BR': { discount: 55, flag: '🇧🇷', currency: 'USD' }, // Brazil
    'MX': { discount: 50, flag: '🇲🇽', currency: 'USD' }, // Mexico
    'AR': { discount: 65, flag: '🇦🇷', currency: 'USD' }, // Argentina
    'TR': { discount: 45, flag: '🇹🇷', currency: 'USD' }, // Turkey
    'PH': { discount: 60, flag: '🇵🇭', currency: 'USD' }, // Philippines
    'VN': { discount: 65, flag: '🇻🇳', currency: 'USD' }, // Vietnam
    'TH': { discount: 50, flag: '🇹🇭', currency: 'USD' }, // Thailand
    'ID': { discount: 60, flag: '🇮🇩', currency: 'USD' }, // Indonesia
    'MY': { discount: 45, flag: '🇲🇾', currency: 'USD' }, // Malaysia
    'PK': { discount: 65, flag: '🇵🇰', currency: 'USD' }, // Pakistan
    'BD': { discount: 70, flag: '🇧🇩', currency: 'USD' }, // Bangladesh
    'LK': { discount: 65, flag: '🇱🇰', currency: 'USD' }, // Sri Lanka
    'EG': { discount: 60, flag: '🇪🇬', currency: 'USD' }, // Egypt
    'NG': { discount: 65, flag: '🇳🇬', currency: 'USD' }, // Nigeria
    'KE': { discount: 60, flag: '🇰🇪', currency: 'USD' }, // Kenya
    'GH': { discount: 65, flag: '🇬🇭', currency: 'USD' }, // Ghana
    'UA': { discount: 55, flag: '🇺🇦', currency: 'USD' }, // Ukraine
    'RO': { discount: 40, flag: '🇷🇴', currency: 'USD' }, // Romania
    'BG': { discount: 45, flag: '🇧🇬', currency: 'USD' }, // Bulgaria
    'RS': { discount: 50, flag: '🇷🇸', currency: 'USD' }, // Serbia
    'HR': { discount: 35, flag: '🇭🇷', currency: 'USD' }, // Croatia
  };

  const countryInfo = pppData[countryCode];
  
  if (countryInfo) {
    const localPrice = Math.round(basePrice * (1 - countryInfo.discount / 100));
    return {
      basePrice,
      localPrice,
      discount: countryInfo.discount,
      countryCode,
      countryName,
      flag: countryInfo.flag,
      currency: countryInfo.currency,
    };
  }

  // Default to US pricing
  return {
    basePrice,
    localPrice: basePrice,
    discount: 0,
    countryCode: countryCode || 'US',
    countryName: countryName || 'United States',
    flag: '🇺🇸',
    currency: 'USD',
  };
}