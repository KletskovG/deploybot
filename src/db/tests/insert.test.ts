import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';

import { TABLES } from '@db/consts';

import { createTestTransaction } from './mocks';

const TEST_PREFIX = 'test-';

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

vi.mock('@logger/index', () => ({
	info: vi.fn(),
	error: vi.fn(),
}));

vi.mock('@db/consts', () => ({
	TABLES: {
		transactions: 'transactions_dev',
	},
}));

describe('insert transactions to DB', () => {
	const insertedIds: string[] = [];

	let withConnection: typeof import('../index').withConnection;
	let buildInsertQuery: typeof import('../yql/insert').buildInsertQuery;

	beforeAll(async () => {
		({ withConnection } = await import('../index'));
		({ buildInsertQuery } = await import('../yql/insert'));
	});

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

	it('inserts single transaction successfully', async () => {
		const transaction = createTestTransaction(TEST_PREFIX);
		insertedIds.push(transaction.id);

		const query = buildInsertQuery([transaction]);

		await expect(
			withConnection(async (sql) => await sql(query)),
		).resolves.not.toThrow();

		const result = await withConnection(async (sql) => {
			const [[row]] = await sql<[{ id: Buffer }]>(
				`SELECT id FROM ${TABLES.transactions} WHERE id = '${transaction.id}'`,
			);
			return row;
		});

		expect(result.id.toString()).toBe(transaction.id);
	});

	it('inserts transaction with NULL optional fields', async () => {
		const transaction = createTestTransaction(TEST_PREFIX, {
			category: null,
			note: null,
		});
		insertedIds.push(transaction.id);

		const query = buildInsertQuery([transaction]);

		await expect(
			withConnection(async (sql) => await sql(query)),
		).resolves.not.toThrow();

		const result = await withConnection(async (sql) => {
			const [[row]] = await sql<[{ id: Buffer; category: Buffer | null; note: Buffer | null }]>(
				`SELECT id, category, note FROM ${TABLES.transactions} WHERE id = '${transaction.id}'`,
			);
			return row;
		});

		expect(result.id.toString()).toBe(transaction.id);
		expect(result.category).toBeNull();
		expect(result.note).toBeNull();
	});

	it('inserts multiple transactions in single query', async () => {
		const transactions = [
			createTestTransaction(TEST_PREFIX, { expense: 100 }),
			createTestTransaction(TEST_PREFIX, { expense: 200 }),
			createTestTransaction(TEST_PREFIX, { expense: 300 }),
		];
		transactions.forEach(t => insertedIds.push(t.id));

		const query = buildInsertQuery(transactions);

		await expect(
			withConnection(async (sql) => await sql(query)),
		).resolves.not.toThrow();

		const result = await withConnection(async (sql) => {
			const idList = transactions.map(t => `'${t.id}'`).join(', ');
			const [rows] = await sql<[{ id: Buffer }]>(
				`SELECT id FROM ${TABLES.transactions} WHERE id IN (${idList})`,
			);
			return rows;
		});

		expect(result).toHaveLength(3);
	});
});
