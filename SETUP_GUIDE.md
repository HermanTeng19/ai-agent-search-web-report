# AI Agent Backend Setup Guide

This guide will help you set up the AI Agent Backend Enhancement system from scratch.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows 10+
- **Node.js**: Version 18.0 or higher
- **MongoDB**: Version 4.4 or higher
- **Memory**: At least 2GB RAM available
- **Storage**: 10GB free disk space

### Required API Keys
- **Google Gemini API Key**: For AI analysis and content generation
- **Google Search API Key**: For web search functionality
- **Google Custom Search Engine ID**: For search customization

## 🚀 Installation Steps

### Step 1: Environment Setup

1. **Install Node.js**
   ```bash
   # Using Node Version Manager (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   
   # Or download from https://nodejs.org/
   ```

2. **Install MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y mongodb
   
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB service
   sudo systemctl start mongod  # Linux
   brew services start mongodb-community  # macOS
   ```

3. **Verify Installation**
   ```bash
   node --version    # Should show v18.x.x
   npm --version     # Should show 9.x.x or higher
   mongod --version  # Should show MongoDB server version
   ```

### Step 2: Project Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ai-agent
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment Configuration**
   ```bash
   cp .env.example .env
   ```

4. **Edit Environment Variables**
   ```bash
   nano .env  # or use your preferred editor
   ```

   Configure the following variables:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/ai-agent
   
   # Google Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Google Search API
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_CX=your_custom_search_engine_id_here
   
   # MCP Configuration (optional)
   MCP_SERVER_URL=http://localhost:3000
   ```

### Step 3: API Key Configuration

#### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

#### Google Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Custom Search API
4. Create credentials (API Key)
5. Copy the API key

#### Google Custom Search Engine ID

1. Visit [Google Custom Search](https://cse.google.com/cse/)
2. Create a new search engine
3. Configure search settings
4. Copy the Search Engine ID

### Step 4: Database Setup

1. **Start MongoDB**
   ```bash
   # Linux
   sudo systemctl start mongod
   
   # macOS
   brew services start mongodb-community
   
   # Windows
   net start MongoDB
   ```

2. **Verify Database Connection**
   ```bash
   mongo --eval "db.runCommand({connectionStatus: 1})"
   ```

3. **Create Database Indexes** (optional)
   ```bash
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect('mongodb://localhost:27017/ai-agent');
   // Database will be created automatically when first used
   "
   ```

### Step 5: Directory Structure Setup

1. **Create Required Directories**
   ```bash
   mkdir -p public/screenshots
   mkdir -p reports/markdown
   mkdir -p logs
   ```

2. **Set Permissions**
   ```bash
   chmod 755 public/screenshots
   chmod 755 reports/markdown
   chmod 755 logs
   ```

## 🧪 Testing Installation

### Step 1: Start the Server

```bash
npm start
```

You should see output similar to:
```
Server starting on port 3001
MongoDB connected successfully
AI Information Expert Server is running on http://localhost:3001
```

### Step 2: Run Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "data": {
    "status": "operational",
    "timestamp": "2025-01-07T12:00:00.000Z",
    "services": {
      "database": "healthy",
      "gemini": "healthy",
      "search": "healthy"
    }
  }
}
```

### Step 3: Run Test Suite

```bash
node scripts/test-final.js
```

Expected output:
```
🚀 Starting comprehensive functionality test...

1. Health check...
✅ Server health status: operational

2. Starting multi-round search...
✅ Search started, report ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

3. Waiting for search completion...
✅ Search completed successfully

4. Testing HTML generation...
✅ HTML report generated (6000+ characters)

5. Testing Markdown download...
✅ Markdown report downloaded (3000+ characters)

6. Testing screenshot API...
✅ Screenshot API working

7. Testing report listing...
✅ Report listing working (6 reports)

🎉 All tests passed! System is ready for use.
```

## 🔧 Configuration Options

### Server Configuration

```javascript
// src/config/index.js
module.exports = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-agent',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  ai: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7
    }
  },
  search: {
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CX,
      maxResults: 10
    }
  }
};
```

### Search Configuration

```javascript
// Default search options
const defaultOptions = {
  maxRounds: 3,              // Number of search rounds
  maxResultsPerRound: 8,     // Results per round
  includeScreenshots: true,  // Capture screenshots
  generateMarkdown: true,    // Generate Markdown report
  template: 'modern',        // HTML template
  sources: ['google', 'wikipedia']  // Search sources
};
```

### Template Configuration

Available templates:
- `modern`: Clean, gradient-based design
- `classic`: Traditional, formal styling
- `minimal`: Minimalist with lots of whitespace
- `academic`: Academic paper style with citations
- `presentation`: Large fonts and visual elements

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongoNetworkError: failed to connect to server
```

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

#### 2. API Key Errors
```
Error: Gemini API key is invalid
```

**Solution:**
- Verify API key is correct in `.env` file
- Check API key permissions in Google Cloud Console
- Ensure billing is enabled for your Google Cloud project

#### 3. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <process_id>

# Or use a different port
export PORT=3002
npm start
```

#### 4. Permission Denied Errors
```
Error: EACCES: permission denied, mkdir '/path/to/screenshots'
```

**Solution:**
```bash
# Fix directory permissions
sudo chown -R $USER:$USER public/screenshots
chmod 755 public/screenshots
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=ai-agent:* npm start
```

### Log Files

Check application logs:
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## 🔄 Development Workflow

### Development Mode

```bash
# Start with auto-reload
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Production Mode

```bash
# Build for production
npm run build

# Start in production mode
NODE_ENV=production npm start

# Use PM2 for process management
npm install -g pm2
pm2 start src/server/index.js --name ai-agent
```

## 📊 Monitoring

### Health Monitoring

```bash
# Check system health
curl http://localhost:3001/api/health

# Get detailed statistics
curl http://localhost:3001/api/health/stats
```

### Performance Monitoring

```bash
# Monitor memory usage
node --inspect src/server/index.js

# Monitor with PM2
pm2 monit
```

## 🔐 Security Setup

### Environment Security

```bash
# Secure .env file
chmod 600 .env

# Add .env to .gitignore
echo ".env" >> .gitignore
```

### Database Security

```javascript
// Enable MongoDB authentication
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase"]
})
```

### API Security

```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

## 📈 Performance Optimization

### Node.js Optimization

```bash
# Increase memory limit
node --max-old-space-size=4096 src/server/index.js

# Enable production optimizations
NODE_ENV=production npm start
```

### Database Optimization

```javascript
// Create indexes for better performance
db.reports.createIndex({ "createdAt": -1 })
db.reports.createIndex({ "status": 1 })
db.images.createIndex({ "createdAt": -1 })
```

## 🆘 Support

If you encounter issues:

1. **Check the logs**: Look at application and system logs
2. **Verify configuration**: Ensure all environment variables are set correctly
3. **Test components**: Use the provided test scripts to isolate issues
4. **Check dependencies**: Ensure all required services are running
5. **Review documentation**: Check the implementation guide for detailed information

For additional help:
- Create an issue in the GitHub repository
- Check the FAQ section
- Review the troubleshooting guide

---

**Setup complete!** Your AI Agent Backend Enhancement system is now ready for use. 