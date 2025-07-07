# AI智能体信息展示专家 - 安装配置指南

> **语言版本**: [English](SETUP_GUIDE.md) | [中文](SETUP_GUIDE_ZH.md)  
> **主要文档**: [English](README.md) | [中文](README_ZH.md)

这是一个完整的后端MVP实现，包含了所有核心功能：多源搜索、AI分析、HTML报告生成等。

## 📋 前置要求

### 1. 系统环境

- **Node.js**: 18.0+ (推荐18.17.0+)
- **MongoDB**: 5.0+ 
- **操作系统**: macOS, Linux, Windows

### 2. API密钥准备

#### 必需的API密钥
- **Google Gemini API Key**: [获取地址](https://ai.google.dev/)

#### 可选的API密钥（用于增强搜索功能）
- **Google Custom Search API**: [获取地址](https://developers.google.com/custom-search/v1/introduction)
# - **Bing Search API**: [获取地址](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api) (已移除)

> 注意：即使没有Google API密钥，系统仍可正常工作，会使用Wikipedia作为搜索源。

## 🚀 快速启动步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 创建环境变量文件

创建 `.env` 文件在项目根目录：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai-information-expert

# AI模型配置（必需）
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# 搜索API配置（可选）
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
# BING_SEARCH_API_KEY=your_bing_search_api_key (已移除)

# 服务器配置
PORT=3001
NODE_ENV=development

# 其他配置
LOG_LEVEL=info
```

### 3. 启动MongoDB

#### 方法1: 使用Docker（推荐）
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 方法2: 本地安装
```bash
# macOS (使用Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt update
sudo apt install mongodb
sudo systemctl start mongod

# CentOS/RHEL
sudo yum install mongodb-org
sudo systemctl start mongod
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 5. 验证安装

```bash
# 检查健康状态
curl http://localhost:3001/api/health

# 运行完整API测试
npm run test:api
```

## 🔧 详细配置说明

### MongoDB配置

默认连接到本地MongoDB实例：
- **URL**: `mongodb://localhost:27017/ai-information-expert`
- **数据库名**: `ai-information-expert`

如需连接远程MongoDB：
```bash
MONGODB_URI=mongodb://username:password@host:port/database_name
```

### Gemini API配置

1. 访问 [Google AI Studio](https://ai.google.dev/)
2. 创建新项目或选择现有项目
3. 启用Generative AI API
4. 创建API密钥
5. 将API密钥设置为环境变量

### 搜索API配置（可选）

#### Google Custom Search
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 启用 Custom Search API
3. 创建Custom Search Engine: [点击这里](https://cse.google.com/)
4. 获取API密钥和搜索引擎ID

# #### Bing Search API (已移除)
# 1. 访问 [Azure Portal](https://portal.azure.com/)
# 2. 创建Bing Search资源
# 3. 获取API密钥

## 🧪 测试和验证

### 1. 基础健康检查

```bash
curl http://localhost:3001/api/health
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "healthy",
      "gemini": "healthy",
      "search": {
        "wikipedia": "healthy"
      }
    }
  }
}
```

### 2. 创建测试搜索

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "人工智能发展现状",
    "language": "zh",
    "maxResults": 5,
    "sources": ["wikipedia"]
  }'
```

### 3. 运行完整测试套件

```bash
npm run test:api
```

这将运行一系列集成测试，验证：
- 搜索创建和执行
- AI分析处理
- HTML报告生成
- 数据持久化

## 📂 项目结构说明

```
ai-agent/
├── src/
│   ├── config/              # 配置文件
│   │   ├── connection.js    # MongoDB连接
│   │   └── models/          # 数据模型
│   ├── server/              # Express服务器
│   │   ├── index.js         # 主服务器文件
│   │   └── routes/          # API路由
│   ├── services/            # 业务逻辑服务
│   │   ├── ai/              # AI服务（Gemini）
│   │   └── search/          # 搜索服务
│   └── utils/               # 工具函数
├── scripts/                 # 脚本文件
├── logs/                    # 日志文件夹
├── package.json             # 项目依赖
└── README.md                # 主文档
```

## 🔍 核心API端点

### 搜索相关
- `POST /api/search` - 创建搜索任务
- `GET /api/search/:searchId` - 获取搜索结果
- `GET /api/search` - 搜索历史列表

### 报告相关
- `POST /api/report` - 生成HTML报告
- `GET /api/report/:reportId` - 获取报告详情
- `GET /api/report/:reportId/html` - 获取HTML内容
- `GET /api/report/:reportId/download` - 下载报告

### 监控相关
- `GET /api/health` - 系统健康检查
- `GET /api/health/stats` - 系统统计信息

## 🚨 故障排除

### 常见问题

1. **端口3001被占用**
   ```bash
   # 检查端口占用
   lsof -i :3001
   
   # 或更改端口
   export PORT=3002
   npm run dev
   ```

2. **MongoDB连接失败**
   ```bash
   # 检查MongoDB状态
   sudo systemctl status mongod  # Linux
   brew services list | grep mongo  # macOS
   ```

3. **Gemini API错误**
   - 验证API密钥是否正确
   - 检查API额度是否充足
   - 确认网络连接正常

4. **搜索服务失败**
   - Wikipedia不需要API密钥，应该总是可用
   - 如果全部搜索源失败，检查网络连接

### 日志查看

```bash
# 实时查看日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 查看特定时间的日志
grep "2024-01-01" logs/combined.log
```

## 🚀 生产部署建议

### 1. 环境变量安全
- 使用环境变量管理敏感信息
- 不要将API密钥提交到版本控制

### 2. 数据库优化
- 使用MongoDB集群确保高可用性
- 配置适当的索引优化查询性能

### 3. 监控和日志
- 设置日志轮转避免磁盘空间不足
- 使用监控工具追踪性能指标

### 4. 安全考虑
- 配置防火墙限制访问
- 使用HTTPS加密传输
- 实施适当的速率限制

## 📞 获取帮助

如果遇到问题：

1. 检查这个安装指南
2. 查看项目README.md
3. 运行健康检查确认各服务状态
4. 查看日志文件获取详细错误信息
5. 创建Issue报告问题

---

**祝您使用愉快！** 🚀 