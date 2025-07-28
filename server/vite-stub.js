// Production stub for vite module
module.exports = {
  setupVite: async () => {
    console.log('Vite setup skipped in production');
  },
  serveStatic: (req, res, next) => {
    next();
  }
};