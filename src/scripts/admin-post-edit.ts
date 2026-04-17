import { apiJson, getToken, redirectToLogin } from './admin-client';

type Post = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	body: string;
	status: string;
	updatedAt: string;
	publishedAt: string | null;
	author: { email: string };
};

function getPostId(): string {
	return (document.getElementById('postId') as HTMLInputElement)?.value?.trim() ?? '';
}

function init() {
	const msg = document.getElementById('msg') as HTMLDivElement;
	const ok = document.getElementById('ok') as HTMLDivElement;
	const form = document.getElementById('form') as HTMLFormElement;
	const loading = document.getElementById('loading') as HTMLParagraphElement;
	const meta = document.getElementById('meta') as HTMLParagraphElement;

	if (!getToken()) {
		redirectToLogin();
		return;
	}
	if (!getPostId()) {
		loading.textContent = '无效的文章链接';
		msg.textContent = '缺少文章 ID，请从列表重新进入。';
		msg.style.display = 'block';
		return;
	}

	async function load() {
		const postId = getPostId();
		if (!postId) return;
		try {
			const res = await apiJson<{ data: Post }>(`/api/v1/admin/posts/${encodeURIComponent(postId)}`);
			const p = res.data;
			(document.getElementById('title') as HTMLInputElement).value = p.title;
			(document.getElementById('slug') as HTMLInputElement).value = p.slug;
			(document.getElementById('summary') as HTMLTextAreaElement).value = p.summary;
			(document.getElementById('body') as HTMLTextAreaElement).value = p.body;
			meta.textContent = `状态：${p.status} · 更新：${new Date(p.updatedAt).toLocaleString('zh-CN')} · 作者：${p.author.email}`;
			loading.style.display = 'none';
			form.style.display = 'block';
		} catch (e) {
			const text = e instanceof Error ? e.message : '加载失败';
			loading.textContent = text;
			msg.textContent = text;
			msg.style.display = 'block';
		}
	}

	function showOk(text: string) {
		ok.textContent = text;
		ok.style.display = 'block';
		setTimeout(() => {
			ok.style.display = 'none';
		}, 2500);
	}

	document.getElementById('save')?.addEventListener('click', async () => {
		const postId = getPostId();
		if (!postId) return;
		msg.style.display = 'none';
		const title = (document.getElementById('title') as HTMLInputElement).value.trim();
		const slug = (document.getElementById('slug') as HTMLInputElement).value.trim();
		const summary = (document.getElementById('summary') as HTMLTextAreaElement).value;
		const body = (document.getElementById('body') as HTMLTextAreaElement).value;
		try {
			await apiJson(`/api/v1/admin/posts/${encodeURIComponent(postId)}`, {
				method: 'PATCH',
				body: JSON.stringify({ title, slug, summary, body }),
			});
			showOk('已保存');
		} catch (e) {
			msg.textContent = e instanceof Error ? e.message : '保存失败';
			msg.style.display = 'block';
		}
	});

	document.getElementById('publish')?.addEventListener('click', async () => {
		const postId = getPostId();
		if (!postId) return;
		msg.style.display = 'none';
		const title = (document.getElementById('title') as HTMLInputElement).value.trim();
		const slug = (document.getElementById('slug') as HTMLInputElement).value.trim();
		const summary = (document.getElementById('summary') as HTMLTextAreaElement).value;
		const body = (document.getElementById('body') as HTMLTextAreaElement).value;
		try {
			await apiJson(`/api/v1/admin/posts/${encodeURIComponent(postId)}`, {
				method: 'PATCH',
				body: JSON.stringify({ title, slug, summary, body, status: 'published' }),
			});
			showOk('已发布');
			window.location.reload();
		} catch (e) {
			msg.textContent = e instanceof Error ? e.message : '发布失败';
			msg.style.display = 'block';
		}
	});

	document.getElementById('delete')?.addEventListener('click', async () => {
		const postId = getPostId();
		if (!postId) return;
		if (!confirm('确定删除这篇文章？不可恢复。')) return;
		msg.style.display = 'none';
		try {
			await apiJson(`/api/v1/admin/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
			window.location.href = '/admin';
		} catch (e) {
			msg.textContent = e instanceof Error ? e.message : '删除失败';
			msg.style.display = 'block';
		}
	});

	void load();
}

init();
