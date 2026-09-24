import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { createExpense } from '@core';
import { createCtx } from '@core/createCtx';
import { HTTP_STATUS, ROUTE } from '@server/consts';
import { IExpenseQueryParams } from '@typings/server/expense';

export async function expenseRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.EXPENSE, async (
		request: FastifyRequest<{ Querystring: IExpenseQueryParams }>,
		reply: FastifyReply,
	) => {
		const { date, expense, category, income, note } = request.query;
		const ctx = createCtx(request);

		try {
			const result = await createExpense(ctx.userId, { date, expense, category, note, income });
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
