import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
	// Railway / Render 等默认探测 `/`；仅 `/health` 时易被判定为不健康（404）
	app.get('/', async () => ({ ok: true, service: 'tech-blog-api' }));
	app.get('/health', async () => ({ ok: true, service: 'tech-blog-api' }));
};
