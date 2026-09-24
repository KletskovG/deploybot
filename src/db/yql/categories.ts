import { TABLES } from '@db/consts';

import { queries } from './queries';

export const buildCategoriesQuery = (userId: number): string => {
	return queries.categories(`${TABLES.transactions}_${userId}`);
};
