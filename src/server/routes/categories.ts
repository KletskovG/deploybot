import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getCategories } from '@core';
import { createCtx } from '@core/createCtx';
import { HTTP_STATUS, ROUTE } from '@server/consts';

export async function categoriesRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.CATEGORIES, async (
		request: FastifyRequest,
		reply: FastifyReply,
	) => {
		const ctx = createCtx(request);
		try {
			const result = await getCategories(ctx.userId);
			return reply.status(HTTP_STATUS.OK).send({
				status: 'ok',
				data: result,
			});
		} catch (err) {
			return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
				status: 'error',
				message: `Internal server error: ${err}`,
			});
		}
	});
}
