import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@lib/error';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { createExpense } from '../expense';

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

vi.mock('@db/yql/insert', () => ({
	buildInsertQuery: vi.fn(),
}));

describe('createExpense', () => {
	let mockWithConnection: ReturnType<typeof vi.fn>;
	let mockReadTransactionsFromYDB: ReturnType<typeof vi.fn>;
	let mockBuildInsertQuery: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();

		const dbModule = await import('@db');
		const readModule = await import('@db/read');
		const sqlModule = await import('@db/yql/insert');

		mockWithConnection = dbModule.withConnection as ReturnType<typeof vi.fn>;
		mockReadTransactionsFromYDB = readModule.readTransactionsFromYDB as ReturnType<typeof vi.fn>;
		mockBuildInsertQuery = sqlModule.buildInsertQuery as ReturnType<typeof vi.fn>;
	});

	describe('validation', () => {
		it('throws ValidationError for invalid date', async () => {
			await expect(
				createExpense({
					date: 'invalid-date',
					expense: '100',
				}),
			).rejects.toThrow(ValidationError);

			await expect(
				createExpense({
					date: 'invalid-date',
					expense: '100',
				}),
			).rejects.toThrow('Invalid date');
		});

		it('throws ValidationError for missing expense', async () => {
			await expect(
				createExpense({
					date: '2026-02-05',
					expense: '',
				}),
			).rejects.toThrow(ValidationError);

			await expect(
				createExpense({
					date: '2026-02-05',
					expense: '',
				}),
			).rejects.toThrow('Missing expense');
		});

		it('throws ValidationError for undefined expense', async () => {
			await expect(
				createExpense({
					date: '2026-02-05',
					expense: undefined as unknown as string,
				}),
			).rejects.toThrow(ValidationError);
		});

		it('accepts valid date and expense', async () => {
			mockBuildInsertQuery.mockReturnValue('INSERT INTO transactions');
			mockWithConnection.mockResolvedValue([[]]);
			mockReadTransactionsFromYDB.mockReturnValue([]);

			await expect(
				createExpense({
					date: '2026-02-05',
					expense: '100',
				}),
			).resolves.not.toThrow();
		});
	});

	describe('transaction creation', () => {
		beforeEach(() => {
			mockBuildInsertQuery.mockReturnValue('INSERT INTO transactions');
			mockWithConnection.mockResolvedValue([[]]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
		});

		it('creates transaction with all fields', async () => {
			await createExpense({
				date: '2026-02-05',
				expense: '500',
				category: 'Food',
				note: 'Groceries',
			});

			expect(mockBuildInsertQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					id: expect.any(String),
					date: '2026-02-05',
					expense: 500,
					category: 'food',
					note: 'groceries',
					timestamp: expect.any(String),
				}),
			]);
		});

		it('creates transaction without optional fields', async () => {
			await createExpense({
				date: '2026-02-05',
				expense: '300',
			});

			expect(mockBuildInsertQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					id: expect.any(String),
					date: '2026-02-05',
					expense: 300,
					timestamp: expect.any(String),
				}),
			]);
		});

		it('formats date correctly', async () => {
			await createExpense({
				date: '2026-02-05T10:30:00Z',
				expense: '100',
			});

			expect(mockBuildInsertQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					date: '2026-02-05',
				}),
			]);
		});

		it('converts category to lowercase and trims whitespace', async () => {
			await createExpense({
				date: '2026-02-05',
				expense: '100',
				category: '  FOOD  ',
			});

			expect(mockBuildInsertQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					category: 'food',
				}),
			]);
		});
	});

	describe('database interaction', () => {
		const mockYdbData: ITransactionYDB[] = [
			{
				id: Buffer.from('test-uuid-123'),
				date: new Date('2026-02-05'),
				expense: BigInt(500),
				category: Buffer.from('food'),
				note: Buffer.from('groceries'),
				timestamp: BigInt(1738713600000),
			},
		];

		const mockTransaction: ITransaction = {
			id: 'test-uuid-123',
			date: '2026-02-05',
			expense: 500,
			category: 'food',
			note: 'groceries',
			timestamp: '1738713600000',
		};

		beforeEach(() => {
			mockBuildInsertQuery.mockReturnValue('INSERT INTO transactions VALUES (...)');
		});

		it('calls buildInsertQuery with transaction list', async () => {
			mockWithConnection.mockResolvedValue([mockYdbData]);
			mockReadTransactionsFromYDB.mockReturnValue([mockTransaction]);

			await createExpense({
				date: '2026-02-05',
				expense: '500',
				category: 'food',
				note: 'groceries',
			});

			expect(mockBuildInsertQuery).toHaveBeenCalledTimes(1);
			expect(mockBuildInsertQuery).toHaveBeenCalledWith([
				expect.objectContaining({
					date: '2026-02-05',
					expense: 500,
					category: 'food',
					note: 'groceries',
				}),
			]);
		});

		it('executes query using withConnection', async () => {
			mockWithConnection.mockResolvedValue([mockYdbData]);
			mockReadTransactionsFromYDB.mockReturnValue([mockTransaction]);

			await createExpense({
				date: '2026-02-05',
				expense: '500',
			});

			expect(mockWithConnection).toHaveBeenCalledTimes(1);
			expect(mockWithConnection).toHaveBeenCalledWith(expect.any(Function));
		});

		it('passes query result to readTransactionsFromYDB', async () => {
			mockWithConnection.mockResolvedValue([mockYdbData]);
			mockReadTransactionsFromYDB.mockReturnValue([mockTransaction]);

			await createExpense({
				date: '2026-02-05',
				expense: '500',
			});

			expect(mockReadTransactionsFromYDB).toHaveBeenCalledTimes(1);
			expect(mockReadTransactionsFromYDB).toHaveBeenCalledWith(mockYdbData);
		});

		it('returns transformed transaction from readTransactionsFromYDB', async () => {
			mockWithConnection.mockResolvedValue([mockYdbData]);
			mockReadTransactionsFromYDB.mockReturnValue([mockTransaction]);

			const result = await createExpense({
				date: '2026-02-05',
				expense: '500',
				category: 'food',
				note: 'groceries',
			});

			expect(result).toEqual([mockTransaction]);
			expect(result).toHaveLength(1);
			expect(result[0].expense).toBe(500);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			mockBuildInsertQuery.mockReturnValue('INSERT INTO transactions');
		});

		it('returns empty array on database error', async () => {
			const dbError = new Error('Database connection failed');
			mockWithConnection.mockRejectedValue(dbError);

			const result = await createExpense({
				date: '2026-02-05',
				expense: '100',
			});

			expect(result).toEqual([]);
		});

		it('returns empty array on query execution error', async () => {
			const queryError = new Error('Query execution failed');
			mockWithConnection.mockImplementation(async (_callback) => {
				throw queryError;
			});

			const result = await createExpense({
				date: '2026-02-05',
				expense: '100',
			});

			expect(result).toEqual([]);
		});

		it('returns empty array on transformation error', async () => {
			const transformError = new Error('Transformation failed');
			mockWithConnection.mockResolvedValue([[]]);
			mockReadTransactionsFromYDB.mockImplementation(() => {
				throw transformError;
			});

			const result = await createExpense({
				date: '2026-02-05',
				expense: '100',
			});

			expect(result).toEqual([]);
		});

		it('does not catch validation errors', async () => {
			await expect(
				createExpense({
					date: 'invalid',
					expense: '100',
				}),
			).rejects.toThrow(ValidationError);
		});
	});
});
