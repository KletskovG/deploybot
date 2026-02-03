import { randomUUID } from 'node:crypto';

import { FastifyReply, FastifyRequest } from 'fastify';

import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildInsertQuery } from '@db/sql/insert';
import { formatDate, isValidDate } from '@lib';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';
import { IExpenseQueryParams } from '@typings/server/expense';

export async function handleExpense(
  request: FastifyRequest<{ Querystring: IExpenseQueryParams }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const { date, expense, category, note } = request.query;

  if (!isValidDate(date)) {
    return reply.status(400).send({
      status: 'error',
      message: 'Invalid date',
    });
  }

  if (!expense) {
    return reply.status(400).send({
      status: 'error',
      message: 'Expense is required',
    });
  }

  const transactionsList: ITransaction[] = [{
    id: randomUUID(),
    date: formatDate(new Date(date)),
    expense: Number(expense),
    category: String(category) ?? null,
    note: String(note) ?? null,
    timestamp: new Date().getTime().toString(),
  }];
  const query = buildInsertQuery(transactionsList);
  return withConnection(async (sql) => await sql<ITransactionYDB[]>(query))
    .then(([data]) => {
      return reply.status(200).send({
        status: 'ok',
        data: readTransactionsFromYDB(data),
      });
    })
    .catch(() => {
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error',
      });
    });
}
