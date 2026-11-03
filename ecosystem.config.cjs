// pm2 进程守护配置：崩溃自动重启、开机自启
// 启动：pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'cuddolab',
      script: 'server.js',
      // 通过 --env-file 读取 .env（需 Node 20.6+）
      node_args: '--env-file=.env',
      // 单实例：限流是内存级的，多实例计数会各自独立
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      // 优雅关闭：给进程时间处理完现有请求（与 server.js 的 10s 兜底匹配）
      kill_timeout: 11000,
      env: { NODE_ENV: 'production' },
      out_file: 'logs/out.log',
      error_file: 'logs/err.log',
      time: true,
    },
  ],
};
