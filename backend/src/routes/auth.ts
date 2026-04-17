import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const registerBody = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(128),
});

const loginBody = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

function publicUser(u: { id: string; email: string; role: Role }) {
	return { id: u.id, email: u.email, role: u.role };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
	app.post('/api/v1/auth/register', async (request, reply) => {
		const parsed = registerBody.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(422).send({
				error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
			});
		}
		const { email, password } = parsed.data;
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return reply.status(409).send({
				error: { code: 'EMAIL_IN_USE', message: 'Email already registered' },
			});
		}
		const passwordHash = await hashPassword(password);
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				role: Role.reader,
			},
		});
		const token = await reply.jwtSign(
			{ sub: user.id, role: user.role },
			{ expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
		);
		return { token, user: publicUser(user) };
	});

	app.post('/api/v1/auth/login', async (request, reply) => {
		const parsed = loginBody.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(422).send({
				error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() },
			});
		}
		const { email, password } = parsed.data;
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || !(await verifyPassword(user.passwordHash, password))) {
			return reply.status(401).send({
				error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
			});
		}
		const token = await reply.jwtSign(
			{ sub: user.id, role: user.role },
			{ expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
		);
		return { token, user: publicUser(user) };
	});

	app.post(
		'/api/v1/auth/logout',
		{ preHandler: [app.authenticate] },
		async (_request, reply) => {
			// Stateless JWT: client discards token. Hook reserved for future blocklist.
			return reply.code(204).send();
		},
	);

	app.get(
		'/api/v1/me',
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			const userId = request.user.sub;
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				return reply.status(401).send({
					error: { code: 'UNAUTHORIZED', message: 'User no longer exists' },
				});
			}
			return { user: publicUser(user) };
		},
	);
};
