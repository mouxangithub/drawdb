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

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入路由
import diagramRoutes from './routes/diagrams.js';
import templateRoutes from './routes/templates.js';
import shareRoutes from './routes/shares.js';

// 导入数据库连接
import { sequelize } from './models/index.js';

// 导入种子数据控制器
import { importTemplateSeeds } from './controllers/seedController.js';

// 加载环境变量（从项目根目录）
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// 提取API URL路径
const getApiPath = () => {
  if (!process.env.API_URL) return '/api';
  try {
    return new URL(process.env.API_URL).pathname;
  } catch (e) {
    // 如果API_URL不是有效的URL，直接使用它作为路径
    return process.env.API_URL.startsWith('/') 
      ? process.env.API_URL 
      : `/${process.env.API_URL}`;
  }
};

const apiBasePath = getApiPath();

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
app.use(`${apiBasePath}/diagrams`, diagramRoutes);
app.use(`${apiBasePath}/templates`, templateRoutes);
app.use(`${apiBasePath}/shares`, shareRoutes);

// 获取静态文件路径
function getStaticFilesPath() {
  // 检查环境变量中配置的静态文件目录
  if (process.env.STATIC_FILES_DIR) {
    const envPath = path.resolve(process.env.STATIC_FILES_DIR);
    console.log(`检查环境变量配置的路径: ${envPath}`);
    if (fs.existsSync(envPath)) {
      console.log(`使用环境变量指定的静态文件路径: ${envPath}`);
      return envPath;
    } else {
      console.warn(`环境变量指定的路径不存在: ${envPath}`);
    }
  }

  // 首先检查已复制的前端文件目录
  const publicPath = path.resolve(__dirname, '../../public');
  console.log(`检查public目录: ${publicPath}`);
  if (fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'))) {
    console.log(`使用public目录作为静态文件路径: ${publicPath}`);
    return publicPath;
  }

  // 检查其他可能的路径
  // 注意：dist目录通常不会存在于Git仓库中，因为它已被添加到.gitignore
  // 它会在构建过程中生成，并在Docker构建时复制到server/public目录
  const possiblePaths = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../../dist'),
    path.resolve(__dirname, '../../dist')
  ];

  for (const p of possiblePaths) {
    console.log(`检查路径: ${p}`);
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
      console.log(`找到有效的静态文件路径: ${p}`);
      return p;
    }
  }

  // 如果所有路径都无效，返回默认路径
  console.warn('没有找到有效的静态文件路径，返回默认路径');
  return path.resolve(process.cwd(), 'dist');
}

const staticFilesPath = getStaticFilesPath();

// 服务前端静态文件
console.log(`提供静态文件的目录: ${staticFilesPath}`);
if (fs.existsSync(staticFilesPath)) {
  const files = fs.readdirSync(staticFilesPath);
  console.log(`静态目录中的文件: ${files.join(', ')}`);
  
  // 检查 index.html 是否存在
  if (fs.existsSync(path.join(staticFilesPath, 'index.html'))) {
    console.log('找到 index.html 文件');
  } else {
    console.warn('静态目录中没有 index.html 文件');
  }
} else {
  console.error(`静态文件目录不存在: ${staticFilesPath}`);
}

// 设置静态文件服务中间件
console.log(`设置静态文件服务路径: ${staticFilesPath}`);

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
      <head><title>前端应用未找到</title></head>
      <body>
        <h1>错误: 前端应用文件未找到</h1>
        <p>服务器无法定位前端应用的入口文件 (index.html)。</p>
        <p>已检查的路径:</p>
        <ul>
          <li>${indexPath}</li>
          ${alternativePaths.map(p => `<li>${p}</li>`).join('\n')}
        </ul>
        <p>请确保前端应用已构建并正确部署。</p>
      </body>
    </html>
  `);
});

// 复制前端文件到服务器目录的函数
const copyFrontendFiles = () => {
  try {
    // 可能的前端源位置
    const possibleSources = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname, '../../../dist'),
      path.resolve(__dirname, '../../dist')
    ];
    
    // 目标位置
    const targetDir = path.resolve(__dirname, '../../public');
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      console.log(`创建目标目录: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 查找有效的源目录
    let sourceDir = null;
    for (const dir of possibleSources) {
      if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
        sourceDir = dir;
        break;
      }
    }
    
    if (!sourceDir) {
      console.warn('没有找到有效的前端源目录，跳过复制');
      return;
    }
    
    console.log(`从 ${sourceDir} 复制前端文件到 ${targetDir}`);
    
    // 读取源目录中的所有文件和子目录
    const copyRecursive = (src, dest) => {
      // 确保目标目录存在
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      // 获取源目录中的所有项
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      // 复制每一个项
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          // 递归复制子目录
          copyRecursive(srcPath, destPath);
        } else {
          // 复制文件
          fs.copyFileSync(srcPath, destPath);
          console.log(`复制文件: ${srcPath} -> ${destPath}`);
        }
      }
    };
    
    // 开始复制
    copyRecursive(sourceDir, targetDir);
    console.log('前端文件复制完成');
  } catch (error) {
    console.error('复制前端文件时出错:', error);
  }
};

// 启动服务器
async function startServer() {
  try {
    // 确保数据库目录存在
    const dbPath = process.env.DB_STORAGE || 'server/database/drawdb.sqlite';
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`创建数据库目录: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // 检查数据库文件是否存在
    const dbExists = fs.existsSync(dbPath);
    if (!dbExists) {
      console.log(`数据库文件不存在，将在首次同步时创建: ${dbPath}`);
    } else {
      console.log(`使用现有数据库文件: ${dbPath}`);
    }
    
    // 尝试复制前端文件
    copyFrontendFiles();
    
    // 同步数据库模型
    await sequelize.sync();
    console.log('数据库连接成功并同步完成');

    // 导入种子数据（仅在首次创建数据库时）
    if (!dbExists) {
      console.log('首次运行，导入初始模板数据');
      await importTemplateSeeds();
    } else {
      console.log('使用现有数据库，跳过初始模板导入');
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器已启动，监听端口: ${PORT}`);
      console.log(`API基础路径: ${apiBasePath}`);
      console.log(`前端静态文件路径: ${staticFilesPath}`);
      console.log(`数据库路径: ${dbPath}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

startServer(); 