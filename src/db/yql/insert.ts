import { TABLES } from '@db/consts';
import { ITransaction } from '@typings/core/transaction';

import { queries } from './queries';

const transactionList = (transactions: ITransaction[]): string => {
	return transactions.map(transaction => {
		const {
			id,
			date,
			expense,
			category,
			note,
			timestamp,
		} = transaction;

		return `(
    '${id}',
    Date('${date}'),
    ${expense},
    ${category ? `'${category}'` : 'NULL'},
    ${note ? `'${note}'` : 'NULL'},
    ${timestamp}
    )`;
	}).join(',');
};

export const buildInsertQuery = (transactions: ITransaction[]): string => {
	const list = transactionList(transactions);
	return queries.insert(TABLES.transactions, list);
};
