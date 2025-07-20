export const monitoringConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  sampling: {
    error: 1.0, // 错误采样率 100%
    performance: 0.1, // 性能采样率 10%
  },
  retention: {
    errors: 30, // 错误数据保留30天
    performance: 7, // 性能数据保留7天
  }
};