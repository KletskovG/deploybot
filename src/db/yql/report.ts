import { TABLES } from '@db/consts';

import { queries } from './queries';

export interface IReportFilters {
  dateFrom: string;
  dateTo: string;
}

export const buildReportQuery = (userId: number, filters: IReportFilters): string => {
	const { dateFrom, dateTo } = filters;
	return queries.report(`${TABLES.transactions}_${userId}`, dateFrom, dateTo);
};
