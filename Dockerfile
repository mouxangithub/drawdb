# 阶段1: 构建前端和后端
FROM node:20-alpine AS build
WORKDIR /app

# 安装基本工具便于调试
RUN apk add --no-cache git curl

# 提高npm的调试信息
ENV NPM_CONFIG_LOGLEVEL=verbose

# 先安装根项目依赖
COPY package*.json ./
RUN echo "Installing frontend dependencies..." && \
    npm install --no-audit --no-fund && \
    echo "Frontend dependencies installed successfully."

# 再安装后端依赖
WORKDIR /app/server
COPY server/package*.json ./
RUN echo "Installing backend dependencies..." && \
    npm install --no-audit --no-fund && \
    echo "Backend dependencies installed successfully."

# 回到根目录复制所有文件
# 注意：dist目录不会包含在源代码中，因为它已被添加到.gitignore文件
# 下面的构建步骤会在Docker构建过程中重新生成dist目录
WORKDIR /app
COPY . .

# 确保不复制数据库文件
RUN rm -f /app/server/database/*.sqlite

# 构建前端并复制到后端的静态目录
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN echo "Building frontend..." && \
    npm run build && \
    mkdir -p /app/server/public && \
    cp -r /app/dist/* /app/server/public/ && \
    ls -la /app/server/public/ && \
    echo "Frontend built and copied to server/public successfully."

# 阶段2: 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 复制后端代码和依赖
COPY --from=build /app/server ./server

# 确保复制了前端静态文件
COPY --from=build /app/server/public ./server/public

# 确保数据库目录存在，但不包含任何数据文件
RUN mkdir -p /app/server/database && \
    touch /app/server/database/.gitkeep && \
    echo "数据库文件将通过卷挂载提供，不包含在镜像中" > /app/server/database/README.txt

# 列出目录结构
RUN ls -la /app && \
    ls -la /app/server && \
    ls -la /app/server/public || echo "Public directory not found!" && \
    ls -la /app/server/database

# 配置环境变量
ENV NODE_ENV=production
# 默认使用/api作为基础路径
ENV PORT=3000

# 添加调试信息日志
RUN echo "NODE_ENV=${NODE_ENV}" && \
    echo "PORT=${PORT}"

# 安装生产环境依赖
WORKDIR /app/server
RUN echo "Installing production dependencies..." && \
    npm install --no-audit --no-fund --only=production && \
    echo "Production dependencies installed successfully."

# 暴露后端端口，使用变量保持一致性
EXPOSE ${PORT}

# 添加启动脚本
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# 启动应用，使用启动脚本
WORKDIR /app
CMD ["/app/docker-start.sh"]