#!/bin/bash

# 测试脚本 - 模拟容器内环境
echo "模拟 Docker 容器环境..."

# 设置测试环境变量
export NODE_ENV=production
export PORT=3000
export API_URL=/api
export DEBUG=false

# 创建必要的目录结构
mkdir -p public
mkdir -p server/database

# 执行启动脚本
echo "执行 docker-start.sh..."
./docker-start.sh

# 检查结果
echo "检查生成的配置文件..."
if [ -f public/config.js ]; then
  echo "配置文件已生成:"
  cat public/config.js
else
  echo "配置文件未生成!"
fi 