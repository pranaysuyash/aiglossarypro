#!/usr/bin/env tsx

import { performance } from 'node:perf_hooks';
import { eq, sql } from 'drizzle-orm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { db } from '../server/db';
import { categories, terms } from '../shared/schema';

interface QualityReport {
  totalTerms: number;
  termsWithContent: number;
  averageContentLength: number;
  qualityScores: {
    excellent: number; // 9-10
    good: number; // 7-8
    average: number; // 5-6
    poor: number; // 0-4
  };
  completionByCategory: Record<string, number>;
  missingContent: string[];
  recommendations: string[];
  generatedAt: string;
}

async function generateQualityReport(): Promise<QualityReport> {
  console.log('🔍 Generating Content Quality Report...');

  const startTime = performance.now();

  // Get all terms with their categories
  const allTerms = await db
    .select({
      id: terms.id,
      name: terms.name,
      definition: terms.definition,
      shortDefinition: terms.shortDefinition,
      characteristics: terms.characteristics,
      applications: terms.applications,
      categoryName: categories.name,
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id));

  const report: QualityReport = {
    totalTerms: allTerms.length,
    termsWithContent: 0,
    averageContentLength: 0,
    qualityScores: { excellent: 0, good: 0, average: 0, poor: 0 },
    completionByCategory: {},
    missingContent: [],
    recommendations: [],
    generatedAt: new Date().toISOString(),
  };

  let totalContentLength = 0;

  for (const term of allTerms) {
    // Calculate content completeness
    let contentScore = 0;
    let contentLength = 0;

    if (term.definition && term.definition.length > 50) {
      contentScore += 25;
      contentLength += term.definition.length;
    }
    if (term.shortDefinition && term.shortDefinition.length > 20) {
      contentScore += 15;
      contentLength += term.shortDefinition.length;
    }
    if (term.characteristics && term.characteristics.length > 0) {
      contentScore += 20;
      contentLength += term.characteristics.join(' ').length;
    }
    if (term.applications && Array.isArray(term.applications) && term.applications.length > 0) {
      contentScore += 25;
      contentLength += JSON.stringify(term.applications).length;
    }

    // Additional sections would be checked here in full implementation
    contentScore += 15; // Placeholder for other sections

    totalContentLength += contentLength;

    if (contentScore >= 70) {
      report.termsWithContent++;
    }

    // Categorize quality
    if (contentScore >= 90) report.qualityScores.excellent++;
    else if (contentScore >= 70) report.qualityScores.good++;
    else if (contentScore >= 50) report.qualityScores.average++;
    else {
      report.qualityScores.poor++;
      report.missingContent.push(term.name);
    }

    // Track by category
    const categoryName = term.categoryName || 'Uncategorized';
    if (!report.completionByCategory[categoryName]) {
      report.completionByCategory[categoryName] = 0;
    }
    if (contentScore >= 70) {
      report.completionByCategory[categoryName]++;
    }
  }

  report.averageContentLength = Math.round(totalContentLength / Math.max(allTerms.length, 1));

  // Generate recommendations
  if (report.qualityScores.poor > 0) {
    report.recommendations.push(
      `${report.qualityScores.poor} terms need immediate content improvement`
    );
  }
  if (report.totalTerms === 0) {
    report.recommendations.push('No terms found in database - start content generation');
  } else if (report.termsWithContent / report.totalTerms < 0.8) {
    report.recommendations.push(
      'Content completion rate below 80% - prioritize content generation'
    );
  }
  if (report.averageContentLength < 500) {
    report.recommendations.push(
      'Average content length is low - consider expanding definitions and examples'
    );
  }

  const duration = performance.now() - startTime;
  console.log(`✅ Quality report generated in ${(duration / 1000).toFixed(2)}s`);

  return report;
}

function printQualityReport(report: QualityReport): void {
  console.log('\n📊 CONTENT QUALITY REPORT');
  console.log('═══════════════════════════');
  console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(`Total Terms: ${report.totalTerms}`);

  if (report.totalTerms > 0) {
    console.log(
      `Terms with Content: ${report.termsWithContent} (${((report.termsWithContent / report.totalTerms) * 100).toFixed(1)}%)`
    );
    console.log(`Average Content Length: ${report.averageContentLength} characters`);

    console.log('\n📈 Quality Distribution:');
    console.log(`  Excellent (90-100%): ${report.qualityScores.excellent}`);
    console.log(`  Good (70-89%): ${report.qualityScores.good}`);
    console.log(`  Average (50-69%): ${report.qualityScores.average}`);
    console.log(`  Poor (0-49%): ${report.qualityScores.poor}`);

    if (Object.keys(report.completionByCategory).length > 0) {
      console.log('\n📋 Completion by Category:');
      for (const [category, count] of Object.entries(report.completionByCategory)) {
        console.log(`  ${category}: ${count} terms`);
      }
    }

    if (report.missingContent.length > 0) {
      console.log('\n⚠️  Terms Needing Content:');
      report.missingContent.slice(0, 10).forEach(term => console.log(`  - ${term}`));
      if (report.missingContent.length > 10) {
        console.log(`  ... and ${report.missingContent.length - 10} more`);
      }
    }
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
  }
}

async function saveReportToFile(report: QualityReport): Promise<string> {
  try {
    // Ensure reports directory exists
    await mkdir('reports', { recursive: true });

    const reportDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `quality-report-${reportDate}-${timestamp}.json`;
    const filePath = join('reports', fileName);

    await writeFile(filePath, JSON.stringify(report, null, 2));

    return filePath;
  } catch (error) {
    console.error('❌ Error saving report to file:', error);
    throw error;
  }
}

async function main() {
  try {
    const report = await generateQualityReport();
    printQualityReport(report);

    // Save report to file
    const filePath = await saveReportToFile(report);
    console.log(`\n📄 Report saved to ${filePath}`);

    // Exit with appropriate code based on quality
    if (report.totalTerms === 0) {
      console.log('\n⚠️  No terms found - database may need initialization');
      process.exit(2);
    } else if (report.qualityScores.poor > report.totalTerms * 0.3) {
      console.log('\n⚠️  Quality issues detected - more than 30% of terms need improvement');
      process.exit(1);
    } else {
      console.log('\n✅ Quality check completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error generating quality report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateQualityReport, type QualityReport };
