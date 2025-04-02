<div align="center">
    <img width="64" alt="drawdb logo" src="./src/assets/icon-dark.png">
    <h1>drawDB</h1>
</div>

<h3 align="center">免费、简单且直观的数据库模式编辑器和SQL生成器</h3>

<div align="center" style="margin-bottom:12px;">
    <a href="https://drawdb.app/" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/开始使用-grey" alt="drawDB"/>
    </a>
    <a href="https://discord.gg/BrjZgNrmR6" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/discord/1196658537208758412.svg?label=加入Discord&logo=discord" alt="Discord"/>
    </a>
    <a href="https://x.com/drawDB_" style="display: flex; align-items: center;">
        <img src="https://img.shields.io/badge/在X上关注我们-blue?logo=X" alt="Follow us on X"/>
    </a>
</div>

<div align="center" style="margin-bottom:20px;">
    <a href="README.md">English</a> | <a href="README.zh.md">中文</a>
</div>

<h3 align="center"><img width="700" style="border-radius:5px;" alt="demo" src="drawdb.png"></h3>

## 📝 项目介绍

DrawDB是一个强大且用户友好的数据库实体关系(DBER)编辑器，直接在您的浏览器中运行。通过简单点击即可构建数据库图表，导出SQL脚本，自定义编辑器，无需创建账户即可使用所有功能。

本项目基于[drawdb-io/drawdb](https://github.com/drawdb-io/drawdb)开发，增加了后端服务器、SQLite数据库集成等多项增强功能。

> **开发说明**：本项目在开发过程中使用AI辅助，通过[Cursor](https://cursor.sh/)编辑器进行代码生成和改写。AI帮助重写和增强了原始代码库，添加了后端服务器集成和其他扩展功能。

## 📋 功能增强

相比原项目，本分支增加了以下关键功能：

- **完整后端服务**：添加了服务器组件，实现数据持久化存储
- **SQLite数据库**：集成SQLite用于图表存储和管理
- **多图表管理**：支持创建和管理多个数据库图表
- **国际化支持**：添加了多语言支持（英文/中文）
- **Docker部署**：完整的Docker支持，便于快速部署
- **自动备份**：内置数据库备份功能
- **增强预览**：交互式图表预览，支持缩放和平移操作
- **优化的用户界面**：精简的用户界面，控制面板位于底部，浮动信息面板
- **创建时间显示**：在网格和表格视图模式中添加创建时间显示
- **高级筛选系统**：全面的筛选功能，支持按数据库类型、创建时间和修改时间筛选图表
- **实时协作**：基于WebSocket的协作编辑，带有用户在线状态指示、光标跟踪和冲突解决
- **协作控制**：用户界面组件显示在线协作者、连接状态和协作操作
- **离线恢复**：待处理操作队列，用于从临时断开中恢复
- **用户身份管理**：在会话之间保持一致的用户识别，使用颜色编码的头像

## ✨ 核心功能

- **多图表管理**：创建和管理多个数据库图表，支持网格和表格视图模式
- **交互式预览**：图表缩略图和功能齐全的预览模式，支持拖拽和缩放
- **图表分享**：生成分享链接与团队成员或客户协作
- **多人协同编辑**：支持多人同时编辑图表，内置版本冲突解决机制
- **实时在线状态**：查看当前正在查看和编辑图表的用户，带有用户头像和状态指示
- **用户活跃状态检测**：自动检测和管理协作会话中的非活跃用户
- **操作同步**：所有更改在所有连接用户之间即时同步
- **国际化**：支持多种语言界面，包括英文和中文
- **高级筛选**：按名称、数据库类型、创建日期和修改日期筛选图表
- **JSON编辑器**：实时JSON编辑，用于表格、关系、主题区域和备注
- **免费使用**：所有功能完全免费，无需注册账号

## 🚀 快速开始

### 使用Docker启动（推荐）

```bash
# 拉取最新版本镜像
docker pull ghcr.io/mouxangithub/drawdb:latest

# 创建必要的目录
mkdir -p server/database backups

# 运行容器
docker run -d --name drawdb \
  -p 3000:3000 \
  -v $(pwd)/server/database:/app/server/database \
  -v $(pwd)/backups:/app/backups \
  ghcr.io/mouxangithub/drawdb:latest
```

通过Docker Compose使用：

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

### 使用启动脚本

#### Windows系统
```bat
# 本地运行（不使用Docker，直接启动前后端）
start.bat local

# 启动开发环境（使用Docker）
start.bat dev

# 启动生产环境（使用Docker）
start.bat prod
```

#### Linux/macOS系统
```bash
# 添加执行权限
chmod +x start.sh

# 本地运行（不使用Docker，直接启动前后端）
./start.sh local

# 启动开发环境（使用Docker）
./start.sh dev

# 启动生产环境（使用Docker）
./start.sh prod
```

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/mouxangithub/drawdb
cd drawdb

# 安装所有依赖
npm run install:all

# 同时启动前端和后端开发服务
npm start
```

## 🏗️ 项目结构

项目主要分为前端和后端两部分：

```
drawdb/
├─ src/                   # 前端源代码
│  ├─ animations/         # 动画组件
│  ├─ assets/             # 静态资源
│  ├─ components/         # 可复用组件
│  │  ├─ common/          # 通用UI组件
│  │  │  ├─ DiagramPreviewCard/  # 交互式图表预览卡片
│  │  │  ├─ DiagramViewModal/    # 图表详情预览模态框
│  │  │  ├─ ShareModal/          # 图表分享模态框
│  │  │  ├─ DiagramThumbnail.jsx # 图表缩略图组件
│  │  │  ├─ ZoomControl.jsx      # 缩放控制组件
│  │  │  ├─ ConfirmationPrompt.jsx  # 通用确认对话框组件
│  │  │  └─ ThemeLanguageSwitcher/ # 主题和语言切换组件
│  │  ├─ CollaborationStatus.jsx  # WebSocket连接状态组件
│  │  ├─ CollaboratorsList.jsx    # 在线协作用户列表组件
│  │  ├─ UserActivityIndicator.jsx # 用户活跃状态指示器组件
│  │  ├─ WebSocketLoadingOverlay.jsx # WebSocket加载状态覆盖层
│  │  ├─ EditorCanvas/    # 画布编辑器组件
│  │  ├─ EditorHeader/    # 编辑器头部组件
│  │  ├─ EditorSidePanel/ # 编辑器侧边栏组件
│  │  └─ LexicalEditor/   # 富文本编辑器组件
│  ├─ context/            # React上下文
│  │  ├─ WebSocketContext.jsx  # WebSocket连接上下文管理
│  │  ├─ CollaborationContext.jsx  # 协作功能与用户活跃状态管理
│  │  └─ ...              # 其他上下文组件
│  ├─ data/               # 静态数据和常量
│  ├─ hooks/              # 自定义React钩子
│  │  ├─ useWebSocket.js  # WebSocket连接钩子
│  │  ├─ useCollaboration.js  # 协作功能钩子
│  │  ├─ useUserActivity.js  # 用户活跃状态监控钩子
│  │  ├─ useJsonEditor.js  # JSON编辑器状态钩子
│  │  └─ ...              # 其他钩子函数
│  ├─ i18n/               # 国际化配置
│  ├─ icons/              # 图标组件
│  ├─ pages/              # 页面组件
│  ├─ services/           # API和服务
│  │  ├─ websocket.js     # WebSocket客户端服务
│  │  ├─ diagramWebSocketService.js  # 图表WebSocket服务
│  │  └─ ...              # 其他服务
│  ├─ styles/             # CSS样式文件
│  │  ├─ components/      # 组件相关样式
│  │  ├─ pages/           # 页面相关样式
│  │  └─ global/          # 全局样式
│  ├─ utils/              # 工具函数
│  ├─ App.jsx             # 主应用组件
│  └─ main.jsx            # 应用入口点
├─ server/                # 后端服务器
│  ├─ database/           # SQLite数据库文件
│  └─ src/                # 服务器源代码
│     ├─ websocket/       # WebSocket服务器实现
│     └─ ...              # 其他服务器代码
```

## 📋 环境变量

项目使用`.env`文件配置前端和后端环境变量：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 前端配置
VITE_WS_PORT=3000  # WebSocket实时协作端口

# 数据库配置
DB_STORAGE=server/database/drawdb.sqlite
```

## 🔄 数据备份

系统使用的SQLite数据库通过Docker卷挂载到主机系统，可以使用以下方法备份：

```bash
# 使用启动脚本执行备份
./start.sh backup  # Linux/macOS
start.bat backup   # Windows

# 或手动备份
cp server/database/drawdb.sqlite backups/drawdb_$(date +%Y%m%d_%H%M%S).sqlite
```

## 🔧 故障排除

如果遇到问题，请检查：

1. **静态文件不可访问**：确保正确设置了`STATIC_FILES_DIR`环境变量
2. **Docker容器无法启动**：检查端口是否被占用，目录权限是否正确

## 🤝 贡献

欢迎贡献代码、报告问题或提出新功能建议。请参阅[贡献指南](CONTRIBUTING.md)。

## 👏 致谢

本项目基于[drawdb-io/drawdb](https://github.com/drawdb-io/drawdb)开发。我们衷心感谢原项目的创建者以及所有做出贡献的开发者。

## 📄 许可证

本项目基于[AGPL-3.0许可证](LICENSE)发布，与原项目[drawdb-io/drawdb](https://github.com/drawdb-io/drawdb)使用相同的许可证。AGPL-3.0许可证要求：

- 分发软件时必须提供源代码
- 修改后的软件分发时必须使用相同的许可证
- 对代码的修改必须记录在文档中
- 如果您在服务器上运行修改后的程序并允许用户与之通信，您也必须向他们提供源代码

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

---

*需要英文版文档？请查看 [README.md](README.md)。*