module.exports = {
  apps: [
    {
      name: 'edusystem-frontend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/hichoma/Dev/freelance/EduSystem/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      restart_delay: 4000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'edusystem-frontend-build',
      script: 'npm',
      args: 'run build',
      cwd: '/home/hichoma/Dev/freelance/EduSystem/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false,
      watch: false
    },
    {
      name: 'edusystem-frontend-preview',
      script: 'npm',
      args: 'run preview',
      cwd: '/home/hichoma/Dev/freelance/EduSystem/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4173
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      restart_delay: 4000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
