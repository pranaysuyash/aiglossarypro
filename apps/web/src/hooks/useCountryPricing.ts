import { useEffect, useState } from 'react';

interface CountryPricing {
  basePrice: number;
  localPrice: number;
  originalPrice?: number;
  discount: number;
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  loading: boolean;
  annualSavings: number; // vs competitors
  localCompetitor: string;
  isDiscounted?: boolean;
  launchPricing: {
    isActive: boolean;
    launchPrice: number;
    originalPrice: number;
    savingsAmount: number;
    claimedSlots: number;
    totalSlots: number;
    showCounter: boolean;
  };
}

// Launch pricing configuration defaults (will be overridden by server data)
const LAUNCH_PRICING_CONFIG = {
  originalPrice: 249,
  launchPrice: 179,
  savingsAmount: 70,
  totalSlots: 500,
  claimedSlots: 0, // Default to 0, will be updated from server
  showCounter: true,
  isActive: true, // Control launch pricing globally
};

export function useCountryPricing() {
  const [pricing, setPricing] = useState<CountryPricing>({
    basePrice: 249,
    localPrice: 249,
    originalPrice: 249,
    discount: 0,
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    loading: true,
    annualSavings: 300,
    localCompetitor: 'DataCamp',
    isDiscounted: false,
    launchPricing: {
      isActive: LAUNCH_PRICING_CONFIG.isActive,
      launchPrice: LAUNCH_PRICING_CONFIG.launchPrice,
      originalPrice: LAUNCH_PRICING_CONFIG.originalPrice,
      savingsAmount: LAUNCH_PRICING_CONFIG.savingsAmount,
      claimedSlots: LAUNCH_PRICING_CONFIG.claimedSlots,
      totalSlots: LAUNCH_PRICING_CONFIG.totalSlots,
      showCounter: LAUNCH_PRICING_CONFIG.showCounter,
    },
  });

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const [locationResponse, earlyBirdResponse] = await Promise.all([
          fetch('/api/location'),
          fetch('/api/early-bird-status'),
        ]);

        const locationData = await locationResponse.json();
        const earlyBirdData = await earlyBirdResponse.json();

        const countryPricing = calculatePPPPricing(locationData.country_code, locationData.country_name);
        setPricing({
          ...countryPricing,
          loading: false,
          launchPricing: {
            ...countryPricing.launchPricing,
            claimedSlots: earlyBirdData?.data?.totalPurchased || 0,
            isActive: earlyBirdData?.data?.isActive || false,
          },
        });
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
        setPricing(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPricingData();
  }, []);

  return pricing;
}

function calculatePPPPricing(
  countryCode: string,
  countryName: string
): Omit<CountryPricing, 'loading'> {
  const basePrice = 249;

  // Calculate launch pricing (use defaults, will be overridden by server data)
  const launchPricing = {
    isActive: LAUNCH_PRICING_CONFIG.isActive,
    launchPrice: LAUNCH_PRICING_CONFIG.launchPrice,
    originalPrice: LAUNCH_PRICING_CONFIG.originalPrice,
    savingsAmount: LAUNCH_PRICING_CONFIG.savingsAmount,
    claimedSlots: LAUNCH_PRICING_CONFIG.claimedSlots, // This will be updated from server
    totalSlots: LAUNCH_PRICING_CONFIG.totalSlots,
    showCounter: LAUNCH_PRICING_CONFIG.showCounter,
  };

  // Enhanced PPP data with competitor analysis
  const pppData: Record<
    string,
    {
      discount: number;
      flag: string;
      currency: string;
      annualSavings: number;
      localCompetitor: string;
    }
  > = {
    IN: {
      discount: 60,
      flag: '🇮🇳',
      currency: 'USD',
      annualSavings: 400, // vs ₹25,000/year courses
      localCompetitor: 'DataCamp India',
    },
    BR: {
      discount: 55,
      flag: '🇧🇷',
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Coursera Brazil',
    },
    MX: {
      discount: 50,
      flag: '🇲🇽',
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Platzi',
    },
    AR: {
      discount: 65,
      flag: '🇦🇷',
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Argentina',
    },
    TR: {
      discount: 45,
      flag: '🇹🇷',
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'Udemy Turkey',
    },
    PH: {
      discount: 60,
      flag: '🇵🇭',
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'DataCamp Philippines',
    },
    VN: {
      discount: 65,
      flag: '🇻🇳',
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Vietnam',
    },
    TH: {
      discount: 50,
      flag: '🇹🇭',
      currency: 'USD',
      annualSavings: 275,
      localCompetitor: 'DataCamp Thailand',
    },
    ID: {
      discount: 60,
      flag: '🇮🇩',
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Coursera Indonesia',
    },
    MY: {
      discount: 45,
      flag: '🇲🇾',
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'DataCamp Malaysia',
    },
    PK: {
      discount: 65,
      flag: '🇵🇰',
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Local AI courses',
    },
    BD: {
      discount: 70,
      flag: '🇧🇩',
      currency: 'USD',
      annualSavings: 400,
      localCompetitor: 'Local tech courses',
    },
    EG: {
      discount: 60,
      flag: '🇪🇬',
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'Coursera Egypt',
    },
    NG: {
      discount: 65,
      flag: '🇳🇬',
      currency: 'USD',
      annualSavings: 350,
      localCompetitor: 'Local AI bootcamps',
    },
    KE: {
      discount: 60,
      flag: '🇰🇪',
      currency: 'USD',
      annualSavings: 300,
      localCompetitor: 'DataCamp Kenya',
    },
    UA: {
      discount: 55,
      flag: '🇺🇦',
      currency: 'USD',
      annualSavings: 250,
      localCompetitor: 'Coursera Ukraine',
    },
    RO: {
      discount: 40,
      flag: '🇷🇴',
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms',
    },
    PL: {
      discount: 35,
      flag: '🇵🇱',
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms',
    },
    CZ: {
      discount: 35,
      flag: '🇨🇿',
      currency: 'USD',
      annualSavings: 200,
      localCompetitor: 'European platforms',
    },
    BG: {
      discount: 45,
      flag: '🇧🇬',
      currency: 'USD',
      annualSavings: 180,
      localCompetitor: 'European platforms',
    },
    RS: {
      discount: 50,
      flag: '🇷🇸',
      currency: 'USD',
      annualSavings: 150,
      localCompetitor: 'Regional platforms',
    },
    HR: {
      discount: 35,
      flag: '🇭🇷',
      currency: 'USD',
      annualSavings: 180,
      localCompetitor: 'European platforms',
    },
  };

  const countryInfo = pppData[countryCode];

  if (countryInfo) {
    const localPrice = Math.round(basePrice * (1 - countryInfo.discount / 100));
    return {
      basePrice,
      localPrice,
      originalPrice: basePrice,
      discount: countryInfo.discount,
      countryCode,
      countryName,
      flag: countryInfo.flag,
      currency: countryInfo.currency,
      annualSavings: countryInfo.annualSavings,
      localCompetitor: countryInfo.localCompetitor,
      isDiscounted: true,
      launchPricing,
    };
  }

  // Default to US pricing for developed countries
  return {
    basePrice,
    localPrice: basePrice,
    originalPrice: basePrice,
    discount: 0,
    countryCode: countryCode || 'US',
    countryName: countryName || 'United States',
    flag: getCountryFlag(countryCode),
    currency: 'USD',
    annualSavings: 300, // vs DataCamp $300+/year
    localCompetitor: 'DataCamp/Coursera',
    isDiscounted: false,
    launchPricing,
  };
}

function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    CA: '🇨🇦',
    GB: '🇬🇧',
    AU: '🇦🇺',
    DE: '🇩🇪',
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    NL: '🇳🇱',
    SE: '🇸🇪',
    NO: '🇳🇴',
    DK: '🇩🇰',
    FI: '🇫🇮',
    CH: '🇨🇭',
    AT: '🇦🇹',
    IE: '🇮🇪',
    JP: '🇯🇵',
    KR: '🇰🇷',
    SG: '🇸🇬',
    NZ: '🇳🇿',
  };
  return flags[countryCode] || '🌍';
}
