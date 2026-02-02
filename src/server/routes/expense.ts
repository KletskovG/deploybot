import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ROUTE } from '@server/consts';
import { handleExpense } from '@server/handlers/expense';
import { IExpenseQueryParams } from '@typings/server/expense';

export async function expenseRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(ROUTE.EXPENSE, async (
    request: FastifyRequest<{ Querystring: IExpenseQueryParams }>,
    reply: FastifyReply,
  ) => {
    return handleExpense(request, reply);
  });
}
