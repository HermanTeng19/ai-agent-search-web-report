const express = require('express');
const router = express.Router();
const SearchService = require('../../services/search/SearchService');
const GeminiService = require('../../services/ai/gemini');
const { Report, Image } = require('../../database/models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

// 初始化服务
const searchService = new SearchService();
const geminiService = new GeminiService();

/**
 * 执行多轮搜索
 * POST /api/iterative-search
 */
router.post('/', async (req, res) => {
  try {
    const { topic, options = {} } = req.body;
    
    // 验证输入
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and must be a string'
      });
    }

    if (topic.length < 2 || topic.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Topic must be between 2 and 200 characters'
      });
    }

    logger.info(`Starting iterative search for topic: ${topic}`);
    
    // 生成唯一ID
    const reportId = uuidv4();
    const searchId = uuidv4();
    
    // 创建初始报告记录
    const report = new Report({
      reportId,
      searchId,
      title: `${topic} - 深度研究报告`,
      status: 'generating',
      template: {
        name: options.template || 'modern',
        customizations: {
          includeScreenshots: options.includeScreenshots !== false,
          includeMarkdown: options.generateMarkdown !== false
        }
      },
      searchRounds: [],
      screenshots: []
    });
    
    await report.save();
    
    // 异步执行搜索
    setImmediate(async () => {
      try {
        // 执行多轮搜索
        const searchResult = await searchService.iterativeSearch(topic, {
          maxRounds: options.maxRounds || 3,
          maxResultsPerRound: options.maxResultsPerRound || 8,
          includeScreenshots: options.includeScreenshots !== false,
          generateMarkdown: options.generateMarkdown !== false,
          language: options.language || 'zh'
        });
        
        // 保存截图到数据库
        const savedScreenshots = [];
        for (const screenshot of searchResult.screenshots) {
          const imageRecord = new Image({
            filename: screenshot.filename,
            thumbnailFilename: screenshot.thumbnailFilename,
            path: screenshot.path,
            thumbnailPath: screenshot.thumbnailPath,
            publicUrl: screenshot.publicUrl,
            thumbnailUrl: screenshot.thumbnailUrl,
            size: screenshot.size,
            thumbnailSize: screenshot.thumbnailSize,
            dimensions: screenshot.dimensions,
            format: screenshot.format,
            sourceUrl: screenshot.url,
            sourceTitle: screenshot.title,
            sourceDomain: screenshot.sourceDomain,
            metadata: screenshot.metadata,
            reportId: report._id,
            status: 'completed'
          });
          
          await imageRecord.save();
          savedScreenshots.push(imageRecord._id);
        }
        
        // 生成HTML报告
        const htmlContent = await geminiService.generateHTMLReport(
          searchResult.analysisResult,
          options.template || 'modern',
          searchResult.screenshots
        );
        
        // 更新报告
        await Report.findByIdAndUpdate(report._id, {
          status: 'completed',
          htmlContent,
          searchRounds: searchResult.searchRounds,
          analysisResult: searchResult.analysisResult,
          screenshots: savedScreenshots,
          markdownReport: searchResult.markdownReport ? {
            filename: searchResult.markdownReport.filename,
            path: searchResult.markdownReport.path,
            relativePath: searchResult.markdownReport.relativePath,
            size: searchResult.markdownReport.size,
            generated: true,
            generatedAt: new Date()
          } : undefined,
          metadata: {
            wordCount: htmlContent.length,
            estimatedReadingTime: Math.ceil(htmlContent.length / 1000),
            generationTime: searchResult.processingTime,
            fileSize: Buffer.byteLength(htmlContent, 'utf8')
          }
        });
        
        logger.info(`Iterative search completed for topic: ${topic}`);
        
      } catch (error) {
        logger.error('Iterative search failed:', error);
        
        // 更新报告状态为失败
        await Report.findByIdAndUpdate(report._id, {
          status: 'failed',
          error: {
            message: error.message,
            code: 'SEARCH_FAILED',
            details: error.stack
          }
        });
      }
    });
    
    // 立即返回响应
    res.json({
      success: true,
      reportId,
      searchId,
      message: 'Iterative search started',
      statusUrl: `/api/iterative-search/${reportId}/status`,
      resultUrl: `/api/iterative-search/${reportId}/result`
    });
    
  } catch (error) {
    logger.error('Iterative search request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取搜索状态
 * GET /api/iterative-search/:reportId/status
 */
router.get('/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findOne({ reportId })
      .populate('screenshots', 'filename publicUrl thumbnailUrl sourceUrl sourceTitle')
      .select('reportId status searchRounds markdownReport metadata createdAt updatedAt error');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const response = {
      success: true,
      reportId,
      status: report.status,
      progress: {
        currentRound: report.searchRounds.length,
        totalRounds: 3,
        completed: report.status === 'completed',
        failed: report.status === 'failed'
      },
      metadata: report.metadata,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    };
    
    if (report.status === 'failed' && report.error) {
      response.error = {
        message: report.error.message,
        code: report.error.code
      };
    }
    
    if (report.status === 'completed') {
      response.screenshots = report.screenshots;
      response.markdownReport = report.markdownReport;
    }
    
    res.json(response);
    
  } catch (error) {
    logger.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取搜索结果
 * GET /api/iterative-search/:reportId/result
 */
router.get('/:reportId/result', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'html' } = req.query;
    
    const report = await Report.findOne({ reportId })
      .populate('screenshots', 'filename publicUrl thumbnailUrl sourceUrl sourceTitle dimensions size');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    if (report.status !== 'completed') {
      return res.status(202).json({
        success: false,
        error: 'Report is not ready yet',
        status: report.status,
        statusUrl: `/api/iterative-search/${reportId}/status`
      });
    }
    
    // 增加查看次数
    await report.incrementViews();
    
    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(report.htmlContent);
    } else if (format === 'json') {
      res.json({
        success: true,
        reportId,
        title: report.title,
        htmlContent: report.htmlContent,
        searchRounds: report.searchRounds,
        screenshots: report.screenshots,
        markdownReport: report.markdownReport,
        metadata: report.metadata,
        createdAt: report.createdAt,
        views: report.views
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: html, json'
      });
    }
    
  } catch (error) {
    logger.error('Result retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取Markdown报告
 * GET /api/iterative-search/:reportId/markdown
 */
router.get('/:reportId/markdown', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findOne({ reportId })
      .select('markdownReport status');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    if (report.status !== 'completed' || !report.markdownReport || !report.markdownReport.generated) {
      return res.status(404).json({
        success: false,
        error: 'Markdown report not available'
      });
    }
    
    const fs = require('fs').promises;
    const markdownContent = await fs.readFile(report.markdownReport.path, 'utf8');
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${report.markdownReport.filename.replace(/[^\w\-_.]/g, '_')}"`);
    res.send(markdownContent);
    
  } catch (error) {
    logger.error('Markdown retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 列出所有报告
 * GET /api/iterative-search/reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    
    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }
    
    const reports = await Report.find(filter)
      .select('reportId title status metadata createdAt updatedAt views downloads')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Report.countDocuments(filter);
    
    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Reports listing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 