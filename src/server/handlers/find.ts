import { FastifyReply, FastifyRequest } from 'fastify';

import { withConnection } from '@db';
import { buildFindQuery, readFindResult } from '@db/sql/find';
import { formatDate, isValidDate } from '@lib';
import { IFindFiltersOptions } from '@typings/common/findFilters';
import { ITransactionYDB } from '@typings/core/transaction';
import { IFindQueryParams } from '@typings/server/find';

export async function handleFind(
  request: FastifyRequest<{ Querystring: IFindQueryParams }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const { date, expense, category, note } = request.query;

  if (date && !isValidDate(date)) {
    return reply.status(400).send({
      status: 'error',
      message: 'Invalid date',
    });
  }

  if (expense && isNaN(Number(expense))) {
    return reply.status(400).send({
      status: 'error',
      message: 'Invalid expense value',
    });
  }

  const filters: IFindFiltersOptions = {};

  if (date) {
    filters.date = formatDate(new Date(date));
  }

  if (expense) {
    filters.expense = Number(expense);
  }

  if (category) {
    filters.category = String(category);
  }

  if (note) {
    filters.note = String(note);
  }

  const query = buildFindQuery(filters);

  return withConnection(async (sql) => {
    const [result] = await sql<ITransactionYDB[]>(query);
    return readFindResult(result);
  })
    .then((result) => {
      return reply.status(200).send({
        status: 'ok',
        data: result,
      });
    })
    .catch(() => {
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error',
      });
    });
}
