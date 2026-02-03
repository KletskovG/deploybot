import { formatDate } from '@lib';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export const readTransactionsFromYDB = (result: ITransactionYDB[]): ITransaction[] => {
  return result.map(item => {
    return {
      id: item.id.toString(),
      date: formatDate(new Date(item.date)),
      expense: Number(item.expense),
      category: item.category?.toString(),
      note: item.note?.toString(),
      timestamp: item.timestamp.toString(),
    };
  });
};
