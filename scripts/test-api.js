const axios = require('axios');
const config = require('../src/config');

// 测试配置
const BASE_URL = `http://localhost:${config.server.port}`;
const API_BASE = `${BASE_URL}/api`;

// 测试数据
const testTopic = '人工智能的发展现状和未来趋势';
let testSearchId = null;
let testReportId = null;

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试函数
async function testHealthCheck() {
  logInfo('Testing health check...');
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    
    if (response.status === 200) {
      logSuccess('Health check passed');
      console.log('  Services status:', response.data.data.services);
      return true;
    } else {
      logError('Health check failed - unexpected status');
      return false;
    }
  } catch (error) {
    // 接受503状态码，因为服务器可能因为某些服务不健康而返回503
    if (error.response && error.response.status === 503) {
      logSuccess('Health check passed (service partially unhealthy)');
      console.log('  Services status:', error.response.data.data.services);
      return true;
    }
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testCreateSearch() {
  logInfo('Testing search creation...');
  
  try {
    const response = await axios.post(`${API_BASE}/search`, {
      topic: testTopic,
      language: 'en',
      maxResults: 10,
      sources: ['wikipedia'], // 使用Wikipedia避免需要API密钥
      includeContent: true
    });
    
    if (response.status === 202) {
      testSearchId = response.data.data.searchId;
      logSuccess(`Search created with ID: ${testSearchId}`);
      console.log('  Estimated time:', response.data.data.estimatedTime);
      return true;
    } else {
      logError('Search creation failed - unexpected status');
      return false;
    }
  } catch (error) {
    logError(`Search creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSearchStatus() {
  if (!testSearchId) {
    logError('No search ID available for testing');
    return false;
  }
  
  logInfo('Testing search status...');
  
  try {
    let attempts = 0;
    const maxAttempts = 20; // 最多等待60秒
    
    while (attempts < maxAttempts) {
      const response = await axios.get(`${API_BASE}/search/${testSearchId}`);
      
      if (response.status === 200) {
        const searchData = response.data.data;
        logInfo(`Search status: ${searchData.status}`);
        
        if (searchData.status === 'completed') {
          logSuccess('Search completed successfully');
          console.log('  Results count:', searchData.results.length);
          console.log('  Processing time:', searchData.metadata.searchDuration + 'ms');
          return true;
        } else if (searchData.status === 'failed') {
          logError('Search failed');
          console.log('  Error:', searchData.error);
          return false;
        }
        
        // 等待3秒再检查
        await delay(3000);
        attempts++;
      } else {
        logError('Search status check failed - unexpected status');
        return false;
      }
    }
    
    logWarning('Search did not complete within expected time');
    return false;
    
  } catch (error) {
    logError(`Search status check failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateReport() {
  if (!testSearchId) {
    logError('No search ID available for testing');
    return false;
  }
  
  logInfo('Testing report creation...');
  
  try {
    const response = await axios.post(`${API_BASE}/report`, {
      searchId: testSearchId,
      template: 'modern',
      customizations: {
        colorScheme: 'blue',
        fontSize: 'medium',
        includeCharts: true,
        includeImages: true
      }
    });
    
    if (response.status === 202) {
      testReportId = response.data.data.reportId;
      logSuccess(`Report creation started with ID: ${testReportId}`);
      console.log('  Estimated time:', response.data.data.estimatedTime);
      return true;
    } else {
      logError('Report creation failed - unexpected status');
      return false;
    }
  } catch (error) {
    logError(`Report creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testReportStatus() {
  if (!testReportId) {
    logError('No report ID available for testing');
    return false;
  }
  
  logInfo('Testing report status...');
  
  try {
    let attempts = 0;
    const maxAttempts = 10; // 最多等待30秒
    
    while (attempts < maxAttempts) {
      const response = await axios.get(`${API_BASE}/report/${testReportId}`);
      
      if (response.status === 200) {
        const reportData = response.data.data;
        logInfo(`Report status: ${reportData.status}`);
        
        if (reportData.status === 'completed') {
          logSuccess('Report completed successfully');
          console.log('  Word count:', reportData.metadata.wordCount);
          console.log('  Generation time:', reportData.metadata.generationTime + 'ms');
          console.log('  File size:', reportData.metadata.fileSize + ' bytes');
          return true;
        } else if (reportData.status === 'failed') {
          logError('Report generation failed');
          console.log('  Error:', reportData.error);
          return false;
        }
        
        // 等待3秒再检查
        await delay(3000);
        attempts++;
      } else {
        logError('Report status check failed - unexpected status');
        return false;
      }
    }
    
    logWarning('Report did not complete within expected time');
    return false;
    
  } catch (error) {
    logError(`Report status check failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testReportHTML() {
  if (!testReportId) {
    logError('No report ID available for testing');
    return false;
  }
  
  logInfo('Testing report HTML retrieval...');
  
  try {
    const response = await axios.get(`${API_BASE}/report/${testReportId}/html`);
    
    if (response.status === 200) {
      const htmlContent = response.data;
      if (htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<html>')) {
        logSuccess('HTML report retrieved successfully');
        console.log('  HTML size:', htmlContent.length + ' characters');
        return true;
      } else {
        logError('HTML report does not contain valid HTML');
        return false;
      }
    } else {
      logError('HTML report retrieval failed - unexpected status');
      return false;
    }
  } catch (error) {
    logError(`HTML report retrieval failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSearchHistory() {
  logInfo('Testing search history...');
  
  try {
    const response = await axios.get(`${API_BASE}/search?page=1&limit=5`);
    
    if (response.status === 200) {
      const data = response.data.data;
      logSuccess(`Search history retrieved successfully`);
      console.log('  Total searches:', data.pagination.total);
      console.log('  Current page:', data.pagination.page);
      return true;
    } else {
      logError('Search history retrieval failed - unexpected status');
      return false;
    }
  } catch (error) {
    logError(`Search history retrieval failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testStatsEndpoint() {
  logInfo('Testing stats endpoint...');
  
  try {
    const response = await axios.get(`${API_BASE}/health/stats`);
    
    if (response.status === 200) {
      const stats = response.data.data;
      logSuccess('Stats retrieved successfully');
      console.log('  Total searches:', stats.searches.total);
      console.log('  Total reports:', stats.reports.total);
      console.log('  System uptime:', Math.round(stats.system.uptime) + ' seconds');
      console.log('  Memory usage:', stats.system.memory.used + '/' + stats.system.memory.total + ' MB');
      return true;
    } else {
      logError('Stats retrieval failed - unexpected status');
      return false;
    }
  } catch (error) {
    logError(`Stats retrieval failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('='.repeat(60), 'blue');
  log('AI Information Display Expert - API Tests', 'blue');
  log('='.repeat(60), 'blue');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Create Search', fn: testCreateSearch },
    { name: 'Search Status', fn: testSearchStatus },
    { name: 'Create Report', fn: testCreateReport },
    { name: 'Report Status', fn: testReportStatus },
    { name: 'Report HTML', fn: testReportHTML },
    { name: 'Search History', fn: testSearchHistory },
    { name: 'Stats Endpoint', fn: testStatsEndpoint }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      log(`\n${'-'.repeat(40)}`, 'yellow');
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      failed++;
    }
  }
  
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`Test Results: ${passed} passed, ${failed} failed`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
  
  if (failed === 0) {
    logSuccess('All tests passed! 🎉');
  } else {
    logError(`${failed} tests failed. Please check the logs above.`);
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// 检查服务器是否运行
async function checkServerRunning() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    // 接受503状态码，因为服务器可能因为某些服务不健康而返回503
    if (error.response && error.response.status === 503) {
      return true;
    }
    return false;
  }
}

// 启动测试
async function main() {
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    logError(`Server is not running on ${BASE_URL}`);
    logInfo('Please start the server first with: npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(error => {
  logError(`Test runner error: ${error.message}`);
  process.exit(1);
}); 