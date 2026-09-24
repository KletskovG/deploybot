import { formatDate } from '@lib';
import { ICategoryYDB } from '@typings/core/category';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export const readTransactionsFromYDB = (result: ITransactionYDB[]): ITransaction[] => {
	return result.map(item => {
		return {
			id: item.id.toString(),
			date: formatDate(new Date(item.date)),
			expense: Number(item.expense),
			income: Number(item.income),
			category: item.category?.toString(),
			note: item.note?.toString(),
			timestamp: item.timestamp.toString(),
		};
	});
};

export const readCategoriesFromYDB = (result: ICategoryYDB[]): string[] => {
	return result.map(item => item.category.toString());
};
