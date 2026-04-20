#!/bin/sh
# Railway：MySQL 可能比 API 晚几秒就绪，迁移失败时短暂重试；仍失败则退出（多为 DATABASE_URL / 同项目私网问题）
max="${PRISMA_MIGRATE_RETRIES:-40}"
i=0
while [ "$i" -lt "$max" ]; do
	if ./node_modules/.bin/prisma migrate deploy; then
		exec node dist/server.js
	fi
	i=$((i + 1))
	echo "prisma migrate deploy failed (attempt $i/$max), retry in 3s..."
	sleep 3
done
echo "Giving up after $max attempts. Check DATABASE_URL and that MySQL is in the same Railway project."
exit 1
