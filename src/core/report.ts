import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildReportQuery } from '@db/sql/report';
import { formatDate, isValidDate } from '@lib';
import { ValidationError } from '@lib/error';
import { error } from '@logger';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export interface IReportParams {
  dateFrom: string;
  dateTo: string;
}

const CSV_HEADERS = ['id', 'date', 'expense', 'category', 'note', 'timestamp'] as const;

const escapeCSVValue = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
};

const transactionsToCSV = (transactions: ITransaction[]): string => {
	const header = CSV_HEADERS.join(',');
	const rows = transactions.map(t =>
		CSV_HEADERS.map(key => escapeCSVValue(t[key])).join(','),
	);
	return [header, ...rows].join('\n');
};

export async function getReport(
	params: IReportParams,
): Promise<string> {
	const { dateFrom, dateTo } = params;

	if (!isValidDate(dateFrom)) {
		throw new ValidationError('Invalid dateFrom');
	}

	if (!isValidDate(dateTo)) {
		throw new ValidationError('Invalid dateTo');
	}

	const formattedDateFrom = formatDate(new Date(dateFrom));
	const formattedDateTo = formatDate(new Date(dateTo));

	const filters = {
		dateFrom: formattedDateFrom,
		dateTo: formattedDateTo,
	};

	const query = buildReportQuery(filters);

	try {
		const transactions = await withConnection(async (sql) => {
			const [data] = await sql<ITransactionYDB[]>(query);
			return readTransactionsFromYDB(data);
		});

		const csv = transactionsToCSV(transactions);
		const filename = `report_${formattedDateFrom}_${formattedDateTo}.csv`;
		const csvPath = join(process.cwd(), filename);

		await writeFile(csvPath, csv, 'utf-8');

		return csvPath;
	} catch (err) {
		error('Error getting report: ', err);
	}

	return '';
}
