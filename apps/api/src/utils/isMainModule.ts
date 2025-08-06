/**
 * Helper function to check if a module is being run as the main module
 * Works with both CommonJS and ES modules
 */
export function isMainModule(): boolean {
  // Check if running as CommonJS
  if (typeof require !== 'undefined' && require.main === module) {
    return true;
  }
  
  // Check if running as ES module (when available)
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  
  // Fallback: check if this is the entry point
  return process.argv[1] === __filename;
}