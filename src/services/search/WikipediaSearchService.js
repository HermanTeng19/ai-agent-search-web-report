const axios = require('axios');
const logger = require('../../utils/logger');

class WikipediaSearchService {
  constructor() {
    this.baseUrl = 'https://zh.wikipedia.org/w/api.php';
    this.enBaseUrl = 'https://en.wikipedia.org/w/api.php';
  }

  /**
   * 执行Wikipedia搜索
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果数组
   */
  async search(query, options = {}) {
    const {
      maxResults = 5,
      language = 'zh'
    } = options;

    try {
      logger.info(`Starting Wikipedia search for: "${query}"`);
      
      const baseUrl = language === 'en' ? this.enBaseUrl : this.baseUrl;
      
      // 第一步：搜索页面标题
      const searchResults = await this.searchPages(query, baseUrl, maxResults);
      
      if (searchResults.length === 0) {
        return [];
      }
      
      // 第二步：获取页面内容
      const results = await this.getPageContents(searchResults, baseUrl);
      
      logger.info(`Wikipedia search completed, found ${results.length} results`);
      return results;

    } catch (error) {
      logger.error('Wikipedia search error:', error);
      throw new Error(`Wikipedia search failed: ${error.message}`);
    }
  }

  /**
   * 搜索Wikipedia页面
   * @param {string} query - 搜索查询
   * @param {string} baseUrl - API基础URL
   * @param {number} maxResults - 最大结果数
   * @returns {Promise<Array>} 页面列表
   */
  async searchPages(query, baseUrl, maxResults) {
    const params = {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: maxResults,
      format: 'json',
      origin: '*'
    };

    const response = await axios.get(baseUrl, {
      params,
      timeout: 10000
    });

    if (!response.data.query || !response.data.query.search) {
      return [];
    }

    return response.data.query.search.map(item => ({
      title: item.title,
      pageid: item.pageid,
      snippet: item.snippet ? item.snippet.replace(/<[^>]*>/g, '') : ''
    }));
  }

  /**
   * 获取页面内容
   * @param {Array} pages - 页面列表
   * @param {string} baseUrl - API基础URL
   * @returns {Promise<Array>} 完整的搜索结果
   */
  async getPageContents(pages, baseUrl) {
    const results = [];
    
    for (const page of pages) {
      try {
        const params = {
          action: 'query',
          prop: 'extracts|info',
          pageids: page.pageid,
          exintro: true,
          exlimit: 1,
          explaintext: true,
          exsectionformat: 'plain',
          inprop: 'url',
          format: 'json',
          origin: '*'
        };

        const response = await axios.get(baseUrl, {
          params,
          timeout: 10000
        });

        if (response.data.query && response.data.query.pages) {
          const pageData = response.data.query.pages[page.pageid];
          
          if (pageData && pageData.extract) {
            results.push({
              source: 'wikipedia',
              title: pageData.title,
              url: pageData.fullurl || `${baseUrl.replace('/w/api.php', '')}/wiki/${encodeURIComponent(pageData.title)}`,
              snippet: page.snippet || pageData.extract.substring(0, 200),
              content: pageData.extract,
              relevanceScore: 0, // 将在SearchService中计算
              scrapedAt: new Date()
            });
          }
        }
        
        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.warn(`Failed to get content for Wikipedia page ${page.title}:`, error.message);
      }
    }

    return results;
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 是否可用
   */
  async healthCheck() {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: 'test',
          srlimit: 1,
          format: 'json',
          origin: '*'
        },
        timeout: 5000
      });
      
      return response.status === 200 && response.data.query;
    } catch (error) {
      logger.warn('Wikipedia search health check failed:', error.message);
      return false;
    }
  }
}

module.exports = WikipediaSearchService; 