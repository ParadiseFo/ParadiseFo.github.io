# 环境变量与数据库连接加密（dotenvx）

## 当前做法

- **`DATABASE_URL`**（含 MySQL 密码）使用 [**dotenvx**](https://github.com/dotenvx/dotenvx) **仅加密该字段**，其余变量仍为明文，便于本地阅读。
- **`.env.keys`** 为私钥，用于解密；**切勿提交到 Git**（已在 `backend/.gitignore` 中忽略）。
- **`.env`** 可提交也可不提交：加密后的 `DATABASE_URL` 不以明文形式出现在文件中，但仍建议不要把整个 `.env` 推到公开仓库，除非你确认无其他敏感项。

## 本地必备文件

| 文件 | 说明 |
|------|------|
| `backend/.env` | 含 `encrypted:...` 的 `DATABASE_URL` 等 |
| `backend/.env.keys` | 解密私钥，**自行备份**到密码管理器或安全介质 |

新克隆仓库后：从备份恢复 **`.env`** 与 **`.env.keys`** 到 `backend/` 目录，再执行 `npm install`、`npm run dev`。

## 常用命令

```bash
cd backend

# 修改某条明文后，仅重新加密 DATABASE_URL：
npx dotenvx encrypt -f .env -k DATABASE_URL

# 查看解密后的内容（勿把输出贴到公开处）
npx dotenvx decrypt -f .env
```

所有需要连接数据库的 npm 脚本已改为通过 **`dotenvx run --`** 注入解密后的环境变量（见 `package.json`）。

## 更换 MySQL 密码后

1. 在 `.env` 里把 `DATABASE_URL` 改成新的 `mysql://root:新密码@...`（明文）。
2. 执行：`npx dotenvx encrypt -f .env -k DATABASE_URL`
3. 确认 `.env` 中再次变为 `encrypted:...`，并保管好 `.env.keys`。

## 安全说明

- **加密磁盘上的 `.env` ≠ 数据库层面的密码强度**；若密码曾在聊天、截图中泄露，请在 MySQL 中 **修改 root 密码** 并按上一节更新。
- **JWT_SECRET**、**ADMIN_PASSWORD** 仍为明文；若需同样加密，可执行：  
  `npx dotenvx encrypt -f .env -k JWT_SECRET -k ADMIN_PASSWORD`（按需指定 key）。
