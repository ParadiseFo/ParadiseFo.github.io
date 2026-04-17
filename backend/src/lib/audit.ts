import { prisma } from './prisma.js';

export async function writeAudit(params: {
	actorId: string;
	action: string;
	targetType: string;
	targetId: string;
	metadata?: Record<string, unknown>;
}) {
	const metadata =
		params.metadata === undefined ? null : JSON.stringify(params.metadata);
	await prisma.auditLog.create({
		data: {
			actorId: params.actorId,
			action: params.action,
			targetType: params.targetType,
			targetId: params.targetId,
			metadata,
		},
	});
}
