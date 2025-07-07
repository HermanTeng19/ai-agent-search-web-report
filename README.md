# AI Agent Backend Enhancement

A comprehensive AI-powered information research and analysis system with multi-round search, automated screenshots, and intelligent report generation.

## 🚀 Features

- **Multi-Round Search**: Intelligent iterative search across multiple sources (Google, Wikipedia)
- **Automated Screenshots**: Capture webpage screenshots with MCP protocol integration
- **AI Analysis**: Google Gemini-powered content analysis and synthesis
- **Document Generation**: Structured Markdown and HTML report generation
- **Hybrid Storage**: File system + MongoDB for optimal performance
- **RESTful API**: Complete API system with async processing

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Service**: Google Gemini API
- **Screenshot**: MCP (Model Context Protocol)
- **Storage**: File system + Database hybrid approach

## 📋 Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Google Gemini API Key
- MCP Server (for screenshots)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Run tests**
   ```bash
   node scripts/test-final.js
   ```

## 🌐 API Endpoints

### Multi-Round Search
- `POST /api/iterative-search` - Start a new search
- `GET /api/iterative-search/:reportId/status` - Check search status
- `GET /api/iterative-search/:reportId/result` - Get search results
- `GET /api/iterative-search/:reportId/markdown` - Download Markdown report
- `GET /api/iterative-search/reports` - List all reports

### Screenshot Management
- `GET /screenshots/:year/:month/:filename` - Access screenshot files
- `GET /api/screenshots` - List screenshots
- `GET /api/screenshots/stats` - Get storage statistics
- `DELETE /api/screenshots/:imageId` - Delete screenshot

### Health Check
- `GET /api/health` - Service health status

## 📝 Usage Example

### Starting a Search

```bash
curl -X POST http://localhost:3001/api/iterative-search \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Artificial Intelligence Development",
    "options": {
      "maxRounds": 3,
      "maxResultsPerRound": 8,
      "includeScreenshots": true,
      "generateMarkdown": true,
      "template": "modern"
    }
  }'
```

### Checking Status

```bash
curl http://localhost:3001/api/iterative-search/{reportId}/status
```

### Getting Results

```bash
# HTML format
curl http://localhost:3001/api/iterative-search/{reportId}/result?format=html

# JSON format
curl http://localhost:3001/api/iterative-search/{reportId}/result?format=json

# Download Markdown
curl http://localhost:3001/api/iterative-search/{reportId}/markdown
```

## 📊 Project Structure

```
ai-agent/
├── src/
│   ├── server/
│   │   ├── index.js                 # Main server
│   │   └── routes/                  # API routes
│   ├── services/
│   │   ├── search/                  # Search services
│   │   ├── ai/                      # AI services
│   │   ├── screenshot/              # Screenshot services
│   │   ├── storage/                 # Storage services
│   │   └── document/                # Document services
│   ├── database/
│   │   └── models/                  # Data models
│   └── utils/                       # Utility functions
├── public/
│   └── screenshots/                 # Screenshot storage
├── scripts/                         # Test scripts
└── reports/                         # Generated reports
```

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-agent

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Search API
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_custom_search_engine_id

# MCP Configuration
MCP_SERVER_URL=http://localhost:3000
```

### Template Options

- `modern` - Clean, gradient-based design
- `classic` - Traditional, formal styling
- `minimal` - Minimalist with lots of whitespace
- `academic` - Academic paper style with citations
- `presentation` - Large fonts and visual elements

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Test all functionality
node scripts/test-final.js

# Test specific components
node scripts/test-gemini.js
node scripts/test-search-service.js
```

## 📈 Performance

- **Search Completion**: 60-120 seconds for 3-round search
- **Concurrency**: 5 concurrent search requests, 3 screenshot batches
- **Storage**: Automatic file cleanup and compression
- **Caching**: 1-day cache for static files

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Gemini API Errors**
   - Verify API key is valid
   - Check rate limits

3. **Screenshot Failures**
   - Some websites block automated screenshots
   - System gracefully degrades without affecting search

### Logs

Check application logs for detailed error information:
```bash
tail -f logs/app.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the test scripts for usage examples

---

**Built with ❤️ using Node.js and AI** 