import { TABLES } from '@db/consts';
import { IFindFiltersOptions } from '@typings/common/findFilters';

import { queries } from './queries';

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
	return queries.find(TABLES.transactions, filter);
};
