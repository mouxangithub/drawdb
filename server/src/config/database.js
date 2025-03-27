/**
 * 数据库配置文件
 * 配置SQLite连接参数
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database/drawdb.sqlite'),
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../database/drawdb.sqlite'),
    logging: false,
  },
}; 