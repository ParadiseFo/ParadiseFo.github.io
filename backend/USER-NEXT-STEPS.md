# 迁移进度（助手已完成的步骤）

1. 已从 **`prisma/dev.db`** 导出 CSV 到 **`migration-export/`**（`User.csv`、`Post.csv`、`AuditLog.csv`）。
2. 已安装 **`csv-stringify` / `csv-parse` / `sql.js` / `dotenv`** 等依赖，`npm run db:export-sqlite-csv` 默认可识别 **`prisma/dev.db`**。

---

# 需要你在本机完成的步骤（需 MySQL `root` 密码）

## 1. 建库（若尚未创建）

在 **MySQL 命令行**或 **Workbench** 中执行：

```sql
CREATE DATABASE IF NOT EXISTS techblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. 编辑 **`backend/.env`**

把 **`DATABASE_URL`** 改成（**把 `你的密码` 换成真实 root 密码**；密码里若有 `@`、`:` 等符号，需做 [URL 编码](https://www.urlencoder.org/)）：

```env
DATABASE_URL="mysql://root:你的密码@127.0.0.1:3306/techblog"
```

可删除或注释掉原来的 `file:./dev.db` 行。

## 3. 在 **`backend`** 目录执行

```bash
npx prisma migrate deploy
npm run db:import-mysql-csv
npm run dev
```

若 `migrate deploy` 报「表已存在」，说明库里有旧结构；请换空库 `techblog` 或先自行清空相关表后再执行。

## 4. 验证

浏览器打开管理端 / 博文列表，确认文章与账号与迁移前一致。

---

**说明**：助手无法代你输入 MySQL 密码，故 **`migrate deploy`** 与 **`db:import-mysql-csv`** 必须由你在填好 `.env` 后本地执行。
