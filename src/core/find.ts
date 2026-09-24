import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildFindQuery } from '@db/yql/find';
import { formatDate, isValidDate } from '@lib';
import { ValidationError } from '@lib/error';
import { error } from '@logger';
import { IFindFiltersOptions } from '@typings/common/findFilters';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export async function findTransactions(
	userId: number,
	params: IFindFiltersOptions,
): Promise<ITransaction[]> {
	const { date, expense, category, note, income } = params;

	if (date && !isValidDate(date)) {
		throw new ValidationError('Invalid date');
	}

	if (expense && isNaN(Number(expense))) {
		throw new ValidationError('Invalid expense value');
	}

	const filters: IFindFiltersOptions = {};

	if (date) {
		filters.date = formatDate(new Date(date));
	}

	if (expense) {
		filters.expense = Number(expense);
	}

	if (income && !isNaN(Number(income))) {
		filters.income = Number(income);
	}

	if (category) {
		filters.category = String(category);
	}

	if (note) {
		filters.note = String(note);
	}

	const query = buildFindQuery(userId, filters);

	try {
		return await withConnection(async (sql) => {
			const [data] = await sql<ITransactionYDB[]>(query);
			return readTransactionsFromYDB(data);
		});
	} catch (err) {
		error('Error finding transactions: ', err);
	}
	return [];
}
