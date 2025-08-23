module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm run preview',
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      time: true
    }
  ]
};