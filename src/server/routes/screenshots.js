const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { Image } = require('../../database/models');
const logger = require('../../utils/logger');

/**
 * 提供截图文件访问
 * GET /screenshots/:year/:month/:filename
 */
router.get('/:year/:month/:filename', async (req, res) => {
  try {
    const { year, month, filename } = req.params;
    
    // 验证参数
    if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month format'
      });
    }
    
    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', 'screenshots', year, month, filename);
    
    try {
      // 检查文件是否存在
      await fs.access(filePath);
      
      // 更新数据库中的访问统计（异步，不阻塞响应）
      setImmediate(async () => {
        try {
          const image = await Image.findOne({ filename });
          if (image) {
            await image.incrementViewCount();
          }
        } catch (error) {
          logger.warn('Failed to update image view count:', error);
        }
      });
      
      // 设置缓存头
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天
      res.setHeader('ETag', `"${filename}"`);
      
      // 根据文件扩展名设置Content-Type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp'
      };
      
      const mimeType = mimeTypes[ext] || 'image/png';
      res.setHeader('Content-Type', mimeType);
      
      // 发送文件
      res.sendFile(filePath);
      
    } catch (error) {
      // 文件不存在
      res.status(404).json({
        success: false,
        error: 'Screenshot not found'
      });
    }
    
  } catch (error) {
    logger.error('Screenshot serving failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * 获取截图信息
 * GET /api/screenshots/:imageId/info
 */
router.get('/:imageId/info', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await Image.findById(imageId)
      .populate('reportId', 'title reportId')
      .select('-__v');
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      image: {
        id: image._id,
        filename: image.filename,
        thumbnailFilename: image.thumbnailFilename,
        publicUrl: image.publicUrl,
        thumbnailUrl: image.thumbnailUrl,
        size: image.size,
        sizeFormatted: image.sizeFormatted,
        dimensions: image.dimensions,
        format: image.format,
        sourceUrl: image.sourceUrl,
        sourceTitle: image.sourceTitle,
        sourceDomain: image.sourceDomain,
        metadata: image.metadata,
        report: image.reportId,
        status: image.status,
        viewCount: image.viewCount,
        lastViewed: image.lastViewed,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      }
    });
    
  } catch (error) {
    logger.error('Image info retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 列出截图
 * GET /api/screenshots
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      reportId = null,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    if (reportId) {
      filter.reportId = reportId;
    }
    if (status !== 'all') {
      filter.status = status;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const images = await Image.find(filter)
      .populate('reportId', 'title reportId')
      .select('filename thumbnailFilename publicUrl thumbnailUrl sourceUrl sourceTitle dimensions size format status viewCount createdAt')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Image.countDocuments(filter);
    
    res.json({
      success: true,
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Images listing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取存储统计
 * GET /api/screenshots/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const storageStats = await Image.getStorageStats();
    const statusStats = await Image.getStatusStats();
    
    res.json({
      success: true,
      stats: {
        storage: storageStats,
        status: statusStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Storage stats retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除截图
 * DELETE /api/screenshots/:imageId
 */
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // 删除文件
    const ImageStorageService = require('../../services/storage/ImageStorageService');
    const imageStorage = new ImageStorageService();
    
    try {
      await imageStorage.deleteImage(image.path, image.thumbnailPath);
    } catch (error) {
      logger.warn('Failed to delete image files:', error);
      // 继续删除数据库记录
    }
    
    // 删除数据库记录
    await Image.findByIdAndDelete(imageId);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    logger.error('Image deletion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 批量清理过期截图
 * POST /api/screenshots/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    
    if (daysOld < 1 || daysOld > 365) {
      return res.status(400).json({
        success: false,
        error: 'daysOld must be between 1 and 365'
      });
    }
    
    // 清理数据库记录
    const dbResult = await Image.cleanupOldImages(daysOld);
    
    // 清理文件系统
    const ImageStorageService = require('../../services/storage/ImageStorageService');
    const imageStorage = new ImageStorageService();
    const fsResult = await imageStorage.cleanupOldImages(daysOld);
    
    res.json({
      success: true,
      cleanup: {
        database: {
          deletedCount: dbResult.deletedCount
        },
        filesystem: {
          deletedCount: fsResult.deletedCount,
          deletedFiles: fsResult.deletedFiles,
          errors: fsResult.errors
        },
        cutoffDate: fsResult.cutoffDate
      }
    });
    
  } catch (error) {
    logger.error('Cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 