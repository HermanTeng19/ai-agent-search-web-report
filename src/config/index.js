require('dotenv').config();

module.exports = {
  // 数据库配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-information-expert',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // Redis配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },

  // AI模型配置
  ai: {
    gemini: {
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      maxTokens: 8192,
      temperature: 0.7,
    }
  },

  // 搜索API配置
  search: {
    google: {
      apiKey: process.env.GOOGLE_SEARCH_API_KEY,
      engineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
      maxResults: 10,
    }
  },

  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  }
}; 