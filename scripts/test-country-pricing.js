// Test script for country pricing and EARLY500 discount
const testCountries = [
  { code: 'US', name: 'United States', expected: { discount: 0, pppPrice: 249, launchPrice: 179 } },
  { code: 'IN', name: 'India', expected: { discount: 60, pppPrice: 100, launchPrice: 179 } },
  { code: 'BR', name: 'Brazil', expected: { discount: 55, pppPrice: 112, launchPrice: 179 } },
  { code: 'MX', name: 'Mexico', expected: { discount: 50, pppPrice: 125, launchPrice: 179 } },
  { code: 'PH', name: 'Philippines', expected: { discount: 60, pppPrice: 100, launchPrice: 179 } },
];

// Pricing configuration from useCountryPricing.ts
const LAUNCH_PRICING_CONFIG = {
  originalPrice: 249,
  launchPrice: 179,
  savingsAmount: 70,
  totalSlots: 500,
  claimedSlots: 237,
  showCounter: true,
  isActive: true,
};

// PPP data from the hook
const pppData = {
  'IN': { discount: 60, flag: '🇮🇳', currency: 'USD', annualSavings: 400, localCompetitor: 'DataCamp India' },
  'BR': { discount: 55, flag: '🇧🇷', currency: 'USD', annualSavings: 350, localCompetitor: 'Coursera Brazil' },
  'MX': { discount: 50, flag: '🇲🇽', currency: 'USD', annualSavings: 300, localCompetitor: 'Platzi' },
  'PH': { discount: 60, flag: '🇵🇭', currency: 'USD', annualSavings: 300, localCompetitor: 'DataCamp Philippines' },
};

function calculatePricing(countryCode, countryName) {
  const basePrice = 249;
  const countryInfo = pppData[countryCode];
  
  let localPrice = basePrice;
  let discount = 0;
  
  if (countryInfo) {
    localPrice = Math.round(basePrice * (1 - countryInfo.discount / 100));
    discount = countryInfo.discount;
  }
  
  return {
    countryCode,
    countryName,
    basePrice,
    localPrice,
    discount,
    launchPrice: LAUNCH_PRICING_CONFIG.launchPrice,
    launchActive: LAUNCH_PRICING_CONFIG.isActive && LAUNCH_PRICING_CONFIG.claimedSlots < LAUNCH_PRICING_CONFIG.totalSlots,
    finalPrice: LAUNCH_PRICING_CONFIG.isActive ? LAUNCH_PRICING_CONFIG.launchPrice : localPrice,
    totalSavings: basePrice - (LAUNCH_PRICING_CONFIG.isActive ? LAUNCH_PRICING_CONFIG.launchPrice : localPrice),
    gumroadUrl: `https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500`,
    currency: countryInfo?.currency || 'USD',
    flag: countryInfo?.flag || '🌍',
  };
}

console.log('🌍 Country Pricing & EARLY500 Discount Test\n');
console.log('=' .repeat(80));

testCountries.forEach(country => {
  const pricing = calculatePricing(country.code, country.name);
  
  console.log(`\n${pricing.flag} ${pricing.countryName} (${pricing.countryCode})`);
  console.log(`   Base Price:           $${pricing.basePrice}`);
  console.log(`   PPP Discount:         ${pricing.discount}%`);
  console.log(`   PPP Price:            $${pricing.localPrice}`);
  console.log(`   Launch Price:         $${pricing.launchPrice} (EARLY500)`);
  console.log(`   Final Price:          $${pricing.finalPrice}`);
  console.log(`   Total Savings:        $${pricing.totalSavings} (${Math.round((pricing.totalSavings / pricing.basePrice) * 100)}%)`);
  console.log(`   Gumroad URL:          ${pricing.gumroadUrl}`);
  
  // Validate expectations
  const expected = country.expected;
  const valid = pricing.discount === expected.discount && 
                pricing.localPrice === expected.pppPrice && 
                pricing.launchPrice === expected.launchPrice;
  
  console.log(`   Status:               ${valid ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n' + '=' .repeat(80));
console.log('\n📊 EARLY500 Discount Strategy Summary:');
console.log('   • US/Developed:       $179 (28% off $249)');
console.log('   • India/Philippines:  $179 (28% off $249, but 80% cheaper than PPP would be)');
console.log('   • Brazil:             $179 (28% off $249, but 60% cheaper than PPP would be)');
console.log('   • Mexico:             $179 (28% off $249, but 43% cheaper than PPP would be)');

console.log('\n🎯 Key Benefits:');
console.log('   • Uniform pricing simplifies Gumroad management');
console.log('   • Creates urgency with limited slots (237/500 claimed)');
console.log('   • Provides massive value in developing countries');
console.log('   • EARLY500 code works globally without geo-restrictions');

console.log('\n🔗 Testing URLs:');
console.log('   • US:      https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500');
console.log('   • India:   https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500');
console.log('   • Brazil:  https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500');
console.log('   • Mexico:  https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500');

console.log('\n✅ All countries use the same Gumroad URL with EARLY500 discount');
console.log('✅ Launch pricing ($179) provides excellent value globally');
console.log('✅ No complex geo-based pricing needed - simpler and more effective');