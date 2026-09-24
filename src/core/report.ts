import { randomUUID } from 'node:crypto';
import { writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { withConnection } from '@db';
import { readTransactionsFromYDB } from '@db/read';
import { buildReportQuery } from '@db/yql/report';
import { formatDate, isValidDate, uploadToS3 } from '@lib';
import { ValidationError } from '@lib/error';
import { error } from '@logger';
import { ITransaction, ITransactionYDB } from '@typings/core/transaction';

export interface IReportParams {
  dateFrom: string;
  dateTo: string;
}

const CSV_HEADERS = ['id', 'date', 'expense', 'category', 'note', 'timestamp', 'income'] as const;

const escapeCSVValue = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
};

const transactionsToCSV = (transactions: Array<Partial<ITransaction>>): string => {
	const header = CSV_HEADERS.join(',');
	const rows = transactions.map(t =>
		CSV_HEADERS.map(key => escapeCSVValue(t[key])).join(','),
	);
	return [header, ...rows].join('\n');
};

export async function getReport(
	userId: number,
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

	const query = buildReportQuery(userId, filters);

	try {
		const transactions = await withConnection(async (sql) => {
			const [data] = await sql<ITransactionYDB[]>(query);
			return readTransactionsFromYDB(data).map(transaction => {
				const transactionCopy: Partial<ITransaction> = { ...transaction };
				delete transactionCopy.id;
				return transactionCopy;
			});
		});

		const csv = transactionsToCSV(transactions);
		const filename = `${randomUUID()}.csv`;
		const csvPath = join(process.cwd(), filename);

		await writeFile(csvPath, csv, 'utf-8');

		return uploadToS3(csvPath)
			.then(s3Url => {
				if (s3Url) {
					rm(csvPath);
					return s3Url;
				}

				return csvPath;
			});
	} catch (err) {
		error('Error getting report: ', err);
	}

	return '';
}
