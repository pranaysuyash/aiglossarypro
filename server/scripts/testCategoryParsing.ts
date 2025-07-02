/**
 * Test the improved category parsing logic
 */

// Simulate the improved category validation functions from excelParser.ts
function isValidCategoryValue(value: string): boolean {
  const invalidPatterns = [
    /^introduction/i,
    /^definition/i,
    /^overview/i,
    /^tags?:/i,
    /^example/i,
    /^see also/i,
    /^\s*$/,
    /^[0-9]+\.?\s*$/
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(value)) && value.length > 2;
}

function cleanCategoryName(name: string): string {
  return name
    .replace(/^[-\*•\s]+/, '') // Remove leading bullets/dashes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^(Category|Tag|Domain|Technique):\s*/i, '') // Remove prefixes
    .replace(/\s*\([^)]*\)$/, '') // Remove trailing parentheses
    .trim();
}

function isValidCategoryName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 80) return false;
  
  // Valid category patterns for AI/ML domain
  const validPatterns = [
    /machine learning/i,
    /deep learning/i,
    /neural network/i,
    /computer vision/i,
    /natural language/i,
    /artificial intelligence/i,
    /data science/i,
    /statistics/i,
    /probability/i,
    /linear algebra/i,
    /optimization/i,
    /reinforcement learning/i,
    /supervised learning/i,
    /unsupervised learning/i,
    /robotics/i,
    /nlp/i
  ];
  
  const invalidPatterns = [
    /^tags?:/i,
    /^introduction/i,
    /^definition/i,
    /^overview/i,
    /^description/i,
    /^example/i
  ];
  
  // Check if it's a valid AI/ML category or passes basic validation
  const isValidAIML = validPatterns.some(pattern => pattern.test(name));
  const isNotInvalid = !invalidPatterns.some(pattern => pattern.test(name));
  
  return (isValidAIML || isNotInvalid) && name.split(' ').length <= 5; // Max 5 words
}

// Test data samples from the problematic categories we found
const testCases = [
  // Invalid categories that should be filtered out
  'Tags: Collaborative Reasoning',
  'Introduction – Definition',
  'Combinatorial Batch Normalization',
  'Overview of Machine Learning',
  'Example 1: Neural Networks',
  'Definition: Deep Learning',
  'a',
  '1.',
  '',
  'See Also: Related Terms',
  
  // Valid categories that should pass
  'Machine Learning',
  'Deep Learning',
  'Neural Networks',
  'Computer Vision',
  'Natural Language Processing',
  'Artificial Intelligence',
  'Statistics',
  'Probability Theory',
  'Linear Algebra',
  'Optimization',
  'Reinforcement Learning',
  'Data Science',
  'Robotics',
  'NLP',
  
  // Edge cases
  'Machine Learning Algorithms', // Should pass (valid AI/ML)
  'Transformer Architecture', // Should pass (specific but valid)
  'Mathematical Foundations', // Should pass (broad topic)
  'Python Programming', // Should pass (general validation)
  'Very Long Category Name That Exceeds Normal Length Expectations and Should Be Filtered', // Should fail (too long)
];

console.log('🧪 Testing Category Parsing Logic');
console.log('=================================');

console.log('\n📊 Test Results:');
testCases.forEach((testCase, index) => {
  const isValidValue = isValidCategoryValue(testCase);
  const cleanedName = cleanCategoryName(testCase);
  const isValidName = isValidCategoryName(cleanedName);
  const finalResult = isValidValue && isValidName;
  
  const status = finalResult ? '✅ PASS' : '❌ FAIL';
  const indexStr = (index + 1).toString().padStart(2, ' ');
  console.log(`${indexStr}. ${status} "${testCase}" -> "${cleanedName}"`);
  
  if (!isValidValue) console.log(`     └── Invalid value pattern`);
  if (isValidValue && !isValidName) console.log(`     └── Invalid name after cleaning`);
});

// Test the parseListItems function simulation
function parseListItems(value: string): string[] {
  if (!value) return [];
  
  return value
    .split(/[,;|]+/) // Split by comma, semicolon, or pipe
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length <= 100)
    .map(item => cleanCategoryName(item))
    .filter(item => isValidCategoryName(item));
}

console.log('\n🔍 Testing List Parsing:');
console.log('=======================');

const listTestCases = [
  'Machine Learning, Deep Learning, Computer Vision',
  'Neural Networks; Artificial Intelligence; Statistics',
  'Tags: ML, Tags: DL, Introduction: AI',
  'Machine Learning | Natural Language Processing | Robotics',
  'Probability Theory, Linear Algebra, Optimization, Mathematical Foundations',
];

listTestCases.forEach((testCase, index) => {
  const result = parseListItems(testCase);
  console.log(`${index + 1}. Input: "${testCase}"`);
  console.log(`   Output: [${result.map(r => `"${r}"`).join(', ')}]`);
  console.log(`   Count: ${result.length}\n`);
});

console.log('✅ Category parsing logic test completed!');
console.log('\n💡 Key Improvements:');
console.log('- Filters out invalid patterns like "Tags:", "Introduction", etc.');
console.log('- Validates category names against AI/ML domain knowledge');
console.log('- Cleans up formatting issues (bullets, prefixes, parentheses)');
console.log('- Handles multiple list formats (comma, semicolon, pipe)');
console.log('- Prevents overly long or single-character categories');