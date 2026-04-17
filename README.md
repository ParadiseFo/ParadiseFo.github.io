# 技术随笔（Astro / SSG）

本仓库在官方 **Blog** 模板基础上做了定制：中文界面与示例文章、**KaTeX 数学公式**（`remark-math` + `rehype-katex`）、构建期 **Shiki 代码高亮**。**产品需求**：前台见 `docs/PRD.md`（**v0.2：线上文章以后端 / 数据库为主**），自建 API 与管理后台见 `docs/PRD-backend.md`。**衔接方式**：**模式 B** — 博文列表与详情为 **SSR**，运行时请求 `PUBLIC_API_BASE`（见根目录 `.env.example`）。**管理后台**：`/admin/login`（登录后可在浏览器新建/编辑/发布文章，Token 存 `sessionStorage`）。**同时需运行后端** `backend/`。`src/content` 下 Markdown 不再作为线上列表数据源，仅可作本地示例。**后端**：`backend/`（Fastify，见 `backend/README.md`）。部署：Node 适配器产物在 `dist/`，请先 `npm run build` 再按 `@astrojs/node` 文档启动；并将 `astro.config.mjs` 中 `site` 改为正式域名。

```sh
npm install
npm run dev
```

---

# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support
- ✅ KaTeX + remark-math（本项目已配置）

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
