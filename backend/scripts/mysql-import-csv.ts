/**
 * 将 migration-export/*.csv 导入当前 DATABASE_URL 指向的 MySQL（需已 prisma migrate）。
 * 用法：在 backend 目录且 .env 中 DATABASE_URL 为 MySQL 后执行：
 *   npx tsx scripts/mysql-import-csv.ts [migration-export 目录]
 */
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

/** SQLite 导出可能为 ISO 字符串或毫秒/秒级时间戳（纯数字） */
function parseDate(s: string | undefined, fallback?: Date): Date {
	if (s == null || s.trim() === '') {
		return fallback ?? new Date();
	}
	const t = s.trim();
	if (/^\d+$/.test(t)) {
		const n = Number(t);
		return new Date(n < 1e12 ? n * 1000 : n);
	}
	const d = new Date(t);
	if (Number.isNaN(d.getTime())) {
		return fallback ?? new Date();
	}
	return d;
}

function parseOptionalDate(s: string | undefined): Date | null {
	if (s == null || s.trim() === '') return null;
	const t = s.trim();
	if (/^\d+$/.test(t)) {
		const n = Number(t);
		return new Date(n < 1e12 ? n * 1000 : n);
	}
	const d = new Date(t);
	return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
	// 由 `dotenvx run` 启动时已注入解密后的 DATABASE_URL，切勿再用 dotenv 读加密 .env 覆盖
	if (!process.env.DATABASE_URL) {
		loadEnv({ path: join(backendRoot, '.env') });
	}

	const rawDir = process.argv[2];
	const dir = rawDir
		? isAbsolute(rawDir)
			? rawDir
			: join(process.cwd(), rawDir)
		: join(backendRoot, 'migration-export');
	const prisma = new PrismaClient();

	const userCsv = readFileSync(join(dir, 'User.csv'), 'utf8');
	const postCsv = readFileSync(join(dir, 'Post.csv'), 'utf8');
	const auditCsv = readFileSync(join(dir, 'AuditLog.csv'), 'utf8');

	const users = parse(userCsv, { columns: true, skip_empty_lines: true, trim: true }) as Record<
		string,
		string
	>[];
	const posts = parse(postCsv, { columns: true, skip_empty_lines: true, trim: true }) as Record<
		string,
		string
	>[];
	const audits = parse(auditCsv, { columns: true, skip_empty_lines: true, trim: true }) as Record<
		string,
		string
	>[];

	await prisma.$transaction(async (tx) => {
		if (users.length) {
			for (const u of users) {
				if (!u.id) continue;
				await tx.user.create({
					data: {
						id: u.id,
						email: u.email,
						passwordHash: u.passwordHash,
						role: u.role as 'reader' | 'admin' | 'author',
						createdAt: parseDate(u.createdAt),
						emailVerifiedAt: parseOptionalDate(u.emailVerifiedAt),
					},
				});
			}
			console.log(`User: 导入 ${users.filter((x) => x.id).length} 条`);
		}
		if (posts.length) {
			for (const p of posts) {
				if (!p.id) continue;
				await tx.post.create({
					data: {
						id: p.id,
						authorId: p.authorId,
						slug: p.slug,
						title: p.title,
						summary: p.summary,
						body: p.body,
						status: p.status as 'draft' | 'published' | 'archived',
						publishedAt: parseOptionalDate(p.publishedAt),
						createdAt: parseDate(p.createdAt),
						updatedAt: parseDate(p.updatedAt),
					},
				});
			}
			console.log(`Post: 导入 ${posts.filter((x) => x.id).length} 条`);
		}
		if (audits.length) {
			for (const a of audits) {
				if (!a.id) continue;
				await tx.auditLog.create({
					data: {
						id: a.id,
						actorId: a.actorId,
						action: a.action,
						targetType: a.targetType,
						targetId: a.targetId,
						metadata: a.metadata || null,
						createdAt: parseDate(a.createdAt),
					},
				});
			}
			console.log(`AuditLog: 导入 ${audits.filter((x) => x.id).length} 条`);
		}
	});

	await prisma.$disconnect();
	console.log('CSV 导入完成。');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
