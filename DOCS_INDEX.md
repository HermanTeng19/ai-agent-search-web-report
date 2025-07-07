# Documentation Index

Welcome to the AI Agent Backend Enhancement documentation! This index will help you find the information you need.

## 📚 Main Documentation

### 🇺🇸 English Documentation (Default)
- **[README.md](README.md)** - Main project overview and quick start guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed installation and setup instructions
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current project status and implementation details
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Technical architecture and deployment guide

### 🇨🇳 中文文档
- **[README_ZH.md](README_ZH.md)** - 项目概述和快速开始指南
- **[SETUP_GUIDE_ZH.md](SETUP_GUIDE_ZH.md)** - 详细安装和设置说明

## 🚀 Getting Started

### New Users
1. Start with **[README.md](README.md)** for project overview
2. Follow **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for installation
3. Check **[PROJECT_STATUS.md](PROJECT_STATUS.md)** for current features

### Developers
1. Read **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** for technical details
2. Review **[ITERATIVE_SEARCH_IMPLEMENTATION.md](ITERATIVE_SEARCH_IMPLEMENTATION.md)** for search implementation
3. Check **[scripts/](scripts/)** directory for test examples

## 📖 Documentation Structure

```
├── README.md                           # Main project documentation
├── SETUP_GUIDE.md                     # Installation guide
├── PROJECT_STATUS.md                  # Project status report
├── IMPLEMENTATION_GUIDE.md            # Technical implementation guide
├── ITERATIVE_SEARCH_IMPLEMENTATION.md # Search feature documentation
├── README_ZH.md                       # Chinese project documentation
├── SETUP_GUIDE_ZH.md                  # Chinese installation guide
└── DOCS_INDEX.md                      # This file
```

## 🔧 Quick Reference

### API Endpoints
- Health Check: `GET /api/health`
- Start Search: `POST /api/iterative-search`
- Check Status: `GET /api/iterative-search/:reportId/status`
- Get Results: `GET /api/iterative-search/:reportId/result`

### Configuration
- Environment file: `.env`
- Main config: `src/config/index.js`
- MongoDB models: `src/database/models/`

### Testing
- Full test suite: `node scripts/test-final.js`
- Gemini test: `node scripts/test-gemini.js`
- Search test: `node scripts/test-search-service.js`

## 🆘 Need Help?

1. **Installation Issues**: Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
2. **API Usage**: Review [README.md](README.md) usage examples
3. **Technical Details**: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
4. **Feature Status**: Check [PROJECT_STATUS.md](PROJECT_STATUS.md)

## 📝 Language Support

- **English**: Primary documentation language
- **中文**: 中文文档可用，但英文文档更完整和最新

---

**Choose your language and start exploring!** 🚀 