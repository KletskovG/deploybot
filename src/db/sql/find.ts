import { TABLES } from '@db/consts';
import { formatDate } from '@lib';
import { IFindFiltersOptions } from '@typings/common/findFilters';
import { ITransactionYDB , ITransaction } from '@typings/core/transaction';

const findFilters = (filtersOptions: IFindFiltersOptions): string => {
  const { date, expense, category, note } = filtersOptions;
  const filters: string[] = [];

  if (date) {
    filters.push(`date = Date('${date}')`);
  }

  if (expense) {
    filters.push(`expense = ${expense}`);
  }

  if (category) {
    filters.push(`category = '${category}'`);
  }

  if (note) {
    filters.push(`note = '${note}'`);
  }

  return filters.reduce((acc, filter, index) => {
    if (index === 0) {
      return `WHERE ${filter}`;
    }
    return `${acc} AND ${filter}`;
  }, '');
};

export const buildFindQuery = (filtersOptions: IFindFiltersOptions): string => {
  const filter = findFilters(filtersOptions);
  const query = `
    SELECT * FROM ${TABLES.transactions}
    ${filter}
    LIMIT 100
  `;
  return query;
};

export const readFindResult = (result: ITransactionYDB[]): ITransaction[] => {
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
