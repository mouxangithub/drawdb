<div align="center">
    <img width="64" alt="drawdb logo" src="./src/assets/icon-dark.png">
    <h1>drawDB</h1>
</div>

<h3 align="center">Free, simple, and intuitive database schema editor and SQL generator.</h3>

<div align="center" style="margin-bottom:12px;">
    <a href="https://drawdb.app/" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Start%20building-grey" alt="drawDB"/>
    </a>
    <a href="https://discord.gg/BrjZgNrmR6" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/discord/1196658537208758412.svg?label=Join%20the%20Discord&logo=discord" alt="Discord"/>
    </a>
    <a href="https://x.com/drawDB_" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/Follow%20us%20on%20X-blue?logo=X" alt="Follow us on X"/>
    </a>
</div>

<div align="center" style="margin-bottom:20px;">
    <a href="README.md">English</a> | <a href="README.zh.md">中文</a>
</div>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.png"></h3>

## 📝 Project Introduction

DrawDB is a robust and user-friendly database entity relationship (DBER) editor right in your browser. Build diagrams with a few clicks, export SQL scripts, customize your editor, and more without creating an account.

This project is based on [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) with enhancements including a backend server, SQLite database integration, and more features.

> **Development Note**: This project was developed with the assistance of AI, using the [Cursor](https://cursor.sh/) editor for code generation and adaptation. The AI helped rewrite and enhance the original codebase, adding the backend server integration and other extended features.

## 📋 What's Added

Compared to the original project, this fork adds several key features:

- **Full Backend Server**: Added a server component for persistent data storage
- **SQLite Database**: Integrated SQLite for diagram storage and management
- **Multi-Diagram Management**: Support for creating and managing multiple diagrams
- **Internationalization**: Added support for multiple languages (English/Chinese)
- **Docker Deployment**: Complete Docker support for easy deployment
- **Automated Backups**: Built-in database backup functionality
- **Enhanced Preview**: Interactive diagram preview with zoom and pan capabilities
- **Optimized UI**: Refined user interface with control panel centered at bottom and floating info panel
- **Creation Time Display**: Added creation time display in both grid and table view modes
- **Advanced Filtering System**: Comprehensive filtering by database type, creation time, and update time
- **Real-time Collaboration**: WebSocket-based collaborative editing with user presence indicators, cursor tracking, and conflict resolution
- **Collaboration Controls**: User interface components showing online collaborators, connection status, and collaborative actions
- **Offline Recovery**: Pending operations queue for recovering from temporary disconnections
- **User Identity Management**: Consistent user identification across sessions with color-coded avatars

## ✨ Core Features

- **Multi-Diagram Management**: Create and manage multiple database diagrams with grid and table view modes
- **Interactive Preview**: Diagram thumbnails and full-featured preview mode with drag and zoom capabilities
- **Diagram Sharing**: Generate sharing links to collaborate with team members or clients
- **Collaborative Editing**: Support for concurrent diagram editing with version conflict resolution
- **Real-time Presence**: See who's currently viewing and editing the diagram with user avatars and status indicators
- **User Activity Detection**: Automatically detect and manage inactive users in collaborative sessions
- **Operation Synchronization**: All changes are instantly synchronized between all connected users
- **Internationalization**: Support for multiple languages, including English and Chinese interfaces
- **Advanced Filtering**: Filter diagrams by name, database type, creation date, and modification date
- **JSON Editor**: Real-time JSON editing for tables, relationships, subject areas, and notes
- **Free to Use**: All features completely free, no account registration required

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Pull the latest image
docker pull ghcr.io/mouxangithub/drawdb:latest

# Create necessary directories
mkdir -p server/database backups

# Run the container
docker run -d --name drawdb \
  -p 3000:3000 \
  -v $(pwd)/server/database:/app/server/database \
  -v $(pwd)/backups:/app/backups \
  ghcr.io/mouxangithub/drawdb:latest
```

Using Docker Compose:

```yaml
services:
  drawdb:
    image: ghcr.io/mouxangithub/drawdb:latest
    container_name: drawdb
    restart: unless-stopped
    ports:
      - 3000:3000
    volumes:
      - ./server/database:/app/server/database
      - ./backups:/app/backups
```

### Using Startup Scripts

#### Windows
```bat
# Run locally (without Docker, start both frontend and backend)
start.bat local

# Start development environment (using Docker)
start.bat dev

# Start production environment (using Docker)
start.bat prod
```

#### Linux/macOS
```bash
# Add execution permission
chmod +x start.sh

# Run locally (without Docker, start both frontend and backend)
./start.sh local

# Start development environment (using Docker)
./start.sh dev

# Start production environment (using Docker)
./start.sh prod
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/mouxangithub/drawdb
cd drawdb

# Install all dependencies
npm run install:all

# Start both frontend and backend development servers
npm start
```

## 开发说明

### 启动项目

```bash
# 安装所有依赖
npm run install:all

# 开发模式启动（同时启动前端和后端）
npm run start
```

启动后，浏览器将自动打开并访问应用。前端服务现在会暴露到本地网络，可以通过局域网IP地址访问（如 http://192.168.x.x:5173）。

## 🏗️ Project Structure

The project is divided into frontend and backend parts:

```
drawdb/
├─ src/                   # Frontend source code
│  ├─ animations/         # Animation components
│  ├─ assets/             # Static resources
│  ├─ components/         # Reusable components
│  │  ├─ common/          # Common UI components
│  │  │  ├─ DiagramPreviewCard/  # Interactive diagram preview cards
│  │  │  ├─ DiagramViewModal/    # Full diagram preview modal
│  │  │  ├─ ShareModal/          # Diagram sharing modal
│  │  │  ├─ DiagramThumbnail.jsx # 图表缩略图组件
│  │  │  ├─ ZoomControl.jsx      # 缩放控制组件
│  │  │  ├─ ConfirmationPrompt.jsx  # Confirmation dialog component
│  │  │  └─ ThemeLanguageSwitcher/ # Theme and language switcher component
│  │  ├─ CollaborationStatus.jsx  # WebSocket连接状态组件
│  │  ├─ CollaboratorsList.jsx    # 在线协作用户列表组件
│  │  ├─ UserActivityIndicator.jsx # 用户活跃状态指示器组件
│  │  ├─ WebSocketLoadingOverlay.jsx # WebSocket加载状态覆盖层
│  │  ├─ EditorCanvas/    # Canvas editor components
│  │  ├─ EditorHeader/    # Editor header components
│  │  ├─ EditorSidePanel/ # Editor side panel components
│  │  ├─ JsonEditor/      # JSON编辑器组件
│  │  └─ LexicalEditor/   # Rich text editor components
│  ├─ context/            # React contexts
│  │  ├─ WebSocketContext.jsx  # WebSocket连接上下文管理
│  │  ├─ CollaborationContext.jsx  # 协作功能与用户活跃状态管理
│  │  ├─ JsonEditorContext.jsx  # JSON编辑器状态管理
│  │  └─ ...              # 其他上下文组件
│  ├─ data/               # Static data and constants
│  ├─ hooks/              # Custom React hooks
│  │  ├─ useWebSocket.js  # WebSocket连接钩子
│  │  ├─ useCollaboration.js  # 协作功能钩子
│  │  ├─ useUserActivity.js  # 用户活跃状态监控钩子
│  │  ├─ useJsonEditor.js  # JSON编辑器状态钩子
│  │  └─ ...              # 其他钩子函数
│  ├─ i18n/               # Internationalization configuration
│  ├─ icons/              # Icon components
│  ├─ pages/              # Page components
│  ├─ services/           # APIs and services
│  │  ├─ websocket.js     # WebSocket客户端服务
│  │  ├─ diagramWebSocketService.js  # 图表WebSocket服务
│  │  └─ ...              # 其他服务
│  ├─ styles/             # CSS样式文件
│  │  ├─ components/      # 组件相关样式
│  │  ├─ pages/           # 页面相关样式
│  │  └─ global/          # 全局样式
│  ├─ utils/              # Utility functions
│  ├─ App.jsx             # Main application component
│  └─ main.jsx            # Application entry point
├─ server/                # Backend server
│  ├─ database/           # SQLite database files
│  └─ src/                # Server source code
│     ├─ websocket/       # WebSocket服务器实现
│     └─ ...              # 其他服务器代码
```

## 📋 Environment Variables

The project uses a `.env` file to configure both frontend and backend environment variables:

```bash
# Server configuration
PORT=3000
NODE_ENV=development

# Frontend configuration
VITE_WS_PORT=3000  # WebSocket port for real-time collaboration

# Database configuration
DB_STORAGE=server/database/drawdb.sqlite
```

## 🔄 Data Backup

The SQLite database used by the system is mounted to the host system via Docker volumes and can be backed up using:

```bash
# Using startup script for backup
./start.sh backup  # Linux/macOS
start.bat backup   # Windows

# Or manual backup
cp server/database/drawdb.sqlite backups/drawdb_$(date +%Y%m%d_%H%M%S).sqlite
```

## 🔧 Troubleshooting

If you encounter issues, please check:

1. **静态文件不可访问**: 确保以下几点:
   - 检查 `STATIC_FILES_DIR` 环境变量是否正确设置
   - 检查 Docker 容器中 `/app/server/public` 目录是否存在并包含静态文件
   - 如果使用自定义 Docker 构建，确保 `npm run build` 成功执行并将构建结果正确复制到 `/app/server/public`
   - 运行 `docker exec -it drawdb sh` 进入容器并检查 `/app/server/public` 目录

2. **Docker 容器无法启动**: 检查端口是否已被占用或目录权限是否正确
3. **WebSocket协作错误修复**:
   - 修复了`Workspace.jsx`中重复定义的`handleCollaborationOperation`函数，重命名为`handleCollaborationEvent`
   - 修复了拖动操作时`diagramData`变量未定义的问题
   - 优化了WebSocket消息处理逻辑，确保兼容不同格式的事件数据
   - 加强了错误处理和数据验证，提高系统稳定性

## 🤝 Contributing

Contributions are welcome, whether it's code contributions, bug reports, or feature suggestions. Please see the [contribution guidelines](CONTRIBUTING.md).

## 👏 Acknowledgements

This project is based on [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb). We would like to express our sincere gratitude to the original project's creators and all contributors who made it possible.

## 📄 License

This project is released under the [AGPL-3.0 License](LICENSE), the same license as the original [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) project. The AGPL-3.0 license requires that:

- Source code must be made available when distributing the software
- Modifications must be released under the same license when distributing the software
- Changes made to the code must be documented
- If you run a modified program on a server and let users communicate with it, you must also provide them with the source code

## 🔄 协作功能

项目支持实时协作编辑功能，允许多个用户同时编辑同一个图表。主要特性包括：

### 实时协作

- **无需登录** - 使用设备唯一标识符（基于IP地址或客户端生成的唯一ID）自动识别用户
- **实时光标** - 显示其他用户的光标位置
- **编辑指示器** - 显示哪些组件正在被其他用户编辑
- **版本冲突解决** - 自动处理多人同时编辑时的版本冲突

### 协作组件

- **协作状态栏** - 显示当前连接状态和在线用户数量
- **用户列表** - 显示当前在线的所有用户
- **编辑指示器** - 在组件上显示谁正在编辑
- **远程光标** - 显示其他用户的光标位置

### 技术实现

- 使用`ws`库实现WebSocket服务
- 使用Sequelize操作SQLite数据库
- 客户端使用浏览器原生WebSocket API

## 项目结构

前端结构：
- `public/`: 静态资源
- `src/`: 源代码
  - `components/`: 组件
    - `EditorCanvas/`: 编辑器画布相关组件
    - `EditorHeader/`: 编辑器头部控制面板组件
    - `EditorSidePanel/`: 编辑器侧边面板组件
    - `LexicalEditor/`: 富文本编辑器组件
    - `JsonEditor/`: JSON编辑器组件
  - `context/`: React Context
    - `AuthContext.jsx`: 认证上下文
    - `CanvasContext.jsx`: 画布上下文
    - `DiagramContext.jsx`: 图表数据上下文
    - `WebSocketContext.jsx`: WebSocket连接上下文
    - `CollaborationContext.jsx`: 协作功能上下文
    - `JsonEditorContext.jsx`: JSON编辑器状态管理
  - `services/`: 服务
    - `api.js`: HTTP API服务
    - `authService.js`: 认证服务
    - `diagramWebSocketService.js`: 图表WebSocket服务
    - `websocketManager.js`: WebSocket连接管理器
    - `customEventBridge.js`: 自定义事件桥
  - `pages/`: 页面组件
  - `data/`: 数据和常量定义
  - `hooks/`: 自定义Hooks
  - `utils/`: 工具函数
  - `i18n/`: 国际化

后端结构：
- `server/`: 服务器代码
  - `controllers/`: 控制器
  - `middleware/`: 中间件
  - `routes/`: 路由
  - `services/`: 服务层
  - `utils/`: 工具函数
  - `models/`: 数据模型
  - `config/`: 配置文件
  - `websocket/`: WebSocket处理
  - `app.js`: 应用入口
  - `server.js`: 服务器启动
- `database/`: 数据库相关
  - `migrations/`: 数据库迁移
  - `seeds/`: 数据库种子数据
  - `schema.sql`: 数据库架构

## 最近更新

### WebSocket连接管理优化

为解决WebSocket频繁连接和断开的问题，我们对WebSocket连接管理进行了全面重构：

1. **集中式连接管理**：
   - 新增`websocketManager.js`作为全局WebSocket连接管理器
   - 统一管理连接建立、消息发送、状态监听和错误处理
   - 实现连接状态共享，避免重复连接尝试

2. **关键优化内容**：
   - 实现连接请求去重，避免短时间内重复建立连接
   - 添加指数退避的重连机制，提高连接稳定性
   - 引入心跳机制确保长连接稳定
   - 优化认证失败的处理逻辑
   - 完善连接异常恢复机制

3. **组件协作改进**：
   - 重构`WebSocketContext`，使用新的连接管理器
   - 更新`diagramWebSocketService`，优化API调用方式
   - 改进`Workspace`组件的WebSocket交互，避免重复连接
   - 增强`CollaborationProvider`的稳定性和性能

这些优化显著减少了WebSocket连接频率，提高了实时协作的稳定性和用户体验。

---

*Looking for the Chinese version of this document? See [README.zh.md](README.zh.md).*