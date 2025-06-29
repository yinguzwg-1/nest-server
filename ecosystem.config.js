module.exports = {
  apps: [
    {
      name: 'nestjs-api',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/root/nest-server/nest-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err-1.log',
      out_file: './logs/out-1.log',
      log_file: './logs/combined-1.log',
      time: true
    }
  ]
}; 