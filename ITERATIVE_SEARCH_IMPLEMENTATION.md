# AI智能体多轮搜索功能实现文档

## 概述

本文档详细记录了AI智能体信息展示专家系统的多轮搜索功能实现，包括自动化网页截图、文件存储管理、Markdown文档生成和增强的HTML报告生成等核心功能。

## 功能特性

### 1. 多轮深度搜索
- **智能搜索策略**: 基于前一轮结果自动生成下一轮搜索查询
- **多数据源集成**: 支持Google搜索和Wikipedia搜索
- **内容增强**: 自动抓取网页内容进行深度分析
- **AI驱动分析**: 使用Gemini AI分析每轮搜索结果并确定搜索方向

### 2. 自动化网页截图
- **MCP集成**: 集成MCP (Model Context Protocol) 网页截图工具
- **批量处理**: 支持批量截图，自动重试机制
- **智能优化**: 自动调整浏览器窗口大小，等待页面加载完成
- **错误处理**: 完善的错误处理和日志记录

### 3. 混合存储策略
- **文件系统存储**: 图片文件存储在`public/screenshots/`目录，按年月组织
- **MongoDB元数据**: 只存储图片元数据，包括路径、大小、创建时间等
- **缩略图生成**: 自动生成缩略图，优化加载性能
- **存储优化**: 支持图片压缩、格式转换、自动清理

### 4. Markdown文档生成
- **结构化报告**: 生成包含目录、摘要、详细分析的Markdown文档
- **多轮搜索展示**: 展示每轮搜索的查询、结果和关键发现
- **截图集成**: 在Markdown中展示截图和相关链接
- **下载支持**: 支持Markdown文档下载

### 5. 增强的HTML报告
- **截图展示**: HTML报告中集成截图显示
- **响应式设计**: 适配移动端和桌面端
- **多种模板**: 支持现代、经典、极简、学术、演示等多种风格
- **交互功能**: 支持折叠、标签页等交互元素

## 系统架构

### 核心服务

#### 1. SearchService (增强版)
```javascript
class SearchService {
  // 多轮深度搜索
  async iterativeSearch(topic, options)
  
  // 分析单轮搜索结果
  async analyzeRoundResults(results, topic, round)
  
  // 批量截图
  async captureScreenshots(results, metadata)
}
```

#### 2. MCPScreenshotService
```javascript
class MCPScreenshotService {
  // 截取网页截图
  async captureScreenshot(url, options)
  
  // 批量截图
  async captureMultipleScreenshots(urls, options)
  
  // 生成截图文件名
  generateScreenshotFilename(url, options)
}
```

#### 3. ImageStorageService
```javascript
class ImageStorageService {
  // 保存截图文件并生成缩略图
  async saveScreenshot(imageBuffer, filename, metadata)
  
  // 获取存储统计信息
  async getStorageStats()
  
  // 清理过期图片
  async cleanupOldImages(daysOld)
}
```

#### 4. MarkdownService
```javascript
class MarkdownService {
  // 生成研究报告Markdown文档
  async generateResearchReport(data, options)
  
  // 构建Markdown内容
  buildMarkdownContent(params)
  
  // 列出所有Markdown文件
  async listMarkdownFiles()
}
```

#### 5. GeminiService (增强版)
```javascript
class GeminiService {
  // 生成HTML报告内容（支持截图）
  async generateHTMLReport(processedContent, template, screenshots)
  
  // 构建HTML生成提示词（包含截图信息）
  buildHTMLPrompt(processedContent, template, screenshots)
}
```

### 数据模型

#### 1. Image模型
```javascript
{
  filename: String,           // 文件名
  thumbnailFilename: String,  // 缩略图文件名
  path: String,              // 文件路径
  publicUrl: String,         // 公共访问URL
  thumbnailUrl: String,      // 缩略图URL
  size: Number,              // 文件大小
  dimensions: {              // 图片尺寸
    width: Number,
    height: Number
  },
  sourceUrl: String,         // 来源网址
  sourceTitle: String,       // 来源标题
  metadata: {                // 元数据
    originalSize: Number,
    compression: String,
    captureTime: Date,
    tags: [String]
  },
  reportId: ObjectId,        // 关联报告ID
  status: String,            // 状态
  viewCount: Number,         // 查看次数
  createdAt: Date
}
```

#### 2. Report模型 (扩展)
```javascript
{
  // 原有字段...
  
  // 多轮搜索信息
  searchRounds: [{
    roundNumber: Number,
    query: String,
    results: [Object],
    keyFindings: String,
    nextDirection: String,
    timestamp: Date,
    processingTime: Number
  }],
  
  // 截图信息
  screenshots: [ObjectId],   // 关联的截图ID数组
  
  // Markdown文档信息
  markdownReport: {
    filename: String,
    path: String,
    size: Number,
    generated: Boolean,
    generatedAt: Date
  }
}
```

## API接口

### 1. 多轮搜索API

#### 启动多轮搜索
```http
POST /api/iterative-search
Content-Type: application/json

{
  "topic": "人工智能发展现状",
  "options": {
    "maxRounds": 3,
    "maxResultsPerRound": 8,
    "includeScreenshots": true,
    "generateMarkdown": true,
    "template": "modern",
    "language": "zh"
  }
}
```

#### 检查搜索状态
```http
GET /api/iterative-search/{reportId}/status
```

#### 获取搜索结果
```http
GET /api/iterative-search/{reportId}/result?format=html
GET /api/iterative-search/{reportId}/result?format=json
```

#### 下载Markdown报告
```http
GET /api/iterative-search/{reportId}/markdown
```

#### 列出所有报告
```http
GET /api/iterative-search/reports?page=1&limit=10&status=completed
```

### 2. 截图管理API

#### 访问截图文件
```http
GET /screenshots/{year}/{month}/{filename}
```

#### 获取截图信息
```http
GET /api/screenshots/{imageId}/info
```

#### 列出截图
```http
GET /api/screenshots?page=1&limit=20&reportId={reportId}
```

#### 获取存储统计
```http
GET /api/screenshots/stats
```

#### 删除截图
```http
DELETE /api/screenshots/{imageId}
```

#### 批量清理过期截图
```http
POST /api/screenshots/cleanup
Content-Type: application/json

{
  "daysOld": 30
}
```

## 目录结构

```
ai-agent/
├── public/
│   └── screenshots/           # 截图存储目录
│       └── YYYY/MM/          # 按年月组织
├── reports/
│   └── markdown/             # Markdown报告存储
├── src/
│   ├── services/
│   │   ├── search/
│   │   │   └── SearchService.js    # 增强的搜索服务
│   │   ├── screenshot/
│   │   │   └── MCPScreenshotService.js  # MCP截图服务
│   │   ├── storage/
│   │   │   └── ImageStorageService.js   # 图片存储服务
│   │   ├── document/
│   │   │   └── MarkdownService.js       # Markdown生成服务
│   │   └── ai/
│   │       └── gemini.js               # 增强的AI服务
│   ├── database/models/
│   │   ├── Image.js                    # 图片数据模型
│   │   ├── Report.js                   # 扩展的报告模型
│   │   └── index.js
│   └── server/routes/
│       ├── iterative-search.js         # 多轮搜索路由
│       └── screenshots.js              # 截图管理路由
└── scripts/
    └── test-iterative-search.js        # 功能测试脚本
```

## 工作流程

### 多轮搜索流程

1. **接收请求**: 用户提交搜索主题和选项
2. **创建报告记录**: 在数据库中创建初始报告记录
3. **异步执行搜索**: 
   - 第一轮搜索：使用原始主题进行搜索
   - 内容抓取：获取搜索结果的详细内容
   - 截图处理：对重要网页进行截图
   - AI分析：分析当前轮次结果，确定下一步方向
   - 后续轮次：基于AI分析结果进行深入搜索
4. **综合分析**: 使用AI对所有搜索结果进行综合分析
5. **生成报告**: 
   - 生成Markdown文档
   - 生成HTML报告（包含截图）
   - 更新数据库记录
6. **返回结果**: 提供多种格式的访问方式

### 截图处理流程

1. **URL验证**: 验证网址有效性
2. **MCP调用**: 使用MCP工具进行网页截图
3. **图片处理**: 
   - 使用Sharp进行图片压缩
   - 生成缩略图
   - 格式转换
4. **文件存储**: 
   - 按年月目录结构存储
   - 生成公共访问URL
5. **数据库记录**: 保存图片元数据到MongoDB
6. **错误处理**: 失败重试和错误记录

## 性能优化

### 1. 并发控制
- 限制同时进行的截图数量（批次大小：3）
- 搜索结果批量处理（批次大小：5）
- 避免过度并发导致的资源竞争

### 2. 缓存策略
- 截图文件HTTP缓存（1天）
- ETag支持避免重复传输
- 数据库查询优化和索引

### 3. 存储优化
- 图片压缩（PNG质量90%，缩略图80%）
- 自动清理过期文件
- 存储统计和监控

### 4. 错误处理
- 多层次重试机制
- 优雅降级（截图失败不影响搜索）
- 详细的错误日志和监控

## 测试和验证

### 测试脚本
使用`scripts/test-iterative-search.js`进行全面测试：

```bash
# 运行测试
node scripts/test-iterative-search.js
```

### 测试覆盖
- 多轮搜索功能测试
- 截图API测试  
- 报告生成测试
- Markdown下载测试
- 错误处理测试
- 性能压力测试

## 部署注意事项

### 1. 依赖安装
```bash
npm install uuid sharp
```

### 2. 目录创建
```bash
mkdir -p public/screenshots
mkdir -p reports/markdown
```

### 3. 环境配置
确保以下环境变量配置：
- `GOOGLE_API_KEY`: Google搜索API密钥
- `GOOGLE_SEARCH_ENGINE_ID`: Google搜索引擎ID
- `GOOGLE_GEMINI_API_KEY`: Google Gemini API密钥
- `MONGODB_URI`: MongoDB连接字符串

### 4. MCP工具集成
需要确保MCP Playwright工具正确安装和配置。

### 5. 权限设置
确保应用有权限：
- 读写`public/screenshots/`目录
- 读写`reports/markdown/`目录
- 访问外部API和网站

## 监控和维护

### 1. 日志监控
- 搜索请求和处理时间
- 截图成功率和失败原因
- 存储使用情况
- API响应时间

### 2. 定期维护
- 清理过期截图文件
- 数据库索引优化
- 存储空间监控
- 性能分析和优化

### 3. 错误告警
- 搜索失败率过高
- 截图服务不可用
- 存储空间不足
- API响应超时

## 扩展计划

### 1. 功能扩展
- 支持更多搜索引擎
- 视频截图和处理
- 实时搜索结果推送
- 用户自定义搜索策略

### 2. 性能优化
- 分布式截图处理
- CDN集成
- 缓存层优化
- 异步队列处理

### 3. 集成扩展
- 其他MCP工具集成
- 第三方存储服务
- AI模型选择
- 多语言支持

---

*文档版本: 1.0*  
*更新时间: 2024-01-15*  
*作者: AI智能体开发团队* 