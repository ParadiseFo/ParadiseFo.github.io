# 模式 B：前台与管理员共用同一套 API（数据库文章）

目标：**GitHub Pages 上的博文**与 **管理后台里的文章** 都来自 **已部署的 Fastify API + MySQL**，不再使用仓库内 `src/content/blog` 作为线上数据源。

---

## 1. 部署后端 API（公网 HTTPS）

1. 按 **`backend/docs/DEPLOY-PAAS.md`**、**`docs/RAILWAY-MYSQL.md`** 在 Railway（或其它 PaaS）部署 **`backend/`**，并配置 **`DATABASE_URL`、`JWT_SECRET`**。  
2. 记下 API 根地址，例如：`https://xxx.up.railway.app`（**无尾斜杠**）。  
3. 自检：浏览器或 `curl` 访问 **`https://你的API/api/v1/posts`** 能返回 JSON。

---

## 2. GitHub 仓库 Secret（CI 构建拉文章）

1. 打开 **`ParadiseFo/ParadiseFo.github.io`** → **Settings** → **Secrets and variables** → **Actions**。  
2. 新建 **`PUBLIC_API_BASE`** = 上一步的 **HTTPS API 根地址**（与 `curl` 测试用同一前缀）。  
3. 保存后，在 **Actions** 里 **重新运行**「Deploy to GitHub Pages」，或向 `main` 推送一次提交。

构建时 `npm run build` 会带该变量，**博文列表与详情页**会从 API 生成静态 HTML。

---

## 3. 本地开发（`Projects\tech-blog`）

1. 复制 **`.env.example`** 为 **`.env`**（勿提交）。  
2. 设置 **`PUBLIC_API_BASE=http://127.0.0.1:4000`**（或你的本机 API 端口）。  
3. 在 **`backend/`** 执行 **`npm run dev`**（或等价命令），保证 **`GET /api/v1/posts`** 可用。  
4. 博客根目录 **`npm run dev`**，此时 **`/blog`**、管理员均指向同一 API。

---

## 4. 管理后台与 CORS

- 浏览器从 **`https://paradisefo.github.io`** 访问 API 时，后端需允许该来源。当前 Fastify 使用 **`origin: true`**（反射 Origin），一般无需改代码。  
- 登录、编辑、发布仍依赖 **JWT**；请使用已在库里 **`seed`** 或注册的管理员账号。

---

## 5. 静态站限制（必读）

- **新建/发布文章** 发生在数据库；**GitHub Pages 上的 HTML** 在 **每次 CI 构建** 时从 API **快照**生成。  
- 发完文章后需 **重新触发部署**（推送任意提交，或 Actions 里 **Run workflow**），线上 `/blog` 才会出现新文。  
- **管理后台编辑**：使用 **`/admin/posts/edit?id=<文章id>`** 单页 + 浏览器内请求管理 API，**草稿与已发布**均可编辑，**不依赖**构建时为每个 id 生成静态文件。  
- 旧地址 **`/admin/posts/<id>/edit`** 已废弃；部署后若仍打开旧链接，**`404.html`** 会尝试自动跳转到 **`/admin/posts/edit?id=`**（依赖 GitHub Pages 对缺失路径返回站点根目录 `404.html` 的行为）。

---

## 6. 与「仅 Markdown」模式的区别

| 条件 | 行为 |
|------|------|
| **未**设置 `PUBLIC_API_BASE`（本地无 `.env`，CI 无 Secret） | 使用 **`src/content/blog`** 的 Markdown，与管理员数据**无关**。 |
| **已**设置 `PUBLIC_API_BASE` 为合法 URL | 使用 **API**，与管理员**同源**。 |

更多部署步骤见 **`docs/DEPLOY-GITHUB-PAGES.md`**、**`docs/DEPLOY-USER-ONLY.md`**。
