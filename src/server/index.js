const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const connectDB = require('../database/connection');

// 导入路由
const searchRoutes = require('./routes/search');
const reportRoutes = require('./routes/report');
const healthRoutes = require('./routes/health');
const iterativeSearchRoutes = require('./routes/iterative-search');
const screenshotRoutes = require('./routes/screenshots');

const app = express();

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// 静态文件服务
app.use('/screenshots', express.static(path.join(__dirname, '../../public/screenshots')));

// 路由配置
app.use('/api/search', searchRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/iterative-search', iterativeSearchRoutes);
app.use('/api/screenshots', screenshotRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();
    
    // 启动服务器
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.env}`);
    });

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = app; 