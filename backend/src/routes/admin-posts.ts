import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { PostStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { writeAudit } from '../lib/audit.js';
import { slugify } from '../lib/slug.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const createBody = z.object({
	title: z.string().min(1).max(300),
	summary: z.string().max(2000).optional(),
	body: z.string().min(1),
	slug: z.string().min(1).max(200).optional(),
	status: z.nativeEnum(PostStatus).optional(),
});

const patchBody = z
	.object({
		title: z.string().min(1).max(300).optional(),
		summary: z.string().max(2000).optional(),
		body: z.string().min(1).optional(),
		slug: z.string().min(1).max(200).optional(),
		status: z.nativeEnum(PostStatus).optional(),
	})
	.refine((o) => Object.keys(o).length > 0, { message: 'empty' });

function canAccessPost(
	user: { sub: string; role: string },
	post: { authorId: string },
): boolean {
	if (user.role === 'admin') return true;
	if (user.role === 'author' && post.authorId === user.sub) return true;
	return false;
}

async function requireStaff(request: FastifyRequest, reply: FastifyReply) {
	const role = request.user.role;
	if (role !== 'admin' && role !== 'author') {
		return reply.status(403).send({
			error: { code: 'FORBIDDEN', message: 'Staff only' },
		});
	}
}

export const adminPostsRoutes: FastifyPluginAsync = async (app) => {
	const staff = { preHandler: [app.authenticate, requireStaff] };

	app.get<{ Params: { id: string } }>('/api/v1/admin/posts/:id', staff, async (request, reply) => {
		const { id } = request.params;
		const post = await prisma.post.findUnique({
			where: { id },
			include: {
				author: { select: { id: true, email: true } },
			},
		});
		if (!post) {
			return reply.status(404).send({
				error: { code: 'NOT_FOUND', message: 'Post not found' },
			});
		}
		if (!canAccessPost(request.user, post)) {
			return reply.status(403).send({
				error: { code: 'FORBIDDEN', message: 'Cannot view this post' },
			});
		}
		return { data: post };
	});

	app.get('/api/v1/admin/posts', staff, async (request) => {
		const q = request.query as Record<string, string | undefined>;
		const page = Math.max(1, Number(q.page) || 1);
		const limit = Math.min(MAX_LIMIT, Math.max(1, Number(q.limit) || DEFAULT_LIMIT));
		const skip = (page - 1) * limit;
		const statusParam = q.status as PostStatus | undefined;
		const userId = request.user.sub;
		const role = request.user.role;

		const where =
			role === 'admin'
				? statusParam
					? { status: statusParam }
					: {}
				: {
						authorId: userId,
						...(statusParam ? { status: statusParam } : {}),
					};

		const [total, rows] = await prisma.$transaction([
			prisma.post.count({ where }),
			prisma.post.findMany({
				where,
				orderBy: { updatedAt: 'desc' },
				skip,
				take: limit,
				include: {
					author: { select: { id: true, email: true } },
				},
			}),
		]);

		return {
			data: rows,
			meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
		};
	});

	app.post('/api/v1/admin/posts', staff, async (request, reply) => {
		const parsed = createBody.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(422).send({
				error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
			});
		}
		const { title, summary: summaryIn, body, slug: slugIn, status } = parsed.data;
		const summary = summaryIn ?? '';
		const authorId = request.user.sub;
		let slug = slugIn ? slugify(slugIn) : slugify(title);
		const existing = await prisma.post.findUnique({ where: { slug } });
		if (existing) {
			slug = `${slug}-${Date.now().toString(36)}`;
		}

		let nextStatus = status ?? PostStatus.draft;
		let publishedAt: Date | null = null;
		if (nextStatus === PostStatus.published) {
			publishedAt = new Date();
		}

		const post = await prisma.post.create({
			data: {
				authorId,
				slug,
				title,
				summary,
				body,
				status: nextStatus,
				publishedAt,
			},
		});

		await writeAudit({
			actorId: authorId,
			action: 'post.create',
			targetType: 'post',
			targetId: post.id,
			metadata: { slug: post.slug, status: post.status },
		});

		return reply.status(201).send({ data: post });
	});

	app.patch<{ Params: { id: string } }>(
		'/api/v1/admin/posts/:id',
		staff,
		async (request, reply) => {
			const { id } = request.params;
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) {
				return reply.status(404).send({
					error: { code: 'NOT_FOUND', message: 'Post not found' },
				});
			}
			if (!canAccessPost(request.user, post)) {
				return reply.status(403).send({
					error: { code: 'FORBIDDEN', message: 'Cannot edit this post' },
				});
			}

			const parsed = patchBody.safeParse(request.body);
			if (!parsed.success) {
				return reply.status(422).send({
					error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
				});
			}
			const patch = parsed.data;
			let slug = patch.slug !== undefined ? slugify(patch.slug) : undefined;
			if (slug && slug !== post.slug) {
				const clash = await prisma.post.findFirst({
					where: { slug, NOT: { id: post.id } },
				});
				if (clash) {
					return reply.status(409).send({
						error: { code: 'SLUG_IN_USE', message: 'Slug already in use' },
					});
				}
			}

			let publishedAt: Date | null | undefined = undefined;
			let status = patch.status;
			if (status === PostStatus.published && post.status !== PostStatus.published) {
				publishedAt = new Date();
			}
			if (status === PostStatus.draft) {
				publishedAt = null;
			}

			const updated = await prisma.post.update({
				where: { id },
				data: {
					...(patch.title !== undefined ? { title: patch.title } : {}),
					...(patch.summary !== undefined ? { summary: patch.summary } : {}),
					...(patch.body !== undefined ? { body: patch.body } : {}),
					...(slug !== undefined ? { slug } : {}),
					...(status !== undefined ? { status } : {}),
					...(publishedAt !== undefined ? { publishedAt } : {}),
				},
			});

			await writeAudit({
				actorId: request.user.sub,
				action: 'post.update',
				targetType: 'post',
				targetId: id,
				metadata: { slug: updated.slug, status: updated.status },
			});

			return { data: updated };
		},
	);

	app.post<{ Params: { id: string } }>(
		'/api/v1/admin/posts/:id/publish',
		staff,
		async (request, reply) => {
			const { id } = request.params;
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) {
				return reply.status(404).send({
					error: { code: 'NOT_FOUND', message: 'Post not found' },
				});
			}
			if (!canAccessPost(request.user, post)) {
				return reply.status(403).send({
					error: { code: 'FORBIDDEN', message: 'Cannot publish this post' },
				});
			}

			const updated = await prisma.post.update({
				where: { id },
				data: {
					status: PostStatus.published,
					publishedAt: post.publishedAt ?? new Date(),
				},
			});

			await writeAudit({
				actorId: request.user.sub,
				action: 'post.publish',
				targetType: 'post',
				targetId: id,
				metadata: { slug: updated.slug },
			});

			return { data: updated };
		},
	);

	app.delete<{ Params: { id: string } }>(
		'/api/v1/admin/posts/:id',
		staff,
		async (request, reply) => {
			const { id } = request.params;
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) {
				return reply.status(404).send({
					error: { code: 'NOT_FOUND', message: 'Post not found' },
				});
			}
			if (!canAccessPost(request.user, post)) {
				return reply.status(403).send({
					error: { code: 'FORBIDDEN', message: 'Cannot delete this post' },
				});
			}

			await prisma.post.delete({ where: { id } });

			await writeAudit({
				actorId: request.user.sub,
				action: 'post.delete',
				targetType: 'post',
				targetId: id,
				metadata: { slug: post.slug },
			});

			return reply.status(204).send();
		},
	);
};
