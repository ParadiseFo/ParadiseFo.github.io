# 从 SQLite 迁移到 MySQL（CSV 方案）

## 前提

- 已安装 MySQL，并创建数据库（推荐）：

```sql
CREATE DATABASE techblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- 已备份 **`dev.db`**（整文件复制即可）。

## 步骤概览

1. **从 SQLite 导出 CSV**（不依赖当前 `DATABASE_URL`，只要 `dev.db` 文件还在）。
2. 配置 **`backend/.env`** 中的 **`DATABASE_URL`** 指向 MySQL。
3. **执行 Prisma 迁移**，在 MySQL 中建空表。
4. **将 CSV 导入 MySQL**（空表、无外键冲突）。

---

## 1. 导出 CSV

在 **`backend`** 目录执行：

```bash
npm run db:export-sqlite-csv
```

默认会尝试 **`prisma/dev.db`**，其次 **`dev.db`**（与 Prisma 常用 `file:./dev.db` 一致）。若数据库文件在别处：

```bash
npm run db:export-sqlite-csv -- "D:\path\to\dev.db"
```

输出目录：**`backend/migration-export/`**，包含 `User.csv`、`Post.csv`、`AuditLog.csv`。

---

## 2. 配置 MySQL 连接

编辑 **`backend/.env`**（勿提交到 Git）：

```env
DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/techblog"
```

请把 `techblog` 换成你建库时使用的库名。

---

## 3. 在 MySQL 中建表

仍在 **`backend`** 目录：

```bash
npx prisma migrate deploy
```

开发环境也可用：

```bash
npx prisma migrate dev
```

---

## 4. 导入 CSV

确保 MySQL 里**还没有**这些业务数据（刚迁移完一般是空表）。然后：

```bash
npm run db:import-mysql-csv
```

若 CSV 不在默认的 `migration-export/`：

```bash
npm run db:import-mysql-csv -- "D:\path\to\migration-export"
```

---

## 5. 验证

```bash
npm run dev
```

登录管理后台、打开博文列表与单篇，确认数据与迁移前一致。

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 导入报主键/唯一约束冲突 | 目标库中已有数据；换空库重新 `migrate deploy` 后再导入，或先清空相关表。 |
| 正文过长 | 当前 `schema.prisma` 已为 `summary`/`body`/`metadata` 使用 `@db.Text`，勿改回默认 `VARCHAR(191)`。 |
| `sql.js` 找不到 wasm | 确认已在 `backend` 执行过 `npm install`。 |
| 只想重新导出 | 保留旧 `dev.db` 副本即可随时再执行 `db:export-sqlite-csv`。 |

---

## 仓库说明

- 已从 **SQLite** 切换为 **MySQL** 的 Prisma `provider`；旧版 SQLite 迁移目录已替换为 **`20260416120000_init_mysql`**。
- 若需长期保留 **`dev.db`** 备份，请放在项目外或加入忽略规则，勿提交。
