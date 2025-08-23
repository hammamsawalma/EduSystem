module.exports = {
  apps: [
    {
      name: 'edusystem-backend',
      script: 'app.js',
      cwd: '/home/hichoma/Dev/freelance/EduSystem/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'exports'
      ],
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      kill_timeout: 5000,
      restart_delay: 4000
    }
  ]
};
