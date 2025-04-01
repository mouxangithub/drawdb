# 阶段1: 构建前端和后端
FROM node:20-alpine AS build
WORKDIR /app

# 安装基本工具便于调试
RUN apk add --no-cache git curl

# 提高npm的调试信息
ENV NPM_CONFIG_LOGLEVEL=verbose

# 先安装根项目依赖
COPY package*.json ./
RUN echo "安装前端依赖..." && \
    npm install --no-audit --no-fund && \
    echo "前端依赖安装成功。"

# 再安装后端依赖
WORKDIR /app/server
COPY server/package*.json ./
RUN echo "安装后端依赖..." && \
    npm install --no-audit --no-fund && \
    echo "后端依赖安装成功。"

# 回到根目录复制所有文件
# 注意：dist目录不会包含在源代码中，因为它已被添加到.gitignore文件
# 下面的构建步骤会在Docker构建过程中重新生成dist目录
WORKDIR /app
COPY . .

# 确保不复制数据库文件
RUN rm -f /app/server/database/*.sqlite

# 构建前端并复制到后端的静态目录
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN echo "构建前端..." && \
    npm run build && \
    echo "前端构建成功，生成目录为:" && \
    ls -la /app/dist/ && \
    echo "创建服务器静态目录..." && \
    mkdir -p /app/server/public && \
    echo "复制前端静态文件到服务器目录..." && \
    cp -r /app/dist/* /app/server/public/ && \
    echo "验证复制结果:" && \
    ls -la /app/server/public/ && \
    echo "前端静态文件已成功复制到服务器目录。"

# 阶段2: 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 复制后端代码和依赖
COPY --from=build /app/server ./server

# 确保复制了前端静态文件
RUN echo "验证前端静态文件是否成功复制:" && \
    ls -la /app/server/public/ || echo "公共目录未找到，构建可能失败!"

# 确保数据库目录存在，但不包含任何数据文件
RUN mkdir -p /app/server/database && \
    touch /app/server/database/.gitkeep && \
    echo "数据库文件将通过卷挂载提供，不包含在镜像中" > /app/server/database/README.txt

# 列出目录结构以便调试
RUN echo "目录结构：" && \
    ls -la /app && \
    echo "服务器目录：" && \
    ls -la /app/server && \
    echo "静态文件目录：" && \
    ls -la /app/server/public || echo "静态文件目录不存在!" && \
    echo "数据库目录：" && \
    ls -la /app/server/database

# 配置环境变量
ENV NODE_ENV=production
# 默认使用/api作为基础路径
ENV PORT=3000
# 明确指定静态文件目录
ENV STATIC_FILES_DIR=/app/server/public

# 添加调试信息日志
RUN echo "环境配置：" && \
    echo "NODE_ENV=${NODE_ENV}" && \
    echo "PORT=${PORT}" && \
    echo "STATIC_FILES_DIR=${STATIC_FILES_DIR}"

# 安装生产环境依赖
WORKDIR /app/server
RUN echo "安装生产环境依赖..." && \
    npm install --no-audit --no-fund --only=production && \
    echo "生产环境依赖安装成功。"

# 暴露后端端口，使用变量保持一致性
EXPOSE ${PORT}

# 添加启动脚本
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# 启动应用，使用启动脚本
WORKDIR /app
CMD ["/app/docker-start.sh"]