import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildUpdateQuery } from '@db/yql/update';
import { formatDate, isValidDate } from '@lib';
import { ValidationError } from '@lib/error';
import { error } from '@logger';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export async function updateTransaction(
	userId: number,
	params: ITransaction,
): Promise<ITransaction[]> {
	const { id, date, expense, category, note } = params;

	if (!id) {
		throw new ValidationError('Update: Missing transaction id');
	}

	if (date && !isValidDate(date)) {
		throw new ValidationError('Update: Invalid date');
	}

	if (expense !== undefined && isNaN(Number(expense))) {
		throw new ValidationError('Update: Invalid expense value');
	}

	const fields: Partial<ITransaction> = {};

	if (date) {
		fields.date = formatDate(new Date(date));
	}

	if (expense) {
		fields.expense = Number(expense);
	}

	if (category !== undefined) {
		fields.category = category ? String(category).toLowerCase().trim() : null;
	}

	if (note !== undefined) {
		fields.note = note ? String(note).toLowerCase().trim() : null;
	}

	if (Object.keys(fields).length === 0) {
		throw new ValidationError('Update: No fields to update');
	}

	const query = buildUpdateQuery(userId, id, fields);

	try {
		return await withConnection(async (sql) => {
			const [data] = await sql<ITransactionYDB[]>(query);
			return readTransactionsFromYDB(data);
		});
	} catch (err) {
		error('Error updating transaction: ', err);
	}
	return [];
}
