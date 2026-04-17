const MAX_SLUG = 200;

export function slugify(input: string): string {
	const base = input
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return base.slice(0, MAX_SLUG) || 'post';
}
