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
  annualSavings: number; // vs competitors
  localCompetitor: string;
}

export function useCountryPricing() {
  const [pricing, setPricing] = useState<CountryPricing>({
    basePrice: 249,
    localPrice: 249,
    discount: 0,
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    loading: true,
    annualSavings: 300,
    localCompetitor: 'DataCamp',
  });

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Use a more reliable service or fallback to default
        const response = await fetch('https://api.ipdata.co/v1/current?api-key=test', {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        }).catch(() => null);
        
        if (!response || !response.ok) {
          // Fallback to default US pricing
          setPricing(prev => ({ ...prev, loading: false }));
          return;
        }
        
        const data = await response.json();
        
        const countryPricing = calculatePPPPricing(data.country_code, data.country_name);
        setPricing({
          ...countryPricing,
          loading: false,
        });
      } catch (error) {
        console.error('Country detection failed:', error);
        setPricing(prev => ({ ...prev, loading: false }));
      }
    };

    detectCountry();
  }, []);

  return pricing;
}

function calculatePPPPricing(countryCode: string, countryName: string): Omit<CountryPricing, 'loading'> {
  const basePrice = 249;
  
  // Enhanced PPP data with competitor analysis
  const pppData: Record<string, { 
    discount: number; 
    flag: string; 
    currency: string;
    annualSavings: number;
    localCompetitor: string;
  }> = {
    'IN': { 
      discount: 60, 
      flag: '🇮🇳', 
      currency: 'USD',
      annualSavings: 400, // vs ₹25,000/year courses
      localCompetitor: 'DataCamp India'
    },
    'BR': { 
      discount: 55, 
      flag: '🇧🇷', 
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Coursera Brazil'
    },
    'MX': { 
      discount: 50, 
      flag: '🇲🇽', 
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Platzi'
    },
    'AR': { 
      discount: 65, 
      flag: '🇦🇷', 
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Argentina'
    },
    'TR': { 
      discount: 45, 
      flag: '🇹🇷', 
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'Udemy Turkey'
    },
    'PH': { 
      discount: 60, 
      flag: '🇵🇭', 
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'DataCamp Philippines'
    },
    'VN': { 
      discount: 65, 
      flag: '🇻🇳', 
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Vietnam'
    },
    'TH': { 
      discount: 50, 
      flag: '🇹🇭', 
      currency: 'USD',
      annualSavings: 275,
      localCompetitor: 'DataCamp Thailand'
    },
    'ID': { 
      discount: 60, 
      flag: '🇮🇩', 
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Coursera Indonesia'
    },
    'MY': { 
      discount: 45, 
      flag: '🇲🇾', 
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'DataCamp Malaysia'
    },
    'PK': { 
      discount: 65, 
      flag: '🇵🇰', 
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Local AI courses'
    },
    'BD': { 
      discount: 70, 
      flag: '🇧🇩', 
      currency: 'USD',
      annualSavings: 400,
      localCompetitor: 'Local tech courses'
    },
    'EG': { 
      discount: 60, 
      flag: '🇪🇬', 
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Coursera Egypt'
    },
    'NG': { 
      discount: 65, 
      flag: '🇳🇬', 
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Local AI bootcamps'
    },
    'KE': { 
      discount: 60, 
      flag: '🇰🇪', 
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'DataCamp Kenya'
    },
    'UA': { 
      discount: 55, 
      flag: '🇺🇦', 
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Ukraine'
    },
    'RO': { 
      discount: 40, 
      flag: '🇷🇴', 
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms'
    },
    'PL': { 
      discount: 35, 
      flag: '🇵🇱', 
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms'
    },
    'CZ': { 
      discount: 35, 
      flag: '🇨🇿', 
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms'
    },
    'BG': { 
      discount: 45, 
      flag: '🇧🇬', 
      currency: 'USD',
      annualSavings: 180,
      localCompetitor: 'European platforms'
    },
    'RS': { 
      discount: 50, 
      flag: '🇷🇸', 
      currency: 'USD',
      annualSavings: 150,
      localCompetitor: 'Regional platforms'
    },
    'HR': { 
      discount: 35, 
      flag: '🇭🇷', 
      currency: 'USD',
      annualSavings: 180,
      localCompetitor: 'European platforms'
    },
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
      annualSavings: countryInfo.annualSavings,
      localCompetitor: countryInfo.localCompetitor,
    };
  }

  // Default to US pricing for developed countries
  return {
    basePrice,
    localPrice: basePrice,
    discount: 0,
    countryCode: countryCode || 'US',
    countryName: countryName || 'United States',
    flag: getCountryFlag(countryCode),
    currency: 'USD',
    annualSavings: 300, // vs DataCamp $300+/year
    localCompetitor: 'DataCamp/Coursera',
  };
}

function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺', 'DE': '🇩🇪', 
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪',
    'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹',
    'IE': '🇮🇪', 'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬', 'NZ': '🇳🇿',
  };
  return flags[countryCode] || '🌍';
}
