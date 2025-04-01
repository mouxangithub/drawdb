#!/bin/sh

# Docker 容器内启动脚本
echo "开始启动 DrawDB 服务..."

# 显示环境变量（用于调试）
echo "环境变量配置:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "STATIC_FILES_DIR: $STATIC_FILES_DIR"

# 确保数据库目录存在
mkdir -p /app/server/database
echo "数据库目录已确认: /app/server/database"

# 检查数据库文件
if [ ! -f /app/server/database/drawdb.sqlite ]; then
  echo "数据库文件不存在，将创建新数据库"
fi

# 检查静态文件是否存在
echo "检查静态文件目录..."
if [ -d "/app/server/public" ]; then
  echo "静态文件目录存在: /app/server/public"
  echo "目录内容:"
  ls -la /app/server/public/
  
  if [ -f "/app/server/public/index.html" ]; then
    echo "静态文件检查通过: index.html 文件已找到"
  else
    echo "警告: 静态文件目录中缺少 index.html 文件"
    echo "尝试从备用位置恢复静态文件..."
    
    # 如果有备用静态文件目录，可以尝试复制
    if [ -d "/app/dist" ] && [ -f "/app/dist/index.html" ]; then
      echo "从备用位置复制静态文件..."
      cp -r /app/dist/* /app/server/public/
      echo "复制完成，再次检查:"
      ls -la /app/server/public/
    fi
  fi
else
  echo "警告: 静态文件目录不存在"
  echo "创建静态文件目录..."
  mkdir -p /app/server/public
  
  # 如果有备用静态文件目录，可以尝试复制
  if [ -d "/app/dist" ] && [ -f "/app/dist/index.html" ]; then
    echo "从备用位置复制静态文件..."
    cp -r /app/dist/* /app/server/public/
    echo "复制完成，检查结果:"
    ls -la /app/server/public/
  else
    echo "错误: 未找到可用的静态文件源目录"
    echo "服务可能无法正常提供前端页面"
  fi
fi

# 启动服务器
echo "启动 Node.js 服务器..."
cd /app/server && node src/index.js 