# 部署到 GitHub Pages（`paradisefo.github.io`）

本仓库已支持 **`output: 'static'`** + **GitHub Actions** 自动构建发布。  
静态页在构建时通过 **`PUBLIC_API_BASE`** 拉取已发布文章；**管理后台**仍在浏览器内请求同一 API，请确保 API **公网可访问且已配置 CORS**。

**仅在浏览器里完成的步骤**（Secrets、Pages 源、工作流权限）：见 **`docs/DEPLOY-USER-ONLY.md`** 第 D、F 节。

---

## 一、前提条件

1. **GitHub 仓库**：`ParadiseFo/ParadiseFo.github.io`（用户名与仓库名规则见 GitHub 文档）。  
2. **后端 API**：Fastify 已部署到 **HTTPS**（例如 `https://api.xxx.com` 或云厂商 URL），且 `GET /api/v1/posts` 可匿名访问已发布列表。  
   - 本仓库为 **博客与 `backend/` 同仓**：部署 API 时请在 PaaS 将 **Root Directory** 设为 **`backend`**；详见 **`backend/docs/DEPLOY-PAAS.md`** 第二节。  
3. **本地**（可选）：`node >= 22.12`，能执行 `npm run build`。

---

## 二、一次性配置（在 GitHub 网页上操作）

### 1. 打开 Pages 与 Actions

1. 打开仓库 → **Settings** → **Pages**。  
2. **Build and deployment → Source** 选 **GitHub Actions**（不要选 “Deploy from a branch” 除非你不用本工作流）。  
3. **Settings** → **Actions** → **General** → **Workflow permissions**：勾选 **Read and write**，并允许 GitHub Token 调用 Pages（按页面提示保存）。

### 2. 配置密钥（构建时拉文章列表）

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**。  
2. Name：`PUBLIC_API_BASE`  
3. Value：你的 API 根地址，**无尾部斜杠**，例如：  
   `https://your-api.example.com`  
4. 保存。

> CI 里的 `npm run build` 会用该地址请求文章；若未配置或 API 不可达，构建出的博文列表/单篇可能为空。

### 3. 把代码推到该仓库

在本机博客目录（本仓库根目录）：

```bash
git init
git remote add origin https://github.com/ParadiseFo/ParadiseFo.github.io.git
git add .
git commit -m "Configure static build and GitHub Pages"
git branch -M main
git push -u origin main
```

若远程已存在 README，可先 `git pull origin main --allow-unrelated-histories` 再推送。

---

## 三、自动部署如何工作

- 推送（或手动运行）工作流 **Deploy to GitHub Pages** 时：  
  - 安装依赖 → `npm run build`（注入 `PUBLIC_API_BASE`）→ 上传 `dist/` → 发布到 Pages。  
- 数分钟后访问：**`https://paradisefo.github.io/`**

---

## 四、本地自检

```bash
npm install
set PUBLIC_API_BASE=https://你的API根地址
npm run build
npx serve dist
```

浏览器打开本地 `serve` 给出的地址，检查首页、博文列表、单篇。

> **若未设置 `PUBLIC_API_BASE` 或 API 未启动**，构建会成功，但 **`/blog/某slug/` 不会生成**（列表可能显示错误提示）。以 CI 中配置了 Secret 且 API 可公网访问为准。

---

## 五、常见问题

| 现象 | 处理 |
|------|------|
| Actions 里 build 失败 | 看日志；多为 Node 版本、依赖或 API 超时。 |
| 站点能开但没有文章 | 检查 Secret `PUBLIC_API_BASE`；API 是否 HTTPS；本机 `curl` 该地址 `/api/v1/posts`。 |
| 管理后台登录失败 | API 的 CORS 需允许 `https://paradisefo.github.io`；且 AdminLayout 里 `data-public-api-base` 需指向同一 API（由构建时 `PUBLIC_API_BASE` 注入）。 |
| API 仍在本机 | 需内网穿透或把 API 部署到公网；GitHub 构建环境访问不到 `localhost:4000`。 |

---

## 六、与「仅 Node 部署」的区别

- **GitHub Pages**：只托管 **静态 `dist/`**，不运行 Astro Node 适配器。  
- **后端**：仍在别处运行；本方案未把 MySQL/Fastify 放到 GitHub。
