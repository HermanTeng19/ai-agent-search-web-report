const mongoose = require('mongoose');

// 搜索结果子文档Schema
const searchResultSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['google', 'wikipedia', 'other']
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  snippet: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  relevanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// 主搜索Schema
const searchSchema = new mongoose.Schema({
  searchId: {
    type: String,
    required: true,
    unique: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  language: {
    type: String,
    default: 'zh',
    enum: ['zh', 'en', 'auto']
  },
  maxResults: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  status: {
    type: String,
    enum: ['pending', 'searching', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  searchResults: [searchResultSchema],
  processedContent: {
    summary: {
      type: String,
      default: ''
    },
    keyPoints: [{
      type: String
    }],
    categories: [{
      name: String,
      points: [String]
    }],
    sources: [{
      title: String,
      url: String,
      reliability: Number
    }],
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },
  metadata: {
    searchDuration: {
      type: Number,
      default: 0
    },
    processingDuration: {
      type: Number,
      default: 0
    },
    totalResults: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash'
    }
  },
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
searchSchema.index({ searchId: 1 });
searchSchema.index({ topic: 'text' });
searchSchema.index({ status: 1 });
searchSchema.index({ createdAt: -1 });

// 虚拟字段
searchSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

searchSchema.virtual('hasError').get(function() {
  return this.status === 'failed' && this.error;
});

// 实例方法
searchSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

searchSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// 静态方法
searchSchema.statics.findBySearchId = function(searchId) {
  return this.findOne({ searchId });
};

searchSchema.statics.findRecentSearches = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Search', searchSchema); 