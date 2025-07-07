const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class MarkdownService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'reports', 'markdown');
    this.templateDir = path.join(__dirname, 'templates');
    this.defaultTemplate = 'research-report';
  }

  /**
   * 生成研究报告Markdown文档
   * @param {Object} data - 报告数据
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateResearchReport(data, options = {}) {
    try {
      const {
        topic,
        searchResults,
        analysisResult,
        screenshots,
        rounds,
        timestamp = new Date()
      } = data;

      const {
        template = this.defaultTemplate,
        includeScreenshots = true,
        includeRawData = false,
        filename = null
      } = options;

      logger.info(`Generating markdown report for topic: ${topic}`);

      // 构建Markdown内容
      const markdownContent = this.buildMarkdownContent({
        topic,
        searchResults,
        analysisResult,
        screenshots,
        rounds,
        timestamp,
        includeScreenshots,
        includeRawData
      });

      // 生成文件名
      const finalFilename = filename || this.generateFilename(topic, timestamp);
      const filePath = path.join(this.outputDir, finalFilename);

      // 确保输出目录存在
      await fs.mkdir(this.outputDir, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, markdownContent, 'utf8');

      logger.info(`Markdown report generated: ${filePath}`);

      return {
        success: true,
        filename: finalFilename,
        path: filePath,
        relativePath: path.relative(process.cwd(), filePath),
        size: Buffer.byteLength(markdownContent, 'utf8'),
        timestamp,
        content: markdownContent
      };

    } catch (error) {
      logger.error('Failed to generate markdown report:', error);
      throw new Error(`Markdown generation failed: ${error.message}`);
    }
  }

  /**
   * 构建Markdown内容
   * @param {Object} params - 构建参数
   * @returns {string} Markdown内容
   */
  buildMarkdownContent(params) {
    const {
      topic,
      searchResults,
      analysisResult,
      screenshots,
      rounds,
      timestamp,
      includeScreenshots,
      includeRawData
    } = params;

    let markdown = '';

    // 标题和基本信息
    markdown += this.buildHeader(topic, timestamp);

    // 执行摘要
    markdown += this.buildExecutiveSummary(analysisResult);

    // 多轮搜索概览
    if (rounds && rounds.length > 0) {
      markdown += this.buildSearchRoundsOverview(rounds);
    }

    // 关键发现
    markdown += this.buildKeyFindings(analysisResult);

    // 详细分析
    markdown += this.buildDetailedAnalysis(analysisResult);

    // 截图展示
    if (includeScreenshots && screenshots && screenshots.length > 0) {
      markdown += this.buildScreenshotsSection(screenshots);
    }

    // 信息源和参考资料
    markdown += this.buildSourcesSection(searchResults, analysisResult);

    // 原始数据（可选）
    if (includeRawData) {
      markdown += this.buildRawDataSection(searchResults, analysisResult);
    }

    // 页脚
    markdown += this.buildFooter(timestamp);

    return markdown;
  }

  /**
   * 构建文档头部
   * @param {string} topic - 主题
   * @param {Date} timestamp - 时间戳
   * @returns {string} 头部内容
   */
  buildHeader(topic, timestamp) {
    return `# ${topic} - 研究报告

**生成时间**: ${timestamp.toLocaleString('zh-CN')}  
**报告类型**: AI智能体深度研究报告  
**数据来源**: 多源搜索 + AI分析  

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [多轮搜索概览](#多轮搜索概览)
3. [关键发现](#关键发现)
4. [详细分析](#详细分析)
5. [截图展示](#截图展示)
6. [信息源和参考资料](#信息源和参考资料)
7. [原始数据](#原始数据)

---

`;
  }

  /**
   * 构建执行摘要
   * @param {Object} analysisResult - 分析结果
   * @returns {string} 摘要内容
   */
  buildExecutiveSummary(analysisResult) {
    return `## 🎯 执行摘要

${analysisResult.summary || '暂无摘要信息'}

**置信度**: ${Math.round((analysisResult.confidence || 0.7) * 100)}%

---

`;
  }

  /**
   * 构建搜索轮次概览
   * @param {Array} rounds - 搜索轮次数据
   * @returns {string} 概览内容
   */
  buildSearchRoundsOverview(rounds) {
    let content = `## 🔍 多轮搜索概览

本次研究共进行了 **${rounds.length}** 轮搜索，逐步深入探索主题：

`;

    rounds.forEach((round, index) => {
      content += `### 第 ${index + 1} 轮搜索
- **搜索查询**: ${round.query}
- **搜索结果**: ${round.results?.length || 0} 条
- **关键发现**: ${round.keyFindings || '待分析'}
- **下一步方向**: ${round.nextDirection || '已完成'}

`;
    });

    content += '---\n\n';
    return content;
  }

  /**
   * 构建关键发现
   * @param {Object} analysisResult - 分析结果
   * @returns {string} 关键发现内容
   */
  buildKeyFindings(analysisResult) {
    let content = `## 🔑 关键发现

`;

    if (analysisResult.keyPoints && analysisResult.keyPoints.length > 0) {
      analysisResult.keyPoints.forEach((point, index) => {
        content += `${index + 1}. **${point}**\n`;
      });
    } else {
      content += '暂无关键发现数据\n';
    }

    content += '\n---\n\n';
    return content;
  }

  /**
   * 构建详细分析
   * @param {Object} analysisResult - 分析结果
   * @returns {string} 详细分析内容
   */
  buildDetailedAnalysis(analysisResult) {
    let content = `## 📊 详细分析

`;

    if (analysisResult.categories && analysisResult.categories.length > 0) {
      analysisResult.categories.forEach((category, index) => {
        content += `### ${category.name}

`;
        if (category.points && category.points.length > 0) {
          category.points.forEach(point => {
            content += `- ${point}\n`;
          });
        }
        content += '\n';
      });
    } else {
      content += '暂无详细分析数据\n\n';
    }

    content += '---\n\n';
    return content;
  }

  /**
   * 构建截图展示部分
   * @param {Array} screenshots - 截图数据
   * @returns {string} 截图展示内容
   */
  buildScreenshotsSection(screenshots) {
    let content = `## 📸 截图展示

以下是相关网页的截图，提供直观的视觉参考：

`;

    screenshots.forEach((screenshot, index) => {
      content += `### 截图 ${index + 1}: ${screenshot.title || screenshot.url}

![${screenshot.title || 'Screenshot'}](${screenshot.publicUrl})

- **网址**: [${screenshot.url}](${screenshot.url})
- **截图时间**: ${screenshot.createdAt ? new Date(screenshot.createdAt).toLocaleString('zh-CN') : '未知'}
- **文件大小**: ${screenshot.sizeFormatted || this.formatBytes(screenshot.size || 0)}
- **分辨率**: ${screenshot.dimensions ? `${screenshot.dimensions.width}x${screenshot.dimensions.height}` : '未知'}

`;
    });

    content += '---\n\n';
    return content;
  }

  /**
   * 构建信息源部分
   * @param {Array} searchResults - 搜索结果
   * @param {Object} analysisResult - 分析结果
   * @returns {string} 信息源内容
   */
  buildSourcesSection(searchResults, analysisResult) {
    let content = `## 📚 信息源和参考资料

### 权威来源

`;

    // 从分析结果中提取来源
    if (analysisResult.sources && analysisResult.sources.length > 0) {
      analysisResult.sources.forEach((source, index) => {
        const reliability = Math.round((source.reliability || 0.7) * 100);
        content += `${index + 1}. **[${source.title}](${source.url})**  
   可靠性: ${reliability}%  
   来源: ${this.getSourceType(source.url)}

`;
      });
    }

    content += '\n### 所有搜索结果\n\n';

    // 列出所有搜索结果
    if (searchResults && searchResults.length > 0) {
      searchResults.forEach((result, index) => {
        content += `${index + 1}. **[${result.title}](${result.url})**  
   来源: ${result.source || 'unknown'}  
   摘要: ${result.snippet || '无摘要'}

`;
      });
    }

    content += '---\n\n';
    return content;
  }

  /**
   * 构建原始数据部分
   * @param {Array} searchResults - 搜索结果
   * @param {Object} analysisResult - 分析结果
   * @returns {string} 原始数据内容
   */
  buildRawDataSection(searchResults, analysisResult) {
    let content = `## 📄 原始数据

<details>
<summary>点击展开原始搜索结果</summary>

\`\`\`json
${JSON.stringify(searchResults, null, 2)}
\`\`\`

</details>

<details>
<summary>点击展开AI分析结果</summary>

\`\`\`json
${JSON.stringify(analysisResult, null, 2)}
\`\`\`

</details>

---

`;
    return content;
  }

  /**
   * 构建页脚
   * @param {Date} timestamp - 时间戳
   * @returns {string} 页脚内容
   */
  buildFooter(timestamp) {
    return `## 📝 报告说明

- **生成工具**: AI智能体信息展示专家
- **生成时间**: ${timestamp.toISOString()}
- **报告格式**: Markdown
- **数据来源**: Google搜索 + Wikipedia + AI分析
- **处理方式**: 多轮搜索 + 智能分析 + 截图展示

> 本报告由AI智能体自动生成，信息仅供参考。建议结合其他权威来源进行验证。

---

*报告结束*
`;
  }

  /**
   * 生成文件名
   * @param {string} topic - 主题
   * @param {Date} timestamp - 时间戳
   * @returns {string} 文件名
   */
  generateFilename(topic, timestamp) {
    const cleanTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-');
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    return `${cleanTopic}-${dateStr}-${timeStr}.md`;
  }

  /**
   * 获取来源类型
   * @param {string} url - URL
   * @returns {string} 来源类型
   */
  getSourceType(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes('wikipedia')) return 'Wikipedia';
      if (domain.includes('gov')) return '政府网站';
      if (domain.includes('edu')) return '教育机构';
      if (domain.includes('org')) return '组织机构';
      if (domain.includes('news') || domain.includes('cnn') || domain.includes('bbc')) return '新闻媒体';
      
      return '网站';
    } catch (error) {
      return '未知';
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 读取Markdown文件
   * @param {string} filename - 文件名
   * @returns {Promise<string>} 文件内容
   */
  async readMarkdownFile(filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      logger.error(`Failed to read markdown file ${filename}:`, error);
      throw new Error(`Markdown file read failed: ${error.message}`);
    }
  }

  /**
   * 列出所有Markdown文件
   * @returns {Promise<Array>} 文件列表
   */
  async listMarkdownFiles() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      const files = await fs.readdir(this.outputDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      const fileInfos = await Promise.all(
        markdownFiles.map(async (filename) => {
          const filePath = path.join(this.outputDir, filename);
          const stats = await fs.stat(filePath);
          return {
            filename,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
      );

      return fileInfos.sort((a, b) => b.modifiedAt - a.modifiedAt);
    } catch (error) {
      logger.error('Failed to list markdown files:', error);
      throw new Error(`Markdown file listing failed: ${error.message}`);
    }
  }

  /**
   * 删除Markdown文件
   * @param {string} filename - 文件名
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteMarkdownFile(filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      await fs.unlink(filePath);
      logger.info(`Markdown file deleted: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete markdown file ${filename}:`, error);
      throw new Error(`Markdown file deletion failed: ${error.message}`);
    }
  }
}

module.exports = MarkdownService; 