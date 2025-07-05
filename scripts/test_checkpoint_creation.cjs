#!/usr/bin/env node

/**
 * Test checkpoint file creation specifically
 */

const fs = require('fs').promises;
const FormData = require('form-data');

async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function testCheckpointCreation() {
  console.log('🔍 Testing Checkpoint File Creation');
  console.log('==================================');
  
  const testFile = __dirname + '/data/row1.xlsx';
  
  const aiOptions = {
    enableAI: true,
    mode: 'basic',
    sections: ['Introduction – Definition and Overview'],
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'full'
  };
  
  try {
    const fetch = await getFetch();
    const form = new FormData();
    form.append('file', require('fs').createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions));
    
    console.log('🚀 Starting processing...');
    
    const response = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Processing completed successfully');
      
      // Wait for file writes
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check checkpoint directory
      try {
        const checkpointDir = __dirname + '/temp/checkpoints';
        const files = await fs.readdir(checkpointDir);
        
        console.log('📁 Checkpoint directory contents:', files);
        
        const checkpointFiles = files.filter(f => f.includes('row1.xlsx'));
        if (checkpointFiles.length > 0) {
          console.log('✅ Checkpoint files found:', checkpointFiles);
          
          // Read and analyze main checkpoint
          const mainFile = checkpointFiles[0];
          const content = await fs.readFile(`${checkpointDir}/${mainFile}`, 'utf-8');
          const checkpoint = JSON.parse(content);
          
          console.log('📊 Checkpoint Contents:');
          console.log(`   Version: ${checkpoint.version}`);
          console.log(`   Processor: ${checkpoint.processorType}`);
          console.log(`   Progress: ${checkpoint.processedCells}/${checkpoint.totalCells}`);
          console.log(`   Errors: ${checkpoint.errorLog.length}`);
          
          return true;
        } else {
          console.log('⚠️  No checkpoint files found for row1.xlsx');
          return false;
        }
      } catch (error) {
        console.log('❌ Error checking checkpoint directory:', error.message);
        return false;
      }
      
    } else {
      console.log('❌ Processing failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testCheckpointCreation().then(success => {
  console.log(`\n🎯 Checkpoint Creation Test: ${success ? 'PASSED' : 'FAILED'}`);
}).catch(console.error);