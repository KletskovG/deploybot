/* eslint-disable prefer-destructuring */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TEST_TABLE_ID } from '@db/consts';
import { ValidationError } from '@lib/error';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { getReport } from '../report';

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

vi.mock('@db/yql/report', () => ({
	buildReportQuery: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
	writeFile: vi.fn(),
	rm: vi.fn(),
}));

vi.mock('@lib', async () => {
	const actual = await vi.importActual('@lib');
	return {
		...actual,
		uploadToS3: vi.fn(),
	};
});

describe('getReport', () => {
	let mockWithConnection: ReturnType<typeof vi.fn>;
	let mockReadTransactionsFromYDB: ReturnType<typeof vi.fn>;
	let mockBuildReportQuery: ReturnType<typeof vi.fn>;
	let mockWriteFile: ReturnType<typeof vi.fn>;
	let mockRm: ReturnType<typeof vi.fn>;
	let mockUploadToS3: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();

		const dbModule = await import('@db');
		const readModule = await import('@db/read');
		const sqlModule = await import('@db/yql/report');
		const fsModule = await import('node:fs/promises');
		const libModule = await import('@lib');

		mockWithConnection = dbModule.withConnection as ReturnType<typeof vi.fn>;
		mockReadTransactionsFromYDB = readModule.readTransactionsFromYDB as ReturnType<typeof vi.fn>;
		mockBuildReportQuery = sqlModule.buildReportQuery as ReturnType<typeof vi.fn>;
		mockWriteFile = fsModule.writeFile as ReturnType<typeof vi.fn>;
		mockRm = fsModule.rm as ReturnType<typeof vi.fn>;
		mockUploadToS3 = libModule.uploadToS3 as ReturnType<typeof vi.fn>;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('validation', () => {
		it('throws ValidationError for invalid dateFrom', async () => {
			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: 'invalid-date',
					dateTo: '2026-02-10',
				}),
			).rejects.toThrow(ValidationError);

			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: 'invalid-date',
					dateTo: '2026-02-10',
				}),
			).rejects.toThrow('Invalid dateFrom');
		});

		it('throws ValidationError for invalid dateTo', async () => {
			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: '2026-02-01',
					dateTo: 'invalid-date',
				}),
			).rejects.toThrow(ValidationError);

			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: '2026-02-01',
					dateTo: 'invalid-date',
				}),
			).rejects.toThrow('Invalid dateTo');
		});

		it('accepts valid date range', async () => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockWriteFile.mockResolvedValue(undefined);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');
			mockRm.mockResolvedValue(undefined);

			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: '2026-02-01',
					dateTo: '2026-02-10',
				}),
			).resolves.not.toThrow();
		});
	});

	describe('query building', () => {
		beforeEach(() => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockWriteFile.mockResolvedValue(undefined);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');
			mockRm.mockResolvedValue(undefined);
		});

		it('formats dates before building query', async () => {
			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockBuildReportQuery).toHaveBeenCalledWith(1, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});
		});

		it('handles dates with time component', async () => {
			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01T00:00:00Z',
				dateTo: '2026-02-10T23:59:59Z',
			});

			expect(mockBuildReportQuery).toHaveBeenCalledWith(1, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});
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
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions WHERE date BETWEEN ...');
			mockWriteFile.mockResolvedValue(undefined);
			mockRm.mockResolvedValue(undefined);
		});

		it('executes query using withConnection', async () => {
			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockWithConnection).toHaveBeenCalledTimes(1);
			expect(mockWithConnection).toHaveBeenCalledWith(expect.any(Function));
		});

		it('passes query result to readTransactionsFromYDB', async () => {
			mockWithConnection.mockImplementation(async (callback) => {
				return callback(() => Promise.resolve([mockYdbData]));
			});
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockReadTransactionsFromYDB).toHaveBeenCalledTimes(1);
			expect(mockReadTransactionsFromYDB).toHaveBeenCalledWith(mockYdbData);
		});
	});

	describe('CSV generation', () => {
		beforeEach(() => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
			mockWriteFile.mockResolvedValue(undefined);
			mockRm.mockResolvedValue(undefined);
		});

		it('generates CSV with correct headers', async () => {
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
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockWriteFile).toHaveBeenCalledTimes(1);
			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('id,date,expense,category,note,timestamp');
		});

		it('generates CSV rows with transaction data', async () => {
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
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('test-id-1,2026-02-05,500,food,groceries,1738713600000');
		});

		it('handles empty transactions array', async () => {
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toBe('id,date,expense,category,note,timestamp,income');
		});

		it('escapes CSV values with commas', async () => {
			const mockTransactions: ITransaction[] = [
				{
					id: 'test-id-1',
					date: '2026-02-05',
					expense: 500,
					income: 0,
					category: 'food',
					note: 'groceries, snacks',
					timestamp: '1738713600000',
				},
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('"groceries, snacks"');
		});

		it('escapes CSV values with quotes', async () => {
			const mockTransactions: ITransaction[] = [
				{
					id: 'test-id-1',
					date: '2026-02-05',
					expense: 500,
					income: 0,
					category: 'food',
					note: 'John\'s "special" groceries',
					timestamp: '1738713600000',
				},
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('"John\'s ""special"" groceries"');
		});

		it('handles null values in CSV', async () => {
			const mockTransactions: ITransaction[] = [
				{
					id: 'test-id-1',
					date: '2026-02-05',
					expense: 500,
					income: 0,
					category: null,
					note: null,
					timestamp: '1738713600000',
				},
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('test-id-1,2026-02-05,500,,,1738713600000');
		});

		it('handles undefined values in CSV', async () => {
			const mockTransactions: ITransaction[] = [
				{
					id: 'test-id-1',
					date: '2026-02-05',
					expense: 500,
					income: 0,
					timestamp: '1738713600000',
				},
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('test-id-1,2026-02-05,500,,,1738713600000');
		});
	});

	describe('file operations', () => {
		beforeEach(() => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockWriteFile.mockResolvedValue(undefined);
			mockRm.mockResolvedValue(undefined);
		});

		it('writes CSV to file with .csv extension', async () => {
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockWriteFile).toHaveBeenCalledTimes(1);
			const [filePath] = mockWriteFile.mock.calls[0];
			expect(filePath).toMatch(/\.csv$/);
		});

		it('writes CSV with utf-8 encoding', async () => {
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockWriteFile).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				'utf-8',
			);
		});

		it('uploads CSV to S3', async () => {
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockUploadToS3).toHaveBeenCalledTimes(1);
			expect(mockUploadToS3).toHaveBeenCalledWith(expect.stringMatching(/\.csv$/));
		});

		it('deletes local file after successful S3 upload', async () => {
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(mockRm).toHaveBeenCalledTimes(1);
			const [filePath] = mockWriteFile.mock.calls[0];
			expect(mockRm).toHaveBeenCalledWith(filePath);
		});

		it('returns S3 URL after successful upload', async () => {
			const s3Url = 'https://s3.example.com/report-123.csv';
			mockUploadToS3.mockResolvedValue(s3Url);

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toBe(s3Url);
		});

		it('returns local file path if S3 upload fails', async () => {
			mockUploadToS3.mockResolvedValue(null);

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toMatch(/\.csv$/);
			expect(mockRm).not.toHaveBeenCalled();
		});

		it('returns local file path if S3 upload returns empty string', async () => {
			mockUploadToS3.mockResolvedValue('');

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toMatch(/\.csv$/);
			expect(mockRm).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
		});

		it('returns empty string on database error', async () => {
			const dbError = new Error('Database connection failed');
			mockWithConnection.mockRejectedValue(dbError);

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toBe('');
		});

		it('returns empty string on query execution error', async () => {
			const queryError = new Error('Query execution failed');
			mockWithConnection.mockImplementation(async (_callback) => {
				throw queryError;
			});

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toBe('');
		});

		it('returns empty string on file write error', async () => {
			const writeError = new Error('File write failed');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockWriteFile.mockRejectedValue(writeError);

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toBe('');
		});

		it('does not catch validation errors', async () => {
			await expect(
				getReport(TEST_TABLE_ID, {
					dateFrom: 'invalid',
					dateTo: '2026-02-10',
				}),
			).rejects.toThrow(ValidationError);
		});
	});

	describe('edge cases', () => {
		beforeEach(() => {
			mockBuildReportQuery.mockReturnValue('SELECT * FROM transactions');
			mockWithConnection.mockResolvedValue([]);
			mockReadTransactionsFromYDB.mockReturnValue([]);
			mockWriteFile.mockResolvedValue(undefined);
			mockUploadToS3.mockResolvedValue('https://s3.example.com/file.csv');
			mockRm.mockResolvedValue(undefined);
		});

		it('handles same dateFrom and dateTo', async () => {
			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-05',
				dateTo: '2026-02-05',
			});

			expect(mockBuildReportQuery).toHaveBeenCalledWith(1, {
				dateFrom: '2026-02-05',
				dateTo: '2026-02-05',
			});
		});

		it('handles large number of transactions', async () => {
			const largeTransactionList: ITransaction[] = Array.from({ length: 1000 }, (_, i) => ({
				id: `test-id-${i}`,
				date: '2026-02-05',
				expense: 100 + i,
				income: 0,
				category: 'test',
				note: `note ${i}`,
				timestamp: `${1738713600000 + i}`,
			}));

			mockWithConnection.mockResolvedValue(largeTransactionList);
			mockReadTransactionsFromYDB.mockReturnValue(largeTransactionList);

			const result = await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			expect(result).toBe('https://s3.example.com/file.csv');
			expect(mockWriteFile).toHaveBeenCalledTimes(1);
		});

		it('handles transactions with newlines in notes', async () => {
			const mockTransactions: ITransaction[] = [
				{
					id: 'test-id-1',
					date: '2026-02-05',
					expense: 500,
					income: 0,
					category: 'food',
					note: 'line1\nline2',
					timestamp: '1738713600000',
				},
			];

			mockWithConnection.mockResolvedValue(mockTransactions);
			mockReadTransactionsFromYDB.mockReturnValue(mockTransactions);

			await getReport(TEST_TABLE_ID, {
				dateFrom: '2026-02-01',
				dateTo: '2026-02-10',
			});

			const [, csvContent] = mockWriteFile.mock.calls[0];
			expect(csvContent).toContain('"line1\nline2"');
		});
	});
});
