import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getCategories } from '@core';
import { HTTP_STATUS, ROUTE } from '@server/consts';

export async function categoriesRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.CATEGORIES, async (
		_request: FastifyRequest,
		reply: FastifyReply,
	) => {
		try {
			const result = await getCategories();
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
