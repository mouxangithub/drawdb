#!/bin/sh

# Docker 容器内启动脚本
echo "开始启动 DrawDB 服务..."

# 显示环境变量（用于调试）
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# 确保数据库目录存在
mkdir -p /app/server/database

# 检查数据库文件
if [ ! -f /app/server/database/drawdb.sqlite ]; then
  echo "数据库文件不存在，将创建新数据库"
fi

# 启动服务器
echo "启动 Node.js 服务器..."
cd /app/server && node src/index.js 