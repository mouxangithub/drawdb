/**
 * 数据库模型索引文件
 * 负责初始化Sequelize并导入所有模型
 */
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import databaseConfig from '../config/database.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取当前环境
const env = process.env.NODE_ENV || 'development';
const dbConfig = databaseConfig[env];

// 创建数据库目录
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)){
  fs.mkdirSync(dbDir, { recursive: true });
}

// 初始化Sequelize
const sequelize = new Sequelize(dbConfig);

// 导入模型
import DiagramModel from './diagram.js';
import TemplateModel from './template.js';
import ShareModel from './share.js';

const Diagram = DiagramModel(sequelize);
const Template = TemplateModel(sequelize);
const Share = ShareModel(sequelize);

// 模型关联
// 图表与分享内容的关联
Diagram.hasMany(Share, { foreignKey: 'diagramId' });
Share.belongsTo(Diagram, { foreignKey: 'diagramId' });

// 导出模型和sequelize实例
export {
  sequelize,
  Diagram,
  Template,
  Share,
}; 