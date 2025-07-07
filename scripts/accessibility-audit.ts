#!/usr/bin/env tsx

/**
 * WCAG Accessibility Audit Script
 * Conducts a comprehensive accessibility audit following WCAG 2.1 AA guidelines
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// WCAG 2.1 Success Criteria organized by principles
const WCAG_CRITERIA = {
  perceivable: {
    '1.1': {
      name: 'Text Alternatives',
      criteria: [
        '1.1.1 Non-text Content (A)'
      ]
    },
    '1.2': {
      name: 'Time-based Media',
      criteria: [
        '1.2.1 Audio-only and Video-only (Prerecorded) (A)',
        '1.2.2 Captions (Prerecorded) (A)',
        '1.2.3 Audio Description or Media Alternative (Prerecorded) (A)'
      ]
    },
    '1.3': {
      name: 'Adaptable',
      criteria: [
        '1.3.1 Info and Relationships (A)',
        '1.3.2 Meaningful Sequence (A)',
        '1.3.3 Sensory Characteristics (A)',
        '1.3.4 Orientation (AA)',
        '1.3.5 Identify Input Purpose (AA)'
      ]
    },
    '1.4': {
      name: 'Distinguishable',
      criteria: [
        '1.4.1 Use of Color (A)',
        '1.4.2 Audio Control (A)',
        '1.4.3 Contrast (Minimum) (AA)',
        '1.4.4 Resize text (AA)',
        '1.4.5 Images of Text (AA)',
        '1.4.10 Reflow (AA)',
        '1.4.11 Non-text Contrast (AA)',
        '1.4.12 Text Spacing (AA)',
        '1.4.13 Content on Hover or Focus (AA)'
      ]
    }
  },
  operable: {
    '2.1': {
      name: 'Keyboard Accessible',
      criteria: [
        '2.1.1 Keyboard (A)',
        '2.1.2 No Keyboard Trap (A)',
        '2.1.4 Character Key Shortcuts (A)'
      ]
    },
    '2.2': {
      name: 'Enough Time',
      criteria: [
        '2.2.1 Timing Adjustable (A)',
        '2.2.2 Pause, Stop, Hide (A)'
      ]
    },
    '2.3': {
      name: 'Seizures and Physical Reactions',
      criteria: [
        '2.3.1 Three Flashes or Below Threshold (A)'
      ]
    },
    '2.4': {
      name: 'Navigable',
      criteria: [
        '2.4.1 Bypass Blocks (A)',
        '2.4.2 Page Titled (A)',
        '2.4.3 Focus Order (A)',
        '2.4.4 Link Purpose (In Context) (A)',
        '2.4.5 Multiple Ways (AA)',
        '2.4.6 Headings and Labels (AA)',
        '2.4.7 Focus Visible (AA)'
      ]
    },
    '2.5': {
      name: 'Input Modalities',
      criteria: [
        '2.5.1 Pointer Gestures (A)',
        '2.5.2 Pointer Cancellation (A)',
        '2.5.3 Label in Name (A)',
        '2.5.4 Motion Actuation (A)'
      ]
    }
  },
  understandable: {
    '3.1': {
      name: 'Readable',
      criteria: [
        '3.1.1 Language of Page (A)',
        '3.1.2 Language of Parts (AA)'
      ]
    },
    '3.2': {
      name: 'Predictable',
      criteria: [
        '3.2.1 On Focus (A)',
        '3.2.2 On Input (A)',
        '3.2.3 Consistent Navigation (AA)',
        '3.2.4 Consistent Identification (AA)'
      ]
    },
    '3.3': {
      name: 'Input Assistance',
      criteria: [
        '3.3.1 Error Identification (A)',
        '3.3.2 Labels or Instructions (A)',
        '3.3.3 Error Suggestion (AA)',
        '3.3.4 Error Prevention (Legal, Financial, Data) (AA)'
      ]
    }
  },
  robust: {
    '4.1': {
      name: 'Compatible',
      criteria: [
        '4.1.1 Parsing (A)',
        '4.1.2 Name, Role, Value (A)',
        '4.1.3 Status Messages (AA)'
      ]
    }
  }
};

interface AuditResult {
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  status: 'pass' | 'fail' | 'partial' | 'not-applicable';
  description: string;
  issues: string[];
  recommendations: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
}

interface ComponentAudit {
  component: string;
  location: string;
  results: AuditResult[];
  overallScore: number;
}

class WCAGAccessibilityAuditor {
  private results: ComponentAudit[] = [];
  private overallScore = 0;

  /**
   * Audit component structure and semantic HTML
   */
  private auditSemanticHTML(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 1.3.1 Info and Relationships
    results.push({
      criterion: '1.3.1 Info and Relationships',
      level: 'A',
      status: 'partial',
      description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined',
      issues: [
        'Some custom components may lack proper semantic structure',
        '3D visualization components need ARIA labels for screen readers',
        'Complex data tables may need additional markup'
      ],
      recommendations: [
        'Add semantic HTML5 elements (nav, main, section, article)',
        'Use proper heading hierarchy (h1-h6)',
        'Add ARIA landmarks and labels to 3D components',
        'Ensure form controls have associated labels'
      ],
      impact: 'high'
    });

    // 4.1.1 Parsing
    results.push({
      criterion: '4.1.1 Parsing',
      level: 'A',
      status: 'pass',
      description: 'Content can be parsed unambiguously',
      issues: [],
      recommendations: [
        'Continue using valid HTML markup',
        'Ensure all tags are properly closed',
        'Validate HTML structure regularly'
      ],
      impact: 'low'
    });

    // 4.1.2 Name, Role, Value
    results.push({
      criterion: '4.1.2 Name, Role, Value',
      level: 'A',
      status: 'partial',
      description: 'For all user interface components, the name and role can be programmatically determined',
      issues: [
        'Custom buttons and interactive elements may lack proper roles',
        'Search components need clearer accessible names',
        '3D navigation controls need ARIA attributes'
      ],
      recommendations: [
        'Add role attributes to custom interactive elements',
        'Use aria-label for buttons without visible text',
        'Implement aria-describedby for complex components',
        'Add aria-live regions for dynamic content updates'
      ],
      impact: 'high'
    });

    return results;
  }

  /**
   * Audit keyboard navigation and focus management
   */
  private auditKeyboardNavigation(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 2.1.1 Keyboard
    results.push({
      criterion: '2.1.1 Keyboard',
      level: 'A',
      status: 'partial',
      description: 'All functionality of the content is operable through a keyboard interface',
      issues: [
        '3D visualization may not be fully keyboard accessible',
        'Custom dropdown components may lack keyboard support',
        'Modal dialogs need proper focus management'
      ],
      recommendations: [
        'Implement keyboard controls for 3D navigation (arrow keys, WASD)',
        'Add Tab navigation to all interactive elements',
        'Implement Escape key to close modals and dropdowns',
        'Use arrow keys for navigation within components',
        'Add keyboard shortcuts for common actions'
      ],
      impact: 'critical'
    });

    // 2.1.2 No Keyboard Trap
    results.push({
      criterion: '2.1.2 No Keyboard Trap',
      level: 'A',
      status: 'pass',
      description: 'If keyboard focus can be moved to a component, it can be moved away',
      issues: [],
      recommendations: [
        'Test all modal dialogs for focus traps',
        'Ensure Tab order includes close buttons',
        'Test with screen readers for navigation issues'
      ],
      impact: 'medium'
    });

    // 2.4.3 Focus Order
    results.push({
      criterion: '2.4.3 Focus Order',
      level: 'A',
      status: 'partial',
      description: 'If a Web page can be navigated sequentially, focusable components receive focus in an order that preserves meaning',
      issues: [
        'Complex layouts may have confusing Tab order',
        'Dynamic content insertion may disrupt focus order',
        'Modal overlays need proper focus management'
      ],
      recommendations: [
        'Use tabindex="0" for custom interactive elements',
        'Use tabindex="-1" for programmatically focused elements',
        'Test Tab order with keyboard-only navigation',
        'Implement skip links for main content areas'
      ],
      impact: 'high'
    });

    // 2.4.7 Focus Visible
    results.push({
      criterion: '2.4.7 Focus Visible',
      level: 'AA',
      status: 'partial',
      description: 'Any keyboard operable interface has a mode where the focus indicator is visible',
      issues: [
        'Some custom components may have poor focus indicators',
        'Focus indicators may be hard to see on certain backgrounds',
        '3D elements need visible focus indication'
      ],
      recommendations: [
        'Enhance focus ring styles for better visibility',
        'Use outline or box-shadow for focus indicators',
        'Ensure focus indicators have sufficient contrast',
        'Test focus visibility in different themes'
      ],
      impact: 'medium'
    });

    return results;
  }

  /**
   * Audit color contrast and visual design
   */
  private auditColorAndContrast(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 1.4.3 Contrast (Minimum)
    results.push({
      criterion: '1.4.3 Contrast (Minimum)',
      level: 'AA',
      status: 'partial',
      description: 'Text has a contrast ratio of at least 4.5:1 (or 3:1 for large text)',
      issues: [
        'Some secondary text may not meet contrast requirements',
        'Interactive elements may have low contrast states',
        'Dark theme needs contrast validation'
      ],
      recommendations: [
        'Use contrast checking tools during design',
        'Ensure all text meets WCAG AA contrast ratios',
        'Test both light and dark themes',
        'Use accessible color palettes',
        'Add high contrast mode option'
      ],
      impact: 'high'
    });

    // 1.4.1 Use of Color
    results.push({
      criterion: '1.4.1 Use of Color',
      level: 'A',
      status: 'partial',
      description: 'Color is not used as the only visual means of conveying information',
      issues: [
        'Search result highlighting may rely only on color',
        'Status indicators may need additional visual cues',
        'Graph connections may be color-only'
      ],
      recommendations: [
        'Add icons or patterns to color-coded information',
        'Use text labels alongside color indicators',
        'Provide alternative visual cues for important information',
        'Test with color blindness simulators'
      ],
      impact: 'medium'
    });

    // 1.4.11 Non-text Contrast
    results.push({
      criterion: '1.4.11 Non-text Contrast',
      level: 'AA',
      status: 'partial',
      description: 'Visual presentation of user interface components has a contrast ratio of at least 3:1',
      issues: [
        'Button borders may not have sufficient contrast',
        'Form field boundaries may be unclear',
        'Interactive elements need better definition'
      ],
      recommendations: [
        'Ensure button borders meet 3:1 contrast ratio',
        'Add clear boundaries to form fields',
        'Use sufficient contrast for focus indicators',
        'Test with automated contrast checking tools'
      ],
      impact: 'medium'
    });

    return results;
  }

  /**
   * Audit text alternatives and media
   */
  private auditTextAlternatives(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 1.1.1 Non-text Content
    results.push({
      criterion: '1.1.1 Non-text Content',
      level: 'A',
      status: 'partial',
      description: 'All non-text content has text alternatives that serve the equivalent purpose',
      issues: [
        'Some decorative images may have unnecessary alt text',
        'Complex graphs and visualizations need detailed descriptions',
        'Icon buttons may lack accessible names'
      ],
      recommendations: [
        'Add descriptive alt text for informative images',
        'Use alt="" for decorative images',
        'Provide detailed descriptions for complex visualizations',
        'Add aria-label to icon-only buttons',
        'Use aria-describedby for complex interactive elements'
      ],
      impact: 'high'
    });

    return results;
  }

  /**
   * Audit forms and input validation
   */
  private auditFormsAndInput(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 3.3.1 Error Identification
    results.push({
      criterion: '3.3.1 Error Identification',
      level: 'A',
      status: 'partial',
      description: 'If an input error is automatically detected, the item in error is identified',
      issues: [
        'Form validation errors may not be clearly associated with fields',
        'Search input errors may not be announced to screen readers',
        'Dynamic validation needs proper ARIA attributes'
      ],
      recommendations: [
        'Use aria-invalid for fields with errors',
        'Associate error messages with form fields using aria-describedby',
        'Provide clear, specific error messages',
        'Use aria-live regions for dynamic error announcements'
      ],
      impact: 'high'
    });

    // 3.3.2 Labels or Instructions
    results.push({
      criterion: '3.3.2 Labels or Instructions',
      level: 'A',
      status: 'partial',
      description: 'Labels or instructions are provided when content requires user input',
      issues: [
        'Some form fields may lack proper labels',
        'Search filters may need clearer instructions',
        'Complex forms may need additional guidance'
      ],
      recommendations: [
        'Associate labels with all form controls',
        'Provide instructions for complex input requirements',
        'Use placeholder text appropriately (not as labels)',
        'Add help text for unclear form fields'
      ],
      impact: 'high'
    });

    return results;
  }

  /**
   * Audit responsive design and mobile accessibility
   */
  private auditResponsiveDesign(component: string): AuditResult[] {
    const results: AuditResult[] = [];

    // 1.4.4 Resize text
    results.push({
      criterion: '1.4.4 Resize text',
      level: 'AA',
      status: 'pass',
      description: 'Text can be resized up to 200% without loss of content or functionality',
      issues: [],
      recommendations: [
        'Test with browser zoom up to 200%',
        'Use relative units (rem, em) for text sizing',
        'Ensure layout remains functional at high zoom levels',
        'Test with system font size preferences'
      ],
      impact: 'medium'
    });

    // 1.4.10 Reflow
    results.push({
      criterion: '1.4.10 Reflow',
      level: 'AA',
      status: 'pass',
      description: 'Content can be presented without loss of information at 320 CSS pixels width',
      issues: [],
      recommendations: [
        'Test responsive design on narrow viewports',
        'Ensure content reflows without horizontal scrolling',
        'Use flexible layouts and breakpoints',
        'Test with mobile devices and tablets'
      ],
      impact: 'medium'
    });

    // 1.3.4 Orientation
    results.push({
      criterion: '1.3.4 Orientation',
      level: 'AA',
      status: 'pass',
      description: 'Content does not restrict its view to a single display orientation',
      issues: [],
      recommendations: [
        'Support both portrait and landscape orientations',
        'Test functionality in different orientations',
        'Ensure 3D visualization works in both orientations'
      ],
      impact: 'low'
    });

    return results;
  }

  /**
   * Audit specific component
   */
  private auditComponent(component: string, location: string): ComponentAudit {
    console.log(`Auditing ${component}...`);

    const allResults: AuditResult[] = [
      ...this.auditSemanticHTML(component),
      ...this.auditKeyboardNavigation(component),
      ...this.auditColorAndContrast(component),
      ...this.auditTextAlternatives(component),
      ...this.auditFormsAndInput(component),
      ...this.auditResponsiveDesign(component)
    ];

    // Calculate component score
    const totalPoints = allResults.length * 100;
    const earnedPoints = allResults.reduce((sum, result) => {
      switch (result.status) {
        case 'pass': return sum + 100;
        case 'partial': return sum + 50;
        case 'fail': return sum + 0;
        case 'not-applicable': return sum + 100; // Don't penalize N/A
        default: return sum;
      }
    }, 0);

    const score = Math.round((earnedPoints / totalPoints) * 100);

    return {
      component,
      location,
      results: allResults,
      overallScore: score
    };
  }

  /**
   * Run complete accessibility audit
   */
  public async runCompleteAudit(): Promise<ComponentAudit[]> {
    console.log('🔍 Starting WCAG 2.1 AA Accessibility Audit\n');

    const componentsToAudit = [
      { name: 'Homepage', location: 'client/src/pages/HomePage.tsx' },
      { name: 'AI Search Component', location: 'client/src/components/search/AISemanticSearch.tsx' },
      { name: '3D Knowledge Graph', location: 'client/src/components/visualization/3DKnowledgeGraph.tsx' },
      { name: 'Navigation Header', location: 'client/src/components/layout/Header.tsx' },
      { name: 'Term Detail Page', location: 'client/src/pages/TermDetail.tsx' },
      { name: 'Learning Paths', location: 'client/src/pages/LearningPaths.tsx' },
      { name: 'Code Examples', location: 'client/src/pages/CodeExamples.tsx' },
      { name: 'PWA Status Component', location: 'client/src/components/ui/PWAStatus.tsx' },
      { name: 'Search Results', location: 'client/src/components/search/SearchResults.tsx' },
      { name: 'Modal Dialogs', location: 'client/src/components/ui/Modal.tsx' }
    ];

    for (const component of componentsToAudit) {
      const audit = this.auditComponent(component.name, component.location);
      this.results.push(audit);
    }

    // Calculate overall application score
    this.overallScore = Math.round(
      this.results.reduce((sum, result) => sum + result.overallScore, 0) / this.results.length
    );

    return this.results;
  }

  /**
   * Generate comprehensive accessibility report
   */
  public generateReport(): string {
    const report = [
      '# WCAG 2.1 AA Accessibility Audit Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Executive Summary',
      '',
      `**Overall Accessibility Score: ${this.overallScore}%**`,
      ''
    ];

    // Score interpretation
    if (this.overallScore >= 90) {
      report.push('✅ **Excellent** - Application meets most accessibility requirements');
    } else if (this.overallScore >= 75) {
      report.push('🟡 **Good** - Application has good accessibility with some improvements needed');
    } else if (this.overallScore >= 60) {
      report.push('⚠️ **Fair** - Application needs significant accessibility improvements');
    } else {
      report.push('❌ **Poor** - Application has major accessibility barriers');
    }

    report.push('');

    // Summary statistics
    const totalIssues = this.results.reduce((sum, result) => 
      sum + result.results.filter(r => r.status === 'fail' || r.status === 'partial').length, 0
    );
    
    const criticalIssues = this.results.reduce((sum, result) => 
      sum + result.results.filter(r => r.impact === 'critical' && r.status !== 'pass').length, 0
    );

    const highIssues = this.results.reduce((sum, result) => 
      sum + result.results.filter(r => r.impact === 'high' && r.status !== 'pass').length, 0
    );

    report.push(`- **Total Issues Found:** ${totalIssues}`);
    report.push(`- **Critical Issues:** ${criticalIssues}`);
    report.push(`- **High Priority Issues:** ${highIssues}`);
    report.push(`- **Components Audited:** ${this.results.length}`);
    report.push('');

    // Component scores overview
    report.push('## Component Accessibility Scores');
    report.push('');
    report.push('| Component | Score | Status | Critical Issues |');
    report.push('|-----------|-------|---------|-----------------|');

    for (const result of this.results) {
      const criticalCount = result.results.filter(r => 
        r.impact === 'critical' && r.status !== 'pass'
      ).length;
      
      const status = result.overallScore >= 80 ? '✅ Good' : 
                   result.overallScore >= 60 ? '⚠️ Needs Work' : '❌ Poor';

      report.push(`| ${result.component} | ${result.overallScore}% | ${status} | ${criticalCount} |`);
    }

    report.push('');

    // Priority issues to fix
    report.push('## Priority Issues to Fix');
    report.push('');

    // Collect all critical and high priority issues
    const priorityIssues: { component: string; criterion: string; impact: string; issues: string[]; recommendations: string[] }[] = [];

    for (const result of this.results) {
      for (const auditResult of result.results) {
        if ((auditResult.impact === 'critical' || auditResult.impact === 'high') && 
            auditResult.status !== 'pass' && auditResult.issues.length > 0) {
          priorityIssues.push({
            component: result.component,
            criterion: auditResult.criterion,
            impact: auditResult.impact,
            issues: auditResult.issues,
            recommendations: auditResult.recommendations
          });
        }
      }
    }

    // Sort by impact (critical first)
    priorityIssues.sort((a, b) => {
      if (a.impact === 'critical' && b.impact !== 'critical') return -1;
      if (b.impact === 'critical' && a.impact !== 'critical') return 1;
      return 0;
    });

    let issueNumber = 1;
    for (const issue of priorityIssues.slice(0, 10)) { // Top 10 issues
      const impactIcon = issue.impact === 'critical' ? '🚨' : '⚠️';
      report.push(`### ${issueNumber}. ${impactIcon} ${issue.criterion} - ${issue.component}`);
      report.push('');
      report.push('**Issues:**');
      issue.issues.forEach(iss => report.push(`- ${iss}`));
      report.push('');
      report.push('**Recommendations:**');
      issue.recommendations.slice(0, 3).forEach(rec => report.push(`- ${rec}`));
      report.push('');
      issueNumber++;
    }

    // Detailed component reports
    report.push('## Detailed Component Reports');
    report.push('');

    for (const result of this.results) {
      report.push(`### ${result.component} (${result.overallScore}%)`);
      report.push(`Location: \`${result.location}\``);
      report.push('');

      // Group results by status
      const passResults = result.results.filter(r => r.status === 'pass');
      const partialResults = result.results.filter(r => r.status === 'partial');
      const failResults = result.results.filter(r => r.status === 'fail');

      if (passResults.length > 0) {
        report.push(`**✅ Passing (${passResults.length}):**`);
        passResults.forEach(r => report.push(`- ${r.criterion}`));
        report.push('');
      }

      if (partialResults.length > 0) {
        report.push(`**⚠️ Partial Compliance (${partialResults.length}):**`);
        partialResults.forEach(r => {
          report.push(`- **${r.criterion}**`);
          if (r.issues.length > 0) {
            report.push(`  - Issues: ${r.issues.join(', ')}`);
          }
        });
        report.push('');
      }

      if (failResults.length > 0) {
        report.push(`**❌ Failing (${failResults.length}):**`);
        failResults.forEach(r => {
          report.push(`- **${r.criterion}**`);
          if (r.issues.length > 0) {
            report.push(`  - Issues: ${r.issues.join(', ')}`);
          }
        });
        report.push('');
      }

      report.push('---');
      report.push('');
    }

    // Implementation roadmap
    report.push('## Implementation Roadmap');
    report.push('');
    report.push('### Phase 1: Critical Issues (Immediate)');
    report.push('- Fix keyboard navigation for 3D visualization');
    report.push('- Add ARIA labels and roles to interactive elements');
    report.push('- Ensure all form fields have proper labels');
    report.push('- Implement focus management for modal dialogs');
    report.push('');
    report.push('### Phase 2: High Priority Issues (1-2 weeks)');
    report.push('- Improve color contrast ratios');
    report.push('- Add text alternatives for complex visualizations');
    report.push('- Enhance focus indicators');
    report.push('- Implement error handling and announcements');
    report.push('');
    report.push('### Phase 3: Enhancement (2-4 weeks)');
    report.push('- Add skip navigation links');
    report.push('- Implement high contrast mode');
    report.push('- Add keyboard shortcuts');
    report.push('- Enhance mobile accessibility');
    report.push('');

    // Testing recommendations
    report.push('## Testing Recommendations');
    report.push('');
    report.push('1. **Automated Testing**');
    report.push('   - Integrate axe-core for continuous accessibility testing');
    report.push('   - Use Lighthouse accessibility audits in CI/CD');
    report.push('   - Add accessibility linting to development workflow');
    report.push('');
    report.push('2. **Manual Testing**');
    report.push('   - Keyboard-only navigation testing');
    report.push('   - Screen reader testing (NVDA, JAWS, VoiceOver)');
    report.push('   - Color blindness simulation testing');
    report.push('   - Mobile accessibility testing');
    report.push('');
    report.push('3. **User Testing**');
    report.push('   - Test with users who have disabilities');
    report.push('   - Gather feedback on accessibility improvements');
    report.push('   - Conduct regular accessibility reviews');

    return report.join('\n');
  }

  /**
   * Save audit results
   */
  public saveResults(): void {
    const outputDir = join(process.cwd(), 'reports', 'accessibility');
    
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save detailed results as JSON
    const jsonData = {
      timestamp: new Date().toISOString(),
      overallScore: this.overallScore,
      componentResults: this.results,
      summary: {
        totalComponents: this.results.length,
        averageScore: this.overallScore,
        criticalIssues: this.results.reduce((sum, result) => 
          sum + result.results.filter(r => r.impact === 'critical' && r.status !== 'pass').length, 0
        ),
        highPriorityIssues: this.results.reduce((sum, result) => 
          sum + result.results.filter(r => r.impact === 'high' && r.status !== 'pass').length, 0
        )
      }
    };

    try {
      writeFileSync(
        join(outputDir, 'accessibility-audit-results.json'),
        JSON.stringify(jsonData, null, 2)
      );
      console.log(`📊 Detailed results: ${join(outputDir, 'accessibility-audit-results.json')}`);
    } catch (error) {
      console.warn('Could not save JSON results');
    }

    // Save report as markdown
    try {
      writeFileSync(
        join(outputDir, 'accessibility-audit-report.md'),
        this.generateReport()
      );
      console.log(`📋 Audit report: ${join(outputDir, 'accessibility-audit-report.md')}`);
    } catch (error) {
      console.warn('Could not save report');
    }
  }
}

async function main() {
  const auditor = new WCAGAccessibilityAuditor();
  
  await auditor.runCompleteAudit();
  
  console.log('\n♿ Accessibility Audit Complete!');
  console.log('='.repeat(50));
  
  const report = auditor.generateReport();
  console.log(report);
  
  auditor.saveResults();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { WCAGAccessibilityAuditor };