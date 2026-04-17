# tech-blog-api

自建博客后端：Fastify + Prisma（默认 **MySQL**）+ JWT + Argon2，符合 `docs/PRD-backend.md` 首版范围。

从旧版 **SQLite** 迁数据（CSV）：见 **`docs/MIGRATION-SQLITE-MYSQL.md`**。

## 快速开始

```sh
cd backend
cp .env.example .env   # Windows: copy .env.example .env
# 编辑 .env：填写 DATABASE_URL、JWT_SECRET（≥16 字符）、ADMIN_*
# 推荐加密数据库连接串：npx dotenvx encrypt -f .env -k DATABASE_URL（保管 .env.keys）
npm install
npx dotenvx run -- npx prisma migrate dev
npm run db:seed        # 可选：创建管理员
npm run dev            # http://localhost:4000
```

数据库 URL 加密说明：**`docs/ENV-DOTENVX.md`**。

生产环境可将 `DATABASE_URL` 换为托管 **MySQL** / **PostgreSQL**，并重新执行迁移。

## 主要端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/v1/auth/register` | 注册（默认 `reader`） |
| POST | `/api/v1/auth/login` | 登录，返回 `Bearer` JWT |
| POST | `/api/v1/auth/logout` | 需 `Authorization`，无状态 JWT 仅占位 |
| GET | `/api/v1/me` | 当前用户 |
| GET | `/api/v1/posts` | 已发布列表 `?page=&limit=` |
| GET | `/api/v1/posts/:slug` | 已发布详情 |
| GET | `/api/v1/admin/posts` | 管理端列表，需 staff JWT |
| POST | `/api/v1/admin/posts` | 创建文章 |
| GET | `/api/v1/admin/posts/:id` | 单篇详情（管理端） |
| PATCH | `/api/v1/admin/posts/:id` | 更新 |
| POST | `/api/v1/admin/posts/:id/publish` | 发布 |
| DELETE | `/api/v1/admin/posts/:id` | 删除 |

请求头：`Authorization: Bearer <token>`

## 角色

- `reader`：注册默认；不可访问管理接口。
- `author`：可管理**本人**文章。
- `admin`：可管理全部文章。

## 备份（Runbook 摘要）

- SQLite：定期复制 `prisma/dev.db`（或生产库文件）到异地；恢复即停服后替换文件再启动。
- PostgreSQL：使用云厂商自动备份 + 定期 `pg_dump`；恢复按厂商文档执行。

## 构建

```sh
npm run build
npm start              # 生产 / PaaS：环境变量由平台或进程注入
# npm run start:local  # 本机且使用 dotenvx 加密的 .env 时
```

免费 PaaS（Docker / Render / Railway）与安全核对：**`docs/DEPLOY-PAAS.md`**。

## 与 Astro 前台衔接

在 `docs/PRD.md` / `PRD-backend.md` 中选定模式 **A/B/C** 后，可将「发布成功」Webhook 接到 CI，或让前台运行时请求本 API。
