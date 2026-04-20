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
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# 迁移与 HTTP 在同一容器内执行，才能用 mysql.railway.internal 连库。
# （Railway 的 Pre-deploy 在另一环境里跑，常出现 P1001 无法访问私网 MySQL。）
# 健康检查超时见 backend/railway.json（healthcheckTimeout）。
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
