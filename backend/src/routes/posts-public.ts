import type { FastifyPluginAsync } from 'fastify';
import { PostStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const postsPublicRoutes: FastifyPluginAsync = async (app) => {
	app.get('/api/v1/posts', async (request) => {
		const q = request.query as Record<string, string | undefined>;
		const page = Math.max(1, Number(q.page) || 1);
		const limit = Math.min(MAX_LIMIT, Math.max(1, Number(q.limit) || DEFAULT_LIMIT));
		const skip = (page - 1) * limit;

		const where = { status: PostStatus.published };
		const [total, rows] = await prisma.$transaction([
			prisma.post.count({ where }),
			prisma.post.findMany({
				where,
				orderBy: { publishedAt: 'desc' },
				skip,
				take: limit,
				select: {
					id: true,
					slug: true,
					title: true,
					summary: true,
					publishedAt: true,
					updatedAt: true,
				},
			}),
		]);

		return {
			data: rows,
			meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
		};
	});

	app.get<{ Params: { slug: string } }>('/api/v1/posts/:slug', async (request, reply) => {
		const { slug } = request.params;
		const post = await prisma.post.findFirst({
			where: { slug, status: PostStatus.published },
			include: {
				author: { select: { id: true, email: true } },
			},
		});
		if (!post) {
			return reply.status(404).send({
				error: { code: 'NOT_FOUND', message: 'Post not found' },
			});
		}
		return {
			data: {
				id: post.id,
				slug: post.slug,
				title: post.title,
				summary: post.summary,
				body: post.body,
				publishedAt: post.publishedAt,
				updatedAt: post.updatedAt,
				author: post.author,
			},
		};
	});
};
