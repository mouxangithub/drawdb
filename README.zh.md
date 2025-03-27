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

## ✨ 核心特性

- **多图表管理**：创建和管理多个数据库图表，支持网格和表格两种视图模式
- **交互式预览**：提供图表缩略图和全功能预览模式，支持拖动和缩放操作
- **图表共享**：生成分享链接，与团队成员或客户分享数据库设计
- **国际化支持**：支持多语言，包括英文和中文界面
- **免费使用**：所有功能完全免费，无需注册账户

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
│  ├─ components/         # 可重用组件
│  ├─ context/            # React上下文
│  ├─ data/               # 静态数据和常量
│  ├─ hooks/              # 自定义React钩子
│  ├─ i18n/               # 国际化配置
│  ├─ icons/              # 图标组件
│  ├─ pages/              # 页面组件
│  ├─ services/           # API和服务
│  ├─ utils/              # 工具函数
│  ├─ App.jsx             # 应用程序主组件
│  └─ main.jsx            # 应用程序入口点
├─ server/                # 后端服务器
│  ├─ database/           # SQLite数据库文件
│  └─ src/                # 服务器源代码
```

## 📋 环境变量配置

项目使用`.env`文件统一配置前端和后端环境变量：

```bash
# 服务器配置
PORT=3001
NODE_ENV=development

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

---

*需要英文版文档？请查看 [README.md](README.md)。* 