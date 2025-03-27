/**
 * Swagger 文档配置文件
 * 定义 API 文档的基本信息和路径
 */
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger 定义
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DrawDB API 文档',
      version: '1.0.0',
      description: 'DrawDB 后端 API 接口文档',
      contact: {
        name: 'DrawDB 团队'
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: '默认 API 路径',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // 路径匹配所有的路由文件和控制器
  apis: [
    path.resolve(__dirname, './routes/*.js'),
    path.resolve(__dirname, './controllers/*.js'),
    path.resolve(__dirname, './models/*.js'),
  ],
};

// 初始化 swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 