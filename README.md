# AI Information Display Expert

> **Language**: [English](README.md) | [中文](README_ZH.md)  
> **Setup Guide**: [English](SETUP_GUIDE.md) | [中文](SETUP_GUIDE_ZH.md)

A powerful AI agent system designed for searching, analyzing, and displaying information. The system automatically searches for relevant information from multiple data sources based on user-provided topics, uses AI for intelligent analysis and summarization, and finally generates structured HTML reports.

## 🌟 Core Features

- **Multi-Source Search**: Integrates Google, Wikipedia, and other search engines
- **AI Analysis**: Uses Google Gemini 2.5 Flash for intelligent content analysis and summarization
- **HTML Generation**: Automatically generates beautiful, responsive HTML reports
- **Asynchronous Processing**: Supports large-scale concurrent search and processing tasks
- **History Management**: Complete search and report history records
- **Multiple Templates**: Supports various report display styles

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Search APIs   │    │   Backend       │    │   AI Service    │
│  Google/Wikipedia│◄──►│  Express.js     │◄──►│  Gemini 2.5     │
│  Wikipedia      │    │  MongoDB        │    │  Flash          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   HTML Report   │
                       │   Generator     │
                       └─────────────────┘
```

## 🚀 Quick Start

### System Requirements

- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation Steps

1. **Clone the Project**
```bash
git clone <repository-url>
cd ai-agent
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
# Copy environment variables example file
cp .env.example .env

# Edit environment variables
vim .env
```

Required environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ai-information-expert

# AI Model
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Search APIs (optional, Wikipedia doesn't require API key)
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
# BING_SEARCH_API_KEY=your_bing_api_key (removed)

# Server
PORT=3001
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using system service
sudo systemctl start mongod
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Verify Installation**
```bash
# Run tests
npm run test:api

# Check health status
curl http://localhost:3001/api/health
```

## 📖 API Documentation

### Search Related

#### Create Search Task
```http
POST /api/search
Content-Type: application/json

{
  "topic": "Current status of artificial intelligence development",
  "language": "en",
  "maxResults": 10,
  "sources": ["google", "wikipedia"],
  "includeContent": true
}
```

#### Get Search Results
```http
GET /api/search/{searchId}
```

#### Search History
```http
GET /api/search?page=1&limit=10&status=completed
```

### Report Related

#### Generate HTML Report
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

#### Get HTML Content
```http
GET /api/report/{reportId}/html
```

#### Download Report
```http
GET /api/report/{reportId}/download
```

### Health Check

#### System Status
```http
GET /api/health
```

#### Detailed Statistics
```http
GET /api/health/stats
```

## 🔧 Configuration

### Database Configuration

The system uses MongoDB to store search records and reports:

```javascript
// MongoDB collection structure
searches: {
  searchId: String,      // Unique identifier
  topic: String,         // Search topic
  status: String,        // pending/searching/processing/completed/failed
  searchResults: Array,  // Search results
  processedContent: Object, // AI processed results
  metadata: Object       // Metadata
}

reports: {
  reportId: String,      // Unique identifier
  searchId: String,      // Associated search
  htmlContent: String,   // HTML content
  template: Object,      // Template configuration
  status: String,        // generating/completed/failed
  metadata: Object       // Metadata
}
```

### AI Model Configuration

Supports configuring different AI model parameters:

```javascript
ai: {
  gemini: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192
  }
}
```

### Search Service Configuration

Can configure multiple search sources:

```javascript
search: {
  google: {
    apiKey: 'your_key',
    engineId: 'your_engine_id',
    maxResults: 10
  }
  // Wikipedia requires no configuration
}
```

## 🎨 Template System

The system supports multiple report templates:

### Available Templates

- **modern**: Modern minimalist style with gradient colors and card layouts
- **classic**: Classic traditional style with conventional typography and formal colors
- **minimal**: Minimalist style with minimal decoration and lots of white space
- **academic**: Academic paper style with strict typography and citation formats
- **presentation**: Presentation style with large fonts and prominent visual elements

### Customization Options

- Color schemes: blue, green, red, purple, etc.
- Font sizes: small, medium, large
- Include charts: true/false
- Include images: true/false

## 🔍 Usage Examples

### Basic Search Workflow

```javascript
// 1. Create search
const searchResponse = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Blockchain technology application prospects',
    language: 'en',
    maxResults: 15
  })
});

const { searchId } = await searchResponse.json();

// 2. Poll search status
const checkStatus = async () => {
  const response = await fetch(`/api/search/${searchId}`);
  const data = await response.json();
  
  if (data.status === 'completed') {
    // Search completed, can generate report
    generateReport(searchId);
  } else {
    // Continue waiting
    setTimeout(checkStatus, 3000);
  }
};

// 3. Generate report
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
  
  // Access after report generation is complete
  window.open(`/api/report/${reportId}/html`, '_blank');
};
```

## 🧪 Testing

### Run Tests

```bash
# API functionality tests
npm run test:api

# Unit tests
npm test
```

### Test Coverage

Tests cover the following functionality:

- ✅ Health checks
- ✅ Search creation and status queries
- ✅ AI analysis processing
- ✅ Report generation and HTML output
- ✅ History management
- ✅ Error handling

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t ai-information-expert .

# Run container
docker run -d \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://host:27017/db \
  -e GOOGLE_GEMINI_API_KEY=your_key \
  ai-information-expert
```

### Production Environment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server/index.js --name ai-expert

# Set auto-start on boot
pm2 startup
pm2 save
```

## 📊 Performance Monitoring

### Key Metrics

- Search response time: < 30 seconds
- AI processing time: < 15 seconds
- HTML generation time: < 5 seconds
- System concurrency: 100+ users

### Monitoring Endpoints

```bash
# System health status
GET /api/health

# Detailed statistics
GET /api/health/stats

# Service status
GET /api/health/database
GET /api/health/ai
GET /api/health/search
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check connection string
   echo $MONGODB_URI
   ```

2. **Gemini API Error**
   ```bash
   # Verify API key
   curl -H "x-goog-api-key: $GOOGLE_GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
   ```

3. **Search Service Failed**
   ```bash
   # Test Wikipedia connection
   curl "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=test&format=json"
   ```

4. **Port Conflict**
   ```bash
   # Check port usage
   lsof -i :3001
   
   # Change port
   export PORT=3002
   ```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use ESLint for code checking
- Follow Google JavaScript Style Guide
- Add appropriate comments and documentation
- Ensure tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter issues or need support:

1. Check documentation and FAQ
2. Search existing Issues
3. Create a new Issue
4. Contact the development team

---

**AI Information Display Expert** - Making information search and display intelligent 🚀 