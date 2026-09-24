import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';

import { TABLES, TEST_TABLE_ID } from '@db/consts';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { createTestTransaction } from './mocks';

const TEST_PREFIX = 'test-update-';

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
	TEST_TABLE_ID: 1,
}));

describe('update transactions in DB', () => {
	const insertedIds: string[] = [];

	let withConnection: typeof import('../index').withConnection;
	let buildInsertQuery: typeof import('../yql/insert').buildInsertQuery;
	let buildUpdateQuery: typeof import('../yql/update').buildUpdateQuery;
	let readTransactionsFromYDB: typeof import('../read').readTransactionsFromYDB;

	beforeAll(async () => {
		({ withConnection } = await import('../index'));
		({ buildInsertQuery } = await import('../yql/insert'));
		({ buildUpdateQuery } = await import('../yql/update'));
		({ readTransactionsFromYDB } = await import('../read'));
	});

	const insertTransaction = async (transaction: ITransaction): Promise<void> => {
		const query = buildInsertQuery(TEST_TABLE_ID, [transaction]);
		await withConnection(async (sql) => await sql(query));
		insertedIds.push(transaction.id);
	};

	const deleteTestTransactions = async (ids: string[]): Promise<void> => {
		if (ids.length === 0) return;

		const idList = ids.map(id => `'${id}'`).join(', ');
		await withConnection(async (sql) => {
			await sql(`DELETE FROM ${TABLES.transactions} WHERE id IN (${idList})`);
		});
	};

	afterAll(async () => {
		await deleteTestTransactions(insertedIds);
	});

	describe('buildUpdateQuery', () => {
		it('builds query with single field', () => {
			const query = buildUpdateQuery(TEST_TABLE_ID, 'test-id', { expense: 1500 });

			expect(query).toContain('UPDATE');
			expect(query).toContain(TABLES.transactions);
			expect(query).toContain('SET expense = 1500');
			expect(query).toContain("WHERE id = 'test-id'");
			expect(query).toContain('RETURNING *');
		});

		it('builds query with date field', () => {
			const query = buildUpdateQuery(TEST_TABLE_ID, 'test-id', { date: '2026-02-05' });

			expect(query).toContain("SET date = Date('2026-02-05')");
		});

		it('builds query with multiple fields', () => {
			const query = buildUpdateQuery(TEST_TABLE_ID, 'test-id', {
				expense: 2000,
				category: 'travel',
				note: 'taxi',
			});

			expect(query).toContain('expense = 2000');
			expect(query).toContain("category = 'travel'");
			expect(query).toContain("note = 'taxi'");
		});

		it('builds query with null category', () => {
			const query = buildUpdateQuery(TEST_TABLE_ID, 'test-id', { category: null });

			expect(query).toContain('category = NULL');
		});
	});

	describe('update query execution', () => {
		it('updates expense field', async () => {
			const transaction = createTestTransaction(TEST_PREFIX, { expense: 100 });
			await insertTransaction(transaction);

			const query = buildUpdateQuery(TEST_TABLE_ID, transaction.id, { expense: 9999 });
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				return rows;
			});

			const updated = readTransactionsFromYDB(result);

			expect(updated).toHaveLength(1);
			expect(updated[0].id).toBe(transaction.id);
			expect(updated[0].expense).toBe(9999);
		});

		it('updates date field', async () => {
			const transaction = createTestTransaction(TEST_PREFIX, { date: '2026-02-03' });
			await insertTransaction(transaction);

			const query = buildUpdateQuery(TEST_TABLE_ID, transaction.id, { date: '2026-02-04' });
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				return rows;
			});

			const updated = readTransactionsFromYDB(result);

			expect(updated).toHaveLength(1);
			expect(updated[0].date).toBe('2026-02-04');
		});

		it('updates multiple fields at once', async () => {
			const transaction = createTestTransaction(TEST_PREFIX, {
				expense: 100,
				category: 'food',
				note: 'groceries',
			});
			await insertTransaction(transaction);

			const query = buildUpdateQuery(TEST_TABLE_ID, transaction.id, {
				expense: 5000,
				category: 'travel',
				note: 'flight tickets',
			});
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				return rows;
			});

			const updated = readTransactionsFromYDB(result);

			expect(updated).toHaveLength(1);
			expect(updated[0].expense).toBe(5000);
			expect(updated[0].category).toBe('travel');
			expect(updated[0].note).toBe('flight tickets');
		});

		it('preserves unchanged fields', async () => {
			const transaction = createTestTransaction(TEST_PREFIX, {
				expense: 777,
				category: 'food',
				note: 'groceries',
			});
			await insertTransaction(transaction);

			const query = buildUpdateQuery(TEST_TABLE_ID, transaction.id, { expense: 888 });
			const result = await withConnection(async (sql) => {
				const [rows] = await sql<[ITransactionYDB]>(query);
				return rows;
			});

			const updated = readTransactionsFromYDB(result);

			expect(updated).toHaveLength(1);
			expect(updated[0].expense).toBe(888);
			expect(updated[0].category).toBe('food');
			expect(updated[0].note).toBe('groceries');
			expect(updated[0].date).toBe(transaction.date);
		});
	});
});
