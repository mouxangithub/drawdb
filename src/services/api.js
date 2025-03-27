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
   * 获取所有图表
   */
  getAll: async () => {
    try {
      const response = await api.get('/diagrams');
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
      const response = await api.get('/diagrams/latest');
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
      const response = await api.get(`/diagrams/${id}`);
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
}; 