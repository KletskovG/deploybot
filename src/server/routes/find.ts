import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { findTransactions } from '@core';
import { ROUTE } from '@server/consts';
import { IFindQueryParams } from '@typings/server/find';

export async function findRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.FIND, async (
		request: FastifyRequest<{ Querystring: IFindQueryParams }>,
		reply: FastifyReply,
	) => {
		const { date, expense, category, note } = request.query;

		try {
			const result = await findTransactions({ date, expense, category, note });
			return reply.status(200).send({
				status: 'ok',
				data: result,
			});
		} catch (err) {
			return reply.status(500).send({
				status: 'error',
				message: `Internal server error: ${err}`,
			});
		}
	});
}
