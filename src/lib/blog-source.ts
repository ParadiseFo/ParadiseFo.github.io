/**
 * 是否从后端 API 拉取博文（与管理员、数据库同源）。
 * - 未设置 `PUBLIC_API_BASE`（或空字符串）时：构建使用 `src/content/blog` 的 Markdown（无 Secret 的 CI 友好）。
 * - 已设置任意合法 URL（含本机 `http://127.0.0.1:4000`）时：走 API，与选项 B（管理员发文）一致。
 */
export function usePublicApiForPosts(): boolean {
	const raw = import.meta.env.PUBLIC_API_BASE;
	if (raw === undefined || raw === null) return false;
	const base = String(raw).trim();
	if (base === '') return false;
	try {
		new URL(base);
		return true;
	} catch {
		return false;
	}
}
