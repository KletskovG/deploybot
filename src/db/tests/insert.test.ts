import { randomUUID } from 'node:crypto';

import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';

import { TABLES } from '@db/consts';
import { getRandomDate, getRandomItem } from '@lib/utils/random';
import type { ITransaction } from '@typings/core/transaction';

import { categories, expenses, notes } from './mocks';

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

const createTestTransaction = (overrides: Partial<ITransaction> = {}): ITransaction => ({
	id: `${TEST_PREFIX}${randomUUID()}`,
	date: getRandomDate('2026-02-03', '2026-02-04'),
	expense: getRandomItem(expenses),
	category: getRandomItem(categories),
	note: getRandomItem(notes),
	timestamp: Date.now().toString(),
	...overrides,
});

describe('insert transactions to DB', () => {
	const insertedIds: string[] = [];

	let withConnection: typeof import('../index').withConnection;
	let buildInsertQuery: typeof import('../sql/insert').buildInsertQuery;

	beforeAll(async () => {
		({ withConnection } = await import('../index'));
		({ buildInsertQuery } = await import('../sql/insert'));
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
		const transaction = createTestTransaction();
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
		const transaction = createTestTransaction({
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
			createTestTransaction({ expense: 100 }),
			createTestTransaction({ expense: 200 }),
			createTestTransaction({ expense: 300 }),
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
