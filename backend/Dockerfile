# 生产镜像：供 Railway / Render 等使用；环境变量在平台控制台注入，勿 bake 进镜像
FROM node:22-bookworm-slim AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# 启动前执行迁移（需 DATABASE_URL）；监听端口由平台注入 PORT
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
