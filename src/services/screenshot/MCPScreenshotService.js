const logger = require('../../utils/logger');

class MCPScreenshotService {
  constructor() {
    this.defaultOptions = {
      viewport: { width: 1920, height: 1080 },
      fullPage: true,
      waitTime: 3000, // 等待页面加载时间(ms)
      quality: 90,
      format: 'png'
    };
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * 截取网页截图
   * @param {string} url - 网页URL
   * @param {Object} options - 截图选项
   * @returns {Promise<Buffer>} 截图二进制数据
   */
  async captureScreenshot(url, options = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Attempting to capture screenshot of ${url} (attempt ${attempt}/${this.maxRetries})`);
        
        // 验证URL
        if (!this.isValidUrl(url)) {
          throw new Error(`Invalid URL: ${url}`);
        }

        // 使用MCP playwright工具进行截图
        const screenshot = await this.takeMCPScreenshot(url, mergedOptions);
        
        if (!screenshot || screenshot.length === 0) {
          throw new Error('Empty screenshot returned');
        }

        logger.info(`Screenshot captured successfully: ${url} (${screenshot.length} bytes)`);
        return screenshot;

      } catch (error) {
        lastError = error;
        logger.warn(`Screenshot attempt ${attempt} failed for ${url}:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    logger.error(`Failed to capture screenshot after ${this.maxRetries} attempts: ${url}`);
    throw new Error(`Screenshot capture failed: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * 使用MCP工具截取截图
   * @param {string} url - 网页URL
   * @param {Object} options - 截图选项
   * @returns {Promise<Buffer>} 截图数据
   */
  async takeMCPScreenshot(url, options) {
    try {
      // 导航到页面
      await this.navigateToPage(url);
      
      // 等待页面加载完成
      await this.waitForPageLoad(options.waitTime);
      
      // 调整浏览器窗口大小
      await this.resizeBrowser(options.viewport.width, options.viewport.height);
      
      // 截取截图
      const screenshotResult = await this.takeScreenshot(options);
      
      // 返回截图数据
      return this.processScreenshotResult(screenshotResult);
      
    } catch (error) {
      logger.error('MCP screenshot operation failed:', error);
      throw error;
    }
  }

  /**
   * 导航到指定页面
   * @param {string} url - 目标URL
   * @returns {Promise<void>}
   */
  async navigateToPage(url) {
    try {
      // 这里应该调用MCP的导航功能
      // 由于MCP工具在运行时才可用，这里提供接口定义
      logger.info(`Navigating to: ${url}`);
      
      // 实际实现时需要调用MCP playwright工具
      // 例如：await mcpClient.navigate({ url });
      
      // 模拟导航（在实际集成时需要替换）
      await this.delay(1000);
      
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * 等待页面加载完成
   * @param {number} waitTime - 等待时间(ms)
   * @returns {Promise<void>}
   */
  async waitForPageLoad(waitTime) {
    try {
      logger.info(`Waiting for page load: ${waitTime}ms`);
      
      // 实际实现时需要调用MCP工具的等待功能
      // 例如：await mcpClient.waitFor({ time: waitTime });
      
      await this.delay(waitTime);
      
    } catch (error) {
      throw new Error(`Page load wait failed: ${error.message}`);
    }
  }

  /**
   * 调整浏览器窗口大小
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {Promise<void>}
   */
  async resizeBrowser(width, height) {
    try {
      logger.info(`Resizing browser to ${width}x${height}`);
      
      // 实际实现时需要调用MCP工具的调整大小功能
      // 例如：await mcpClient.resize({ width, height });
      
    } catch (error) {
      throw new Error(`Browser resize failed: ${error.message}`);
    }
  }

  /**
   * 截取截图
   * @param {Object} options - 截图选项
   * @returns {Promise<Object>} 截图结果
   */
  async takeScreenshot(options) {
    try {
      logger.info('Taking screenshot...');
      
      // 实际实现时需要调用MCP工具的截图功能
      // 例如：return await mcpClient.takeScreenshot({ 
      //   fullPage: options.fullPage,
      //   quality: options.quality,
      //   format: options.format
      // });
      
      // 模拟截图结果（在实际集成时需要替换）
      return {
        success: true,
        data: Buffer.from('mock-screenshot-data'),
        format: options.format
      };
      
    } catch (error) {
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * 处理截图结果
   * @param {Object} result - 截图结果
   * @returns {Buffer} 处理后的截图数据
   */
  processScreenshotResult(result) {
    try {
      if (!result.success) {
        throw new Error('Screenshot operation was not successful');
      }
      
      if (!result.data) {
        throw new Error('No screenshot data received');
      }
      
      // 确保返回Buffer格式
      if (Buffer.isBuffer(result.data)) {
        return result.data;
      }
      
      if (typeof result.data === 'string') {
        // 如果是base64字符串，转换为Buffer
        return Buffer.from(result.data, 'base64');
      }
      
      throw new Error('Invalid screenshot data format');
      
    } catch (error) {
      throw new Error(`Screenshot processing failed: ${error.message}`);
    }
  }

  /**
   * 批量截图
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 截图选项
   * @returns {Promise<Array>} 截图结果数组
   */
  async captureMultipleScreenshots(urls, options = {}) {
    const results = [];
    const batchSize = 3; // 限制并发数量
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url, index) => {
        try {
          const screenshot = await this.captureScreenshot(url, options);
          return {
            url,
            success: true,
            data: screenshot,
            index: i + index
          };
        } catch (error) {
          logger.error(`Batch screenshot failed for ${url}:`, error);
          return {
            url,
            success: false,
            error: error.message,
            index: i + index
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 批次间延迟，避免过度请求
      if (i + batchSize < urls.length) {
        await this.delay(2000);
      }
    }
    
    return results.sort((a, b) => a.index - b.index);
  }

  /**
   * 验证URL格式
   * @param {string} url - 待验证的URL
   * @returns {boolean} 验证结果
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成截图文件名
   * @param {string} url - 网页URL
   * @param {Object} options - 选项
   * @returns {string} 文件名
   */
  generateScreenshotFilename(url, options = {}) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '-');
      const path = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '-');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      
      const filename = `${domain}${path ? '-' + path : ''}-${timestamp}`;
      return filename.substring(0, 100); // 限制文件名长度
      
    } catch (error) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      return `screenshot-${timestamp}`;
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间(毫秒)
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      // 检查MCP工具是否可用
      // 实际实现时需要调用MCP工具的健康检查
      
      return {
        status: 'healthy',
        service: 'MCPScreenshotService',
        timestamp: new Date().toISOString(),
        capabilities: {
          screenshot: true,
          navigation: true,
          resize: true,
          batch: true
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'MCPScreenshotService',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = MCPScreenshotService; 