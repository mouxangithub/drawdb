/**
 * 数据种子控制器
 * 实现原IndexedDB中的数据初始化功能
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Template } from '../models/index.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 导入模板种子数据
 * 类似原IndexedDB的populate功能
 */
const importTemplateSeeds = async () => {
  try {
    // 检查是否已有模板数据
    const count = await Template.count();
    
    // 如果已有数据，则不再导入
    if (count > 0) {
      console.log('模板种子数据已存在，跳过导入');
      return;
    }
    
    // 读取前端项目中的模板数据
    // 注意：实际部署时，需要将前端的模板数据复制到后端项目中
    
    // 从目录读取所有模板文件
    console.log('开始导入模板种子数据...');
    
    // 这里仅作为示例，实际项目中需要替换为实际的模板数据导入逻辑
    const templateSeeds = [
      {
        title: "Template 1",
        database: "GENERIC",
        custom: false,
        tables: [],
        relationships: []
      },
      {
        title: "Template 2",
        database: "GENERIC", 
        custom: false,
        tables: [],
        relationships: []
      }
    ];
    
    // 批量创建模板
    await Template.bulkCreate(templateSeeds);
    console.log('模板种子数据导入成功');
  } catch (error) {
    console.error('导入模板种子数据失败:', error);
  }
};

export { importTemplateSeeds }; 