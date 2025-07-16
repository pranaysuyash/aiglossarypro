module.exports = {
  apps: [
    {
      name: 'aiglossary-pro',
      script: './dist/server/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
    {
      name: 'daily-term-rotation',
      script: './scripts/daily-term-rotation.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Run daily at midnight
      autorestart: false, // Don't restart automatically, only via cron
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/daily-rotation-err.log',
      out_file: './logs/daily-rotation-out.log',
      log_file: './logs/daily-rotation-combined.log',
      time: true,
    },
  ],
};
