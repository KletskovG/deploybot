import { TABLES } from '@db/consts';

export interface IReportFilters {
  dateFrom: string;
  dateTo: string;
}

export const buildReportQuery = (filters: IReportFilters): string => {
	const { dateFrom, dateTo } = filters;

	return `
    SELECT * FROM ${TABLES.transactions}
    WHERE date >= Date('${dateFrom}') AND date <= Date('${dateTo}')
    ORDER BY date DESC
  `;
};
