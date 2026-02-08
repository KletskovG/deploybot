import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { createExpense } from '@core';
import { HTTP_STATUS, ROUTE } from '@server/consts';
import { IExpenseQueryParams } from '@typings/server/expense';

export async function expenseRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.EXPENSE, async (
		request: FastifyRequest<{ Querystring: IExpenseQueryParams }>,
		reply: FastifyReply,
	) => {
		const { date, expense, category, note } = request.query;

		try {
			const result = await createExpense({ date, expense, category, note });
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
