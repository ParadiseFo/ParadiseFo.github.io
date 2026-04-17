/**
 * 是否用公网 API 拉取文章。仅在配置了有效、非本机的 PUBLIC_API_BASE 时为 true。
 * GitHub Pages 未配置 Secret 时走本地 content collection，避免默认指向 127.0.0.1:4000。
 */
export function usePublicApiForPosts(): boolean {
	const raw = import.meta.env.PUBLIC_API_BASE;
	if (raw === undefined || raw === null) return false;
	const base = String(raw).trim();
	if (base === '') return false;
	try {
		const u = new URL(base);
		const host = u.hostname.toLowerCase();
		if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1') {
			return false;
		}
	} catch {
		return false;
	}
	return true;
}
