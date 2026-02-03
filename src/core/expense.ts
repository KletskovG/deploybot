import { randomUUID } from 'node:crypto';

import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildInsertQuery } from '@db/sql/insert';
import { formatDate, isValidDate } from '@lib';
import { ValidationError } from '@lib/error';
import { error } from '@logger';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';
import { IExpenseQueryParams } from '@typings/server/expense';

export async function createExpense(
  params: IExpenseQueryParams,
): Promise<ITransaction[]> {
  const { date, expense, category, note } = params;

  if (!isValidDate(date)) {
    throw new ValidationError('Invalid date');
  }

  if (!expense) {
    throw new ValidationError('Missing expense');
  }

  const transactionsList: ITransaction[] = [{
    id: randomUUID(),
    date: formatDate(new Date(date)),
    expense: Number(expense),
    category: String(category).toLowerCase().trim() ?? null,
    note: String(note).toLowerCase().trim() ?? null,
    timestamp: new Date().getTime().toString(),
  }];

  const query = buildInsertQuery(transactionsList);

  try {
    const [data] = await withConnection(async (sql) => await sql<ITransactionYDB[]>(query));
    return readTransactionsFromYDB(data);
  } catch (err) {
    error('Error creating expense: ', err);
    return [];
  }
}
