# 部署：必须由你本人完成的步骤（账号 / 浏览器 / 密钥）

仓库内已包含：`backend/Dockerfile`、根目录 `render.yaml`（Render Blueprint）、`railway.json`（Railway Docker 路径）、以及 `backend/docs/DEPLOY-PAAS.md` 技术说明。  
以下步骤**无法由代码替代**，需你在各平台网页上操作。

---

## A. 云数据库（MySQL 连接串 `DATABASE_URL`）

任选其一（免费档以各厂商当前页面为准）：

1. **PlanetScale**（或兼容 MySQL 的托管库）  
   - 注册 → 创建 database → 拿到 **`mysql://...`** 连接串。  
   - 若要求 SSL，把文档要求的参数一并写在 URL 里。

2. **Railway MySQL**（推荐按文档一步步做）  
   - 完整图文流程：**`docs/RAILWAY-MYSQL.md`**（建库 → `MYSQL_URL` → 在 API 服务里设 **`DATABASE_URL=${{ 服务名.MYSQL_URL }}`** → `JWT_SECRET` → 生成域名）。  
   - Railway 提供的是 **`MYSQL_URL`**；Prisma 要用 **`DATABASE_URL`**，需在 **部署 `backend` 的服务** 里做变量引用或手动粘贴，见上文档第五节。

**你需要记下：** 一整条可用的 **`DATABASE_URL`**（或能解析为 `MYSQL_URL` 的引用），且**不要**把它提交到 Git，只在 Railway 控制台配置。

---

## B. 部署 API（Render 或 Railway，二选一即可）

### 方案 B1：Render（Blueprint）

1. 登录 [Render](https://render.com)，用 **GitHub** 授权访问仓库。  
2. **New → Blueprint**（或 **Infrastructure → Blueprints**），选择 **含本博客与 `backend/` 的同一个仓库**。  
3. 使用仓库**根目录**的 `render.yaml` 创建服务。  
4. 向导若提示 **`DATABASE_URL` / `JWT_SECRET`**：  
   - `DATABASE_URL`：粘贴 **A 节** 的连接串。  
   - `JWT_SECRET`：本地生成随机串（建议 **≥32 字符**），自行保存一份密码管理器；**不要**发在聊天或 issue 里。  
5. 等待首次构建与部署；若失败，打开 **Logs** 查看（常见：`DATABASE_URL` 错误、迁移失败、冷启动超时重试）。  
6. 在 **Dashboard** 找到该 Web Service 的 **HTTPS URL**（如 `https://tech-blog-api.onrender.com`），**无尾斜杠**，复制备用——这是 **`PUBLIC_API_BASE`**。

### 方案 B2：Render（手动，不用 Blueprint）

1. **New → Web Service** → 选同一 GitHub 仓库。  
2. **Root Directory** 填 **`backend`**，Runtime 选 **Docker**，使用 `backend/Dockerfile`。  
3. **Environment** 里添加：`DATABASE_URL`、`JWT_SECRET`、`HOST=0.0.0.0`（`PORT` 一般由平台注入）。  
4. 部署完成后同样复制 **HTTPS 根 URL**。

### 方案 C：Railway

1. [Railway](https://railway.app) 用 GitHub 登录 → **New Project → Deploy from GitHub** → 选**本仓库**。  
2. 二选一：  
   - **推荐**：**Service → Settings → Root Directory** 设为 **`backend`**，构建使用 Dockerfile；或  
   - 保持仓库根，在变量里设置 **`RAILWAY_DOCKERFILE_PATH`** = `backend/Dockerfile`（以 Railway 当前文档为准）；仓库根已有 **`railway.json`** 可作参考。  
3. **Variables**：`DATABASE_URL`、`JWT_SECRET`；若用 MySQL 插件，把插件提供的 URL 映射/合并到 `DATABASE_URL`。  
4. **Generate Domain**，得到 `https://xxx.up.railway.app`，无尾斜杠，作为 **`PUBLIC_API_BASE`**。

### 首次管理员（可选）

在对应平台的 **Shell / 一次性本地**（同一 `DATABASE_URL`）执行：

```bash
cd backend
export DATABASE_URL='...'
export ADMIN_EMAIL='你的邮箱'
export ADMIN_PASSWORD='强密码'
npx prisma db seed
```

执行后可在控制台**删除**临时 `ADMIN_PASSWORD` 环境变量（若曾添加）。若种子跳过，多半是库里已有同邮箱用户。

---

## C. 自检 API

在**本机终端**（把 URL 换成你的 HTTPS 根地址）：

```bash
curl -sS "https://你的服务域名/health"
curl -sS "https://你的服务域名/api/v1/posts"
```

应返回 **200** 与 JSON。若 5xx，先看 PaaS **Logs**。

---

## D. GitHub Pages（博客仓库）

前提：站点仓库为 **`ParadiseFo/ParadiseFo.github.io`**（或你的用户名对应规则），且 **main** 分支有本工作流。

1. **Settings → Pages**  
   - **Build and deployment → Source**：选 **GitHub Actions**（不要选 “Deploy from a branch” 除非你不用现有 workflow）。

2. **Settings → Actions → General → Workflow permissions**  
   - 勾选 **Read and write**，并按页面说明保存（便于 `deploy-pages` 上传）。

3. **Settings → Secrets and variables → Actions → New repository secret**  
   - Name：`PUBLIC_API_BASE`  
   - Value：**B 节** 得到的 API **HTTPS 根地址**，**无尾斜杠**，例如 `https://xxx.onrender.com`。

4. **推送 `main`** 或到 **Actions → Deploy to GitHub Pages → Run workflow**，等待成功。

5. 浏览器打开 **`https://paradisefo.github.io/`**（若用户名不同则替换），检查博文列表与管理后台登录。

---

## E. 付费与额度（自行确认）

- Render / Railway / PlanetScale 的 **免费额度、是否要求绑卡**，以**官网与当前账号页面**为准，会变更。  
- 免费 Web 服务常有 **冷启动**（首请求慢），属正常现象。

---

## F. 提交 Git

将本地修改 **commit 并 push** 到你用于部署的远程（与 Render/Railway 连接的同一仓库）。  
若你只在单机改代码、从未 push，平台**不会**自动更新。

---

## 核对清单（打勾即可上线）

- [ ] 云 MySQL 已创建，`DATABASE_URL` 可用  
- [ ] PaaS 已配置 `DATABASE_URL` + `JWT_SECRET`，API **HTTPS** 可访问  
- [ ] （可选）已 `db seed` 管理员  
- [ ] Pages 仓库已设 `PUBLIC_API_BASE`，workflow 已跑绿  
- [ ] 浏览器验证 `paradisefo.github.io` 与 `/admin` 能连上 API  

更多技术细节见 **`backend/docs/DEPLOY-PAAS.md`** 与 **`docs/DEPLOY-GITHUB-PAGES.md`**。
