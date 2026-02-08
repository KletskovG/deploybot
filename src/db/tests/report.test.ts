import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';

import { TABLES } from '@db/consts';
import { info } from '@logger';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { createTestTransaction } from './mocks';

const TEST_PREFIX = 'test-report-';

const YDB_CONNECTION_STRING = process.env.YDB_CONNECTION_STRING || '';
const YDB_KEY_PATH = process.env.YDB_KEY_PATH || '';

vi.mock('@config/environment', () => ({
	config: {
		BOT_TOKEN: '',
		NODE_ENV: 'test',
		SERVER_PORT: 3001,
		SERVER_HOST: '0.0.0.0',
		LOG_LEVEL: 'info',
		CHAT_ID: 0,
		YDB_CONNECTION_STRING,
		YDB_KEY_PATH,
	},
}));

vi.mock('@db/consts', () => ({
	TABLES: {
		transactions: 'transactions_dev',
	},
}));

describe('report transactions from DB', () => {
	const insertedIds: string[] = [];

	let withConnection: typeof import('../index').withConnection;
	let buildInsertQuery: typeof import('../yql/insert').buildInsertQuery;
	let buildReportQuery: typeof import('../yql/report').buildReportQuery;
	let readTransactionsFromYDB: typeof import('../read').readTransactionsFromYDB;

	beforeAll(async () => {
		({ withConnection } = await import('../index'));
		({ buildInsertQuery } = await import('../yql/insert'));
		({ buildReportQuery } = await import('../yql/report'));
		({ readTransactionsFromYDB } = await import('../read'));
	});

	const deleteTestTransactions = async (ids: string[]): Promise<void> => {
		if (ids.length === 0) return;

		const idList = ids.map(id => `'${id}'`).join(', ');
		await withConnection(async (sql) => {
			await sql(`DELETE FROM ${TABLES.transactions} WHERE id IN (${idList})`);
		});
	};

	const insertTransaction = async (transaction: ITransaction): Promise<void> => {
		const query = buildInsertQuery([transaction]);
		await withConnection(async (sql) => await sql(query));
		insertedIds.push(transaction.id);
	};

	afterAll(async () => {
		await deleteTestTransactions(insertedIds);
	});

	describe('report query execution', () => {
		it('finds transactions within date range', async () => {
			const transaction1 = createTestTransaction(TEST_PREFIX, { date: '2026-02-05' });
			const transaction2 = createTestTransaction(TEST_PREFIX, { date: '2026-02-10' });
			const transaction3 = createTestTransaction(TEST_PREFIX, { date: '2026-02-15' });
			await insertTransaction(transaction1);
			await insertTransaction(transaction2);
			await insertTransaction(transaction3);

			const query = buildReportQuery({
				dateFrom: '2026-02-01',
				dateTo: '2026-02-20',
			});
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				info('DB result: \n', rows);
				return rows;
			});

			const transactions = readTransactionsFromYDB(result);
			const foundIds = transactions.map((t: ITransaction) => t.id);

			expect(foundIds).toContain(transaction1.id);
			expect(foundIds).toContain(transaction2.id);
			expect(foundIds).toContain(transaction3.id);
		});

		it('returns empty array when no transactions in range', async () => {
			const query = buildReportQuery({
				dateFrom: '2099-01-01',
				dateTo: '2099-12-31',
			});
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				info('DB result: \n', rows);
				return rows;
			});

			const transactions = readTransactionsFromYDB(result);

			expect(transactions).toHaveLength(0);
		});

		it('includes boundary dates in range', async () => {
			const startDate = createTestTransaction(TEST_PREFIX, { date: '2026-05-01' });
			const endDate = createTestTransaction(TEST_PREFIX, { date: '2026-05-31' });
			await insertTransaction(startDate);
			await insertTransaction(endDate);

			const query = buildReportQuery({
				dateFrom: '2026-05-01',
				dateTo: '2026-05-31',
			});
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				info('DB result: \n', rows);
				return rows;
			});

			const transactions = readTransactionsFromYDB(result);
			const foundIds = transactions.map((t: ITransaction) => t.id);

			expect(foundIds).toContain(startDate.id);
			expect(foundIds).toContain(endDate.id);
		});
	});
});
