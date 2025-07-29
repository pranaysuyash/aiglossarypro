import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFile = path.resolve(__dirname, '../tests/visual/visual-audit-storybook.ts');
const configPath = path.resolve(__dirname, './playwright.visual.config.ts');

const command = `npx playwright test ${testFile} --config=${configPath}`;

console.log(`Running Playwright command: ${command}`);

const child = exec(command, { cwd: path.resolve(__dirname, '..') });

child.stdout.on('data', data => {
  process.stdout.write(data);
});

child.stderr.on('data', data => {
  process.stderr.write(data);
});

child.on('close', code => {
  if (code !== 0) {
    console.error(`Playwright process exited with code ${code}`);
    process.exit(code);
  }
});
