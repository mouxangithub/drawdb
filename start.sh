#!/bin/bash

# DrawDB 一键部署脚本
# 用法: ./start.sh [dev|prod|local|backup|local-backup|stop|restart|logs]

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 创建必要的目录
mkdir -p server/database backups

# 命令行参数处理
MODE=${1:-prod}

# 打印环境变量（可选，用于调试）
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# 如果数据库目录不存在，创建它
mkdir -p /app/server/database

# 启动服务器
cd /app && node server/src/index.js

# 显示帮助信息
show_help() {
  echo -e "${GREEN}DrawDB 一键部署脚本${NC}"
  echo "用法: ./start.sh [选项]"
  echo ""
  echo "选项:"
  echo "  dev         - 启动开发环境"
  echo "  prod        - 启动生产环境（默认）"
  echo "  local       - 在本地直接运行前后端（无Docker）"
  echo "  backup      - 立即执行数据库备份"
  echo "  local-backup - 手动备份本地数据库（不使用Docker）"
  echo "  stop        - 停止所有服务"
  echo "  restart     - 重启服务"
  echo "  logs        - 查看日志"
  echo "  help        - 显示帮助信息"
}

# 启动开发环境
start_dev() {
  echo -e "${YELLOW}启动开发环境...${NC}"
  docker-compose up -d drawdb-dev
  echo -e "${GREEN}开发服务已启动!${NC}"
  echo -e "访问地址: ${GREEN}http://localhost:5173${NC}"
  echo -e "API地址: ${GREEN}http://localhost:3002/api${NC}"
}

# 启动生产环境
start_prod() {
  echo -e "${YELLOW}启动生产环境...${NC}"
  docker-compose up -d drawdb-prod db-backup
  echo -e "${GREEN}生产服务已启动!${NC}"
  echo -e "访问地址: ${GREEN}http://localhost:3000${NC}"
  echo -e "数据库路径: ${GREEN}$(pwd)/server/database/drawdb.sqlite${NC}"
  echo -e "备份路径: ${GREEN}$(pwd)/backups${NC}"
  echo -e "备份时间: 每天凌晨2点自动备份，保留最近7天的备份"
}

# 本地直接运行（无Docker）
start_local() {
  echo -e "${YELLOW}在本地直接运行前后端...${NC}"
  
  # 检查是否安装了依赖
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
  fi
  
  if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}安装后端依赖...${NC}"
    (cd server && npm install)
  fi
  
  echo -e "${YELLOW}启动前后端服务...${NC}"
  npm start
  
  echo -e "${GREEN}本地服务已启动!${NC}"
  echo -e "前端地址: ${GREEN}http://localhost:5173${NC}"
  echo -e "API地址: ${GREEN}http://localhost:3001/api${NC}"
}

# 执行手动备份
do_backup() {
  echo -e "${YELLOW}执行数据库备份...${NC}"
  docker-compose --profile backup up db-backup-manual
  echo -e "${GREEN}备份完成!${NC}"
  echo -e "备份路径: ${GREEN}$(pwd)/backups${NC}"
  # 显示最新的备份文件
  latest=$(ls -t backups/drawdb_*.sqlite 2>/dev/null | head -1)
  if [ -n "$latest" ]; then
    echo -e "最新备份: ${GREEN}$latest${NC}"
  fi
}

# 本地数据库手动备份（不使用Docker）
do_local_backup() {
  echo -e "${YELLOW}执行本地数据库备份...${NC}"
  
  # 创建备份目录
  mkdir -p backups
  
  # 生成时间戳格式
  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_file="backups/drawdb_${timestamp}.sqlite"
  
  # 复制数据库文件
  cp server/database/drawdb.sqlite "$backup_file"
  
  echo -e "${GREEN}备份完成!${NC}"
  echo -e "备份文件: ${GREEN}$backup_file${NC}"
}

# 根据参数执行相应的操作
case "$MODE" in
  dev)
    start_dev
    ;;
  prod)
    start_prod
    ;;
  local)
    start_local
    ;;
  backup)
    do_backup
    ;;
  local-backup)
    do_local_backup
    ;;
  stop)
    echo -e "${YELLOW}停止所有服务...${NC}"
    docker-compose down
    echo -e "${GREEN}所有服务已停止${NC}"
    ;;
  restart)
    echo -e "${YELLOW}重启服务...${NC}"
    docker-compose down
    start_prod
    ;;
  logs)
    echo -e "${YELLOW}查看容器日志...${NC}"
    docker-compose logs -f
    ;;
  help)
    show_help
    ;;
  *)
    echo -e "${RED}未知选项: $MODE${NC}"
    show_help
    exit 1
    ;;
esac