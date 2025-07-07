const express = require('express');
const mongoose = require('mongoose');
const SearchService = require('../../services/search/SearchService');
const GeminiService = require('../../services/ai/gemini');
const logger = require('../../utils/logger');

const router = express.Router();
const searchService = new SearchService();
const geminiService = new GeminiService();

/**
 * GET /api/health
 * 系统健康检查
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      services: {
        database: 'unknown',
        gemini: 'unknown',
        search: {
          google: 'unknown',
          wikipedia: 'unknown'
        }
      }
    };

    // 检查数据库连接
    try {
      const dbState = mongoose.connection.readyState;
      healthStatus.services.database = dbState === 1 ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      logger.warn('Database health check failed:', error.message);
    }

    // 检查Gemini服务
    try {
      const geminiHealthy = await geminiService.healthCheck();
      healthStatus.services.gemini = geminiHealthy ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthStatus.services.gemini = 'unhealthy';
      logger.warn('Gemini health check failed:', error.message);
    }

    // 检查搜索服务
    try {
      const searchHealths = await searchService.healthCheck();
      healthStatus.services.search = {
        google: searchHealths.google ? 'healthy' : 'unhealthy',
        wikipedia: searchHealths.wikipedia ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      healthStatus.services.search = {
        google: 'unhealthy',
        wikipedia: 'unhealthy'
      };
      logger.warn('Search services health check failed:', error.message);
    }

    // 确定整体状态
    const allServices = [
      healthStatus.services.database,
      healthStatus.services.gemini,
      ...Object.values(healthStatus.services.search)
    ];

    const unhealthyServices = allServices.filter(status => status === 'unhealthy');
    const unknownServices = allServices.filter(status => status === 'unknown');

    if (unhealthyServices.length > 0) {
      healthStatus.status = 'unhealthy';
    } else if (unknownServices.length > 0) {
      healthStatus.status = 'degraded';
    }

    // 根据状态设置HTTP状态码
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/database
 * 数据库健康检查
 */
router.get('/database', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const isHealthy = dbState === 1;
    
    const dbInfo = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      readyState: dbState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0
    };

    res.json({
      success: true,
      data: dbInfo
    });

  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/ai
 * AI服务健康检查
 */
router.get('/ai', async (req, res) => {
  try {
    const geminiHealthy = await geminiService.healthCheck();
    
    const aiInfo = {
      status: geminiHealthy ? 'healthy' : 'unhealthy',
      model: 'gemini-2.5-flash',
      provider: 'Google',
      lastCheck: new Date().toISOString()
    };

    res.json({
      success: true,
      data: aiInfo
    });

  } catch (error) {
    logger.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      message: 'AI health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/search
 * 搜索服务健康检查
 */
router.get('/search', async (req, res) => {
  try {
    const searchHealths = await searchService.healthCheck();
    
    const searchInfo = {
      status: Object.values(searchHealths).some(h => h) ? 'healthy' : 'unhealthy',
      services: {
        google: {
          status: searchHealths.google ? 'healthy' : 'unhealthy',
          name: 'Google Custom Search'
        },
        wikipedia: {
          status: searchHealths.wikipedia ? 'healthy' : 'unhealthy',
          name: 'Wikipedia API'
        }
      },
      lastCheck: new Date().toISOString()
    };

    res.json({
      success: true,
      data: searchInfo
    });

  } catch (error) {
    logger.error('Search health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Search health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/health/stats
 * 系统统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const { Search, Report } = require('../../database/models');
    
    const stats = {
      searches: {
        total: await Search.countDocuments(),
        completed: await Search.countDocuments({ status: 'completed' }),
        failed: await Search.countDocuments({ status: 'failed' }),
        processing: await Search.countDocuments({ status: { $in: ['pending', 'searching', 'processing'] } })
      },
      reports: {
        total: await Report.countDocuments(),
        completed: await Report.countDocuments({ status: 'completed' }),
        failed: await Report.countDocuments({ status: 'failed' }),
        generating: await Report.countDocuments({ status: 'generating' })
      },
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Stats retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats',
      error: error.message
    });
  }
});

module.exports = router; 