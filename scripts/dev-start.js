#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

async function killProcessOnPort(port) {
  try {
    logInfo(`Checking for processes on port ${port}...`);
    
    // Find processes using the port
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(pid => pid);
    
    if (pids.length > 0) {
      logWarning(`Found ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`);
      
      // Kill each process
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          logSuccess(`Killed process ${pid} on port ${port}`);
        } catch (error) {
          logWarning(`Could not kill process ${pid}: ${error.message}`);
        }
      }
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      logInfo(`No processes found on port ${port}`);
    }
  } catch (_error) {
    // No processes found or other error
    logInfo(`Port ${port} is available`);
  }
}

async function cleanupOrphanedProcesses() {
  try {
    logInfo('Cleaning up orphaned development processes...');
    
    // Kill any orphaned npm, tsx, or vite processes
    const commands = [
      "pkill -f 'npm.*dev'",
      "pkill -f 'tsx.*server'", 
      "pkill -f 'vite.*dev'",
      "pkill -f 'dev-start'"
    ];
    
    for (const cmd of commands) {
      try {
        await execAsync(cmd);
      } catch (_error) {
        // Ignore errors - processes might not exist
      }
    }
    
    logSuccess('Cleanup completed');
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

function spawnWithLogging(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options
  });

  // Handle stdout with prefixes
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${colors.blue}[${options.prefix || 'dev'}]${colors.reset} ${line}`);
    });
  });

  // Handle stderr with prefixes
  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${colors.red}[${options.prefix || 'dev'}]${colors.reset} ${line}`);
    });
  });

  return child;
}

async function waitForServer(url, maxAttempts = 30, interval = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (_error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

async function startDevelopmentServers() {
  logSection('🚀 AI Glossary Pro - Smart Development Startup');
  
  // Step 1: Cleanup
  logSection('🧹 Cleanup Phase');
  await cleanupOrphanedProcesses();
  await killProcessOnPort(3001); // Backend port
  await killProcessOnPort(5173); // Frontend port
  
  // Step 2: Start Backend
  logSection('🔧 Starting Backend Server');
  logInfo('Starting server on port 3001...');
  
  const serverProcess = spawnWithLogging('npm', ['run', 'dev:server'], {
    prefix: 'dev:server',
    cwd: process.cwd(),
    env: process.env
  });
  
  // Step 3: Wait for backend to be ready
  logInfo('Waiting for backend server to be ready...');
  const serverReady = await waitForServer('http://localhost:3001/api/health');
  
  if (serverReady) {
    logSuccess('Backend server is ready!');
  } else {
    logWarning('Backend server may not be fully ready, but continuing...');
  }
  
  // Step 4: Start Frontend
  logSection('🎨 Starting Frontend Server');
  logInfo('Starting client on port 5173...');
  
  const clientProcess = spawnWithLogging('npm', ['run', 'dev:client'], {
    prefix: 'dev:client',
    cwd: process.cwd()
  });
  
  // Step 5: Wait for frontend to be ready
  logInfo('Waiting for frontend server to be ready...');
  const clientReady = await waitForServer('http://localhost:5173');
  
  if (clientReady) {
    logSuccess('Frontend server is ready!');
  } else {
    logWarning('Frontend server may not be fully ready, but continuing...');
  }
  
  // Step 6: Show status
  logSection('🎉 Development Environment Ready');
  logSuccess('Frontend: http://localhost:5173');
  logSuccess('Backend:  http://localhost:3001');
  logSuccess('API Docs: http://localhost:3001/api/docs');
  logInfo('Press Ctrl+C to stop all servers');
  
  // Step 7: Setup graceful shutdown
  const cleanup = async () => {
    logSection('🔄 Shutting Down Development Servers');
    
    logInfo('Terminating frontend server...');
    clientProcess.kill('SIGTERM');
    
    logInfo('Terminating backend server...');
    serverProcess.kill('SIGTERM');
    
    // Give processes time to cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force kill if still running
    try {
      clientProcess.kill('SIGKILL');
      serverProcess.kill('SIGKILL');
         } catch (_error) {
       // Processes already terminated
     }
    
    logSuccess('Development servers stopped');
    process.exit(0);
  };
  
  // Handle various termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGUSR1', cleanup);
  process.on('SIGUSR2', cleanup);
  
  // Handle process errors
  serverProcess.on('error', (error) => {
    logError(`Backend server error: ${error.message}`);
  });
  
  clientProcess.on('error', (error) => {
    logError(`Frontend server error: ${error.message}`);
  });
  
  // Handle process exits
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Backend server exited with code ${code}`);
    }
  });
  
  clientProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Frontend server exited with code ${code}`);
    }
  });
}

// Start the development environment
startDevelopmentServers().catch((error) => {
  logError(`Failed to start development servers: ${error.message}`);
  process.exit(1);
}); 