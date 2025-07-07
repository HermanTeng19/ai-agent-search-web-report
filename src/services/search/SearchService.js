const GoogleSearchService = require('./GoogleSearchService');
const WikipediaSearchService = require('./WikipediaSearchService');
const MCPScreenshotService = require('../screenshot/MCPScreenshotService');
const ImageStorageService = require('../storage/ImageStorageService');
const MarkdownService = require('../document/MarkdownService');
const GeminiService = require('../ai/gemini');
const logger = require('../../utils/logger');

class SearchService {
  constructor() {
    this.googleSearch = new GoogleSearchService();
    this.wikipediaSearch = new WikipediaSearchService();
    this.screenshotService = new MCPScreenshotService();
    this.imageStorage = new ImageStorageService();
    this.markdownService = new MarkdownService();
    this.geminiService = new GeminiService();
  }

  /**
   * 执行多数据源搜索
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchMultipleSources(query, options = {}) {
    const {
      maxResults = 10,
      language = 'zh',
      sources = ['google', 'wikipedia']
    } = options;

    logger.info(`Starting multi-source search for: "${query}"`);
    const startTime = Date.now();

    const searchPromises = [];
    const results = [];

    // 并发搜索所有数据源
    if (sources.includes('google')) {
      searchPromises.push(
        this.googleSearch.search(query, { maxResults: Math.ceil(maxResults * 0.7), language })
          .then(results => ({ source: 'google', results }))
          .catch(error => ({ source: 'google', error }))
      );
    }

    if (sources.includes('wikipedia')) {
      searchPromises.push(
        this.wikipediaSearch.search(query, { maxResults: Math.ceil(maxResults * 0.3), language })
          .then(results => ({ source: 'wikipedia', results }))
          .catch(error => ({ source: 'wikipedia', error }))
      );
    }

    try {
      const searchResults = await Promise.all(searchPromises);
      
      // 合并搜索结果
      for (const result of searchResults) {
        if (result.error) {
          logger.warn(`Search failed for ${result.source}:`, result.error.message);
        } else {
          results.push(...result.results);
        }
      }

      // 去重和排序
      const uniqueResults = this.deduplicateResults(results);
      const sortedResults = this.sortResultsByRelevance(uniqueResults, query);
      const limitedResults = sortedResults.slice(0, maxResults);

      const processingTime = Date.now() - startTime;
      logger.info(`Multi-source search completed in ${processingTime}ms, found ${limitedResults.length} results`);

      return limitedResults;

    } catch (error) {
      logger.error('Multi-source search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * 去重搜索结果
   * @param {Array} results - 搜索结果数组
   * @returns {Array} 去重后的结果
   */
  deduplicateResults(results) {
    const seen = new Set();
    const uniqueResults = [];

    for (const result of results) {
      // 使用URL作为去重的主要标识
      const key = result.url;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(result);
      } else {
        // 如果URL相同，选择内容更详细的版本
        const existingIndex = uniqueResults.findIndex(r => r.url === result.url);
        if (existingIndex !== -1) {
          const existing = uniqueResults[existingIndex];
          if (result.content && result.content.length > (existing.content || '').length) {
            uniqueResults[existingIndex] = result;
          }
        }
      }
    }

    return uniqueResults;
  }

  /**
   * 按相关性排序结果
   * @param {Array} results - 搜索结果数组
   * @param {string} query - 搜索查询
   * @returns {Array} 排序后的结果
   */
  sortResultsByRelevance(results, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return results.map(result => {
      // 计算相关性分数
      let score = 0;
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // 标题匹配权重更高
      const titleText = result.title.toLowerCase();
      queryTerms.forEach(term => {
        if (titleText.includes(term)) {
          score += 2;
        }
        if (text.includes(term)) {
          score += 1;
        }
      });
      
      // 来源权重
      const sourceWeights = {
        google: 1.0,
        wikipedia: 1.2, // Wikipedia通常质量更高
        other: 0.8
      };
      
      score *= sourceWeights[result.source] || 1.0;
      
      return {
        ...result,
        relevanceScore: score
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * 获取页面内容
   * @param {string} url - 页面URL
   * @returns {Promise<string>} 页面内容
   */
  async scrapePageContent(url) {
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    try {
      logger.info(`Scraping content from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Information-Expert/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 移除脚本和样式
      $('script, style, nav, footer, header, aside').remove();
      
      // 提取主要内容
      const content = $('main, article, .content, .post-content, .entry-content, body')
        .first()
        .text()
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 3000); // 限制长度
        
      return content;
      
    } catch (error) {
      logger.warn(`Failed to scrape content from ${url}:`, error.message);
      return '';
    }
  }

  /**
   * 批量获取页面内容
   * @param {Array} results - 搜索结果数组
   * @returns {Promise<Array>} 包含内容的结果数组
   */
  async enhanceResultsWithContent(results) {
    const enhancedResults = [];
    
    // 限制并发请求数量
    const batchSize = 5;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      const contentPromises = batch.map(async (result) => {
        const content = await this.scrapePageContent(result.url);
        return {
          ...result,
          content,
          scrapedAt: new Date()
        };
      });
      
      const batchResults = await Promise.all(contentPromises);
      enhancedResults.push(...batchResults);
      
      // 避免过于频繁的请求
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return enhancedResults;
  }

  /**
   * 多轮深度搜索
   * @param {string} topic - 搜索主题
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 完整的搜索和分析结果
   */
  async iterativeSearch(topic, options = {}) {
    const {
      maxRounds = 3,
      maxResultsPerRound = 8,
      includeScreenshots = true,
      generateMarkdown = true,
      language = 'zh'
    } = options;

    logger.info(`Starting iterative search for topic: "${topic}"`);
    const startTime = Date.now();
    
    try {
      const searchRounds = [];
      const allResults = [];
      const screenshots = [];
      let currentQuery = topic;

      // 执行多轮搜索
      for (let round = 1; round <= maxRounds; round++) {
        logger.info(`Starting search round ${round}/${maxRounds} with query: "${currentQuery}"`);
        
        const roundStartTime = Date.now();
        
        // 执行搜索
        const roundResults = await this.searchMultipleSources(currentQuery, {
          maxResults: maxResultsPerRound,
          language,
          sources: ['google', 'wikipedia']
        });

        // 增强结果（获取页面内容）
        const enhancedResults = await this.enhanceResultsWithContent(roundResults);
        
        // 截图处理
        let roundScreenshots = [];
        if (includeScreenshots && enhancedResults.length > 0) {
          roundScreenshots = await this.captureScreenshots(enhancedResults.slice(0, 3), {
            topic,
            round
          });
        }

        // 分析当前轮次结果
        const roundAnalysis = await this.analyzeRoundResults(enhancedResults, topic, round);
        
        const roundData = {
          roundNumber: round,
          query: currentQuery,
          results: enhancedResults,
          screenshots: roundScreenshots,
          keyFindings: roundAnalysis.keyFindings,
          nextDirection: roundAnalysis.nextDirection,
          timestamp: new Date(),
          processingTime: Date.now() - roundStartTime
        };

        searchRounds.push(roundData);
        allResults.push(...enhancedResults);
        screenshots.push(...roundScreenshots);

        // 确定下一轮搜索方向
        if (round < maxRounds && roundAnalysis.nextDirection) {
          currentQuery = roundAnalysis.nextQuery || roundAnalysis.nextDirection;
        }

        logger.info(`Round ${round} completed in ${roundData.processingTime}ms, found ${enhancedResults.length} results`);
      }

      // 综合分析所有结果
      const finalAnalysis = await this.geminiService.analyzeSearchResults(allResults, topic);
      
      // 生成Markdown报告
      let markdownReport = null;
      if (generateMarkdown) {
        markdownReport = await this.markdownService.generateResearchReport({
          topic,
          searchResults: allResults,
          analysisResult: finalAnalysis,
          screenshots,
          rounds: searchRounds
        });
      }

      const totalTime = Date.now() - startTime;
      logger.info(`Iterative search completed in ${totalTime}ms, total results: ${allResults.length}`);

      return {
        success: true,
        topic,
        searchRounds,
        totalResults: allResults.length,
        uniqueResults: this.deduplicateResults(allResults),
        screenshots,
        analysisResult: finalAnalysis,
        markdownReport,
        processingTime: totalTime,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Iterative search failed:', error);
      throw new Error(`Iterative search failed: ${error.message}`);
    }
  }

  /**
   * 分析单轮搜索结果
   * @param {Array} results - 搜索结果
   * @param {string} topic - 主题
   * @param {number} round - 轮次
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeRoundResults(results, topic, round) {
    try {
      const prompt = `分析以下搜索结果，并确定下一步搜索方向：

主题: ${topic}
当前轮次: ${round}

搜索结果:
${results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`).join('\n\n')}

请返回JSON格式的分析结果：
{
  "keyFindings": "本轮关键发现（简要概述）",
  "nextDirection": "下一步搜索方向（如果需要）",
  "nextQuery": "建议的下一轮搜索查询（如果需要）",
  "completionReason": "如果认为搜索已足够，说明原因"
}`;

      const analysisResult = await this.geminiService.model.generateContent(prompt);
      const response = await analysisResult.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        return parsed;
      } catch (parseError) {
        logger.warn('Failed to parse round analysis, using fallback');
        return {
          keyFindings: '发现相关信息，需要进一步分析',
          nextDirection: round < 3 ? `${topic} 详细信息` : null,
          nextQuery: round < 3 ? `${topic} 详细信息` : null
        };
      }
    } catch (error) {
      logger.error('Round analysis failed:', error);
      return {
        keyFindings: '分析过程中出现错误',
        nextDirection: null,
        nextQuery: null
      };
    }
  }

  /**
   * 批量截图
   * @param {Array} results - 搜索结果
   * @param {Object} metadata - 元数据
   * @returns {Promise<Array>} 截图结果
   */
  async captureScreenshots(results, metadata = {}) {
    const screenshots = [];
    
    try {
      logger.info(`Capturing screenshots for ${results.length} URLs`);
      
      for (const result of results) {
        try {
          // 生成截图文件名
          const filename = this.screenshotService.generateScreenshotFilename(result.url);
          
          // 截取截图
          const screenshotBuffer = await this.screenshotService.captureScreenshot(result.url);
          
          // 保存截图
          const savedImage = await this.imageStorage.saveScreenshot(screenshotBuffer, filename, {
            sourceUrl: result.url,
            sourceTitle: result.title,
            sourceDomain: new URL(result.url).hostname,
            topic: metadata.topic,
            round: metadata.round,
            captureTime: new Date()
          });
          
          screenshots.push({
            ...savedImage,
            url: result.url,
            title: result.title,
            source: result.source
          });
          
        } catch (error) {
          logger.error(`Screenshot failed for ${result.url}:`, error);
          // 继续处理其他URL
        }
      }
      
      logger.info(`Successfully captured ${screenshots.length} screenshots`);
      return screenshots;
      
    } catch (error) {
      logger.error('Batch screenshot capture failed:', error);
      return [];
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 各服务状态
   */
  async healthCheck() {
    const checks = {
      google: false,
      wikipedia: false,
      screenshot: false,
      imageStorage: false,
      markdown: false
    };
    
    try {
      checks.google = await this.googleSearch.healthCheck();
    } catch (error) {
      logger.warn('Google search health check failed:', error.message);
    }
    
    try {
      checks.wikipedia = await this.wikipediaSearch.healthCheck();
    } catch (error) {
      logger.warn('Wikipedia search health check failed:', error.message);
    }
    
    try {
      checks.screenshot = await this.screenshotService.healthCheck();
    } catch (error) {
      logger.warn('Screenshot service health check failed:', error.message);
    }
    
    checks.imageStorage = true; // ImageStorageService没有异步依赖
    checks.markdown = true; // MarkdownService没有异步依赖
    
    return checks;
  }
}

module.exports = SearchService; 