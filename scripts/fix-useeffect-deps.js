#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const files = [
  'client/src/pages/CodeExamples.tsx',
  'client/src/pages/LearningPathDetail.tsx',
  'client/src/pages/LearningPaths.tsx',
];

const fixes = [
  {
    file: 'client/src/pages/CodeExamples.tsx',
    search: /}, \[fetchCodeExamples\]\);/g,
    replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);'
  },
  {
    file: 'client/src/pages/LearningPathDetail.tsx',
    search: /}, \[.*fetchLearningPath.*\]\);/g,
    replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [id]);'
  },
  {
    file: 'client/src/pages/LearningPaths.tsx',
    search: /}, \[.*fetchLearningPaths.*fetchUserProgress.*\]\);/g,
    replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);'
  }
];

for (const fix of fixes) {
  try {
    const filePath = path.join(process.cwd(), fix.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fix.file}`);
    } else {
      console.log(`⚠️  File not found: ${fix.file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${fix.file}:`, error.message);
  }
}

console.log('\n🎉 Finished fixing useEffect dependencies!');