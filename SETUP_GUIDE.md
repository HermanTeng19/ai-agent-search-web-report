# AI Information Display Expert - Installation & Setup Guide

> **Language**: [English](SETUP_GUIDE.md) | [中文](SETUP_GUIDE_ZH.md)  
> **Main Documentation**: [English](README.md) | [中文](README_ZH.md)

This is a complete backend MVP implementation that includes all core features: multi-source search, AI analysis, HTML report generation, and more.

## 📋 Prerequisites

### 1. System Environment

- **Node.js**: 18.0+ (recommended 18.17.0+)
- **MongoDB**: 5.0+ 
- **Operating System**: macOS, Linux, Windows

### 2. API Keys Preparation

#### Required API Keys
- **Google Gemini API Key**: [Get it here](https://ai.google.dev/)

#### Optional API Keys (for enhanced search functionality)
- **Google Custom Search API**: [Get it here](https://developers.google.com/custom-search/v1/introduction)
# - **Bing Search API**: [Get it here](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api) (removed)

> Note: Even without Google API key, the system will still work normally using Wikipedia as a search source.

## 🚀 Quick Start Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment Variables File

Create a `.env` file in the project root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-information-expert

# AI Model Configuration (Required)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Search API Configuration (Optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
# BING_SEARCH_API_KEY=your_bing_search_api_key (removed)

# Server Configuration
PORT=3001
NODE_ENV=development

# Other Configuration
LOG_LEVEL=info
```

### 3. Start MongoDB

#### Method 1: Using Docker (Recommended)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Method 2: Local Installation
```bash
# macOS (using Homebrew)
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

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`.

### 5. Verify Installation

```bash
# Check health status
curl http://localhost:3001/api/health

# Run complete API tests
npm run test:api
```

## 🔧 Detailed Configuration

### MongoDB Configuration

Default connection to local MongoDB instance:
- **URL**: `mongodb://localhost:27017/ai-information-expert`
- **Database Name**: `ai-information-expert`

To connect to remote MongoDB:
```bash
MONGODB_URI=mongodb://username:password@host:port/database_name
```

### Gemini API Configuration

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create a new project or select an existing one
3. Enable the Generative AI API
4. Create an API key
5. Set the API key as an environment variable

### Search API Configuration (Optional)

#### Google Custom Search
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search API
3. Create Custom Search Engine: [Click here](https://cse.google.com/)
4. Get API key and search engine ID

# #### Bing Search API (removed)
# 1. Visit [Azure Portal](https://portal.azure.com/)
# 2. Create Bing Search resource
# 3. Get API key

## 🧪 Testing and Verification

### 1. Basic Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
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

### 2. Create Test Search

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Current status of artificial intelligence development",
    "language": "en",
    "maxResults": 5,
    "sources": ["wikipedia"]
  }'
```

### 3. Run Complete Test Suite

```bash
npm run test:api
```

This will run a series of integration tests to verify:
- Search creation and execution
- AI analysis processing
- HTML report generation
- Data persistence

## 📂 Project Structure

```
ai-agent/
├── src/
│   ├── config/              # Configuration files
│   │   ├── connection.js    # MongoDB connection
│   │   └── models/          # Data models
│   ├── server/              # Express server
│   │   ├── index.js         # Main server file
│   │   └── routes/          # API routes
│   ├── services/            # Business logic services
│   │   ├── ai/              # AI services (Gemini)
│   │   └── search/          # Search services
│   └── utils/               # Utility functions
├── scripts/                 # Script files
├── logs/                    # Log folder
├── package.json             # Project dependencies
└── README.md                # Main documentation
```

## 🔍 Core API Endpoints

### Search Related
- `POST /api/search` - Create search task
- `GET /api/search/:searchId` - Get search results
- `GET /api/search` - Search history list

### Report Related
- `POST /api/report` - Generate HTML report
- `GET /api/report/:reportId` - Get report details
- `GET /api/report/:reportId/html` - Get HTML content
- `GET /api/report/:reportId/download` - Download report

### Monitoring Related
- `GET /api/health` - System health check
- `GET /api/health/stats` - System statistics

## 🚨 Troubleshooting

### Common Issues

1. **Port 3001 in Use**
   ```bash
   # Check port usage
   lsof -i :3001
   
   # Or change port
   export PORT=3002
   npm run dev
   ```

2. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod  # Linux
   brew services list | grep mongo  # macOS
   ```

3. **Gemini API Error**
   - Verify API key is correct
   - Check if API quota is sufficient
   - Ensure network connection is normal

4. **Search Service Failed**
   - Wikipedia doesn't need API key, should always be available
   - If all search sources fail, check network connection

### Log Viewing

```bash
# View logs in real-time
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# View logs for specific time
grep "2024-01-01" logs/combined.log
```

## 🚀 Production Deployment Recommendations

### 1. Environment Variable Security
- Use environment variables to manage sensitive information
- Don't commit API keys to version control

### 2. Database Optimization
- Use MongoDB cluster for high availability
- Configure appropriate indexes to optimize query performance

### 3. Monitoring and Logging
- Set up log rotation to avoid disk space issues
- Use monitoring tools to track performance metrics

### 4. Security Considerations
- Configure firewall to restrict access
- Use HTTPS for encrypted transmission
- Implement appropriate rate limiting

## 📞 Getting Help

If you encounter issues:

1. Check this installation guide
2. Review the project README.md
3. Run health check to confirm service status
4. Check log files for detailed error information
5. Create an Issue to report problems

---

**Happy coding!** 🚀 