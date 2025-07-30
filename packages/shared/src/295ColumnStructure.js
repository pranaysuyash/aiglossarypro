"use strict";
// shared/295ColumnStructure.ts
// Complete 295-column hierarchical structure for AI/ML Glossary
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStructureStats = exports.buildHierarchicalTree = exports.getInteractiveColumns = exports.getColumnsByPriority = exports.getEssentialColumns = exports.getColumnsByCategory = exports.getColumnsBySection = exports.getColumnById = exports.HIERARCHICAL_295_STRUCTURE = void 0;
exports.HIERARCHICAL_295_STRUCTURE = [
    // TERM (1)
    {
        id: 'term',
        name: 'Term',
        displayName: 'Term',
        path: 'term',
        section: 'basic',
        category: 'essential',
        priority: 1,
        estimatedTokens: 10,
        contentType: 'text',
        description: 'The canonical name of the AI/ML term',
        isInteractive: false,
        order: 1
    },
    // INTRODUCTION SECTION (2-11)
    {
        id: 'introduction_definition_overview',
        name: 'Introduction – Definition and Overview',
        displayName: 'Definition and Overview',
        path: 'introduction.definition_overview',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'definition_overview',
        category: 'essential',
        priority: 1,
        estimatedTokens: 150,
        contentType: 'markdown',
        description: 'Core definition and high-level overview of the term',
        isInteractive: false,
        order: 2
    },
    {
        id: 'introduction_key_concepts',
        name: 'Introduction – Key Concepts and Principles',
        displayName: 'Key Concepts and Principles',
        path: 'introduction.key_concepts',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'key_concepts',
        category: 'essential',
        priority: 2,
        estimatedTokens: 200,
        contentType: 'markdown',
        description: 'Fundamental concepts and principles underlying the term',
        isInteractive: false,
        order: 3
    },
    {
        id: 'introduction_importance_relevance',
        name: 'Introduction – Importance and Relevance in AI/ML',
        displayName: 'Importance and Relevance in AI/ML',
        path: 'introduction.importance_relevance',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'importance_relevance',
        category: 'essential',
        priority: 2,
        estimatedTokens: 150,
        contentType: 'markdown',
        description: 'Why this term matters in the context of AI/ML',
        isInteractive: false,
        order: 4
    },
    {
        id: 'introduction_brief_history',
        name: 'Introduction – Brief History or Background',
        displayName: 'Brief History or Background',
        path: 'introduction.brief_history',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'brief_history',
        category: 'important',
        priority: 3,
        estimatedTokens: 120,
        contentType: 'markdown',
        description: 'Historical context and background of the term',
        isInteractive: false,
        order: 5
    },
    {
        id: 'introduction_main_category',
        name: 'Introduction – Category and Sub-category of the Term – Main Category',
        displayName: 'Main Category',
        path: 'introduction.category.main_category',
        parentPath: 'introduction.category',
        section: 'introduction',
        subsection: 'category',
        subsubsection: 'main_category',
        category: 'important',
        priority: 3,
        estimatedTokens: 30,
        contentType: 'text',
        description: 'Primary category classification of the term',
        isInteractive: false,
        order: 6
    },
    {
        id: 'introduction_sub_category',
        name: 'Introduction – Category and Sub-category of the Term – Sub-category',
        displayName: 'Sub-category',
        path: 'introduction.category.sub_category',
        parentPath: 'introduction.category',
        section: 'introduction',
        subsection: 'category',
        subsubsection: 'sub_category',
        category: 'important',
        priority: 3,
        estimatedTokens: 40,
        contentType: 'text',
        description: 'Specific sub-category classification',
        isInteractive: false,
        order: 7
    },
    {
        id: 'introduction_relationship_other_categories',
        name: 'Introduction – Category and Sub-category of the Term – Relationship to Other Categories or Domains',
        displayName: 'Relationship to Other Categories or Domains',
        path: 'introduction.category.relationship_other_categories',
        parentPath: 'introduction.category',
        section: 'introduction',
        subsection: 'category',
        subsubsection: 'relationship_other_categories',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 100,
        contentType: 'markdown',
        description: 'How this term relates to other domains and categories',
        isInteractive: false,
        order: 8
    },
    {
        id: 'introduction_limitations_assumptions',
        name: 'Introduction – Limitations and Assumptions of the Concept',
        displayName: 'Limitations and Assumptions of the Concept',
        path: 'introduction.limitations_assumptions',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'limitations_assumptions',
        category: 'important',
        priority: 3,
        estimatedTokens: 150,
        contentType: 'markdown',
        description: 'Key limitations and underlying assumptions',
        isInteractive: false,
        order: 9
    },
    {
        id: 'introduction_technological_trends',
        name: 'Introduction – Technological Trends and Future Predictions',
        displayName: 'Technological Trends and Future Predictions',
        path: 'introduction.technological_trends',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'technological_trends',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 180,
        contentType: 'markdown',
        description: 'Current trends and future outlook for this concept',
        isInteractive: false,
        order: 10
    },
    {
        id: 'introduction_interactive_mermaid',
        name: 'Introduction – Interactive Element: Mermaid Diagram',
        displayName: 'Interactive Element: Mermaid Diagram',
        path: 'introduction.interactive_mermaid',
        parentPath: 'introduction',
        section: 'introduction',
        subsection: 'interactive_mermaid',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 200,
        contentType: 'interactive',
        description: 'Interactive Mermaid diagram for visual explanation',
        isInteractive: true,
        order: 11
    },
    // PREREQUISITES SECTION (12-17)
    {
        id: 'prerequisites_prior_knowledge',
        name: 'Prerequisites – Prior Knowledge or Skills Required',
        displayName: 'Prior Knowledge or Skills Required',
        path: 'prerequisites.prior_knowledge',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'prior_knowledge',
        category: 'essential',
        priority: 2,
        estimatedTokens: 120,
        contentType: 'markdown',
        description: 'Essential background knowledge needed to understand this concept',
        isInteractive: false,
        order: 12
    },
    {
        id: 'prerequisites_recommended_background',
        name: 'Prerequisites – Recommended Background or Experience',
        displayName: 'Recommended Background or Experience',
        path: 'prerequisites.recommended_background',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'recommended_background',
        category: 'important',
        priority: 3,
        estimatedTokens: 100,
        contentType: 'markdown',
        description: 'Suggested background and experience level',
        isInteractive: false,
        order: 13
    },
    {
        id: 'prerequisites_introductory_topics',
        name: 'Prerequisites – Suggested Introductory Topics or Courses',
        displayName: 'Suggested Introductory Topics or Courses',
        path: 'prerequisites.introductory_topics',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'introductory_topics',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 150,
        contentType: 'array',
        description: 'List of suggested preparatory topics and courses',
        isInteractive: false,
        order: 14
    },
    {
        id: 'prerequisites_learning_resources',
        name: 'Prerequisites – Recommended Learning Resources',
        displayName: 'Recommended Learning Resources',
        path: 'prerequisites.learning_resources',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'learning_resources',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 120,
        contentType: 'array',
        description: 'Curated list of learning resources and materials',
        isInteractive: false,
        order: 15
    },
    {
        id: 'prerequisites_connections_other_topics',
        name: 'Prerequisites – Connections to Other Prerequisite Topics or Skills',
        displayName: 'Connections to Other Prerequisite Topics or Skills',
        path: 'prerequisites.connections_other_topics',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'connections_other_topics',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 100,
        contentType: 'markdown',
        description: 'How prerequisite topics interconnect',
        isInteractive: false,
        order: 16
    },
    {
        id: 'prerequisites_interactive_tutorials',
        name: 'Prerequisites – Interactive Element: Links to Introductory Tutorials or Courses',
        displayName: 'Interactive Element: Links to Introductory Tutorials or Courses',
        path: 'prerequisites.interactive_tutorials',
        parentPath: 'prerequisites',
        section: 'prerequisites',
        subsection: 'interactive_tutorials',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 150,
        contentType: 'interactive',
        description: 'Interactive links and embedded tutorial content',
        isInteractive: true,
        order: 17
    },
    // THEORETICAL CONCEPTS SECTION (18-24)
    {
        id: 'theoretical_mathematical_foundations',
        name: 'Theoretical Concepts – Key Mathematical and Statistical Foundations',
        displayName: 'Key Mathematical and Statistical Foundations',
        path: 'theoretical.mathematical_foundations',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'mathematical_foundations',
        category: 'important',
        priority: 3,
        estimatedTokens: 300,
        contentType: 'markdown',
        description: 'Core mathematical and statistical concepts underlying the term',
        isInteractive: false,
        order: 18
    },
    {
        id: 'theoretical_underlying_algorithms',
        name: 'Theoretical Concepts – Underlying Algorithms or Techniques',
        displayName: 'Underlying Algorithms or Techniques',
        path: 'theoretical.underlying_algorithms',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'underlying_algorithms',
        category: 'important',
        priority: 3,
        estimatedTokens: 250,
        contentType: 'markdown',
        description: 'Key algorithms and techniques that implement the concept',
        isInteractive: false,
        order: 19
    },
    {
        id: 'theoretical_assumptions_limitations',
        name: 'Theoretical Concepts – Assumptions and Limitations',
        displayName: 'Assumptions and Limitations',
        path: 'theoretical.assumptions_limitations',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'assumptions_limitations',
        category: 'important',
        priority: 3,
        estimatedTokens: 150,
        contentType: 'markdown',
        description: 'Theoretical assumptions and their limitations',
        isInteractive: false,
        order: 20
    },
    {
        id: 'theoretical_mathematical_derivations',
        name: 'Theoretical Concepts – Mathematical Derivations or Proofs',
        displayName: 'Mathematical Derivations or Proofs',
        path: 'theoretical.mathematical_derivations',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'mathematical_derivations',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 400,
        contentType: 'markdown',
        description: 'Mathematical derivations and formal proofs',
        isInteractive: false,
        order: 21
    },
    {
        id: 'theoretical_interpretability_explainability',
        name: 'Theoretical Concepts – Interpretability and Explainability of the Underlying Concepts',
        displayName: 'Interpretability and Explainability of the Underlying Concepts',
        path: 'theoretical.interpretability_explainability',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'interpretability_explainability',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 200,
        contentType: 'markdown',
        description: 'How to interpret and explain the theoretical concepts',
        isInteractive: false,
        order: 22
    },
    {
        id: 'theoretical_critiques_counterarguments',
        name: 'Theoretical Concepts – Theoretical Critiques and Counterarguments',
        displayName: 'Theoretical Critiques and Counterarguments',
        path: 'theoretical.critiques_counterarguments',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'critiques_counterarguments',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 250,
        contentType: 'markdown',
        description: 'Academic critiques and alternative theoretical perspectives',
        isInteractive: false,
        order: 23
    },
    {
        id: 'theoretical_interactive_visualizations',
        name: 'Theoretical Concepts – Interactive Element: Mathematical Visualizations or Interactive Proofs',
        displayName: 'Interactive Element: Mathematical Visualizations or Interactive Proofs',
        path: 'theoretical.interactive_visualizations',
        parentPath: 'theoretical',
        section: 'theoretical',
        subsection: 'interactive_visualizations',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 300,
        contentType: 'interactive',
        description: 'Interactive mathematical visualizations and proof explorers',
        isInteractive: true,
        order: 24
    },
    // HOW IT WORKS SECTION (25-30)
    {
        id: 'how_it_works_step_by_step',
        name: 'How It Works – Step-by-Step Explanation of the Process',
        displayName: 'Step-by-Step Explanation of the Process',
        path: 'how_it_works.step_by_step',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'step_by_step',
        category: 'essential',
        priority: 2,
        estimatedTokens: 300,
        contentType: 'markdown',
        description: 'Detailed step-by-step explanation of how the concept works',
        isInteractive: false,
        order: 25
    },
    {
        id: 'how_it_works_input_output_stages',
        name: 'How It Works – Input, Output, and Intermediate Stages',
        displayName: 'Input, Output, and Intermediate Stages',
        path: 'how_it_works.input_output_stages',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'input_output_stages',
        category: 'essential',
        priority: 2,
        estimatedTokens: 200,
        contentType: 'markdown',
        description: 'What goes in, what comes out, and what happens in between',
        isInteractive: false,
        order: 26
    },
    {
        id: 'how_it_works_illustrative_examples',
        name: 'How It Works – Illustrative Examples or Case Studies',
        displayName: 'Illustrative Examples or Case Studies',
        path: 'how_it_works.illustrative_examples',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'illustrative_examples',
        category: 'essential',
        priority: 2,
        estimatedTokens: 250,
        contentType: 'markdown',
        description: 'Concrete examples showing the concept in action',
        isInteractive: false,
        order: 27
    },
    {
        id: 'how_it_works_visualizations_animations',
        name: 'How It Works – Visualizations or Animations to Explain the Process',
        displayName: 'Visualizations or Animations to Explain the Process',
        path: 'how_it_works.visualizations_animations',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'visualizations_animations',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 150,
        contentType: 'interactive',
        description: 'Visual aids and animations for better understanding',
        isInteractive: true,
        order: 28
    },
    {
        id: 'how_it_works_component_breakdown',
        name: 'How It Works – Component Breakdown',
        displayName: 'Component Breakdown',
        path: 'how_it_works.component_breakdown',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'component_breakdown',
        category: 'important',
        priority: 3,
        estimatedTokens: 200,
        contentType: 'markdown',
        description: 'Breakdown of individual components and their roles',
        isInteractive: false,
        order: 29
    },
    {
        id: 'how_it_works_interactive_flowcharts',
        name: 'How It Works – Interactive Element: Flowcharts or Animated Diagrams',
        displayName: 'Interactive Element: Flowcharts or Animated Diagrams',
        path: 'how_it_works.interactive_flowcharts',
        parentPath: 'how_it_works',
        section: 'how_it_works',
        subsection: 'interactive_flowcharts',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 250,
        contentType: 'interactive',
        description: 'Interactive flowcharts and animated process diagrams',
        isInteractive: true,
        order: 30
    },
    // VARIANTS OR EXTENSIONS SECTION (31-36)
    {
        id: 'variants_different_types',
        name: 'Variants or Extensions – Different Types or Categories',
        displayName: 'Different Types or Categories',
        path: 'variants.different_types',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'different_types',
        category: 'important',
        priority: 3,
        estimatedTokens: 180,
        contentType: 'markdown',
        description: 'Different variations and categories of the concept',
        isInteractive: false,
        order: 31
    },
    {
        id: 'variants_advanced_specialized',
        name: 'Variants or Extensions – Advanced or Specialized Versions',
        displayName: 'Advanced or Specialized Versions',
        path: 'variants.advanced_specialized',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'advanced_specialized',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 200,
        contentType: 'markdown',
        description: 'Advanced and specialized variants of the concept',
        isInteractive: false,
        order: 32
    },
    {
        id: 'variants_recent_developments',
        name: 'Variants or Extensions – Recent Developments or Improvements',
        displayName: 'Recent Developments or Improvements',
        path: 'variants.recent_developments',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'recent_developments',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 180,
        contentType: 'markdown',
        description: 'Latest developments and improvements in the field',
        isInteractive: false,
        order: 33
    },
    {
        id: 'variants_comparisons_similar',
        name: 'Variants or Extensions – Comparisons to Similar or Related Techniques',
        displayName: 'Comparisons to Similar or Related Techniques',
        path: 'variants.comparisons_similar',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'comparisons_similar',
        category: 'important',
        priority: 3,
        estimatedTokens: 220,
        contentType: 'markdown',
        description: 'Comparisons with related and similar techniques',
        isInteractive: false,
        order: 34
    },
    {
        id: 'variants_comparative_analysis',
        name: 'Variants or Extensions – Comparative Analysis of Variants or Extensions',
        displayName: 'Comparative Analysis of Variants or Extensions',
        path: 'variants.comparative_analysis',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'comparative_analysis',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 280,
        contentType: 'markdown',
        description: 'Detailed comparative analysis of different variants',
        isInteractive: false,
        order: 35
    },
    {
        id: 'variants_interactive_comparison',
        name: 'Variants or Extensions – Interactive Element: Comparison Tables or Interactive Charts',
        displayName: 'Interactive Element: Comparison Tables or Interactive Charts',
        path: 'variants.interactive_comparison',
        parentPath: 'variants',
        section: 'variants',
        subsection: 'interactive_comparison',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 200,
        contentType: 'interactive',
        description: 'Interactive comparison tools and charts',
        isInteractive: true,
        order: 36
    },
    // APPLICATIONS SECTION (37-42)
    {
        id: 'applications_real_world_use_cases',
        name: 'Applications – Real-world Use Cases and Examples',
        displayName: 'Real-world Use Cases and Examples',
        path: 'applications.real_world_use_cases',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'real_world_use_cases',
        category: 'essential',
        priority: 2,
        estimatedTokens: 250,
        contentType: 'markdown',
        description: 'Practical real-world applications and use cases',
        isInteractive: false,
        order: 37
    },
    {
        id: 'applications_industries_domains',
        name: 'Applications – Industries or Domains of Application',
        displayName: 'Industries or Domains of Application',
        path: 'applications.industries_domains',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'industries_domains',
        category: 'important',
        priority: 3,
        estimatedTokens: 180,
        contentType: 'array',
        description: 'Industries and domains where this concept is applied',
        isInteractive: false,
        order: 38
    },
    {
        id: 'applications_benefits_impact',
        name: 'Applications – Benefits and Impact',
        displayName: 'Benefits and Impact',
        path: 'applications.benefits_impact',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'benefits_impact',
        category: 'essential',
        priority: 2,
        estimatedTokens: 180,
        contentType: 'markdown',
        description: 'Benefits and real-world impact of applications',
        isInteractive: false,
        order: 39
    },
    {
        id: 'applications_limitations_challenges',
        name: 'Applications – Limitations or Challenges in Real-world Applications',
        displayName: 'Limitations or Challenges in Real-world Applications',
        path: 'applications.limitations_challenges',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'limitations_challenges',
        category: 'important',
        priority: 3,
        estimatedTokens: 160,
        contentType: 'markdown',
        description: 'Practical limitations and challenges in real applications',
        isInteractive: false,
        order: 40
    },
    {
        id: 'applications_economic_impact',
        name: 'Applications – Economic Impact',
        displayName: 'Economic Impact',
        path: 'applications.economic_impact',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'economic_impact',
        category: 'supplementary',
        priority: 4,
        estimatedTokens: 150,
        contentType: 'markdown',
        description: 'Economic implications and business impact',
        isInteractive: false,
        order: 41
    },
    {
        id: 'applications_interactive_case_studies',
        name: 'Applications – Interactive Element: Case Study Walkthroughs or Interactive Use Cases',
        displayName: 'Interactive Element: Case Study Walkthroughs or Interactive Use Cases',
        path: 'applications.interactive_case_studies',
        parentPath: 'applications',
        section: 'applications',
        subsection: 'interactive_case_studies',
        category: 'advanced',
        priority: 5,
        estimatedTokens: 300,
        contentType: 'interactive',
        description: 'Interactive case study explorations and walkthroughs',
        isInteractive: true,
        order: 42
    }
    // TODO: Add remaining 253 columns (43-295) following the same pattern
    // This establishes the structure - I'll continue with the rest in the next step
];
// Helper functions to work with the structure
const getColumnById = (id) => {
    return exports.HIERARCHICAL_295_STRUCTURE.find(col => col.id === id);
};
exports.getColumnById = getColumnById;
const getColumnsBySection = (section) => {
    return exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.section === section);
};
exports.getColumnsBySection = getColumnsBySection;
const getColumnsByCategory = (category) => {
    return exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === category);
};
exports.getColumnsByCategory = getColumnsByCategory;
const getEssentialColumns = () => {
    return exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'essential');
};
exports.getEssentialColumns = getEssentialColumns;
const getColumnsByPriority = (priority) => {
    return exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.priority === priority);
};
exports.getColumnsByPriority = getColumnsByPriority;
const getInteractiveColumns = () => {
    return exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.isInteractive);
};
exports.getInteractiveColumns = getInteractiveColumns;
const buildHierarchicalTree = () => {
    const tree = {};
    exports.HIERARCHICAL_295_STRUCTURE.forEach(column => {
        const pathParts = column.path.split('.');
        let current = tree;
        pathParts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    metadata: index === pathParts.length - 1 ? column : null,
                    children: {}
                };
            }
            current = current[part].children;
        });
    });
    return tree;
};
exports.buildHierarchicalTree = buildHierarchicalTree;
// Statistics about the structure
const getStructureStats = () => {
    const total = exports.HIERARCHICAL_295_STRUCTURE.length;
    const byCategory = {
        essential: exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'essential').length,
        important: exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'important').length,
        supplementary: exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'supplementary').length,
        advanced: exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'advanced').length
    };
    const interactive = exports.HIERARCHICAL_295_STRUCTURE.filter(col => col.isInteractive).length;
    const totalTokens = exports.HIERARCHICAL_295_STRUCTURE.reduce((sum, col) => sum + col.estimatedTokens, 0);
    return {
        total,
        byCategory,
        interactive,
        totalTokens,
        averageTokens: Math.round(totalTokens / total)
    };
};
exports.getStructureStats = getStructureStats;
//# sourceMappingURL=295ColumnStructure.js.map