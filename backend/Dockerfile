# 生产镜像：供 Railway / Render 等使用；环境变量在平台控制台注入，勿 bake 进镜像
FROM node:22-bookworm-slim AS base
WORKDIR /app

# Prisma 在 postinstall 时需要 schema；须先于 npm ci 复制 prisma/
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN chmod +x scripts/railway-entrypoint.sh
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# 迁移与 HTTP 同容器；入口脚本在 MySQL 未就绪时短暂重试（仍 P1001 多为同项目/变量问题，见 docs/RAILWAY-MYSQL.md）
CMD ["/bin/sh", "./scripts/railway-entrypoint.sh"]
