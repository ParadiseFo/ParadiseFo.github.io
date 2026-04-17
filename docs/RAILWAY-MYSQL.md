# Railway MySQL：从建库到接到本仓库 API（详细步骤）

适用于：**博客与 `backend/` 同仓**，在 **Railway** 上同时跑 **MySQL** 与 **Fastify API**。  
Prisma 使用环境变量 **`DATABASE_URL`**；Railway 的 MySQL 服务会提供 **`MYSQL_URL`** 等变量（见 [官方文档](https://docs.railway.com/databases/mysql)）。

---

## 一、准备工作

1. 浏览器打开 [railway.app](https://railway.app)，用 **GitHub** 登录（或邮箱注册后再绑定 GitHub）。  
2. 准备 **本博客仓库** 的推送权限（与本地 `git remote` 一致），后面要 **Deploy from GitHub**。

---

## 二、新建项目并添加 MySQL

1. 在 Railway 首页点 **New Project**。  
2. 任选其一：  
   - **Empty Project**（空项目），进入画布后再加数据库；或  
   - 若向导里直接有 **Provision MySQL** / **Database**，可先建库。  
3. 在 **Project** 画布上，点 **`+ New`**（或按 **`Ctrl+K` / `Cmd+K`** 打开命令面板），选择 **Database** → **Add MySQL**（名称可能是 **MySQL**，以界面为准）。  
4. 也可使用官方模板入口：[MySQL template](https://railway.com/deploy/mysql)（会新建项目并部署 MySQL）。  
5. 等待 MySQL 服务 **Deploy 成功**（图标变绿或状态为 Running）。首次会拉取官方 MySQL 镜像，需一两分钟。

---

## 三、确认 MySQL 提供的变量

1. 点击画布上的 **MySQL** 服务卡片。  
2. 打开 **Variables**（变量）标签页。  
3. 你会看到类似变量（名称以 [Railway MySQL 文档](https://docs.railway.com/databases/mysql) 为准）：

   | 变量 | 含义 |
   |------|------|
   | `MYSQLHOST` | 主机名 |
   | `MYSQLPORT` | 端口 |
   | `MYSQLUSER` | 用户名 |
   | `MYSQLPASSWORD` | 密码 |
   | `MYSQLDATABASE` | 数据库名 |
   | **`MYSQL_URL`** | **一整条连接 URL**（给应用用最省事） |

4. **记下 MySQL 服务在画布上的名称**（例如 `MySQL`、`mysql-production`）。后面写 **引用变量** 时要和这个名字一致（区分大小写，以界面为准）。

---

## 四、添加 API 服务（本仓库 `backend/`）

1. 在同一 **Project** 里，点 **`+ New`** → **GitHub Repo**（或 **GitHub Repository**）。  
2. 选中你的 **博客仓库**（含 `backend/` 的 monorepo）。  
3. Railway 会创建一个 **Web Service**。进入该服务 → **Settings**：  
   - **Root Directory** 填 **`backend`**（只构建子目录，与 `backend/Dockerfile` 一致）。  
4. 若未自动识别 Docker，在 **Settings** 里将 **Builder** 设为 **Dockerfile**，并确认路径为 `Dockerfile`（相对 `backend/`）。仓库根已有 **`railway.json`** 时，一般可辅助识别 **`backend/Dockerfile`**；若构建仍失败，可在 Variables 里增加 **`RAILWAY_DOCKERFILE_PATH`** = `backend/Dockerfile`（以 [Railway 文档](https://docs.railway.com/deployments/monorepo) 为准）。  
5. 保存后等待 **首次构建与部署**。

---

## 五、把 MySQL 接到 Prisma：`DATABASE_URL`

Prisma 只认 **`DATABASE_URL`**，不会自动读 `MYSQL_URL`。需要在 **API 服务**（不是 MySQL 服务）里配置：

### 推荐：引用 MySQL 服务的 `MYSQL_URL`

1. 打开 **API 服务**（部署 `backend` 的那个）→ **Variables**。  
2. **New Variable**：  
   - **Name**：`DATABASE_URL`  
   - **Value**：使用 Railway **引用语法**，把 MySQL 的 `MYSQL_URL` 指过来：

   ```text
   ${{ MySQL.MYSQL_URL }}
   ```

   若你的 MySQL 服务在画布上不叫 `MySQL`，把 **`MySQL`** 改成 **实际服务名**（在 Variables 输入框里通常有 **自动补全**，选 `服务名.MYSQL_URL` 即可）。

   官方说明：[Referencing another service's variable](https://docs.railway.com/variables#referencing-another-services-variable)。

3. 再添加：  
   - **`JWT_SECRET`**：长随机串（建议 ≥32 字符），可手写或用密码生成器，**不要**提交到 Git。  
   - **`HOST`** = `0.0.0.0`（若未在镜像里默认）。  
4. **Deploy / Redeploy** 让新变量生效。

### 备选：不用引用，手动粘贴

在 MySQL 服务的 **Variables** 或 **Connect** 界面复制 **`MYSQL_URL`** 的完整值，到 API 服务的 **`DATABASE_URL`** 里粘贴。**缺点**：MySQL 密码轮换后要手动更新；**引用**可随 Railway 内部更新。

---

## 六、迁移与启动

本仓库 Docker 启动命令已包含 **`npx prisma migrate deploy`**。  
配置好 `DATABASE_URL` 并 **Redeploy** 后，日志里应出现迁移成功；若失败，打开 API 服务的 **Logs** 查看 Prisma 报错。

---

## 七、公网域名（给 GitHub Pages 的 `PUBLIC_API_BASE`）

1. 选中 **API 服务** → **Settings** → **Networking** / **Generate Domain**（以当前 UI 为准）。  
2. 生成公网 HTTPS 地址，例如 `https://xxx.up.railway.app`。  
3. **无尾斜杠**，整段填入博客仓库 GitHub Actions Secret **`PUBLIC_API_BASE`**。

---

## 八、可选：第一个管理员（Seed）

在 **API 服务** 的 **Variables** 里临时添加（或用一次后删除）：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

然后使用 **Railway Shell**（若可用）或本机安装 [Railway CLI](https://docs.railway.com/cli) 后执行：

```bash
cd backend
railway run npx prisma db seed
```

或在本机导出与线上一致的 `DATABASE_URL` 后执行 `npx prisma db seed`。种子逻辑见 `backend/prisma/seed.ts`。

---

## 九、从本机连 Railway MySQL（调试）

Railway 对 MySQL 默认开启 **TCP Proxy**，可从本机用 MySQL 客户端连接；**出站流量可能计费**，见 [定价说明](https://docs.railway.com/pricing/plans#resource-usage-pricing)。  
在 MySQL 服务界面查看 **Connect** / **Data** 中的主机、端口、用户、密码。

---

## 十、常见问题

| 现象 | 处理 |
|------|------|
| `DATABASE_URL` 未定义 | 确认变量加在 **API 服务**，且已 Redeploy。 |
| 引用变量语法报错 | 检查服务名是否与画布一致；用 Variables 里的 **自动补全** 插入引用。 |
| Prisma 报 SSL | 若 `MYSQL_URL` 不含 SSL 参数，可在 URL 末尾追加 `?sslaccept=strict`（先备份原串再改）。 |
| 只想先测库、不测 API | 仍建议在同一 Project 内，便于内网引用 `${{ MySQL.MYSQL_URL }}`。 |

---

## 十一、费用说明

Railway 以 **用量/订阅** 计费，**是否免费、试用额度** 以 [官网定价](https://railway.com/pricing) 与账户页为准，会变更。

更多部署总览见 **`docs/DEPLOY-USER-ONLY.md`** 与 **`backend/docs/DEPLOY-PAAS.md`**。
