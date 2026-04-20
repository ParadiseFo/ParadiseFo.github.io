# 全栈在 Railway：MySQL + API + 博客前台

在同一 **Railway Project** 里放三个部分：**MySQL**、**Fastify API（`backend/`）**、**Astro 静态前端（仓库根目录）**。不再依赖 GitHub Pages 托管前台时，按本文操作即可。

---

## 架构

```text
用户浏览器
   → 前端服务（HTTPS，serve dist）
   → 管理后台与构建期文章均请求 API
   → API 服务（HTTPS）
   → MySQL 插件
```

---

## 1. MySQL

1. 项目画布 **+ New** → **Database** → **Add MySQL**。  
2. 等待 Running。记下画布上 **MySQL 服务名称**（例如 `MySQL`）。

详见 **`docs/RAILWAY-MYSQL.md`** 第二～三节。

---

## 2. API 服务（`backend/`）

1. **+ New** → **GitHub Repo** → 选本仓库。  
2. **Settings**：  
   - **Root Directory**：`backend`  
   - **Builder**：**Dockerfile**（路径 `Dockerfile`，即 `backend/Dockerfile`）。  
3. **Variables**（API 服务上）：  

   | 变量 | 值 |
   |------|-----|
   | `DATABASE_URL` | `${{ MySQL.MYSQL_URL }}`（`MySQL` 改成你的 MySQL 服务名） |
   | `JWT_SECRET` | 长随机串 |

4. **Networking** → **Public networking** → **Generate domain**，得到例如 `https://tech-blog-api-production.up.railway.app`（示例）。  
5. 等部署成功；用浏览器或 `curl` 访问：  
   `https://你的API域名/health`  
   `https://你的API域名/api/v1/posts`

---

## 3. 前端服务（Astro，仓库根）

1. 同一项目 **+ New** → 再选 **同一 GitHub 仓库**（第二个 Web Service）。  
2. **Settings**：  
   - **Root Directory**：留空（仓库根目录）。  
   - **Dockerfile Path**：`Dockerfile.frontend`。  
3. **Variables**（前端服务上，构建与运行都需要；名称与 `Dockerfile.frontend` 里 `ARG` 一致）：  

   | 变量 | 说明 |
   |------|------|
   | `PUBLIC_API_BASE` | 上一步 API 的 **HTTPS 根地址**，无尾斜杠，例如 `https://tech-blog-api-production.up.railway.app` |
   | `PUBLIC_SITE_URL` | **本前端服务** 的 **HTTPS 根地址**（见下） |

4. 先生成前端域名，再填 `PUBLIC_SITE_URL`：  
   - 在该前端服务 **Networking** → **Generate domain**，得到例如 `https://tech-blog-web-production.up.railway.app`。  
   - 把 **完整 HTTPS URL**（无尾斜杠）写入 **`PUBLIC_SITE_URL`**。  
5. **Deploy / Redeploy**。构建阶段会执行 `npm run build`，从 API 拉文章进静态页；运行阶段用 `serve` 监听 **`PORT`**。

若先部署再改域名：更新 `PUBLIC_SITE_URL` 后 **再部署一次**，以便 sitemap / 绝对链接正确。

---

## 4. 发新文章后

静态页在 **构建时** 从 API 拉数据：**在后台发布文章后**，需要 **重新部署前端服务**（或推送触发构建），线上博文列表才会更新。与 GitHub Pages 模式相同，见 **`docs/MODE-B-API.md`** 第五节。

---

## 5. 可选：不再使用 GitHub Pages

若前台已全在 Railway，可关闭仓库 **Settings → Pages** 或不再依赖 **Actions** 里的 Pages workflow，避免两套站点混淆。

---

## 6. 故障速查

| 现象 | 处理 |
|------|------|
| API 报 `P1012` / `DATABASE_URL` | `DATABASE_URL` 必须加在 **API 服务**，不是仅 MySQL 服务。见 **`docs/RAILWAY-MYSQL.md`**。 |
| 前端构建无文章 | `PUBLIC_API_BASE` 错、API 未 HTTPS、或构建时 API 不可达。 |
| 管理后台连不上 API | 浏览器控制台看请求地址；应指向 API 的公网 HTTPS。 |
| `site` / 站内链接不对 | 检查 **`PUBLIC_SITE_URL`** 是否等于当前前端 Railway 域名并重部署。 |

仓库根 **`astro.config.mjs`** 中 `site` 使用 **`PUBLIC_SITE_URL`**（未设时回退到 `https://paradisefo.github.io`，仅适合仍用 GitHub Pages 时）。
