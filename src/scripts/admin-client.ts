/** 浏览器端：调用后端 API（需页面 `<html data-public-api-base>`） */

export const TOKEN_KEY = 'tech_blog_admin_token';

export function getApiBase(): string {
	return (
		document.documentElement.dataset.publicApiBase?.trim() || 'http://localhost:4000'
	).replace(/\/$/, '');
}

export function getToken(): string | null {
	try {
		return sessionStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setToken(t: string) {
	sessionStorage.setItem(TOKEN_KEY, t);
}

export function clearToken() {
	sessionStorage.removeItem(TOKEN_KEY);
}

const FETCH_TIMEOUT_MS = 20_000;

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		Accept: 'application/json',
		...(init.headers as Record<string, string> | undefined),
	};
	if (!headers['Content-Type'] && init.method && init.method !== 'GET' && init.method !== 'HEAD') {
		headers['Content-Type'] = 'application/json';
	}
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	let res: Response;
	try {
		res = await fetch(`${getApiBase()}${path}`, { ...init, headers, signal: controller.signal });
	} catch (e) {
		clearTimeout(t);
		if (e instanceof Error && e.name === 'AbortError') {
			throw new Error(`请求超时（>${FETCH_TIMEOUT_MS / 1000}s）：请确认后端已启动，且 PUBLIC_API_BASE 与浏览器可访问地址一致`);
		}
		throw new Error(
			e instanceof Error ? e.message : '网络错误：无法连接 API（请检查后端是否在运行、端口与 .env 中 PUBLIC_API_BASE）',
		);
	}
	clearTimeout(t);
	const text = await res.text();
	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		/* empty */
	}
	if (res.status === 204) {
		return undefined as T;
	}
	if (!res.ok) {
		let msg = `请求失败 (${res.status})`;
		if (data && typeof data === 'object' && data !== null && 'error' in data) {
			const m = (data as { error?: { message?: unknown } }).error?.message;
			if (typeof m === 'string') msg = m;
			else if (m != null) msg = JSON.stringify(m);
		}
		if (res.status === 401) {
			clearToken();
		}
		throw new Error(msg);
	}
	return data as T;
}

export function redirectToLogin() {
	window.location.href = '/admin/login';
}
