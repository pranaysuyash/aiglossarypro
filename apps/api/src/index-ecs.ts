console.log(`[ECS] ${new Date().toISOString()} - Starting ECS-optimized server...`);

// Set dummy values to prevent import crashes
if (!process.env.DATABASE_URL) {
  console.log('[ECS] Setting temporary DATABASE_URL for module imports...');
  process.env.DATABASE_URL = 'postgresql://temp:temp@localhost/temp';
}

// Import the main app after setting dummy values
import('./index').then(() => {
  console.log('[ECS] Main application loaded successfully');
}).catch((error) => {
  console.error('[ECS] Failed to load main application:', error);
  process.exit(1);
});
