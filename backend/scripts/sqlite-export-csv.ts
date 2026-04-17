/**
 * 从 SQLite 文件（如 dev.db）导出 User / Post / AuditLog 为 CSV（方案二：供 MySQL 导入）。
 * 用法：npx tsx scripts/sqlite-export-csv.ts [path/to/dev.db]
 * 默认：backend 目录下的 ./dev.db
 * 输出：./migration-export/User.csv 等
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'csv-stringify/sync';
import initSqlJs from 'sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const outDir = join(backendRoot, 'migration-export');

const tables = ['User', 'Post', 'AuditLog'] as const;

async function main() {
	const raw = process.argv[2];
	// Prisma 常用 `file:./dev.db`（相对 schema），文件常在 prisma/dev.db
	const defaultDb = [join(backendRoot, 'prisma', 'dev.db'), join(backendRoot, 'dev.db')].find((p) =>
		existsSync(p),
	);
	const dbPath = raw
		? isAbsolute(raw)
			? raw
			: join(process.cwd(), raw)
		: defaultDb ?? join(backendRoot, 'prisma', 'dev.db');
	let filebuffer: Buffer;
	try {
		filebuffer = readFileSync(dbPath);
	} catch {
		console.error(`无法读取 SQLite 文件: ${dbPath}`);
		console.error('请先备份 dev.db，并确认路径正确；或传入参数：npx tsx scripts/sqlite-export-csv.ts ./dev.db');
		process.exit(1);
	}

	const SQL = await initSqlJs({
		locateFile: (f) => join(backendRoot, 'node_modules', 'sql.js', 'dist', f),
	});
	const db = new SQL.Database(filebuffer);

	mkdirSync(outDir, { recursive: true });

	for (const table of tables) {
		const res = db.exec(`SELECT * FROM "${table}"`);
		if (!res.length || !res[0].columns.length) {
			const empty = stringify([], { header: true, columns: emptyColumns(table) });
			writeFileSync(join(outDir, `${table}.csv`), empty, 'utf8');
			console.warn(`表 ${table} 无数据，已写入仅含表头的 CSV`);
			continue;
		}
		const { columns, values } = res[0];
		const records = values.map((row) => {
			const obj: Record<string, unknown> = {};
			columns.forEach((col, i) => {
				const v = row[i];
				obj[col] = v === null || v === undefined ? '' : v;
			});
			return obj;
		});
		const csv = stringify(records, { header: true, columns });
		writeFileSync(join(outDir, `${table}.csv`), csv, 'utf8');
		console.log(`已写入 ${join('migration-export', `${table}.csv`)}（${records.length} 行）`);
	}

	db.close();
	console.log(`\n完成。输出目录：${outDir}`);
}

function emptyColumns(table: (typeof tables)[number]): string[] {
	if (table === 'User') {
		return ['id', 'email', 'passwordHash', 'role', 'createdAt', 'emailVerifiedAt'];
	}
	if (table === 'Post') {
		return [
			'id',
			'authorId',
			'slug',
			'title',
			'summary',
			'body',
			'status',
			'publishedAt',
			'createdAt',
			'updatedAt',
		];
	}
	return ['id', 'actorId', 'action', 'targetType', 'targetId', 'metadata', 'createdAt'];
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
