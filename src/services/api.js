/**
 * API服务
 * 替代原来的IndexedDB操作，改为通过API请求访问后端SQLite数据库
 */
import axios from 'axios';

// 设置API基础URL
// 直接从当前页面的域名和端口获取，确保在任何环境中都能正确连接API
const API_BASE_URL = window.location.origin + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，在每个请求中添加时间戳参数，确保不使用缓存
api.interceptors.request.use(config => {
  // 将时间戳添加到URL查询参数中
  const timestamp = new Date().getTime();
  config.params = config.params || {};
  config.params._t = timestamp;
  
  // 添加禁用缓存的头信息
  config.headers = {
    ...config.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  return config;
});

/**
 * 服务器状态API
 */
export const serverApi = {
  /**
   * 检查服务器状态
   * 返回服务器是否在线及其基本信息
   */
  checkStatus: async () => {
    try {
      // 使用当前页面的域名和端口
      const baseUrl = window.location.origin;
        
      const response = await axios.get(`${baseUrl}/`);
      return {
        status: 'online',
        message: response.data.message,
        version: response.data.version
      };
    } catch (error) {
      console.error('服务器连接失败:', error);
      return {
        status: 'offline',
        message: '无法连接到服务器',
        error: error.message
      };
    }
  }
};

/**
 * 图表API
 */
export const diagramApi = {
  /**
   * 获取图表列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，默认1
   * @param {number} params.pageSize - 每页记录数，默认10
   * @param {string} params.name - 按名称筛选
   * @param {string|string[]} params.database - 按数据库类型筛选，可以是字符串或字符串数组
   * @param {Date|string} params.createdAtStart - 创建时间开始
   * @param {Date|string} params.createdAtEnd - 创建时间结束
   * @param {Date|string} params.updatedAtStart - 更新时间开始
   * @param {Date|string} params.updatedAtEnd - 更新时间结束
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.sortOrder - 排序方向，ASC或DESC
   * @returns {Promise<Object>} 图表列表和分页信息
   */
  getAll: async (params = {}) => {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      
      // 添加分页参数
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      // 添加筛选参数
      if (params.name) queryParams.append('name', params.name);
      if (params.database) {
        // 支持数据库类型为字符串或数组
        if (Array.isArray(params.database)) {
          if (params.database.length > 0) {
            queryParams.append('database', params.database.join(','));
          }
        } else {
          queryParams.append('database', params.database);
        }
      }
      
      // 添加日期筛选参数
      if (params.createdAtStart) {
        queryParams.append('createdAtStart', typeof params.createdAtStart === 'object' 
          ? params.createdAtStart.toISOString() 
          : params.createdAtStart);
      }
      
      if (params.createdAtEnd) {
        queryParams.append('createdAtEnd', typeof params.createdAtEnd === 'object' 
          ? params.createdAtEnd.toISOString() 
          : params.createdAtEnd);
      }
      
      if (params.updatedAtStart) {
        queryParams.append('updatedAtStart', typeof params.updatedAtStart === 'object' 
          ? params.updatedAtStart.toISOString() 
          : params.updatedAtStart);
      }
      
      if (params.updatedAtEnd) {
        queryParams.append('updatedAtEnd', typeof params.updatedAtEnd === 'object' 
          ? params.updatedAtEnd.toISOString() 
          : params.updatedAtEnd);
      }
      
      // 添加排序参数
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      // 添加随机数，确保每次请求都不相同
      const noCacheParam = Math.random().toString(36).substring(2, 15);
      queryParams.append('nocache', noCacheParam);
      
      const response = await api.get(`/diagrams?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('获取图表列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取最新图表
   */
  getLatest: async () => {
    try {
      // 添加随机数，确保每次请求都不相同
      const noCacheParam = Math.random().toString(36).substring(2, 15);
      const response = await api.get(`/diagrams/latest?nocache=${noCacheParam}`);
      return response.data;
    } catch (error) {
      console.error('获取最新图表失败:', error);
      throw error;
    }
  },

  /**
   * 获取单个图表
   * @param {number} id - 图表ID
   */
  getById: async (id) => {
    try {
      // 添加随机数，确保每次请求都不相同
      const noCacheParam = Math.random().toString(36).substring(2, 15);
      const response = await api.get(`/diagrams/${id}?nocache=${noCacheParam}`);
      return response.data;
    } catch (error) {
      console.error(`获取图表 ${id} 失败:`, error);
      throw error;
    }
  },

  /**
   * 创建图表
   * @param {Object} data - 图表数据
   */
  create: async (data) => {
    try {
      const response = await api.post('/diagrams', data);
      return response.data;
    } catch (error) {
      console.error('创建图表失败:', error);
      throw error;
    }
  },

  /**
   * 更新图表
   * @param {number} id - 图表ID
   * @param {Object} data - 图表数据
   */
  update: async (id, data) => {
    try {
      const response = await api.put(`/diagrams/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`更新图表 ${id} 失败:`, error);
      throw error;
    }
  },

  /**
   * 删除图表
   * @param {number} id - 图表ID
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/diagrams/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除图表 ${id} 失败:`, error);
      throw error;
    }
  },

  /**
   * 获取所有可用的数据库类型
   * @returns {Promise<string[]>} 数据库类型列表
   */
  getDatabaseTypes: async () => {
    try {
      const noCacheParam = Math.random().toString(36).substring(2, 15);
      const response = await api.get(`/diagrams/database-types?nocache=${noCacheParam}`);
      return response.data;
    } catch (error) {
      console.error('获取数据库类型列表失败:', error);
      return []; // 出错时返回空列表
    }
  },
}; 