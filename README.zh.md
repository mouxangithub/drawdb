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

本项目是 [drawdb-io/drawdb](https://github.com/drawdb-io/drawdb) 的一个分支，增强了后端服务器、SQLite 数据库集成以及一系列新功能，旨在提升可用性和功能性。

> **开发说明**：本项目在开发过程中使用了 AI 辅助，利用 [Cursor](https://cursor.sh/) 编辑器进行代码生成和优化。AI 在重写和增强原始代码库方面发挥了关键作用，特别是在添加后端服务器集成和扩展功能方面。

## 📋 主要特性

与原始项目相比，这个增强版的 drawDB 包括：

- **后端服务器**：提供持久数据存储和管理能力。
- **SQLite 数据库**：集成 SQLite 以实现高效的图表存储和检索。
- **多图表支持**：使用户能够创建、管理和组织多个数据库图表。
- **国际化 (i18n)**：支持包括英语和中文在内的多语言，以覆盖更广泛的用户群体。
- **Docker 部署**：提供 Docker 支持，以简化部署和环境一致性。
- **自动备份**：包含内置的数据库备份功能，以保护用户数据。
- **增强预览**：具有交互式图表预览，支持缩放和平移，以便进行详细检查。
- **优化的用户界面**：改进了 UI，采用底部居中的控制面板和浮动信息面板，以提升用户体验。
- **创建时间显示**：在网格和表格视图中显示图表创建时间，以实现更好的组织。
- **高级筛选**：允许按数据库类型、创建时间和更新时间筛选图表，以实现高效搜索。
- **实时协作**：支持基于 WebSocket 的实时协作编辑，包括用户在线状态指示、光标跟踪和冲突解决。
- **协作控制**：UI 组件显示在线协作者、连接状态和协作操作，以实现更好的团队协调。
- **离线恢复**：实施待处理操作队列，以从临时断开连接中恢复，确保数据完整性。
- **用户身份管理**：跨会话保持一致的用户身份识别，并使用彩色编码的头像，以增强用户识别度。

## ✨ 核心功能

- **多图表管理**：在网格和表格视图模式下组织和管理大量数据库图表。
- **交互式图表预览**：通过缩略图和支持拖放及缩放的全功能预览模式预览图表。
- **图表分享**：生成可分享的链接，以便与团队成员和客户协作。
- **协作编辑**：支持并发编辑和冲突解决，以用于团队项目。
- **实时在线状态**：通过用户头像和状态指示器查看当前正在查看和编辑图表的人员。
- **用户活动检测**：自动管理协作会话中的非活跃用户，以优化性能。
- **操作同步**：在连接用户之间即时同步所有更改，实现无缝协作。
- **国际化**：使用您偏好的语言使用 drawDB，支持英语和中文界面。
- **高级筛选**：按名称、数据库类型、创建日期和修改日期筛选图表，以快速查找特定图表。
- **JSON 编辑器**：使用 JSON 编辑器实时编辑表、关系、主题区域和注释属性。
- **免费使用**：完全免费享用所有功能，无需任何账户注册。

## 🚀 快速开始

### Docker 部署（推荐）

```bash
# 拉取最新镜像
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

使用 Docker Compose:

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

### 启动脚本

#### Windows
```bat
# 本地运行（不使用 Docker，启动前端和后端）
start.bat local

# 启动开发环境（使用 Docker）
start.bat dev

# 启动生产环境（使用 Docker）
start.bat prod
```

#### Linux/macOS
```bash
# 添加执行权限
chmod +x start.sh

# 本地运行（不使用 Docker，启动前端和后端）
./start.sh local

# 启动开发环境（使用 Docker）
./start.sh dev

# 启动生产环境（使用 Docker）
./start.sh prod
```

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/mouxangithub/drawdb
cd drawdb

# 安装所有依赖
npm run install:all

# 启动前端和后端开发服务器
npm start
```

## 🏗️ 项目结构

本项目在结构上分为前端和后端组件，以确保可扩展性和可维护性。

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

---

*需要英文版文档？请查看 [README.md](README.md)。* 