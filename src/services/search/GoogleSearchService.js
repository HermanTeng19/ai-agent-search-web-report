const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

class GoogleSearchService {
  constructor() {
    this.apiKey = config.search.google.apiKey;
    this.engineId = config.search.google.engineId;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  /**
   * 执行Google搜索
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果数组
   */
  async search(query, options = {}) {
    if (!this.apiKey || !this.engineId) {
      throw new Error('Google Search API key or engine ID not configured');
    }

    const {
      maxResults = 10,
      language = 'zh',
      safeSearch = 'medium'
    } = options;

    try {
      logger.info(`Starting Google search for: "${query}"`);
      
      const params = {
        key: this.apiKey,
        cx: this.engineId,
        q: query,
        num: Math.min(maxResults, 10), // Google API限制每次最多10个结果
        lr: this.getLanguageCode(language),
        safe: safeSearch,
        fields: 'items(title,link,snippet,pagemap/cse_thumbnail),queries'
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000
      });

      const results = this.parseGoogleResults(response.data);
      logger.info(`Google search completed, found ${results.length} results`);
      
      return results;

    } catch (error) {
      logger.error('Google search error:', error);
      if (error.response?.status === 429) {
        throw new Error('Google Search API rate limit exceeded');
      }
      throw new Error(`Google search failed: ${error.message}`);
    }
  }

  /**
   * 解析Google搜索结果
   * @param {Object} data - API返回数据
   * @returns {Array} 格式化的结果数组
   */
  parseGoogleResults(data) {
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map(item => ({
      source: 'google',
      title: item.title || 'Untitled',
      url: item.link || '',
      snippet: item.snippet || '',
      content: '', // 需要额外抓取
      thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null,
      relevanceScore: 0, // 将在SearchService中计算
      scrapedAt: null
    }));
  }

  /**
   * 获取语言代码
   * @param {string} language - 语言标识
   * @returns {string} Google API语言代码
   */
  getLanguageCode(language) {
    const langMap = {
      'zh': 'lang_zh-CN',
      'en': 'lang_en',
      'auto': ''
    };
    return langMap[language] || '';
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 是否可用
   */
  async healthCheck() {
    if (!this.apiKey || !this.engineId) {
      return false;
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.engineId,
          q: 'test',
          num: 1
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.warn('Google search health check failed:', error.message);
      return false;
    }
  }
}

module.exports = GoogleSearchService; 