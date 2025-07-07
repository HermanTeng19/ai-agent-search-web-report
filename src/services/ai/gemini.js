const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');
const logger = require('../../utils/logger');

class GeminiService {
  constructor() {
    if (!config.ai.gemini.apiKey) {
      throw new Error('Google Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.ai.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.ai.gemini.model,
      generationConfig: {
        temperature: config.ai.gemini.temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: config.ai.gemini.maxTokens,
      }
    });
  }

  /**
   * 分析和提炼搜索结果
   * @param {Array} searchResults - 搜索结果数组
   * @param {string} topic - 搜索主题
   * @returns {Promise<Object>} 处理后的内容
   */
  async analyzeSearchResults(searchResults, topic) {
    try {
      const prompt = this.buildAnalysisPrompt(searchResults, topic);
      
      logger.info('Starting Gemini analysis for topic:', topic);
      const startTime = Date.now();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      logger.info(`Gemini analysis completed in ${processingTime}ms`);
      
      return this.parseAnalysisResult(text);
      
    } catch (error) {
      logger.error('Gemini analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * 生成HTML报告内容
   * @param {Object} processedContent - 处理后的内容
   * @param {string} template - 模板类型
   * @param {Array} screenshots - 截图数组
   * @returns {Promise<string>} HTML内容
   */
  async generateHTMLReport(processedContent, template = 'modern', screenshots = []) {
    try {
      const prompt = this.buildHTMLPrompt(processedContent, template, screenshots);
      
      logger.info('Starting HTML generation with template:', template);
      const startTime = Date.now();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const htmlContent = response.text();
      
      const processingTime = Date.now() - startTime;
      logger.info(`HTML generation completed in ${processingTime}ms`);
      
      return this.cleanHTMLContent(htmlContent);
      
    } catch (error) {
      logger.error('HTML generation error:', error);
      throw new Error(`HTML generation failed: ${error.message}`);
    }
  }

  /**
   * 构建分析提示词
   * @param {Array} searchResults - 搜索结果
   * @param {string} topic - 主题
   * @returns {string} 提示词
   */
  buildAnalysisPrompt(searchResults, topic) {
    const resultsText = searchResults.map((result, index) => {
      return `来源 ${index + 1}: ${result.source}
标题: ${result.title}
网址: ${result.url}
内容摘要: ${result.snippet}
${result.content ? `详细内容: ${result.content.substring(0, 1000)}...` : ''}
---`;
    }).join('\n');

    return `你是一个专业的信息分析专家。请分析以下关于"${topic}"的搜索结果，并提供结构化的分析报告。

搜索结果:
${resultsText}

请按照以下JSON格式返回分析结果:
{
  "summary": "主题的核心总结（200-300字）",
  "keyPoints": [
    "关键要点1",
    "关键要点2",
    "关键要点3"
  ],
  "categories": [
    {
      "name": "分类名称1",
      "points": ["要点1", "要点2"]
    },
    {
      "name": "分类名称2", 
      "points": ["要点1", "要点2"]
    }
  ],
  "sources": [
    {
      "title": "来源标题",
      "url": "来源网址",
      "reliability": 0.85
    }
  ],
  "confidence": 0.9
}

要求:
1. 确保信息准确性，避免虚假信息
2. 提供清晰的逻辑结构
3. 标注信息来源和可靠性
4. 突出最重要的关键信息
5. 使用简洁明了的语言`;
  }

  /**
   * 构建HTML生成提示词
   * @param {Object} processedContent - 处理后的内容
   * @param {string} template - 模板类型
   * @param {Array} screenshots - 截图数组
   * @returns {string} 提示词
   */
  buildHTMLPrompt(processedContent, template, screenshots = []) {
    const templateStyles = {
      modern: '现代简约风格，使用渐变色彩和卡片式布局',
      classic: '经典传统风格，使用传统排版和正式色彩',
      minimal: '极简主义风格，使用最少的装饰和大量留白',
      academic: '学术论文风格，使用严格的排版和引用格式',
      presentation: '演示文稿风格，使用大字体和突出的视觉元素'
    };

    let screenshotSection = '';
    if (screenshots && screenshots.length > 0) {
      screenshotSection = `

截图信息:
${screenshots.map((screenshot, index) => `
截图 ${index + 1}:
- 标题: ${screenshot.title || screenshot.url}
- 网址: ${screenshot.url}
- 图片URL: ${screenshot.publicUrl}
- 缩略图URL: ${screenshot.thumbnailUrl}
- 尺寸: ${screenshot.dimensions ? `${screenshot.dimensions.width}x${screenshot.dimensions.height}` : '未知'}
- 文件大小: ${screenshot.sizeFormatted || '未知'}
`).join('')}`;
    }

    return `请基于以下分析内容生成一个美观的HTML页面，风格为${templateStyles[template]}。

分析内容:
${JSON.stringify(processedContent, null, 2)}${screenshotSection}

要求:
1. 生成完整的HTML页面，包含head和body
2. 使用内联CSS样式，确保页面独立可用
3. 响应式设计，适配移动端
4. 包含以下部分：
   - 页面标题和主题
   - 内容摘要
   - 关键要点（使用列表或卡片）
   - 分类详情（使用折叠或标签页）
   - 截图展示区域（如果有截图）
   - 信息来源（包含链接）
   - 页面底部的生成时间
5. 使用合适的字体、颜色和布局
6. 添加适当的图标和视觉元素
7. 确保内容易于阅读和理解
8. 如果有截图，请在相应位置展示图片，使用img标签引用publicUrl
9. 为截图添加适当的说明文字和链接

请直接返回HTML代码，不要包含任何额外的说明文字。`;
  }

  /**
   * 解析分析结果
   * @param {string} text - AI返回的文本
   * @returns {Object} 解析后的对象
   */
  parseAnalysisResult(text) {
    try {
      // 清理返回的文本，去除可能的markdown格式
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      // 验证必要字段
      if (!parsed.summary || !parsed.keyPoints || !Array.isArray(parsed.keyPoints)) {
        throw new Error('Invalid analysis result format');
      }
      
      return {
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        categories: parsed.categories || [],
        sources: parsed.sources || [],
        confidence: parsed.confidence || 0.7
      };
      
    } catch (error) {
      logger.error('Failed to parse analysis result:', error);
      // 返回基础结果作为备用
      return {
        summary: '分析结果解析失败，请重试',
        keyPoints: ['无法提取关键信息'],
        categories: [],
        sources: [],
        confidence: 0.1
      };
    }
  }

  /**
   * 清理HTML内容
   * @param {string} htmlContent - 原始HTML内容
   * @returns {string} 清理后的HTML内容
   */
  cleanHTMLContent(htmlContent) {
    // 去除可能的markdown格式标记
    let cleaned = htmlContent.replace(/```html\n?|\n?```/g, '').trim();
    
    // 确保HTML结构完整
    if (!cleaned.includes('<!DOCTYPE html>') && !cleaned.includes('<html>')) {
      cleaned = `<!DOCTYPE html>\n<html>\n${cleaned}\n</html>`;
    }
    
    return cleaned;
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 是否可用
   */
  async healthCheck() {
    try {
      const result = await this.model.generateContent('测试连接，请回复"连接正常"');
      const response = await result.response;
      return response.text().includes('连接正常');
    } catch (error) {
      logger.error('Gemini health check failed:', error);
      return false;
    }
  }
}

module.exports = GeminiService; 