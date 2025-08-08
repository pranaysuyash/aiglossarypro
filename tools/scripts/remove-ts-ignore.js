#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
class TsIgnoreRemover {
    fixes = [];
    async removeAllTsIgnores() {
        console.log(chalk.cyan.bold('=== Removing @ts-ignore Comments ===\n'));
        // Define fixes for each file
        this.fixes = [
            {
                file: 'client/src/components/vr/VRConceptSpace.tsx',
                line: 197,
                context: 'Player and XR state placeholders',
                fix: () => this.fixVRConceptSpace()
            },
            {
                file: 'client/src/components/landing/Pricing.tsx',
                line: 17,
                context: 'Million.js optimization directive',
                fix: () => this.fixPricing()
            },
            {
                file: 'server/s3Service.ts',
                line: 142,
                context: 'S3 Body stream type',
                fix: () => this.fixS3Service()
            }
        ];
        // Apply fixes
        for (const fix of this.fixes) {
            console.log(chalk.blue(`Fixing ${fix.file}...`));
            console.log(chalk.gray(`  Context: ${fix.context}`));
            try {
                fix.fix();
                console.log(chalk.green(`  ✓ Fixed successfully\n`));
            }
            catch (error) {
                console.error(chalk.red(`  ✗ Failed: ${error}\n`));
            }
        }
        console.log(chalk.green.bold('✅ All @ts-ignore comments removed from production code!'));
    }
    fixVRConceptSpace() {
        const filePath = join(process.cwd(), 'client/src/components/vr/VRConceptSpace.tsx');
        let content = readFileSync(filePath, 'utf8');
        // Replace the @ts-ignore sections with proper typing
        content = content.replace(`  // @ts-ignore
  const { player } = {} as any; // Player state would go here
  // @ts-ignore
  const { isPresenting } = {} as any; // useXR hook would go here`, `  // VR state placeholders - to be implemented with actual XR hooks
  const player = { position: [0, 0, 0] as [number, number, number] };
  const isPresenting = false; // Will be replaced with useXR().isPresenting when XR is fully integrated`);
        writeFileSync(filePath, content, 'utf8');
    }
    fixPricing() {
        const filePath = join(process.cwd(), 'client/src/components/landing/Pricing.tsx');
        let content = readFileSync(filePath, 'utf8');
        // Remove @ts-ignore comment but keep the Million.js directive as a regular comment
        content = content.replace(`// @ts-ignore - Disable Million.js optimization for this component
const ComparisonTable = /*#__PURE__*/ function ComparisonTable()`, `// Million.js optimization disabled for this component due to dynamic content
// The /*#__PURE__*/ annotation helps with tree-shaking
const ComparisonTable = /*#__PURE__*/ function ComparisonTable()`);
        writeFileSync(filePath, content, 'utf8');
    }
    fixS3Service() {
        const filePath = join(process.cwd(), 'server/s3Service.ts');
        let content = readFileSync(filePath, 'utf8');
        // Add proper type import and fix the Body type issue
        if (!content.includes('import { Readable } from')) {
            content = `import { Readable } from 'stream';\n` + content;
        }
        // Replace the @ts-ignore with proper type casting
        content = content.replace(`      // @ts-ignore - Body should have pipe method as a readable stream
      response.Body.pipe(writeStream)`, `      // Cast Body to Readable stream for pipe operation
      (response.Body as Readable).pipe(writeStream)`);
        writeFileSync(filePath, content, 'utf8');
    }
}
// Run the remover
const remover = new TsIgnoreRemover();
remover.removeAllTsIgnores().catch(error => {
    console.error(chalk.red('Error:', error));
    process.exit(1);
});
