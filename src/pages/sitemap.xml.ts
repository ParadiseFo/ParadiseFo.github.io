import type { APIRoute } from 'astro';
import { fetchPostList } from '../lib/api';

export const prerender = true;

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export const GET: APIRoute = async (context) => {
	const siteStr = context.site?.href ?? import.meta.env.SITE ?? 'https://example.com';
	const origin = new URL(siteStr).origin;

	let postPaths: string[] = [];
	try {
		const { data } = await fetchPostList(1, 500);
		postPaths = data.map((p) => `${origin}/blog/${encodeURIComponent(p.slug)}/`);
	} catch {
		postPaths = [];
	}

	const staticUrls = [`${origin}/`, `${origin}/blog`, `${origin}/about`];
	const all = [...staticUrls, ...postPaths];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
