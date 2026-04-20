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
**Railway**：必须在 **API 服务** 的 Variables 中设置 **`DATABASE_URL`**（可用 `${{ MySQL.MYSQL_URL }}` 引用 MySQL 服务），否则启动时 `prisma migrate` 会报 **P1012**。见仓库根目录 **`docs/RAILWAY-MYSQL.md`**。

### Railway：首次创建管理员（线上没有账号时）

我无法替你在云端数据库里建用户，需要你在 **能连上同一套 `DATABASE_URL`** 的环境里执行一次 **seed**。

1. 打开 **Railway → `tech-blog-api` → Variables**，新增（或临时填写）：
   - **`ADMIN_EMAIL`**：你的邮箱，例如 `you@example.com`
   - **`ADMIN_PASSWORD`**：至少 8 位强密码（**不要用**示例里的默认口令当生产密码）
2. 打开该服务的 **Shell**（或 **Deployments → 某次部署 → Shell**，以你界面为准）。
3. 在容器里执行（工作目录一般为 `/app`）：
   ```sh
   npx prisma db seed
   ```
   成功日志里会有 `Created admin user: ...`。  
   也可使用 **`npm run db:seed:prod`**（与 seed 相同，不经过 dotenvx，依赖平台已注入的环境变量）。
4. 到 **`https://paradisefo.github.io/admin/login`** 用上面邮箱、密码登录（**不要把密码写在网址 `?password=` 里**）。
5. （可选）创建成功后删掉 **`ADMIN_PASSWORD`** 变量，避免长期留在控制台；需要再建账号时再临时加上并跑一次 seed。

说明：**`.env.example` 里的 `admin@example.com` 不会自动出现在数据库里**；公开注册接口默认是 **`reader`**，不能代替管理员，必须用 seed 或数据库里把角色改成 `admin`。

### 前端 + 后端 + 数据库「整条链路」

| 环境 | 数据库 | API | 博客前台（Astro） |
|------|--------|-----|-------------------|
| **线上** | Railway 里 **Add MySQL**，API 服务配 **`DATABASE_URL`** | 同一项目部署 **`backend/`**，生成 **HTTPS** 域名 | **全在 Railway**：再建一服务用根目录 **`Dockerfile.frontend`**，变量 **`PUBLIC_API_BASE` + `PUBLIC_SITE_URL`**，见 **`docs/RAILWAY-FULL-STACK.md`**；**或** 仍用 GitHub Pages 时：Secret **`PUBLIC_API_BASE`**，见 **`docs/MODE-B-API.md`** |
| **本机** | 已装 MySQL，或仓库根 **`docker compose up -d`**（见下） | `backend` 里 **`npm run dev`** | 根目录 `.env` 设 **`PUBLIC_API_BASE=http://127.0.0.1:4000`** |

**可选：用 Docker 只跑 MySQL（本机）** — 仓库根目录：

```sh
copy docker\mysql.env.example docker\mysql.env   # 编辑密码与端口
docker compose up -d
```

将 **`backend/.env`** 里 **`DATABASE_URL`** 指到 **`127.0.0.1:3307`**（与 compose 映射一致），密码与 **`docker/mysql.env`** 里 **`MYSQL_ROOT_PASSWORD`** 相同，再执行迁移与 seed。

## 与 Astro 前台衔接

在 `docs/PRD.md` / `PRD-backend.md` 中选定模式 **A/B/C** 后，可将「发布成功」Webhook 接到 CI，或让前台运行时请求本 API。
