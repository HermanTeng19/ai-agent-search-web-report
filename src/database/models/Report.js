const mongoose = require('mongoose');

// 报告Schema
const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  searchId: {
    type: String,
    required: true,
    ref: 'Search'
  },
  title: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: false
  },
  template: {
    name: {
      type: String,
      required: true,
      enum: ['modern', 'classic', 'minimal', 'academic', 'presentation']
    },
    version: {
      type: String,
      default: '1.0'
    },
    customizations: {
      colorScheme: {
        type: String,
        default: 'blue'
      },
      fontSize: {
        type: String,
        default: 'medium'
      },
      includeCharts: {
        type: Boolean,
        default: true
      },
      includeImages: {
        type: Boolean,
        default: true
      }
    }
  },
  sections: [{
    type: {
      type: String,
      required: true,
      enum: ['summary', 'keyPoints', 'details', 'sources', 'charts', 'images']
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    estimatedReadingTime: {
      type: Number,
      default: 0
    },
    generationTime: {
      type: Number,
      default: 0
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
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
reportSchema.index({ reportId: 1 });
reportSchema.index({ searchId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

// 虚拟字段
reportSchema.virtual('isReady').get(function() {
  return this.status === 'completed';
});

reportSchema.virtual('sizeInKB').get(function() {
  return Math.round(this.metadata.fileSize / 1024);
});

// 实例方法
reportSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

reportSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

reportSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

reportSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// 静态方法
reportSchema.statics.findByReportId = function(reportId) {
  return this.findOne({ reportId });
};

reportSchema.statics.findBySearchId = function(searchId) {
  return this.find({ searchId }).sort({ createdAt: -1 });
};

reportSchema.statics.getPopularReports = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ views: -1, downloads: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Report', reportSchema); 