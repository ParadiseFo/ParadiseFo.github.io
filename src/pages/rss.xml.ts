import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { fetchPostList } from '../lib/api';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const prerender = true;

export const GET: APIRoute = async (context) => {
	let items: { title: string; description?: string; pubDate: Date; link: string }[] = [];
	try {
		const { data } = await fetchPostList(1, 200);
		items = data.map((p) => ({
			title: p.title,
			description: p.summary,
			pubDate: p.publishedAt ? new Date(p.publishedAt) : new Date(p.updatedAt),
			link: `/blog/${p.slug}/`,
		}));
	} catch {
		items = [];
	}

	const site = context.site ?? import.meta.env.SITE ?? 'https://example.com';

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site,
		items,
	});
};
