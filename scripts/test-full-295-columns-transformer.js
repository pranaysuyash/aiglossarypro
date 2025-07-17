import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:3001/api/glossary/generate-content';
const OUTPUT_DIR = path.join(__dirname, '..', 'test-outputs');
const TERM = 'transformer';

// Three prompt strategy for definition
const DEFINITION_PROMPTS = {
  initial: "Generate a comprehensive definition for the AI/ML term 'transformer'",
  enhancement: "Enhance this definition with more technical details and examples",
  optimization: "Optimize this definition for clarity and completeness"
};

// Expected 295 columns (complete list)
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

async function ensureOutputDirectory() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function testFullContentGeneration() {
  console.log('Starting full 295 column content generation test for term:', TERM);
  console.log('Expected number of columns:', EXPECTED_COLUMNS.length);
  console.log('\\n');

  try {
    // Ensure output directory exists
    await ensureOutputDirectory();

    // Start timer
    const startTime = Date.now();

    // Make API request
    console.log('Making API request to:', API_URL);
    const response = await axios.post(API_URL, {
      term: TERM,
      definitionPrompts: DEFINITION_PROMPTS
    }, {
      timeout: 300000 // 5 minute timeout
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\\nAPI request completed in ${duration} seconds`);

    // Validate response
    if (!response.data || !response.data.success) {
      throw new Error('API request failed: ' + (response.data?.error || 'Unknown error'));
    }

    const content = response.data.content;
    console.log('\\nContent generated successfully');

    // Count actual columns
    const actualColumns = Object.keys(content);
    console.log(`\\nColumn count: ${actualColumns.length} / ${EXPECTED_COLUMNS.length}`);

    // Check for missing columns
    const missingColumns = EXPECTED_COLUMNS.filter(col => !content.hasOwnProperty(col));
    const extraColumns = actualColumns.filter(col => !EXPECTED_COLUMNS.includes(col));

    if (missingColumns.length > 0) {
      console.log(`\\nMISSING COLUMNS (${missingColumns.length}):`);
      missingColumns.forEach(col => console.log(`  - ${col}`));
    }

    if (extraColumns.length > 0) {
      console.log(`\\nEXTRA COLUMNS (${extraColumns.length}):`);
      extraColumns.forEach(col => console.log(`  - ${col}`));
    }

    // Save full output
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const outputFileName = `transformer-full-295-columns-${timestamp}.json`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    await fs.writeFile(outputPath, JSON.stringify({
      term: TERM,
      timestamp: timestamp,
      duration: duration,
      columnCount: actualColumns.length,
      expectedColumnCount: EXPECTED_COLUMNS.length,
      missingColumns: missingColumns,
      extraColumns: extraColumns,
      content: content
    }, null, 2));

    console.log(`\\nOutput saved to: ${outputPath}`);

    // Create summary report
    const summaryFileName = `transformer-295-columns-summary-${timestamp}.txt`;
    const summaryPath = path.join(OUTPUT_DIR, summaryFileName);

    const summaryContent = `
FULL 295 COLUMN CONTENT GENERATION TEST SUMMARY
==============================================
Term: ${TERM}
Timestamp: ${timestamp}
Duration: ${duration} seconds

COLUMN ANALYSIS:
- Expected columns: ${EXPECTED_COLUMNS.length}
- Actual columns: ${actualColumns.length}
- Missing columns: ${missingColumns.length}
- Extra columns: ${extraColumns.length}

VALIDATION: ${actualColumns.length === EXPECTED_COLUMNS.length && missingColumns.length === 0 ? 'PASSED' : 'FAILED'}

${missingColumns.length > 0 ? '\\nMISSING COLUMNS:\\n' + missingColumns.map(col => `- ${col}`).join('\\n') : ''}

${extraColumns.length > 0 ? '\\nEXTRA COLUMNS:\\n' + extraColumns.map(col => `- ${col}`).join('\\n') : ''}

SAMPLE CONTENT (first 5 columns):
${EXPECTED_COLUMNS.slice(0, 5).map(col => `\\n${col}:\\n${content[col] ? content[col].substring(0, 200) + '...' : 'NOT FOUND'}`).join('\\n')}
`;

    await fs.writeFile(summaryPath, summaryContent);
    console.log(`Summary saved to: ${summaryPath}`);

    // Display validation result
    console.log('\\n' + '='.repeat(50));
    if (actualColumns.length === EXPECTED_COLUMNS.length && missingColumns.length === 0) {
      console.log('✅ VALIDATION PASSED: All 295 columns generated successfully!');
    } else {
      console.log('❌ VALIDATION FAILED: Column mismatch detected');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\\nTest failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testFullContentGeneration();