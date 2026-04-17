# 免费 PaaS 部署 API（安全核对 + 操作）

> **只能在浏览器/各平台控制台完成的步骤**（注册、绑卡、填密钥、连 GitHub）：见仓库根目录 **`docs/DEPLOY-USER-ONLY.md`**。

## 一、上线前安全核对（建议自检）

| 项 | 说明 |
|----|------|
| **密钥不进仓库** | `DATABASE_URL`、`JWT_SECRET`、管理员密码只在 **PaaS 控制台 / Secrets** 配置，勿提交 Git。 |
| **JWT_SECRET** | 生产环境使用 **≥32 位随机串**（与本地开发可不同）。 |
| **数据库** | 使用云厂商提供的 **MySQL**（或兼容连接串）；勿把本机 root 密码写进镜像。 |
| **HTTPS** | PaaS 通常自动提供 HTTPS；浏览器访问管理端需 **HTTPS API**，与 `https://paradisefo.github.io` 搭配无混合内容问题。 |
| **CORS** | 当前 `origin: true` 会反射请求来源；上线后若改白名单，需包含 GitHub Pages 域名。 |
| **本机 root 密码** | 若曾在聊天中泄露，仍建议日后在云上 **单独设库用户/强密码**；与是否部署无冲突。 |

---

## 二、博客与后端同仓（monorepo，本仓库布局）

根目录是 **Astro 前台**，API 在 **`backend/`**。部署时注意：**前台和 API 用同一 GitHub 仓库，但 PaaS 只构建子目录。**

| 步骤 | 说明 |
|------|------|
| **连接仓库** | Render / Railway 里选 **同一个** 博客仓库（与推 Pages 的 remote 一致）。 |
| **Root Directory** | 必须填 **`backend`**（名称可能写作 *Root*、*Base directory*）。**不要留空**，否则构建上下文在仓库根，会找不到 `backend/Dockerfile` 或装错 `package.json`。 |
| **Docker** | 在「根目录 = `backend`」的前提下，使用目录内的 **`Dockerfile`** 即可。 |
| **GitHub Pages** | Actions 仍在**仓库根**跑 `npm ci` / `npm run build`；与 API 服务**互不冲突**——只有 API 那条服务要指定子目录 `backend`。 |
| **Blueprint** | 仓库**根目录**的 **`render.yaml`** 已配置 `dockerfilePath: ./backend/Dockerfile` 与 **`dockerContext: ./backend`**，可从**仓库根**用 Render Blueprint 一键创建 API 服务。若不用 Blueprint，在 Dashboard **New → Web Service** 并设 **Root Directory = `backend`** 亦可。 |

---

## 三、推荐组合（免费起步）

| 组件 | 常见选择 |
|------|----------|
| **运行 API** | [Railway](https://railway.app) 或 [Render](https://render.com)（连接 GitHub 仓库部署） |
| **MySQL** | [PlanetScale](https://planetscale.com)（免费档 MySQL 兼容）或 Railway 自带 **MySQL 插件** |

> Prisma 已使用 `provider = mysql`，连接串保持 **`mysql://...`** 即可。

---

## 四、Render 示例（Docker）

1. 在 Render **New → Web Service**，连接 **本博客仓库**，**Root Directory** 填 **`backend`**。  
2. **Environment** → **Docker**（使用 `backend/Dockerfile`）。  
3. **Instance type** 选免费档（有冷启动）。  
4. **Environment Variables** 至少配置：  

   | Key | 说明 |
   |-----|------|
   | `DATABASE_URL` | 云 MySQL 连接串（常含 SSL 参数） |
   | `JWT_SECRET` | 长随机串 |
   | `PORT` | 通常 **10000** 或留空由 Render 注入（见下） |
   | `HOST` | `0.0.0.0` |

   Render 会注入 `PORT`；若容器内未读到，可在控制台显式设 `PORT=10000` 并在代码里已使用 `process.env.PORT`（已支持）。

5. **Build** 首次成功后，在 **Shell** 或本地对同一 `DATABASE_URL` 执行一次种子（可选）：  
   `npx prisma db seed`（需配置 `ADMIN_EMAIL` / `ADMIN_PASSWORD`）。

6. 部署完成后复制 **HTTPS URL**（如 `https://xxx.onrender.com`），**无尾斜杠**，填入 Astro 仓库的 **`PUBLIC_API_BASE`** Secret。

---

## 五、Railway 示例

1. **New Project → Deploy from GitHub** → 选 **本博客仓库**，**Root** 设为 **`backend`**。  
2. 在同一 Project 内 **Add MySQL**，在 API 服务 Variables 里设置 **`DATABASE_URL=${{ MySQL.MYSQL_URL }}`**（`MySQL` 改为画布上实际服务名）；并添加 **`JWT_SECRET`**。  
3. 逐步操作见 **`docs/RAILWAY-MYSQL.md`**（含变量引用与域名）。  
4. Railway 提供 **Generate Domain**，得到 `https://xxx.up.railway.app`，用作 **`PUBLIC_API_BASE`**。

---

## 六、数据库迁移

镜像启动命令已包含 **`npx prisma migrate deploy`**。  
若首次部署失败，检查日志中 Prisma 是否连上 `DATABASE_URL`。

---

## 七、与 GitHub Pages 联动

1. API 公网 HTTPS 可访问：`GET /api/v1/posts` 返回 200。  
2. 在 **ParadiseFo.github.io** 仓库 **Actions → Secrets** 设置 **`PUBLIC_API_BASE`** = 上述根地址。  
3. 重新运行 **Deploy to GitHub Pages** workflow。

---

## 八、本地与生产命令区别

| 场景 | 命令 |
|------|------|
| 本机开发（dotenvx 解密 `.env`） | `npm run dev` |
| 本机运行编译结果且用加密 `.env` | `npm run start:local` |
| **PaaS / Docker**（环境变量由平台注入） | `npm start` → `node dist/server.js` |
