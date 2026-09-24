import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TEST_TABLE_ID } from '@db/consts';
import { ValidationError } from '@lib/error';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { findTransactions } from '../find';

vi.mock('@config/environment', () => ({
	config: {
		BOT_TOKEN: '',
		NODE_ENV: 'test',
		SERVER_PORT: 3001,
		SERVER_HOST: '0.0.0.0',
		LOG_LEVEL: 'info',
		CHAT_ID: 0,
		YDB_CONNECTION_STRING: '',
		YDB_KEY_PATH: '',
	},
}));

vi.mock('@db', () => ({
	withConnection: vi.fn(),
}));

vi.mock('@db/read', () => ({
	readTransactionsFromYDB: vi.fn(),
}));

vi.mock('@db/yql/find', () => ({
	buildFindQuery: vi.fn(),
}));

describe('findTransactions', () => {
	let mockWithConnection: ReturnType<typeof vi.fn>;
	let mockReadTransactionsFromYDB: ReturnType<typeof vi.fn>;
	let mockBuildFindQuery: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();

		const dbModule = await import('@db');
		const readModule = await import('@db/read');
		const sqlModule = await import('@db/yql/find');

		mockWithConnection = dbModule.withConnection as ReturnType<typeof vi.fn>;
		mockReadTransactionsFromYDB = readModule.readTransactionsFromYDB as ReturnType<typeof vi.fn>;
		mockBuildFindQuery = sqlModule.buildFindQuery as ReturnType<typeof vi.fn>;
	});

	describe('validation', () => {
		it('throws ValidationError for invalid date', async () => {
			await expect(
				findTransactions(TEST_TABLE_ID, { date: 'invalid-date' }),
			).rejects.toThrow(ValidationError);

			await expect(
				findTransactions(TEST_TABLE_ID, { date: 'invalid-date' }),
			).rejects.toThrow('Invalid date');
		});

		it('throws ValidationError for invalid expense (non-numeric)', async () => {
			await expect(
				findTransactions(TEST_TABLE_ID, { expense: 'not-a-number' as unknown as number }),
			).rejects.toThrow(ValidationError);

			await expect(
				findTransactions(TEST_TABLE_ID, { expense: 'not-a-number' as unknown as number }),
			).rejects.toThrow('Invalid expense value');
		});

		it('accepts valid date in ISO format', async () => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);

			await expect(
				findTransactions(TEST_TABLE_ID, { date: '2026-02-05' }),
			).resolves.not.toThrow();
		});

		it('accepts valid numeric expense', async () => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);

			await expect(
				findTransactions(TEST_TABLE_ID, { expense: 100 }),
			).resolves.not.toThrow();
		});
	});

	describe('filter processing', () => {
		beforeEach(() => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([]);
		});

		it('processes date filter and formats it', async () => {
			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				date: '2026-02-05',
			});
		});

		it('processes expense filter and converts to number', async () => {
			await findTransactions(TEST_TABLE_ID, { expense: '500' as unknown as number });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				expense: 500,
			});
		});

		it('processes category filter and converts to string', async () => {
			await findTransactions(TEST_TABLE_ID, { category: 'food' });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				category: 'food',
			});
		});

		it('processes note filter and converts to string', async () => {
			await findTransactions(TEST_TABLE_ID, { note: 'groceries' });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				note: 'groceries',
			});
		});

		it('processes multiple filters together', async () => {
			await findTransactions(TEST_TABLE_ID, {
				date: '2026-02-05',
				expense: 500,
				category: 'food',
				note: 'groceries',
			});

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				date: '2026-02-05',
				expense: 500,
				category: 'food',
				note: 'groceries',
			});
		});

		it('omits undefined filters', async () => {
			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				date: '2026-02-05',
			});
			expect(mockBuildFindQuery).not.toHaveBeenCalledWith(
				expect.objectContaining({ expense: expect.anything() }),
			);
		});

		it('handles empty filters object', async () => {
			await findTransactions(TEST_TABLE_ID, {});

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {});
		});
	});

	describe('database interaction', () => {
		const mockYdbData: ITransactionYDB[] = [
			{
				id: Buffer.from('test-id-1'),
				date: new Date('2026-02-05'),
				expense: BigInt(500),
				income: BigInt(0),
				category: Buffer.from('food'),
				note: Buffer.from('groceries'),
				timestamp: BigInt(1738713600000),
			},
			{
				id: Buffer.from('test-id-2'),
				date: new Date('2026-02-06'),
				expense: BigInt(300),
				income: BigInt(0),
				category: Buffer.from('transport'),
				note: null,
				timestamp: BigInt(1738800000000),
			},
		];

		const mockTransactions: ITransaction[] = [
			{
				id: 'test-id-1',
				date: '2026-02-05',
				expense: 500,
				income: 0,
				category: 'food',
				note: 'groceries',
				timestamp: '1738713600000',
			},
			{
				id: 'test-id-2',
				date: '2026-02-06',
				expense: 300,
				income: 0,
				category: 'transport',
				timestamp: '1738800000000',
			},
		];

		beforeEach(() => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions WHERE date = Date("2026-02-05")');
		});

		it('calls buildFindQuery with processed filters', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);

			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05', expense: 500 });

			expect(mockBuildFindQuery).toHaveBeenCalledTimes(1);
			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				date: '2026-02-05',
				expense: 500,
			});
		});

		it('executes query using withConnection', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);

			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(mockWithConnection).toHaveBeenCalledTimes(1);
			expect(mockWithConnection).toHaveBeenCalledWith(expect.any(Function));
		});

		it('passes query result to readTransactionsFromYDB', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);

			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(mockReadTransactionsFromYDB).toHaveBeenCalledTimes(1);
			expect(mockReadTransactionsFromYDB).toHaveBeenCalledWith(mockYdbData);
		});

		it('returns transformed transactions from readTransactionsFromYDB', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);

			const result = await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(result).toEqual(mockTransactions);
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('test-id-1');
			expect(result[1].id).toBe('test-id-2');
		});

		it('returns empty array when no transactions found', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([]);

			const result = await findTransactions(TEST_TABLE_ID, { category: 'non-existent' });

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions');
		});

		it('returns empty array on database error', async () => {
			const dbError = new Error('Database connection failed');
			mockWithConnection.mockRejectedValue(dbError);

			const result = await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(result).toEqual([]);
		});

		it('returns empty array on query execution error', async () => {
			const queryError = new Error('Query execution failed');
			mockWithConnection.mockImplementation(async (_callback) => {
				throw queryError;
			});

			const result = await findTransactions(TEST_TABLE_ID, { expense: 100 });

			expect(result).toEqual([]);
		});

		it('returns empty array on transformation error', async () => {
			const transformError = new Error('Transformation failed');
			mockWithConnection.mockImplementation(async (_callback) => {
				return _callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockImplementation(() => {
				throw transformError;
			});

			const result = await findTransactions(TEST_TABLE_ID, { date: '2026-02-05' });

			expect(result).toEqual([]);
		});

		it('does not catch validation errors', async () => {
			await expect(
				findTransactions(TEST_TABLE_ID, { date: 'invalid' }),
			).rejects.toThrow(ValidationError);
		});
	});

	describe('edge cases', () => {
		beforeEach(() => {
			mockBuildFindQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([]);
		});

		it('handles expense as string number', async () => {
			await findTransactions(TEST_TABLE_ID, { expense: '123' as unknown as number });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				expense: 123,
			});
		});

		it('handles expense as zero (omits it as falsy)', async () => {
			await findTransactions(TEST_TABLE_ID, { expense: 0 });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {});
		});

		it('handles negative expense', async () => {
			await findTransactions(TEST_TABLE_ID, { expense: -100 });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				expense: -100,
			});
		});

		it('handles category as number (converts to string)', async () => {
			await findTransactions(TEST_TABLE_ID, { category: 123 as unknown as string });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				category: '123',
			});
		});

		it('handles note as number (converts to string)', async () => {
			await findTransactions(TEST_TABLE_ID, { note: 456 as unknown as string });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				note: '456',
			});
		});

		it('handles date with time component', async () => {
			await findTransactions(TEST_TABLE_ID, { date: '2026-02-05T10:30:00Z' });

			expect(mockBuildFindQuery).toHaveBeenCalledWith(1, {
				date: '2026-02-05',
			});
		});

		it('handles empty string filters (omits them)', async () => {
			await findTransactions(TEST_TABLE_ID, {
				category: '',
				note: '',
			});

			expect(mockBuildFindQuery).not.toHaveBeenCalledWith(
				expect.objectContaining({ category: '' }),
			);
			expect(mockBuildFindQuery).not.toHaveBeenCalledWith(
				expect.objectContaining({ note: '' }),
			);
		});
	});
});
