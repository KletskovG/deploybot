import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { findTransactions } from '@core';
import { HTTP_STATUS, ROUTE } from '@server/consts';
import { IFindQueryParams } from '@typings/server/find';

export async function findRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.FIND, async (
		request: FastifyRequest<{ Querystring: IFindQueryParams }>,
		reply: FastifyReply,
	) => {
		const { date, expense, category, note } = request.query;

		try {
			const result = await findTransactions({ date, expense, category, note });
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
