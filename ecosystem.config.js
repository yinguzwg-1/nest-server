module.exports = {
  apps: [
    {
      name: 'nestjs-api',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/nest-server',
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
        DB_DATABASE: 'nest_db',
        YOUDAO_APP_KEY: '20220529001233310',
        YOUDAO_APP_SECRET: 'yuM_bOR5cbjZVttocWs1'
      },
      error_file: './logs/err-1.log',
      out_file: './logs/out-1.log',
      log_file: './logs/combined-1.log',
      time: true
    }
  ]
}; 