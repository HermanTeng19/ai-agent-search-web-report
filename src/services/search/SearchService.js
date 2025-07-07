const GoogleSearchService = require('./GoogleSearchService');
const WikipediaSearchService = require('./WikipediaSearchService');
const logger = require('../../utils/logger');

class SearchService {
  constructor() {
    this.googleSearch = new GoogleSearchService();
    this.wikipediaSearch = new WikipediaSearchService();
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
   * 健康检查
   * @returns {Promise<Object>} 各服务状态
   */
  async healthCheck() {
    const checks = {
      google: false,
      wikipedia: false
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
    
    return checks;
  }
}

module.exports = SearchService; 