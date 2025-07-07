const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const GeminiService = require('../../services/ai/gemini');
const { Search, Report } = require('../../database/models');
const logger = require('../../utils/logger');

const router = express.Router();
const geminiService = new GeminiService();

// 验证schemas
const reportSchema = Joi.object({
  searchId: Joi.string().required().uuid(),
  template: Joi.string().valid('modern', 'classic', 'minimal', 'academic', 'presentation').default('modern'),
  customizations: Joi.object({
    colorScheme: Joi.string().default('blue'),
    fontSize: Joi.string().valid('small', 'medium', 'large').default('medium'),
    includeCharts: Joi.boolean().default(true),
    includeImages: Joi.boolean().default(true)
  }).default({})
});

/**
 * POST /api/report
 * 生成HTML报告
 */
router.post('/', async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = reportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        details: error.details
      });
    }

    const { searchId, template, customizations } = value;
    const reportId = uuidv4();

    // 检查搜索是否存在且已完成
    const searchRecord = await Search.findBySearchId(searchId);
    if (!searchRecord) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }

    if (searchRecord.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Search is not completed yet',
        searchStatus: searchRecord.status
      });
    }

    if (!searchRecord.processedContent) {
      return res.status(400).json({
        success: false,
        message: 'No processed content available'
      });
    }

    // 创建报告记录
    const reportRecord = new Report({
      reportId,
      searchId,
      title: `${searchRecord.topic} - 分析报告`,
      template: {
        name: template,
        customizations
      },
      status: 'generating'
    });

    await reportRecord.save();

    // 返回报告ID，异步生成报告
    res.status(202).json({
      success: true,
      message: 'Report generation started',
      data: {
        reportId,
        searchId,
        status: 'generating',
        estimatedTime: '5-15 seconds'
      }
    });

    // 异步生成报告
    generateReport(reportId, searchRecord.processedContent, template, customizations);

  } catch (error) {
    logger.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
});

/**
 * GET /api/report/:reportId
 * 获取报告详情
 */
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const reportRecord = await Report.findByReportId(reportId);
    if (!reportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // 增加查看次数
    if (reportRecord.status === 'completed') {
      reportRecord.incrementViews();
    }

    res.json({
      success: true,
      data: {
        reportId: reportRecord.reportId,
        searchId: reportRecord.searchId,
        title: reportRecord.title,
        status: reportRecord.status,
        template: reportRecord.template,
        sections: reportRecord.sections,
        metadata: reportRecord.metadata,
        views: reportRecord.views,
        downloads: reportRecord.downloads,
        error: reportRecord.error,
        createdAt: reportRecord.createdAt,
        updatedAt: reportRecord.updatedAt
      }
    });

  } catch (error) {
    logger.error('Report retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report',
      error: error.message
    });
  }
});

/**
 * GET /api/report/:reportId/html
 * 获取报告HTML内容
 */
router.get('/:reportId/html', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const reportRecord = await Report.findByReportId(reportId);
    if (!reportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (reportRecord.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Report is not ready yet',
        status: reportRecord.status
      });
    }

    // 增加查看次数
    reportRecord.incrementViews();

    // 设置HTML响应头
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });

    res.send(reportRecord.htmlContent);

  } catch (error) {
    logger.error('Report HTML retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report HTML',
      error: error.message
    });
  }
});

/**
 * GET /api/report/:reportId/download
 * 下载报告HTML文件
 */
router.get('/:reportId/download', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const reportRecord = await Report.findByReportId(reportId);
    if (!reportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (reportRecord.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Report is not ready yet',
        status: reportRecord.status
      });
    }

    // 增加下载次数
    reportRecord.incrementDownloads();

    // 设置下载响应头
    const filename = `${reportRecord.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.html`;
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'no-cache'
    });

    res.send(reportRecord.htmlContent);

  } catch (error) {
    logger.error('Report download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    });
  }
});

/**
 * GET /api/report/search/:searchId
 * 获取指定搜索的所有报告
 */
router.get('/search/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const reports = await Report.findBySearchId(searchId);

    res.json({
      success: true,
      data: {
        searchId,
        reports: reports.map(report => ({
          reportId: report.reportId,
          title: report.title,
          status: report.status,
          template: report.template,
          metadata: report.metadata,
          views: report.views,
          downloads: report.downloads,
          createdAt: report.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Search reports retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search reports',
      error: error.message
    });
  }
});

/**
 * DELETE /api/report/:reportId
 * 删除报告
 */
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const reportRecord = await Report.findByReportId(reportId);
    if (!reportRecord) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await Report.deleteOne({ reportId });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    logger.error('Report deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
});

/**
 * 异步生成报告
 * @param {string} reportId - 报告ID
 * @param {Object} processedContent - 处理后的内容
 * @param {string} template - 模板类型
 * @param {Object} customizations - 自定义设置
 */
async function generateReport(reportId, processedContent, template, customizations) {
  const startTime = Date.now();
  
  try {
    logger.info(`Starting report generation for: ${reportId}`);

    // 使用Gemini生成HTML
    const htmlContent = await geminiService.generateHTMLReport(processedContent, template);
    
    // 计算元数据
    const wordCount = htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 假设每分钟200字
    const fileSize = Buffer.byteLength(htmlContent, 'utf8');
    const generationTime = Date.now() - startTime;

    // 创建章节数据
    const sections = [
      {
        type: 'summary',
        title: '内容摘要',
        content: processedContent.summary || '',
        order: 1
      },
      {
        type: 'keyPoints',
        title: '关键要点',
        content: JSON.stringify(processedContent.keyPoints || []),
        order: 2
      },
      {
        type: 'details',
        title: '详细内容',
        content: JSON.stringify(processedContent.categories || []),
        order: 3
      },
      {
        type: 'sources',
        title: '信息来源',
        content: JSON.stringify(processedContent.sources || []),
        order: 4
      }
    ];

    // 更新报告记录
    await Report.findOneAndUpdate(
      { reportId },
      {
        htmlContent,
        sections,
        metadata: {
          wordCount,
          estimatedReadingTime,
          generationTime,
          fileSize
        },
        status: 'completed'
      }
    );

    logger.info(`Report generation completed for: ${reportId}, time: ${generationTime}ms`);

  } catch (error) {
    logger.error(`Report generation failed for ${reportId}:`, error);
    
    // 更新错误状态
    await Report.findOneAndUpdate(
      { reportId },
      {
        status: 'failed',
        error: {
          message: error.message,
          code: error.code || 'REPORT_ERROR',
          details: error.stack
        }
      }
    );
  }
}

module.exports = router; 