import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { updateTransaction } from '@core';
import { createCtx } from '@core/createCtx';
import { HTTP_STATUS, ROUTE } from '@server/consts';
import { ITransaction } from '@typings/core/transaction';

export async function updateRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.UPDATE, async (
		request: FastifyRequest<{ Querystring: ITransaction }>,
		reply: FastifyReply,
	) => {
		const { id, date, expense, income, category, note, timestamp } = request.query;
		const ctx = createCtx(request);

		try {
			const result = await updateTransaction(
				ctx.userId,
				{ id, date, expense, income, category, note, timestamp },
			);
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
