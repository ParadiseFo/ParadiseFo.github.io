/**
 * 公网可读接口（与 backend 对齐）。开发时在 `.env` 设置 `PUBLIC_API_BASE`。
 */
export function getApiBase(): string {
	const base = import.meta.env.PUBLIC_API_BASE;
	if (!base || typeof base !== 'string') {
		return 'http://127.0.0.1:4000';
	}
	return base.replace(/\/$/, '');
}

export type PostListItem = {
	id: string;
	slug: string;
	title: string;
	summary: string;
	publishedAt: string | null;
	updatedAt: string;
};

export type PostListResponse = {
	data: PostListItem[];
	meta: { page: number; limit: number; total: number; totalPages: number };
};

export type PostDetailResponse = {
	data: {
		id: string;
		slug: string;
		title: string;
		summary: string;
		body: string;
		publishedAt: string | null;
		updatedAt: string;
		author: { id: string; email: string };
	};
};

export async function fetchPostList(page = 1, limit = 20): Promise<PostListResponse> {
	const url = `${getApiBase()}/api/v1/posts?page=${page}&limit=${limit}`;
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!res.ok) {
		throw new Error(`fetchPostList failed: ${res.status}`);
	}
	return res.json() as Promise<PostListResponse>;
}

export async function fetchPostBySlug(
	slug: string,
): Promise<PostDetailResponse['data'] | null> {
	const url = `${getApiBase()}/api/v1/posts/${encodeURIComponent(slug)}`;
	const res = await fetch(url, { headers: { Accept: 'application/json' } });
	if (res.status === 404) {
		return null;
	}
	if (!res.ok) {
		throw new Error(`fetchPostBySlug failed: ${res.status}`);
	}
	const json = (await res.json()) as PostDetailResponse;
	return json.data;
}
