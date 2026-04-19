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

# 启动前执行迁移（需 DATABASE_URL）；监听端口由平台注入 PORT
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
