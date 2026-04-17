import '@fastify/jwt';

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: { sub: string; role: 'reader' | 'admin' | 'author' };
		user: { sub: string; role: 'reader' | 'admin' | 'author' };
	}
}
