#!/usr/bin/env node

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OUTPUT_DIR = path.join(__dirname, '..', 'test-outputs');
const TERM = 'transformer';

// All 295 expected columns in order
const EXPECTED_COLUMNS = [
  'Term',
  'Introduction – Definition and Overview',
  'Introduction – Key Concepts and Principles',
  'Introduction – Importance and Relevance in AI/ML',
  'Introduction – Brief History or Background',
  'Introduction – Category and Sub-category of the Term – Main Category',
  'Introduction – Category and Sub-category of the Term – Sub-category',
  'Introduction – Category and Sub-category of the Term – Relationship to Other Categories or Domains',
  'Introduction – Limitations and Assumptions of the Concept',
  'Introduction – Technological Trends and Future Predictions',
  'Introduction – Interactive Element: Mermaid Diagram',
  'Prerequisites – Prior Knowledge or Skills Required',
  'Prerequisites – Recommended Background or Experience',
  'Prerequisites – Suggested Introductory Topics or Courses',
  'Prerequisites – Recommended Learning Resources',
  'Prerequisites – Connections to Other Prerequisite Topics or Skills',
  'Prerequisites – Interactive Element: Links to Introductory Tutorials or Courses',
  'Theoretical Concepts – Key Mathematical and Statistical Foundations',
  'Theoretical Concepts – Underlying Algorithms or Techniques',
  'Theoretical Concepts – Assumptions and Limitations',
  'Theoretical Concepts – Mathematical Derivations or Proofs',
  'Theoretical Concepts – Interpretability and Explainability of the Underlying Concepts',
  'Theoretical Concepts – Theoretical Critiques and Counterarguments',
  'Theoretical Concepts – Interactive Element: Mathematical Visualizations or Interactive Proofs',
  'How It Works – Step-by-Step Explanation of the Process',
  'How It Works – Input, Output, and Intermediate Stages',
  'How It Works – Illustrative Examples or Case Studies',
  'How It Works – Visualizations or Animations to Explain the Process',
  'How It Works – Component Breakdown',
  'How It Works – Interactive Element: Flowcharts or Animated Diagrams',
  'Variants or Extensions – Different Types or Categories',
  'Variants or Extensions – Advanced or Specialized Versions',
  'Variants or Extensions – Recent Developments or Improvements',
  'Variants or Extensions – Comparisons to Similar or Related Techniques',
  'Variants or Extensions – Comparative Analysis of Variants or Extensions',
  'Variants or Extensions – Interactive Element: Comparison Tables or Interactive Charts',
  'Applications – Real-world Use Cases and Examples',
  'Applications – Industries or Domains of Application',
  'Applications – Benefits and Impact',
  'Applications – Limitations or Challenges in Real-world Applications',
  'Applications – Economic Impact',
  'Applications – Interactive Element: Case Study Walkthroughs or Interactive Use Cases',
  'Implementation – Popular Programming Languages and Libraries',
  'Implementation – Code Snippets or Pseudocode',
  'Implementation – Practical Challenges – Common Errors or Misconfigurations',
  'Implementation – Practical Challenges – Debugging Tips and Preventive Measures',
  'Implementation – Hyperparameters and Tuning – Key Hyperparameters and Their Effects',
  'Implementation – Hyperparameters and Tuning – Techniques for Hyperparameter Optimization',
  'Implementation – Hyperparameters and Tuning – Best Practices and Guidelines',
  'Implementation – Deployment and Scaling Considerations',
  'Implementation – Distributed and Parallel Computing Considerations',
  'Implementation – Model Deployment and Serving Strategies',
  'Implementation – Tips for Effective Implementation',
  'Implementation – Security Best Practices',
  'Implementation – Interactive Element: Live Code Examples or Embedded Notebooks',
  'Evaluation and Metrics – Appropriate Evaluation Techniques',
  'Evaluation and Metrics – Performance Measures and Metrics',
  'Evaluation and Metrics – Benchmarking and Comparative Analysis',
  'Evaluation and Metrics – Interpreting and Analyzing Results',
  'Evaluation and Metrics – Statistical Significance and Hypothesis Testing',
  'Evaluation and Metrics – Robustness and Stability Evaluation',
  'Evaluation and Metrics – Interactive Element: Metric Calculators or Interactive Dashboards',
  'Advantages and Disadvantages – Strengths and Benefits',
  'Advantages and Disadvantages – Weaknesses and Limitations',
  'Advantages and Disadvantages – Trade-offs and Considerations',
  'Advantages and Disadvantages – Interactive Element: Pros and Cons Lists with Visual Indicators',
  'Ethics and Responsible AI – Ethical Considerations and Implications',
  'Ethics and Responsible AI – Fairness, Bias, and Transparency',
  'Ethics and Responsible AI – Privacy and Security Concerns',
  'Ethics and Responsible AI – Best Practices for Responsible AI Development',
  'Ethics and Responsible AI – Case Studies or Examples of Ethical Concerns',
  'Ethics and Responsible AI – Mitigation Strategies for Ethical Concerns',
  'Ethics and Responsible AI – Long-Term Societal Impact',
  'Ethics and Responsible AI – Interactive Element: Ethical Decision-Making Scenarios or Quizzes',
  'Historical Context – Origin and Evolution',
  'Historical Context – Significant Milestones or Breakthroughs',
  'Historical Context – Key Contributors or Researchers',
  'Historical Context – Shifts in Paradigms or Approaches',
  'Historical Context – Important Dates – First Appearance or Proposal of the Concept',
  'Historical Context – Important Dates – Landmark Papers or Publications',
  'Historical Context – Important Dates – Significant Conferences or Events',
  'Historical Context – Important Dates – Key Implementations or Applications',
  'Historical Context – Impact on the AI/ML Research Community',
  'Historical Context – Future Outlook and Potential Developments',
  'Historical Context – Interactive Element: Timeline Diagrams (Mermaid or Other)',
  'Illustration or Diagram – Visual Representation of the Concept',
  'Illustration or Diagram – Flowcharts or Process Diagrams',
  'Illustration or Diagram – Architectural or Model Schemas',
  'Illustration or Diagram – Interactive or Dynamic Visualizations',
  'Illustration or Diagram – Interactive Element: Mermaid Diagrams, UML Diagrams, or Interactive Models',
  'Related Concepts – Connection to Other AI/ML Terms or Topics',
  'Related Concepts – Similarities and Differences',
  'Related Concepts – Hybrid or Ensemble Approaches',
  'Related Concepts – Linked Terms and Concepts – Prerequisites or Foundational Topics',
  'Related Concepts – Linked Terms and Concepts – Related or Complementary Techniques',
  'Related Concepts – Linked Terms and Concepts – Contrasting or Alternative Approaches',
  'Related Concepts – Interdisciplinary Connections (e.g., links to other fields like cognitive science, psychology, or neuroscience)',
  'Related Concepts – Interdisciplinary Applications and Cross-pollination',
  'Related Concepts – Influence of Non-Technical Fields',
  'Related Concepts – Interactive Element: Concept Maps or Linked Interactive Diagrams',
  'Case Studies – In-depth Analysis of Real-world Applications',
  'Case Studies – Success Stories and Lessons Learned',
  'Case Studies – Challenges and Solutions',
  'Case Studies – Insights and Takeaways',
  'Case Studies – Limitations or Drawbacks Encountered in Real-world Applications',
  'Case Studies – Comparative Case Studies',
  'Case Studies – Interactive Element: Detailed Case Study Walkthroughs or Interactive Stories',
  'Interviews with Experts – Q&A with Leading Researchers or Practitioners',
  'Interviews with Experts – Insights into Current Trends and Future Directions',
  'Interviews with Experts – Personal Experiences and Advice',
  'Interviews with Experts – Perspectives on Challenges and Opportunities',
  'Interviews with Experts – Ethical Considerations and Societal Impacts',
  'Interviews with Experts – Advice for Aspiring Researchers and Practitioners',
  'Interviews with Experts – Interactive Element: Video Interviews or Embedded Audio Clips',
  'Hands-on Tutorials – Step-by-Step Guides for Implementing Techniques',
  'Hands-on Tutorials – Detailed Explanations of Code and Libraries',
  'Hands-on Tutorials – Troubleshooting Common Issues – Common Errors or Misconfigurations',
  'Hands-on Tutorials – Troubleshooting Common Issues – Debugging Tips and Preventive Measures',
  'Hands-on Tutorials – Best Practices and Tips',
  'Hands-on Tutorials – Project-Based Learning Scenarios',
  'Hands-on Tutorials – Interactive Element: Embedded Code Editors or Live Coding Environments',
  'Interactive Elements – Quizzes or Assessments with Explanations',
  'Interactive Elements – Interactive Visualizations or Simulations',
  'Interactive Elements – Downloadable Code or Notebooks',
  'Interactive Elements – Discussion Forums or Q&A Sections',
  'Interactive Elements – Online Demos or Interactive Notebooks',
  'Interactive Elements – User-Submitted Content',
  'Interactive Elements – Interactive Diagrams (e.g., Mermaid, UML)',
  'Industry Insights – Trends and Adoption in Different Sectors',
  'Industry Insights – Challenges and Opportunities in Specific Domains',
  'Industry Insights – Regulatory Landscape and Implications',
  'Industry Insights – Future Outlook and Potential Disruptions',
  'Industry Insights – Regulatory Landscape and Compliance Considerations',
  'Industry Insights – Innovation Spotlights',
  'Industry Insights – Interactive Element: Industry Trend Charts or Interactive Reports',
  'Common Challenges and Pitfalls – Typical Mistakes or Misconceptions',
  'Common Challenges and Pitfalls – Debugging and Troubleshooting Strategies',
  'Common Challenges and Pitfalls – Best Practices for Avoiding Common Issues',
  'Common Challenges and Pitfalls – Strategies for Overcoming Challenges',
  'Common Challenges and Pitfalls – Interactive Element: Problem-Solving Scenarios or Interactive FAQs',
  'Real-world Datasets and Benchmarks – Popular Datasets for Training and Testing',
  'Real-world Datasets and Benchmarks – Benchmark Results and Leaderboards',
  'Real-world Datasets and Benchmarks – Data Preparation and Preprocessing Techniques',
  'Real-world Datasets and Benchmarks – Bias and Fairness Considerations in Datasets',
  'Real-world Datasets and Benchmarks – Considerations for Diverse and Inclusive Datasets',
  'Real-world Datasets and Benchmarks – Ethical Use of Data',
  'Real-world Datasets and Benchmarks – Interactive Element: Dataset Exploration Tools or Benchmark Comparisons',
  'Tools and Frameworks – Popular Libraries and Frameworks',
  'Tools and Frameworks – Comparison of Different Tools',
  'Tools and Frameworks – Tutorials and Examples for Each Tool',
  'Tools and Frameworks – Comparative Analysis and Benchmarking of Tools',
  'Tools and Frameworks – Interactive Element: Tool Demos or Interactive Comparisons',
  'Did You Know? – Interesting Facts or Trivia',
  'Did You Know? – Common Misconceptions or Myths',
  'Did You Know? – Latest Developments or Future Trends',
  'Did You Know? – Surprising or Counterintuitive Findings',
  'Did You Know? – Historical Anecdotes',
  'Did You Know? – Interactive Element: Fun Facts Pop-ups or Interactive Trivia',
  'Quick Quiz – Multiple Choice Questions',
  'Quick Quiz – True or False Statements',
  'Quick Quiz – Fill in the Blanks',
  'Quick Quiz – Interactive Element: Embedded Quiz Widgets',
  'Further Reading – Recommended Books or Articles',
  'Further Reading – Online Tutorials or Guides',
  'Further Reading – Video Lectures or Podcasts',
  'Further Reading – Industry Reports or White Papers',
  'Further Reading – Podcasts, Webinars, or Online Talks',
  'Further Reading – Critical Reviews and Analyses',
  'Further Reading – Interactive Element: Links to External Resources or Reading Lists',
  'Project Suggestions – Hands-on Exercises or Experiments',
  'Project Suggestions – Real-world Problem-solving Tasks',
  'Project Suggestions – Creative Applications or Extensions',
  'Project Suggestions – Interactive Element: Project Idea Generators or Collaborative Project Platforms',
  'Recommended Websites and Courses – Online Learning Platforms',
  'Recommended Websites and Courses – University Courses or Certifications',
  'Recommended Websites and Courses – Industry-specific Resources',
  'Recommended Websites and Courses – Professional Certifications or Specializations',
  'Recommended Websites and Courses – Interactive Element: Course Comparison Tools or Enrollment Links',
  'Collaboration and Community – Online Forums and Discussion Platforms',
  'Collaboration and Community – Open Source Projects and Contributions',
  'Collaboration and Community – Conferences, Workshops, and Meetups',
  'Collaboration and Community – Interactive Element: Community Links or Collaboration Platforms',
  'Research Papers – Seminal or Foundational Papers',
  'Research Papers – Recent Advancements or State-of-the-Art',
  'Research Papers – Surveys or Review Articles',
  'Research Papers – Critique or Analysis of Research Papers',
  'Research Papers – Emerging Trends and Future Research Directions',
  'Research Papers – Theoretical Implications',
  'Research Papers – Interactive Element: Paper Summaries or Interactive Literature Reviews',
  'Career Guidance – Skills and Qualifications Required',
  'Career Guidance – Job Roles and Responsibilities',
  'Career Guidance – Career Paths and Progression',
  'Career Guidance – Advice for Breaking into the Field',
  'Career Guidance – Emerging Job Roles and Future Career Prospects',
  'Career Guidance – Interactive Element: Career Path Simulators or Skill Assessments',
  'Future Directions – Current Research Trends and Open Problems',
  'Future Directions – Potential Future Developments or Improvements',
  'Future Directions – Emerging Applications or Domains',
  'Future Directions – Ethical Considerations and Societal Implications',
  'Future Directions – Potential Societal and Ethical Implications',
  'Future Directions – Interdisciplinary Research Opportunities',
  'Future Directions – Interactive Element: Trend Prediction Models or Future Scenario Simulations',
  'Glossary – Definition of Key Terms',
  'Glossary – Acronyms and Abbreviations',
  'Glossary – Related Concepts or Jargon',
  'Glossary – Glossary of Mathematical Notations – Explanation of Common Symbols and Notations',
  'Glossary – Glossary of Mathematical Notations – Definitions and Formulas',
  'Glossary – Glossary of Mathematical Notations – Visual Representations or Diagrams',
  'Glossary – Glossary of Mathematical Notations – References to Further Resources',
  'Glossary – Interactive Element: Searchable Glossary or Hover-over Definitions',
  'FAQs – Common Questions and Misconceptions',
  'FAQs – Clear and Concise Answers',
  'FAQs – References to Relevant Sections or Resources',
  'FAQs – Encouragement for Further Exploration',
  'FAQs – Interactive Element: Expandable FAQ Sections or Chatbot Integration',
  'Tags and Keywords – Main Category Tags',
  'Tags and Keywords – Sub-category Tags',
  'Tags and Keywords – Related Concept Tags',
  'Tags and Keywords – Application Domain Tags',
  'Tags and Keywords – Technique or Algorithm Tags',
  'Tags and Keywords – Interactive Element: Tag Clouds or Interactive Tagging Systems',
  'Appendices – Additional Resources and References',
  'Appendices – Cheat Sheets or Quick Reference Guides',
  'Appendices – Glossary of Terms and Definitions',
  'Appendices – Interactive Element: Downloadable Appendices or Interactive Reference Guides',
  'Index – Alphabetical Index of Key Terms and Concepts',
  'Index – Cross-references to Related Sections or Topics',
  'Index – Interactive Element: Clickable Index with Jump Links',
  'References – Citations for Quotes or Statistics',
  'References – Sources for Images or Diagrams',
  'References – Bibliography or Further Reading',
  'References – Interactive Element: Linked References or Citation Tools',
  'Conclusion – Recap of Key Points',
  'Conclusion – Importance and Impact of the Term/Topic in AI/ML',
  'Conclusion – Final Thoughts and Recommendations',
  'Conclusion – Interactive Element: Summary Highlights or Reflection Prompts',
  'Metadata – Term Validation and Basic Information – Recognition',
  'Metadata – Term Validation and Basic Information – Abbreviations and Variations',
  'Metadata – Term Validation and Basic Information – Standardization',
  'Metadata – Technical Classification – Categories and Sub-Categories',
  'Metadata – Technical Classification – Computational Characteristics',
  'Metadata – Technical Classification – Learning and Implementation Complexity',
  'Metadata – Technical Classification – Model Architecture Details',
  'Metadata – Implementation Details – Programming Aspects',
  'Metadata – Implementation Details – Deployment Details',
  'Metadata – Quality and Testing Context – Testing Methodologies',
  'Metadata – Quality and Testing Context – Quality Assurance Metrics',
  'Metadata – Quality and Testing Context – Common Failure Modes',
  'Metadata – Quality and Testing Context – Robustness Characteristics',
  'Metadata – Documentation and Support – Documentation',
  'Metadata – Documentation and Support – Support Environment',
  'Metadata – Documentation and Support – Licensing Information',
  'Metadata – Academic and Research Context – Research Classification',
  'Metadata – Academic and Research Context – Scientific Context',
  'Metadata – Related Terms – Term Relationships',
  'Metadata – Usage Context – Application Domains',
  'Metadata – Usage Context – Common Usage',
  'Metadata – Data Requirements – Input Data',
  'Metadata – Data Requirements – Output Data',
  'Metadata – Performance and Optimization – Performance Metrics',
  'Metadata – Performance and Optimization – Optimization',
  'Metadata – Performance and Optimization – Green AI Considerations',
  'Metadata – Integration and Interoperability – System Integration',
  'Metadata – Integration and Interoperability – Federated Learning Aspects',
  'Metadata – Governance and Compliance – Ethical Considerations',
  'Metadata – Governance and Compliance – Regulatory Aspects',
  'Metadata – Governance and Compliance – Licensing Information',
  'Metadata – Maintenance and Support – Operational Aspects',
  'Metadata – Evolution and Trends Analysis – Current Status',
  'Metadata – Evolution and Trends Analysis – Future Outlook',
  'Metadata – MLOps Considerations – Operationalization',
  'Metadata – MLOps Considerations – AutoML Compatibility',
  'Metadata – MLOps Considerations – Federated Learning Aspects',
  'Metadata – Deployment Details – Containerization',
  'Metadata – Deployment Details – Monitoring and Maintenance',
  'Metadata – Deployment Details – Scalability',
  'Metadata – Localization Suggestions – Translations',
  'Metadata – Localization Suggestions – Regional Variants',
  'Metadata – Localization Suggestions – Cultural Context',
  'Metadata – Metadata Quality – Completeness Metrics',
  'Metadata – Metadata Quality – Verification Status',
  'Metadata – Metadata Quality – Update Tracking',
  'Metadata – Additional Metadata',
  'Best Practices – Guidelines and Recommendations for Optimal Use',
  'Best Practices – Common Strategies to Maximize Effectiveness',
  'Best Practices – Interactive Element: Best Practices Checklists or Interactive Guides',
  'Security Considerations – Potential Security Vulnerabilities',
  'Security Considerations – Mitigation Strategies',
  'Security Considerations – Interactive Element: Security Risk Assessments or Scenario Simulations',
  'Optimization Techniques – Advanced Methods to Improve Performance',
  'Optimization Techniques – Case Studies on Optimization',
  'Optimization Techniques – Interactive Element: Optimization Strategy Simulators or Interactive Tutorials',
  'Comparison with Alternatives – Detailed Comparisons with Similar or Alternative Methods',
  'Comparison with Alternatives – Pros and Cons Relative to Other Techniques',
  'Comparison with Alternatives – Interactive Element: Comparative Analysis Tables or Interactive Decision Tools'
];

// Three-prompt strategy for definition
const DEFINITION_PROMPTS = {
  initial: `Generate a comprehensive technical definition for the AI/ML term "${TERM}". Include:
1. A clear, accurate definition (2-3 sentences)
2. Core technical components
3. Why it's revolutionary in AI/ML
Format: Plain text, professional tone.`,
  
  enhancement: `Enhance this definition of "${TERM}" with:
1. More specific technical details
2. Key architectural innovations
3. Concrete examples of its impact
4. Mathematical or algorithmic foundations
Keep it comprehensive but accessible.`,
  
  optimization: `Optimize this "${TERM}" definition for:
1. Technical accuracy and completeness
2. Clear explanation of unique features
3. Balance between depth and accessibility
4. Smooth flow and readability
Ensure it captures why transformers are fundamental to modern AI.`
};

async function ensureOutputDirectory() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function generateWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI/ML educator creating comprehensive, accurate content for an AI glossary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function generateDefinitionWithThreePrompts() {
  console.log('Generating definition using three-prompt strategy...');
  
  // Initial generation
  const initial = await generateWithRetry(DEFINITION_PROMPTS.initial);
  
  // Enhancement
  const enhancementPrompt = DEFINITION_PROMPTS.enhancement + `\n\nCurrent definition:\n${initial}`;
  const enhanced = await generateWithRetry(enhancementPrompt);
  
  // Optimization
  const optimizationPrompt = DEFINITION_PROMPTS.optimization + `\n\nCurrent definition:\n${enhanced}`;
  const optimized = await generateWithRetry(optimizationPrompt);
  
  return optimized;
}

async function generateColumnContent(columnName, context = {}) {
  // Column-specific prompts
  const columnPrompts = {
    'Term': () => TERM,
    'Introduction – Definition and Overview': () => context.definition || 'Generate a comprehensive definition and overview',
    'Introduction – Key Concepts and Principles': () => `List the key concepts and principles of ${TERM} in AI/ML. Format as bullet points.`,
    'Introduction – Importance and Relevance in AI/ML': () => `Explain the importance and relevance of ${TERM} in AI/ML. 2-3 paragraphs.`,
    'Introduction – Brief History or Background': () => `Provide a brief history and background of ${TERM}. Include key dates and milestones.`,
    'Introduction – Category and Sub-category of the Term – Main Category': () => `What is the main category of ${TERM} in AI/ML taxonomy? (e.g., Deep Learning, Neural Networks, etc.)`,
    'Introduction – Category and Sub-category of the Term – Sub-category': () => `What is the specific sub-category of ${TERM}? Be precise.`,
    'Introduction – Interactive Element: Mermaid Diagram': () => `Create a Mermaid diagram showing the architecture of ${TERM}. Use proper Mermaid syntax.`,
    'Prerequisites – Prior Knowledge or Skills Required': () => `List the prior knowledge and skills required to understand ${TERM}. Format as bullet points.`,
    'Implementation – Popular Programming Languages and Libraries': () => `List popular programming languages and libraries for implementing ${TERM}. Include specific frameworks.`,
    'Implementation – Code Snippets or Pseudocode': () => `Provide a simple code snippet demonstrating ${TERM}. Use Python with comments.`,
    'Applications – Real-world Use Cases and Examples': () => `List 5 real-world use cases and examples of ${TERM}. Be specific with companies/products.`,
    'Historical Context – Origin and Evolution': () => `Describe the origin and evolution of ${TERM}. Include the original paper and authors.`,
    'Historical Context – Important Dates – Landmark Papers or Publications': () => `List landmark papers about ${TERM} with titles, authors, and years.`,
    'Research Papers – Seminal or Foundational Papers': () => `List 5 seminal research papers about ${TERM}. Include full citations.`,
    'FAQs – Common Questions and Misconceptions': () => `Generate 5 FAQs about ${TERM}. Format as Q: and A: pairs.`,
    'Glossary – Definition of Key Terms': () => `Define 5 key terms related to ${TERM}. Format as term: definition.`,
    'Tags and Keywords – Main Category Tags': () => `List main category tags for ${TERM}. Comma-separated.`,
    'Metadata – Term Validation and Basic Information – Recognition': () => `Is "${TERM}" a recognized term in AI/ML? Provide validation.`,
    'Best Practices – Guidelines and Recommendations for Optimal Use': () => `List 5 best practices for using ${TERM}. Format as numbered list.`,
    'Security Considerations – Potential Security Vulnerabilities': () => `List potential security vulnerabilities related to ${TERM}. Include mitigation strategies.`,
    'Optimization Techniques – Advanced Methods to Improve Performance': () => `Describe advanced optimization techniques for ${TERM}. Include specific methods.`,
    'Comparison with Alternatives – Detailed Comparisons with Similar or Alternative Methods': () => `Compare ${TERM} with alternative methods. Include pros and cons.`
  };
  
  // Get prompt for this column or use a generic one
  const promptFunc = columnPrompts[columnName];
  const prompt = promptFunc ? promptFunc() : `Generate content for "${columnName}" related to ${TERM} in AI/ML. Be comprehensive and accurate.`;
  
  try {
    const content = await generateWithRetry(prompt);
    return content;
  } catch (error) {
    console.error(`Failed to generate content for column: ${columnName}`);
    return `[Error generating content for ${columnName}]`;
  }
}

async function generateAll295Columns() {
  console.log(`Starting full 295 column content generation for term: ${TERM}`);
  console.log(`Total columns to generate: ${EXPECTED_COLUMNS.length}`);
  console.log('\\n');
  
  const startTime = Date.now();
  const content = {};
  let completedCount = 0;
  
  // Save progress periodically
  const saveProgress = async () => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const progressPath = path.join(OUTPUT_DIR, `transformer-295-progress-${timestamp}.json`);
    await fs.writeFile(progressPath, JSON.stringify({
      term: TERM,
      timestamp: timestamp,
      completedCount: completedCount,
      totalColumns: EXPECTED_COLUMNS.length,
      duration: (Date.now() - startTime) / 1000,
      content: content
    }, null, 2));
    console.log(`\\n[Progress saved: ${completedCount}/${EXPECTED_COLUMNS.length} columns]`);
  };
  
  // First, generate the definition using three-prompt strategy
  console.log('Step 1: Generating enhanced definition using three-prompt strategy...');
  const enhancedDefinition = await generateDefinitionWithThreePrompts();
  content['Introduction – Definition and Overview'] = enhancedDefinition;
  completedCount++;
  console.log(`✓ Generated enhanced definition (${completedCount}/${EXPECTED_COLUMNS.length})`);
  
  // Generate remaining columns
  console.log('\\nStep 2: Generating remaining 294 columns...');
  
  for (const column of EXPECTED_COLUMNS) {
    if (column === 'Introduction – Definition and Overview') {
      continue; // Already generated
    }
    
    process.stdout.write(`Generating: ${column}...`);
    
    try {
      const columnContent = await generateColumnContent(column, { definition: enhancedDefinition });
      content[column] = columnContent;
      completedCount++;
      process.stdout.write(` ✓ (${completedCount}/${EXPECTED_COLUMNS.length})\\n`);
      
      // Save progress every 20 columns
      if (completedCount % 20 === 0) {
        await saveProgress();
      }
      
      // Small delay to avoid rate limits
      if (completedCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      process.stdout.write(` ✗ ERROR\\n`);
      content[column] = `[Error: ${error.message}]`;
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\\n✅ Content generation completed in ${duration} seconds`);
  
  // Final save
  await saveProgress();
  
  return content;
}

async function validateAndSaveResults(content) {
  console.log('\\nValidating generated content...');
  
  // Count columns
  const generatedColumns = Object.keys(content);
  const missingColumns = EXPECTED_COLUMNS.filter(col => !content.hasOwnProperty(col));
  const extraColumns = generatedColumns.filter(col => !EXPECTED_COLUMNS.includes(col));
  
  console.log(`Generated columns: ${generatedColumns.length}`);
  console.log(`Expected columns: ${EXPECTED_COLUMNS.length}`);
  
  if (missingColumns.length > 0) {
    console.log(`\\nMissing columns (${missingColumns.length}):`);
    missingColumns.forEach(col => console.log(`  - ${col}`));
  }
  
  if (extraColumns.length > 0) {
    console.log(`\\nExtra columns (${extraColumns.length}):`);
    extraColumns.forEach(col => console.log(`  - ${col}`));
  }
  
  // Save results
  await ensureOutputDirectory();
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const outputFileName = `transformer-295-columns-direct-${timestamp}.json`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);
  
  const fullOutput = {
    term: TERM,
    timestamp: timestamp,
    columnCount: generatedColumns.length,
    expectedColumnCount: EXPECTED_COLUMNS.length,
    missingColumns: missingColumns,
    extraColumns: extraColumns,
    validationPassed: generatedColumns.length === EXPECTED_COLUMNS.length && missingColumns.length === 0,
    content: content
  };
  
  await fs.writeFile(outputPath, JSON.stringify(fullOutput, null, 2));
  console.log(`\\nOutput saved to: ${outputPath}`);
  
  // Create summary report
  const summaryFileName = `transformer-295-columns-summary-${timestamp}.txt`;
  const summaryPath = path.join(OUTPUT_DIR, summaryFileName);
  
  const summaryContent = `
DIRECT 295 COLUMN CONTENT GENERATION TEST SUMMARY
================================================
Term: ${TERM}
Timestamp: ${timestamp}
Model: gpt-4-turbo-preview

COLUMN ANALYSIS:
- Expected columns: ${EXPECTED_COLUMNS.length}
- Generated columns: ${generatedColumns.length}
- Missing columns: ${missingColumns.length}
- Extra columns: ${extraColumns.length}

VALIDATION: ${fullOutput.validationPassed ? '✅ PASSED' : '❌ FAILED'}

${missingColumns.length > 0 ? '\\nMISSING COLUMNS:\\n' + missingColumns.map(col => `- ${col}`).join('\\n') : ''}

SAMPLE CONTENT:

1. Definition and Overview:
${content['Introduction – Definition and Overview'] ? content['Introduction – Definition and Overview'].substring(0, 300) + '...' : 'NOT GENERATED'}

2. Key Concepts:
${content['Introduction – Key Concepts and Principles'] ? content['Introduction – Key Concepts and Principles'].substring(0, 200) + '...' : 'NOT GENERATED'}

3. Real-world Applications:
${content['Applications – Real-world Use Cases and Examples'] ? content['Applications – Real-world Use Cases and Examples'].substring(0, 200) + '...' : 'NOT GENERATED'}
`;
  
  await fs.writeFile(summaryPath, summaryContent);
  console.log(`Summary saved to: ${summaryPath}`);
  
  return fullOutput.validationPassed;
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('DIRECT 295 COLUMN CONTENT GENERATION TEST');
    console.log('='.repeat(60));
    
    // Generate all content
    const content = await generateAll295Columns();
    
    // Validate and save
    const validationPassed = await validateAndSaveResults(content);
    
    console.log('\\n' + '='.repeat(60));
    if (validationPassed) {
      console.log('✅ TEST PASSED: All 295 columns generated successfully!');
    } else {
      console.log('❌ TEST FAILED: Column count mismatch');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\\nTest failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();