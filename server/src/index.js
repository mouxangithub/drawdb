/**
 * DrawDB 服务器入口文件
 * 负责启动Express服务器和配置中间件
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { URL, fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import http from 'http'; // 添加http模块
import { initWebSocketServer } from './services/websocketService.js'; // 导入WebSocket服务
import os from 'os'; // 导入os模块用于获取网络接口

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入路由
import diagramRoutes from './routes/diagrams.js';

// 导入数据库连接
import { sequelize } from './models/index.js';

// 加载环境变量（从项目根目录）
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const apiBasePath = '/api';

// 创建HTTP服务器
const server = http.createServer(app);

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 缓存预检请求结果24小时
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API文档路由
app.use(`${apiBasePath}/docs`, (req, res, next) => {
  // 添加禁用缓存的头部
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 添加详细日志
  console.log(`[Swagger UI] 请求: ${req.method} ${req.url}`);

  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "DrawDB API 文档"
}));

// 提供 swagger.json
app.get(`${apiBasePath}/swagger.json`, (req, res) => {
  // 添加禁用缓存的头部
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 专门处理 swagger-ui-init.js 的路由
app.get(`${apiBasePath}/docs/swagger-ui-init.js`, (req, res, next) => {
  console.log('收到 swagger-ui-init.js 请求');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// API路由
// 添加API无缓存中间件
app.use(`${apiBasePath}`, (req, res, next) => {
  // 为所有API请求禁用缓存
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // 继续处理请求
  next();
});

app.use(`${apiBasePath}/diagrams`, diagramRoutes);

// 获取静态文件路径
function getStaticFilesPath() {
  console.log('尝试确定静态文件路径...');
  
  // 检查环境变量中配置的静态文件目录
  if (process.env.STATIC_FILES_DIR) {
    const envPath = path.resolve(process.env.STATIC_FILES_DIR);
    console.log(`检查环境变量指定的路径: ${envPath}`);
    if (fs.existsSync(envPath)) {
      console.log(`使用环境变量指定的静态文件路径: ${envPath}`);
      return envPath;
    }
  }

  // 优先检查Docker构建中使用的server/public目录
  const publicPath = path.resolve(__dirname, '../public');
  console.log(`检查Docker构建路径: ${publicPath}`);
  if (fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'))) {
    console.log(`使用Docker构建的静态文件路径: ${publicPath}`);
    return publicPath;
  }

  // 检查其他可能的路径
  const possiblePaths = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(__dirname, '../public'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../../dist'),
    path.resolve(__dirname, '../../dist')
  ];

  console.log('检查其他可能的静态文件路径:');
  for (const p of possiblePaths) {
    console.log(`- 检查路径: ${p}`);
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
      console.log(`找到可用的静态文件路径: ${p}`);
      return p;
    }
  }
  
  console.log('警告: 未找到有效的静态文件路径，使用默认路径');
  return path.resolve(process.cwd(), 'dist');
}

const staticFilesPath = getStaticFilesPath();

// 针对不同类型的静态资源设置不同的缓存策略
const serveStaticWithCache = (directory, options = {}) => {
  return express.static(directory, {
    etag: true,
    lastModified: true,
    maxAge: '1d', // 默认缓存1天
    ...options
  });
};

// 设置不同类型资源的缓存策略
const cacheSettings = {
  // HTML文件不缓存
  html: {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
  // JS和CSS文件缓存1个月
  assets: {
    maxAge: '30d',
    immutable: true
  },
  // 图像和字体文件缓存1年
  media: {
    maxAge: '365d',
    immutable: true
  }
};

// 应用静态文件服务中间件
app.use(serveStaticWithCache(staticFilesPath, cacheSettings.html));

// 具体资源类型的中间件
app.use('*.js', serveStaticWithCache(staticFilesPath, cacheSettings.assets));
app.use('*.css', serveStaticWithCache(staticFilesPath, cacheSettings.assets));
app.use('*.png', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.jpg', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.jpeg', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.svg', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.webp', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.woff', serveStaticWithCache(staticFilesPath, cacheSettings.media));
app.use('*.woff2', serveStaticWithCache(staticFilesPath, cacheSettings.media));

// 服务根路由
app.get('/api', (req, res) => {
  res.json({
    message: 'DrawDB API 服务已启动',
    version: '1.0.0'
  });
});

// 通配符路由处理，对于所有非API路由的请求返回前端应用
app.get('*', (req, res, next) => {
  // 如果是API请求，跳过处理
  if (req.originalUrl.startsWith(apiBasePath)) {
    console.log(`[API请求] 跳过前端处理: ${req.originalUrl}`);
    return next();
  }

  console.log(`[前端请求] 请求路径: ${req.originalUrl}`);

  // 尝试提供入口文件
  const indexPath = path.join(staticFilesPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    console.log(`[前端请求] 返回主入口文件: ${indexPath}`);
    return res.sendFile(indexPath);
  }

  // 如果主入口文件不存在，尝试其他可能的路径
  const alternativePaths = [
    path.join(__dirname, '../../public/index.html'),
    path.join(__dirname, '../../../dist/index.html'),
    path.join(process.cwd(), 'dist/index.html'),
  ];

  for (const altPath of alternativePaths) {
    console.log(`[前端请求] 尝试替代路径: ${altPath}`);
    if (fs.existsSync(altPath)) {
      console.log(`[前端请求] 找到可用的入口文件: ${altPath}`);
      return res.sendFile(altPath);
    }
  }

  // 如果所有路径都失败，返回错误消息
  console.error(`[前端请求] 无法找到入口文件，已检查的路径:
    - ${indexPath}
    ${alternativePaths.map(p => `    - ${p}`).join('\n')}
  `);

  res.status(404).send(`
    <html>
      <head>
        <title>前端应用未找到</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #e74c3c;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .message {
            background-color: #f8f9fa;
            border-left: 4px solid #2980b9;
            padding: 15px;
            margin: 20px 0;
          }
          code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
          }
          ul {
            background-color: #f8f9fa;
            padding: 15px 15px 15px 35px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <h1>前端应用未找到</h1>
        
        <div class="message">
          <strong>原因：</strong>服务器无法找到前端应用的打包文件 (index.html)。
        </div>
        
        <h3>解决方法：</h3>
        <p>请按照以下步骤操作：</p>
        <ol>
          <li>确保您已启动前端开发服务：在前端项目目录中运行 <code>npm run dev</code> 或 <code>yarn dev</code></li>
          <li>如需构建前端项目：运行 <code>npm run build</code> 或 <code>yarn build</code></li>
          <li>确保构建后的文件位于正确的目录中（通常是 <code>dist</code> 目录）</li>
        </ol>
        
        <h3>已检查的路径:</h3>
        <ul>
          <li>${indexPath}</li>
          ${alternativePaths.map(p => `<li>${p}</li>`).join('\n')}
        </ul>
        
        <p>如果您已经启动了前端服务，请直接访问前端服务的地址（默认通常为 <code>http://localhost:5173</code>）</p>
      </body>
    </html>
  `);
});

// 启动服务器
async function startServer() {
  try {
    // 确保数据库目录存在
    const dbPath = process.env.DB_STORAGE || 'server/database/drawdb.sqlite';
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 检查数据库文件是否存在
    const dbExists = fs.existsSync(dbPath);
    // 同步数据库模型
    await sequelize.sync();

    // 初始化WebSocket服务
    initWebSocketServer(server);

    // 启动服务器
    server.listen(PORT, '0.0.0.0', () => {
      // 获取IP地址
      const getNetworkIPs = () => {
        const networkInterfaces = os.networkInterfaces();
        const results = [];
        
        for (const name of Object.keys(networkInterfaces)) {
          for (const net of networkInterfaces[name]) {
            // 跳过内部接口和非IPv4地址
            if (net.family === 'IPv4' && !net.internal) {
              results.push(net.address);
            }
          }
        }
        return results;
      };
      
      const networkIPs = getNetworkIPs();
      
      console.log(`\n=== DrawDB 服务器已启动 ===`);
      console.log(`- 本地地址: http://localhost:${PORT}`);
      
      if (networkIPs.length > 0) {
        console.log('- 网络地址:');
        networkIPs.forEach(ip => {
          console.log(`  http://${ip}:${PORT}`);
        });
      }
      
      console.log(`\n=== WebSocket服务已启动 ===`);
      console.log(`- 本地地址: ws://localhost:${PORT}/ws/diagrams`);
      
      if (networkIPs.length > 0) {
        console.log('- 网络地址:');
        networkIPs.forEach(ip => {
          console.log(`  ws://${ip}:${PORT}/ws/diagrams`);
        });
      }
      
      // 检查静态文件路径是否真的存在并包含index.html
      if (!fs.existsSync(staticFilesPath) || !fs.existsSync(path.join(staticFilesPath, 'index.html'))) {
        console.warn('\n\x1b[33m%s\x1b[0m', '警告: 前端静态文件未找到!');
        console.warn('\x1b[33m%s\x1b[0m', '请执行以下操作之一:');
        console.warn('\x1b[33m%s\x1b[0m', '1. 启动前端开发服务: 在前端项目目录中运行 npm run dev 或 yarn dev');
        console.warn('\x1b[33m%s\x1b[0m', '2. 构建前端项目: 运行 npm run build 或 yarn build');
        console.warn('\x1b[33m%s\x1b[0m', '前端开发服务默认地址通常为: http://localhost:5173');
      } else {
        console.log(`\n前端静态文件路径: ${staticFilesPath}`);
      }
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

startServer(); 