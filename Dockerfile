# ---- builder：编译原生依赖（better-sqlite3）----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# ---- runner：精简运行镜像 ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# 数据目录（挂载卷），交给 node 用户写
RUN mkdir -p /data && chown node:node /data
COPY --from=builder --chown=node:node /app /app
# 数据库与备份默认写到挂载卷
ENV DB_PATH=/data/feedback.db
ENV BACKUP_DIR=/data/backups
USER node
EXPOSE 3000 3001
CMD ["node", "server.js"]
