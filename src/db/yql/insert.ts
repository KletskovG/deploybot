import { TABLES } from '@db/consts';
import { ITransaction } from '@typings/core/transaction';

import { queries } from './queries';

const transactionList = (transactions: ITransaction[]): string => {
	return transactions.map(transaction => {
		const {
			id,
			date,
			expense,
			income,
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
    ${timestamp},
	${income}
    )`;
	}).join(',');
};

export const buildInsertQuery = (userId: number, transactions: ITransaction[]): string => {
	const list = transactionList(transactions);
	return queries.insert(`${TABLES.transactions}_${userId}`, list);
};
