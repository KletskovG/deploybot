import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TEST_TABLE_ID } from '@db/consts';
import { ValidationError } from '@lib/error';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { updateTransaction } from '../update';

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

vi.mock('@db/yql/update', () => ({
	buildUpdateQuery: vi.fn(),
}));

const baseTransaction: ITransaction = {
	id: 'test-id-123',
	date: '2026-02-05',
	expense: 500,
	income: 0,
	category: 'food',
	note: 'groceries',
	timestamp: '1738713600000',
};

describe('updateTransaction', () => {
	let mockWithConnection: ReturnType<typeof vi.fn>;
	let mockReadTransactionsFromYDB: ReturnType<typeof vi.fn>;
	let mockBuildUpdateQuery: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();

		const dbModule = await import('@db');
		const readModule = await import('@db/read');
		const sqlModule = await import('@db/yql/update');

		mockWithConnection = dbModule.withConnection as ReturnType<typeof vi.fn>;
		mockReadTransactionsFromYDB = readModule.readTransactionsFromYDB as ReturnType<typeof vi.fn>;
		mockBuildUpdateQuery = sqlModule.buildUpdateQuery as ReturnType<typeof vi.fn>;
	});

	describe('validation', () => {
		it('throws ValidationError for missing id', async () => {
			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, id: '' }),
			).rejects.toThrow(ValidationError);

			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, id: '' }),
			).rejects.toThrow('Update: Missing transaction id');
		});

		it('throws ValidationError for invalid date', async () => {
			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, date: 'invalid-date' }),
			).rejects.toThrow(ValidationError);

			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, date: 'invalid-date' }),
			).rejects.toThrow('Update: Invalid date');
		});

		it('throws ValidationError for invalid expense (non-numeric)', async () => {
			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 'not-a-number' as unknown as number }),
			).rejects.toThrow(ValidationError);

			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 'not-a-number' as unknown as number }),
			).rejects.toThrow('Update: Invalid expense value');
		});

		it('accepts valid date and expense', async () => {
			mockBuildUpdateQuery.mockReturnValue('UPDATE transactions SET ...');
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([]);

			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction }),
			).resolves.not.toThrow();
		});
	});

	describe('field processing', () => {
		beforeEach(() => {
			mockBuildUpdateQuery.mockReturnValue('UPDATE transactions SET ...');
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([]);
		});

		it('formats date field', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, date: '2026-02-05T10:30:00Z' });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ date: '2026-02-05' }),
			);
		});

		it('converts expense to number', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: '750' as unknown as number });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ expense: 750 }),
			);
		});

		it('converts category to lowercase and trims', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, category: '  TRAVEL  ' });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ category: 'travel' }),
			);
		});

		it('converts note to lowercase and trims', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, note: '  Restaurant  ' });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ note: 'restaurant' }),
			);
		});

		it('sets category to null when null is passed', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, category: null });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ category: null }),
			);
		});

		it('sets note to null when null is passed', async () => {
			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, note: null });

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({ note: null }),
			);
		});

		it('processes multiple fields together', async () => {
			await updateTransaction(TEST_TABLE_ID, {
				...baseTransaction,
				date: '2026-03-01',
				expense: 1000,
				category: 'Travel',
				note: 'Flight',
			});

			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				baseTransaction.id,
				expect.objectContaining({
					date: '2026-03-01',
					expense: 1000,
					category: 'travel',
					note: 'flight',
				}),
			);
		});
	});

	describe('database interaction', () => {
		const mockYdbData: ITransactionYDB[] = [
			{
				id: Buffer.from('test-id-123'),
				date: new Date('2026-02-05'),
				expense: BigInt(750),
				income: BigInt(0),
				category: Buffer.from('travel'),
				note: Buffer.from('taxi'),
				timestamp: BigInt(1738713600000),
			},
		];

		const mockUpdatedTransaction: ITransaction = {
			id: 'test-id-123',
			date: '2026-02-05',
			expense: 750,
			income: 0,
			category: 'travel',
			note: 'taxi',
			timestamp: '1738713600000',
		};

		beforeEach(() => {
			mockBuildUpdateQuery.mockReturnValue('UPDATE transactions SET expense = 750 WHERE id = ...');
		});

		it('calls buildUpdateQuery with id and fields', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([mockUpdatedTransaction]);

			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(mockBuildUpdateQuery).toHaveBeenCalledTimes(1);
			expect(mockBuildUpdateQuery).toHaveBeenCalledWith(
				1,
				'test-id-123',
				expect.objectContaining({ expense: 750 }),
			);
		});

		it('executes query using withConnection', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([mockUpdatedTransaction]);

			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(mockWithConnection).toHaveBeenCalledTimes(1);
			expect(mockWithConnection).toHaveBeenCalledWith(expect.any(Function));
		});

		it('passes query result to readTransactionsFromYDB', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([mockUpdatedTransaction]);

			await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(mockReadTransactionsFromYDB).toHaveBeenCalledTimes(1);
			expect(mockReadTransactionsFromYDB).toHaveBeenCalledWith(mockYdbData);
		});

		it('returns transformed transaction from readTransactionsFromYDB', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue([mockUpdatedTransaction]);

			const result = await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(result).toEqual([mockUpdatedTransaction]);
			expect(result).toHaveLength(1);
			expect(result[0].expense).toBe(750);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			mockBuildUpdateQuery.mockReturnValue('UPDATE transactions SET ...');
		});

		it('returns empty array on database error', async () => {
			const dbError = new Error('Database connection failed');
			mockWithConnection.mockRejectedValue(dbError);

			const result = await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(result).toEqual([]);
		});

		it('returns empty array on query execution error', async () => {
			const queryError = new Error('Query execution failed');
			mockWithConnection.mockImplementation(async (_callback) => {
				throw queryError;
			});

			const result = await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(result).toEqual([]);
		});

		it('returns empty array on transformation error', async () => {
			const transformError = new Error('Transformation failed');
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([[]]));
			});
			mockReadTransactionsFromYDB.mockImplementation(() => {
				throw transformError;
			});

			const result = await updateTransaction(TEST_TABLE_ID, { ...baseTransaction, expense: 750 });

			expect(result).toEqual([]);
		});

		it('does not catch validation errors', async () => {
			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, id: '' }),
			).rejects.toThrow(ValidationError);

			await expect(
				updateTransaction(TEST_TABLE_ID, { ...baseTransaction, date: 'invalid' }),
			).rejects.toThrow(ValidationError);
		});
	});
});
