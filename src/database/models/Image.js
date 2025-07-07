const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  // 基本信息
  filename: {
    type: String,
    required: true,
    index: true
  },
  thumbnailFilename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: false
  },
  
  // 文件路径
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String,
    required: true
  },
  publicUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  
  // 文件属性
  size: {
    type: Number,
    required: true
  },
  thumbnailSize: {
    type: Number,
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  format: {
    type: String,
    required: true,
    enum: ['png', 'jpg', 'jpeg', 'webp']
  },
  
  // 来源信息
  sourceUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Source URL must be a valid HTTP/HTTPS URL'
    }
  },
  sourceTitle: {
    type: String,
    required: false
  },
  sourceDomain: {
    type: String,
    required: false
  },
  
  // 截图参数
  screenshotOptions: {
    viewport: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 }
    },
    fullPage: { type: Boolean, default: true },
    quality: { type: Number, default: 90 },
    waitTime: { type: Number, default: 3000 }
  },
  
  // 元数据
  metadata: {
    originalSize: Number,
    compression: String,
    userAgent: String,
    captureTime: Date,
    processingTime: Number,
    retryCount: { type: Number, default: 0 },
    tags: [String],
    description: String
  },
  
  // 关联信息
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: false,
    index: true
  },
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Search',
    required: false,
    index: true
  },
  
  // 状态信息
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String,
    required: false
  },
  
  // 访问统计
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    required: false
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'images'
});

// 索引设置
imageSchema.index({ sourceUrl: 1, createdAt: -1 });
imageSchema.index({ reportId: 1, createdAt: -1 });
imageSchema.index({ status: 1, createdAt: -1 });
imageSchema.index({ 'metadata.tags': 1 });

// 虚拟字段
imageSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

imageSchema.virtual('thumbnailSizeFormatted').get(function() {
  const bytes = this.thumbnailSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// 实例方法
imageSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

imageSchema.methods.updateStatus = function(status, errorMessage = null) {
  this.status = status;
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  this.updatedAt = new Date();
  return this.save();
};

imageSchema.methods.addTag = function(tag) {
  if (!this.metadata.tags) {
    this.metadata.tags = [];
  }
  if (!this.metadata.tags.includes(tag)) {
    this.metadata.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

imageSchema.methods.removeTag = function(tag) {
  if (this.metadata.tags) {
    this.metadata.tags = this.metadata.tags.filter(t => t !== tag);
    return this.save();
  }
  return Promise.resolve(this);
};

// 静态方法
imageSchema.statics.findBySourceUrl = function(sourceUrl) {
  return this.find({ sourceUrl }).sort({ createdAt: -1 });
};

imageSchema.statics.findByReport = function(reportId) {
  return this.find({ reportId }).sort({ createdAt: -1 });
};

imageSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

imageSchema.statics.findByTag = function(tag) {
  return this.find({ 'metadata.tags': tag }).sort({ createdAt: -1 });
};

imageSchema.statics.getStorageStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalImages: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalThumbnailSize: { $sum: '$thumbnailSize' },
        avgSize: { $avg: '$size' },
        maxSize: { $max: '$size' },
        minSize: { $min: '$size' }
      }
    }
  ]);
  
  return stats[0] || {
    totalImages: 0,
    totalSize: 0,
    totalThumbnailSize: 0,
    avgSize: 0,
    maxSize: 0,
    minSize: 0
  };
};

imageSchema.statics.getStatusStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });
  
  return result;
};

imageSchema.statics.cleanupOldImages = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $ne: 'processing' }
  });
  
  return result;
};

// 中间件
imageSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

imageSchema.pre('remove', function(next) {
  // 在删除数据库记录前，可以添加清理文件的逻辑
  // 这里可以调用ImageStorageService来删除实际文件
  next();
});

// 导出模型
module.exports = mongoose.model('Image', imageSchema); 