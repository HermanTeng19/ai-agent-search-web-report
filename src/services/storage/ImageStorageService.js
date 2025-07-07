const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const logger = require('../../utils/logger');

class ImageStorageService {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'screenshots');
    this.thumbnailSuffix = '_thumb';
    this.allowedFormats = ['png', 'jpg', 'jpeg', 'webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.thumbnailSize = { width: 300, height: 200 };
  }

  /**
   * 保存截图文件并生成缩略图
   * @param {Buffer} imageBuffer - 图片二进制数据
   * @param {string} filename - 文件名（不含扩展名）
   * @param {Object} metadata - 图片元数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveScreenshot(imageBuffer, filename, metadata = {}) {
    try {
      // 验证图片大小
      if (imageBuffer.length > this.maxFileSize) {
        throw new Error(`Image size exceeds limit: ${imageBuffer.length} bytes`);
      }

      // 生成文件路径
      const timestamp = new Date();
      const yearMonth = this.getYearMonthPath(timestamp);
      const fullPath = path.join(this.baseDir, yearMonth);
      
      // 确保目录存在
      await fs.mkdir(fullPath, { recursive: true });

      // 生成文件名
      const finalFilename = `${filename}-${this.generateTimestamp()}.png`;
      const thumbnailFilename = `${filename}${this.thumbnailSuffix}-${this.generateTimestamp()}.png`;
      
      const fullImagePath = path.join(fullPath, finalFilename);
      const thumbnailPath = path.join(fullPath, thumbnailFilename);

      // 使用sharp处理图片
      const sharpInstance = sharp(imageBuffer);
      const imageMetadata = await sharpInstance.metadata();

      // 保存原图
      await sharpInstance
        .png({ quality: 90 })
        .toFile(fullImagePath);

      // 生成缩略图
      await sharpInstance
        .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 80 })
        .toFile(thumbnailPath);

      // 计算文件大小
      const stats = await fs.stat(fullImagePath);
      const thumbnailStats = await fs.stat(thumbnailPath);

      // 构建返回结果
      const result = {
        filename: finalFilename,
        thumbnailFilename: thumbnailFilename,
        path: path.join(yearMonth, finalFilename),
        thumbnailPath: path.join(yearMonth, thumbnailFilename),
        publicUrl: `/screenshots/${yearMonth}/${finalFilename}`,
        thumbnailUrl: `/screenshots/${yearMonth}/${thumbnailFilename}`,
        size: stats.size,
        thumbnailSize: thumbnailStats.size,
        dimensions: {
          width: imageMetadata.width,
          height: imageMetadata.height
        },
        format: imageMetadata.format,
        createdAt: timestamp,
        metadata: {
          ...metadata,
          originalSize: imageBuffer.length,
          compression: ((imageBuffer.length - stats.size) / imageBuffer.length * 100).toFixed(2)
        }
      };

      logger.info(`Screenshot saved successfully: ${result.publicUrl}`);
      return result;

    } catch (error) {
      logger.error('Failed to save screenshot:', error);
      throw new Error(`Image storage failed: ${error.message}`);
    }
  }

  /**
   * 获取图片信息
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Object>} 图片信息
   */
  async getImageInfo(imagePath) {
    try {
      const fullPath = path.join(this.baseDir, imagePath);
      const stats = await fs.stat(fullPath);
      const sharpInstance = sharp(fullPath);
      const metadata = await sharpInstance.metadata();

      return {
        path: imagePath,
        size: stats.size,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        format: metadata.format,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };

    } catch (error) {
      logger.error(`Failed to get image info for ${imagePath}:`, error);
      throw new Error(`Image info retrieval failed: ${error.message}`);
    }
  }

  /**
   * 删除图片文件
   * @param {string} imagePath - 图片路径
   * @param {string} thumbnailPath - 缩略图路径
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteImage(imagePath, thumbnailPath = null) {
    try {
      const fullPath = path.join(this.baseDir, imagePath);
      await fs.unlink(fullPath);
      
      if (thumbnailPath) {
        const fullThumbnailPath = path.join(this.baseDir, thumbnailPath);
        try {
          await fs.unlink(fullThumbnailPath);
        } catch (error) {
          logger.warn(`Failed to delete thumbnail: ${thumbnailPath}`, error);
        }
      }

      logger.info(`Image deleted successfully: ${imagePath}`);
      return true;

    } catch (error) {
      logger.error(`Failed to delete image ${imagePath}:`, error);
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * 清理过期图片
   * @param {number} daysOld - 删除多少天前的图片
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupOldImages(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedFiles = [];
      const errors = [];

      // 遍历年月目录
      const yearDirs = await fs.readdir(this.baseDir);
      
      for (const yearDir of yearDirs) {
        if (yearDir.startsWith('.')) continue;
        
        const yearPath = path.join(this.baseDir, yearDir);
        const monthDirs = await fs.readdir(yearPath);
        
        for (const monthDir of monthDirs) {
          if (monthDir.startsWith('.')) continue;
          
          const monthPath = path.join(yearPath, monthDir);
          const files = await fs.readdir(monthPath);
          
          for (const file of files) {
            const filePath = path.join(monthPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.birthtime < cutoffDate) {
              try {
                await fs.unlink(filePath);
                deletedFiles.push(path.join(yearDir, monthDir, file));
              } catch (error) {
                errors.push({ file: path.join(yearDir, monthDir, file), error: error.message });
              }
            }
          }
        }
      }

      logger.info(`Cleanup completed: ${deletedFiles.length} files deleted, ${errors.length} errors`);
      
      return {
        deletedCount: deletedFiles.length,
        deletedFiles,
        errors,
        cutoffDate
      };

    } catch (error) {
      logger.error('Failed to cleanup old images:', error);
      throw new Error(`Image cleanup failed: ${error.message}`);
    }
  }

  /**
   * 获取存储统计信息
   * @returns {Promise<Object>} 存储统计
   */
  async getStorageStats() {
    try {
      let totalSize = 0;
      let totalFiles = 0;
      const stats = { byMonth: {}, total: {} };

      // 遍历所有文件
      const yearDirs = await fs.readdir(this.baseDir);
      
      for (const yearDir of yearDirs) {
        if (yearDir.startsWith('.')) continue;
        
        const yearPath = path.join(this.baseDir, yearDir);
        const monthDirs = await fs.readdir(yearPath);
        
        for (const monthDir of monthDirs) {
          if (monthDir.startsWith('.')) continue;
          
          const monthPath = path.join(yearPath, monthDir);
          const files = await fs.readdir(monthPath);
          
          let monthSize = 0;
          let monthFiles = 0;
          
          for (const file of files) {
            const filePath = path.join(monthPath, file);
            const fileStats = await fs.stat(filePath);
            monthSize += fileStats.size;
            monthFiles++;
          }
          
          const monthKey = `${yearDir}-${monthDir}`;
          stats.byMonth[monthKey] = {
            size: monthSize,
            files: monthFiles,
            sizeFormatted: this.formatBytes(monthSize)
          };
          
          totalSize += monthSize;
          totalFiles += monthFiles;
        }
      }

      stats.total = {
        size: totalSize,
        files: totalFiles,
        sizeFormatted: this.formatBytes(totalSize)
      };

      return stats;

    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw new Error(`Storage stats retrieval failed: ${error.message}`);
    }
  }

  /**
   * 生成年月路径
   * @param {Date} date - 日期
   * @returns {string} 年月路径
   */
  getYearMonthPath(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}/${month}`;
  }

  /**
   * 生成时间戳
   * @returns {string} 时间戳字符串
   */
  generateTimestamp() {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '')
      .replace('T', '-')
      .substring(0, 15);
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 验证图片格式
   * @param {Buffer} imageBuffer - 图片数据
   * @returns {Promise<boolean>} 验证结果
   */
  async validateImageFormat(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return this.allowedFormats.includes(metadata.format);
    } catch (error) {
      return false;
    }
  }
}

module.exports = ImageStorageService; 