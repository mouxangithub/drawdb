/**
 * 数据库服务
 * 由原来的IndexedDB转为使用API服务访问后端SQLite数据库
 */
import { diagramApi } from '../services/api';

// 创建一个类似于Dexie API的接口
// 这样可以最小化原有代码的修改
export const db = {
  // 图表操作
  diagrams: {
    // 获取所有图表
    toArray: async () => {
      return await diagramApi.getAll();
    },
    
    // 获取最新图表
    orderBy: () => ({
      last: async () => {
        try {
          return await diagramApi.getLatest();
        } catch (error) {
          // 如果没有图表，返回null
          if (error.response && error.response.status === 404) {
            return null;
          }
          throw error;
        }
      }
    }),
    
    // 获取单个图表
    get: async (id) => {
      try {
        return await diagramApi.getById(id);
      } catch (error) {
        // 如果图表不存在，返回undefined
        if (error.response && error.response.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
    
    // 添加图表
    add: async (data) => {
      const createdDiagram = await diagramApi.create(data);
      return createdDiagram.id;
    },
    
    // 更新图表
    update: async (id, data) => {
      await diagramApi.update(id, data);
      return true;
    },
    
    // 删除图表
    delete: async (id) => {
      await diagramApi.delete(id);
      return true;
    }
  },
  
  // 模拟原有的on事件，在前端环境中不再需要
  on: (event) => {
    console.log(`数据库事件 '${event}' 不再被前端处理，将由后端负责初始化数据。`);
    return null;
  }
};
