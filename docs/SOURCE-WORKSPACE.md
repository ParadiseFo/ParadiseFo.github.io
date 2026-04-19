# 本地以哪份目录为准？

日常改文章、改页面请以本机 **`C:\Users\paradise\Projects\tech-blog`** 为准，并在此目录执行 **`git add` / `commit` / `push`** 到 **`ParadiseFo/ParadiseFo.github.io`**。

此前若曾在 **`.cursor\projects\empty-window\blog`** 推送，两处容易不同步；现在远程仓库应与 **`Projects\tech-blog`** 对齐。

推送后等待 GitHub **Actions** 完成，再访问站点。

若要让 **线上博文与管理员文章一致**，请按 **`docs/MODE-B-API.md`** 配置 **`PUBLIC_API_BASE`**（Secret + 本地 `.env`）。
