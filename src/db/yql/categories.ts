import { TABLES } from '@db/consts';

import { queries } from './queries';

export const buildCategoriesQuery = (): string => {
	return queries.categories(TABLES.transactions);
};
