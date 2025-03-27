#!/bin/sh

# Docker 容器内启动脚本
echo "开始启动 DrawDB 服务..."

# 显示环境变量（用于调试）
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "API_URL: $API_URL"

# 如果没有设置API_URL，则根据PORT动态生成
if [ -z "$API_URL" ]; then
  # 默认使用相对路径/api，但如果指定了非默认端口，则使用完整URL
  if [ "$PORT" = "80" ]; then
    # 默认端口80，使用相对路径
    export API_URL="/api"
  elif [ "$PORT" = "443" ]; then
    # 默认端口443，使用相对路径
    export API_URL="/api"
  else
    # 非默认端口，使用完整URL并包含端口
    export API_URL="http://localhost:${PORT}/api"
  fi
  echo "自动生成API_URL: $API_URL（基于端口:$PORT）"
fi

# 生成运行时配置文件
echo "window.RUNTIME_CONFIG = {
  API_URL: \"$API_URL\",
  DEBUG: ${DEBUG:-false},
  VERSION: \"1.0.0\"
};" > /app/server/public/config.js
echo "已生成运行时配置: API_URL=$API_URL"

# 确保数据库目录存在
mkdir -p /app/server/database

# 检查数据库文件
if [ ! -f /app/server/database/drawdb.sqlite ]; then
  echo "数据库文件不存在，将创建新数据库"
fi

# 启动服务器
echo "启动 Node.js 服务器..."
cd /app/server && node src/index.js 