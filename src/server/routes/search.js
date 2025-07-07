const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const SearchService = require('../../services/search/SearchService');
const GeminiService = require('../../services/ai/gemini');
const { Search } = require('../../database/models');
const logger = require('../../utils/logger');

const router = express.Router();
const searchService = new SearchService();
const geminiService = new GeminiService();

// 验证schemas
const searchSchema = Joi.object({
  topic: Joi.string().required().min(1).max(500).trim(),
  language: Joi.string().valid('zh', 'en', 'auto').default('zh'),
  maxResults: Joi.number().integer().min(1).max(50).default(10),
  sources: Joi.array().items(Joi.string().valid('google', 'wikipedia')).default(['google', 'wikipedia']),
  includeContent: Joi.boolean().default(true)
});

/**
 * POST /api/search
 * 创建新的搜索任务
 */
router.post('/', async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = searchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        details: error.details
      });
    }

    const { topic, language, maxResults, sources, includeContent } = value;
    const searchId = uuidv4();

    // 创建搜索记录
    const searchRecord = new Search({
      searchId,
      topic,
      language,
      maxResults,
      status: 'pending'
    });

    await searchRecord.save();

    // 返回搜索ID，异步处理搜索
    res.status(202).json({
      success: true,
      message: 'Search task created',
      data: {
        searchId,
        status: 'pending',
        estimatedTime: '10-30 seconds'
      }
    });

    // 异步执行搜索
    executeSearch(searchId, topic, { language, maxResults, sources, includeContent });

  } catch (error) {
    logger.error('Search creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create search task',
      error: error.message
    });
  }
});

/**
 * GET /api/search/:searchId
 * 获取搜索结果
 */
router.get('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const searchRecord = await Search.findBySearchId(searchId);
    if (!searchRecord) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    res.json({
      success: true,
      data: {
        searchId: searchRecord.searchId,
        topic: searchRecord.topic,
        status: searchRecord.status,
        results: searchRecord.searchResults,
        processedContent: searchRecord.processedContent,
        metadata: searchRecord.metadata,
        error: searchRecord.error,
        createdAt: searchRecord.createdAt,
        updatedAt: searchRecord.updatedAt
      }
    });

  } catch (error) {
    logger.error('Search retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search results',
      error: error.message
    });
  }
});

/**
 * GET /api/search
 * 获取搜索历史
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'completed'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = status === 'all' ? {} : { status };

    const searches = await Search.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('searchId topic status createdAt metadata');

    const total = await Search.countDocuments(query);

    res.json({
      success: true,
      data: {
        searches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search history',
      error: error.message
    });
  }
});

/**
 * DELETE /api/search/:searchId
 * 删除搜索记录
 */
router.delete('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const searchRecord = await Search.findBySearchId(searchId);
    if (!searchRecord) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    await Search.deleteOne({ searchId });

    res.json({
      success: true,
      message: 'Search deleted successfully'
    });

  } catch (error) {
    logger.error('Search deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete search',
      error: error.message
    });
  }
});

/**
 * 异步执行搜索任务
 * @param {string} searchId - 搜索ID
 * @param {string} topic - 搜索主题
 * @param {Object} options - 搜索选项
 */
async function executeSearch(searchId, topic, options) {
  const startTime = Date.now();
  
  try {
    // 更新状态为搜索中
    await Search.findOneAndUpdate(
      { searchId },
      { status: 'searching' }
    );

    // 执行搜索
    logger.info(`Starting search execution for: ${topic}`);
    const searchResults = await searchService.searchMultipleSources(topic, options);
    
    // 增强搜索结果（获取页面内容）
    let enhancedResults = searchResults;
    if (options.includeContent) {
      enhancedResults = await searchService.enhanceResultsWithContent(searchResults);
    }

    const searchDuration = Date.now() - startTime;

    // 更新搜索结果
    await Search.findOneAndUpdate(
      { searchId },
      {
        searchResults: enhancedResults,
        'metadata.searchDuration': searchDuration,
        'metadata.totalResults': enhancedResults.length,
        status: 'processing'
      }
    );

    // AI处理
    logger.info(`Starting AI processing for: ${topic}`);
    const processingStartTime = Date.now();
    
    const processedContent = await geminiService.analyzeSearchResults(enhancedResults, topic);
    const processingDuration = Date.now() - processingStartTime;

    // 更新处理结果
    await Search.findOneAndUpdate(
      { searchId },
      {
        processedContent,
        'metadata.processingDuration': processingDuration,
        'metadata.aiModel': 'gemini-2.5-flash',
        status: 'completed'
      }
    );

    logger.info(`Search completed for: ${topic}, total time: ${Date.now() - startTime}ms`);

  } catch (error) {
    logger.error(`Search execution failed for ${topic}:`, error);
    
    // 更新错误状态
    await Search.findOneAndUpdate(
      { searchId },
      {
        status: 'failed',
        error: {
          message: error.message,
          code: error.code || 'SEARCH_ERROR',
          details: error.stack
        }
      }
    );
  }
}

module.exports = router; 