# AI智能体信息展示专家

> **语言版本**: [English](README.md) | [中文](README_ZH.md)  
> **安装指南**: [English](SETUP_GUIDE.md) | [中文](SETUP_GUIDE_ZH.md)

一个强大的AI智能体系统，专门用于搜索、分析和展示信息。系统能够根据用户提供的主题，自动从多个数据源搜索相关信息，使用AI进行智能分析和总结，最终生成结构化的HTML报告。

## 🌟 核心功能

- **多源搜索**: 集成Google、Wikipedia等多个搜索引擎
- **AI分析**: 使用Google Gemini 2.5 Flash进行智能内容分析和总结
- **HTML生成**: 自动生成美观的、响应式的HTML报告
- **异步处理**: 支持大规模并发搜索和处理任务
- **历史管理**: 完整的搜索和报告历史记录
- **多模板**: 支持多种报告展示风格

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   搜索引擎API   │    │   后端服务      │    │   AI处理服务    │
│  Google/Wikipedia│◄──►│  Express.js     │◄──►│  Gemini 2.5     │
│  Wikipedia      │    │  MongoDB        │    │  Flash          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   HTML报告      │
                       │   生成器        │
                       └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 5.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-agent
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量
vim .env
```

必需的环境变量：
```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/ai-information-expert

# AI模型
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# 搜索API（可选，Wikipedia无需密钥）
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
# BING_SEARCH_API_KEY=your_bing_api_key (已移除)

# 服务器
PORT=3001
```

4. **启动MongoDB**
```bash
# 使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用系统服务
sudo systemctl start mongod
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **验证安装**
```bash
# 运行测试
npm run test:api

# 检查健康状态
curl http://localhost:3001/api/health
```

## 📖 API文档

### 搜索相关

#### 创建搜索任务
```http
POST /api/search
Content-Type: application/json

{
  "topic": "人工智能发展现状",
  "language": "zh",
  "maxResults": 10,
  "sources": ["google", "wikipedia"],
  "includeContent": true
}
```

#### 获取搜索结果
```http
GET /api/search/{searchId}
```

#### 搜索历史
```http
GET /api/search?page=1&limit=10&status=completed
```

### 报告相关

#### 生成HTML报告
```http
POST /api/report
Content-Type: application/json

{
  "searchId": "uuid-here",
  "template": "modern",
  "customizations": {
    "colorScheme": "blue",
    "fontSize": "medium",
    "includeCharts": true,
    "includeImages": true
  }
}
```

#### 获取HTML内容
```http
GET /api/report/{reportId}/html
```

#### 下载报告
```http
GET /api/report/{reportId}/download
```

### 健康检查

#### 系统状态
```http
GET /api/health
```

#### 详细统计
```http
GET /api/health/stats
```

## 🔧 配置说明

### 数据库配置

系统使用MongoDB存储搜索记录和报告：

```javascript
// MongoDB集合结构
searches: {
  searchId: String,      // 唯一标识
  topic: String,         // 搜索主题
  status: String,        // pending/searching/processing/completed/failed
  searchResults: Array,  // 搜索结果
  processedContent: Object, // AI处理结果
  metadata: Object       // 元数据
}

reports: {
  reportId: String,      // 唯一标识
  searchId: String,      // 关联搜索
  htmlContent: String,   // HTML内容
  template: Object,      // 模板配置
  status: String,        // generating/completed/failed
  metadata: Object       // 元数据
}
```

### AI模型配置

支持配置不同的AI模型参数：

```javascript
ai: {
  gemini: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192
  }
}
```

### 搜索服务配置

可以配置多个搜索源：

```javascript
search: {
  google: {
    apiKey: 'your_key',
    engineId: 'your_engine_id',
    maxResults: 10
  }
  // Wikipedia无需配置
}
```

## 🎨 模板系统

系统支持多种报告模板：

### 可用模板

- **modern**: 现代简约风格，使用渐变色彩和卡片式布局
- **classic**: 经典传统风格，使用传统排版和正式色彩
- **minimal**: 极简主义风格，使用最少的装饰和大量留白
- **academic**: 学术论文风格，使用严格的排版和引用格式
- **presentation**: 演示文稿风格，使用大字体和突出的视觉元素

### 自定义选项

- 颜色方案：blue, green, red, purple等
- 字体大小：small, medium, large
- 图表包含：true/false
- 图片包含：true/false

## 🔍 使用示例

### 基本搜索流程

```javascript
// 1. 创建搜索
const searchResponse = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: '区块链技术应用前景',
    language: 'zh',
    maxResults: 15
  })
});

const { searchId } = await searchResponse.json();

// 2. 轮询搜索状态
const checkStatus = async () => {
  const response = await fetch(`/api/search/${searchId}`);
  const data = await response.json();
  
  if (data.status === 'completed') {
    // 搜索完成，可以生成报告
    generateReport(searchId);
  } else {
    // 继续等待
    setTimeout(checkStatus, 3000);
  }
};

// 3. 生成报告
const generateReport = async (searchId) => {
  const reportResponse = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchId,
      template: 'modern',
      customizations: {
        colorScheme: 'blue',
        fontSize: 'medium'
      }
    })
  });
  
  const { reportId } = await reportResponse.json();
  
  // 等待报告生成完成后访问
  window.open(`/api/report/${reportId}/html`, '_blank');
};
```

## 🧪 测试

### 运行测试

```bash
# API功能测试
npm run test:api

# 单元测试
npm test
```

### 测试覆盖

测试覆盖了以下功能：

- ✅ 健康检查
- ✅ 搜索创建和状态查询
- ✅ AI分析处理
- ✅ 报告生成和HTML输出
- ✅ 历史记录管理
- ✅ 错误处理

## 🚀 部署

### Docker部署

```bash
# 构建镜像
docker build -t ai-information-expert .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://host:27017/db \
  -e GOOGLE_GEMINI_API_KEY=your_key \
  ai-information-expert
```

### 生产环境

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start src/server/index.js --name ai-expert

# 设置开机自启
pm2 startup
pm2 save
```

## 📊 性能监控

### 关键指标

- 搜索响应时间: < 30秒
- AI处理时间: < 15秒
- HTML生成时间: < 5秒
- 系统并发能力: 100+ 用户

### 监控端点

```bash
# 系统健康状态
GET /api/health

# 详细统计信息
GET /api/health/stats

# 各服务状态
GET /api/health/database
GET /api/health/ai
GET /api/health/search
```

## 🔧 故障排除

### 常见问题

1. **MongoDB连接失败**
   ```bash
   # 检查MongoDB状态
   sudo systemctl status mongod
   
   # 检查连接字符串
   echo $MONGODB_URI
   ```

2. **Gemini API错误**
   ```bash
   # 验证API密钥
   curl -H "x-goog-api-key: $GOOGLE_GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
   ```

3. **搜索服务失败**
   ```bash
   # 测试Wikipedia连接
   curl "https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=test&format=json"
   ```

4. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3001
   
   # 更改端口
   export PORT=3002
   ```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

### 代码规范

- 使用ESLint进行代码检查
- 遵循Google JavaScript风格指南
- 添加适当的注释和文档
- 确保测试通过

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或需要支持，请：

1. 查看文档和FAQ
2. 搜索已有的Issues
3. 创建新的Issue
4. 联系开发团队

---

**AI智能体信息展示专家** - 让信息搜索和展示变得智能化 🚀 