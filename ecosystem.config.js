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
        PORT: 3001,
        DB_HOST: '223.4.248.176',
        DB_PORT: 3306,
        DB_USERNAME: 'deploy_user',
        DB_PASSWORD: 'qq123456',
        DB_DATABASE: 'nest_db'
      },
      error_file: './logs/err-1.log',
      out_file: './logs/out-1.log',
      log_file: './logs/combined-1.log',
      time: true
    }
  ]
}; 