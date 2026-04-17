import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { postsPublicRoutes } from './routes/posts-public.js';
import { adminPostsRoutes } from './routes/admin-posts.js';

export async function buildApp() {
	const app = Fastify({
		logger: true,
	});

	const secret = process.env.JWT_SECRET;
	if (!secret || secret.length < 16) {
		app.log.warn(
			'JWT_SECRET is missing or shorter than 16 chars; use a strong secret in production.',
		);
	}

	await app.register(cors, {
		// 默认仅含 GET/HEAD/POST；管理端 PATCH/DELETE 等会预检失败，浏览器报 CORS
		origin: true,
		credentials: true,
		methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
	});
	await app.register(rateLimit, {
		max: 300,
		timeWindow: '1 minute',
	});
	await app.register(jwt, {
		secret: secret || 'dev-insecure-min-16chars',
	});

	app.decorate(
		'authenticate',
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				await request.jwtVerify();
			} catch {
				return reply.status(401).send({
					error: {
						code: 'UNAUTHORIZED',
						message: 'Invalid or missing token',
					},
				});
			}
		},
	);

	await app.register(healthRoutes);
	await app.register(authRoutes);
	await app.register(postsPublicRoutes);
	await app.register(adminPostsRoutes);

	app.setErrorHandler((err, _request, reply) => {
		if (reply.sent) return;
		app.log.error(err);
		const message = err instanceof Error ? err.message : String(err);
		const status =
			typeof err === 'object' && err !== null && 'statusCode' in err && typeof (err as { statusCode?: number }).statusCode === 'number'
				? (err as { statusCode: number }).statusCode
				: 500;
		reply.status(status).send({
			error: {
				code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
				message:
					process.env.NODE_ENV === 'production' && status >= 500
						? 'Internal error'
						: message,
			},
		});
	});

	return app;
}
