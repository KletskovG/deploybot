import { randomUUID } from 'node:crypto';

import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';

import { TABLES } from '@db/consts';
import { getRandomDate, getRandomItem } from '@lib/utils/random';
import { info } from '@logger';
import type { ITransaction, ITransactionYDB } from '@typings/core/transaction';

import { categories, expenses, notes } from './mocks';

const TEST_PREFIX = 'test-find-';

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

const createTestTransaction = (overrides: Partial<ITransaction> = {}): ITransaction => ({
  id: `${TEST_PREFIX}${randomUUID()}`,
  date: getRandomDate('2026-02-03', '2026-02-04'),
  expense: getRandomItem(expenses),
  category: getRandomItem(categories),
  note: getRandomItem(notes),
  timestamp: Date.now().toString(),
  ...overrides,
});

describe('find transactions in DB', () => {
  const insertedIds: string[] = [];

  let withConnection: typeof import('../index').withConnection;
  let buildInsertQuery: typeof import('../sql/insert').buildInsertQuery;
  let buildFindQuery: typeof import('../sql/find').buildFindQuery;
  let readFindResult: typeof import('../sql/find').readFindResult;

  beforeAll(async () => {
    ({ withConnection } = await import('../index'));
    ({ buildInsertQuery } = await import('../sql/insert'));
    ({ buildFindQuery, readFindResult } = await import('../sql/find'));
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

  describe('buildFindQuery', () => {
    it('builds query without filters', () => {
      const query = buildFindQuery({});

      expect(query).toContain('SELECT * FROM');
      expect(query).toContain(TABLES.transactions);
      expect(query).toContain('LIMIT 100');
      expect(query).not.toContain('WHERE');
    });

    it('builds query with date filter', () => {
      const query = buildFindQuery({ date: '2026-02-03' });

      expect(query).toContain("WHERE date = Date('2026-02-03')");
    });

    it('builds query with expense filter', () => {
      const query = buildFindQuery({ expense: 500 });

      expect(query).toContain('WHERE expense = 500');
    });

    it('builds query with category filter', () => {
      const query = buildFindQuery({ category: 'food' });

      expect(query).toContain("WHERE category = 'food'");
    });

    it('builds query with note filter', () => {
      const query = buildFindQuery({ note: 'groceries' });

      expect(query).toContain("WHERE note = 'groceries'");
    });

    it('builds query with multiple filters', () => {
      const query = buildFindQuery({
        date: '2026-02-03',
        expense: 500,
        category: 'food',
      });

      expect(query).toContain("WHERE date = Date('2026-02-03')");
      expect(query).toContain('AND expense = 500');
      expect(query).toContain("AND category = 'food'");
    });
  });

  describe('readFindResult', () => {
    it('transforms YDB result to ITransaction format', () => {
      const mockYdbResult: ITransactionYDB[] = [
        {
          id: Buffer.from('test-id-123'),
          date: new Date('2026-02-03'),
          expense: BigInt(500),
          category: Buffer.from('food'),
          note: Buffer.from('groceries'),
          timestamp: BigInt(1738540800000),
        },
      ];

      const result = readFindResult(mockYdbResult);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id-123');
      expect(result[0].date).toBe('2026-02-03');
      expect(result[0].expense).toBe(500);
      expect(result[0].category).toBe('food');
      expect(result[0].note).toBe('groceries');
      expect(result[0].timestamp).toBe('1738540800000');
    });

    it('handles null optional fields', () => {
      const mockYdbResult: ITransactionYDB[] = [
        {
          id: Buffer.from('test-id-456'),
          date: new Date('2026-02-03'),
          expense: BigInt(250),
          category: null,
          note: null,
          timestamp: BigInt(1738540800000),
        },
      ];

      const result = readFindResult(mockYdbResult);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBeUndefined();
      expect(result[0].note).toBeUndefined();
    });

    it('transforms multiple YDB results', () => {
      const mockYdbResult: ITransactionYDB[] = [
        {
          id: Buffer.from('test-id-1'),
          date: new Date('2026-02-03'),
          expense: BigInt(100),
          category: Buffer.from('food'),
          note: null,
          timestamp: BigInt(1738540800000),
        },
        {
          id: Buffer.from('test-id-2'),
          date: new Date('2026-02-04'),
          expense: BigInt(200),
          category: null,
          note: Buffer.from('transport'),
          timestamp: BigInt(1738627200000),
        },
      ];

      const result = readFindResult(mockYdbResult);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-id-1');
      expect(result[1].id).toBe('test-id-2');
    });
  });

  describe('find query execution', () => {
    it('finds transaction by date', async () => {
      const testDate = '2026-02-03';
      const transaction = createTestTransaction({ date: testDate });
      await insertTransaction(transaction);

      const query = buildFindQuery({ date: testDate });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);
      const found = transactions.find(t => t.id === transaction.id);

      expect(found).toBeDefined();
      expect(found?.date).toBe(testDate);
    });

    it('finds transaction by expense amount', async () => {
      const testExpense = 99999;
      const transaction = createTestTransaction({ expense: testExpense });
      await insertTransaction(transaction);

      const query = buildFindQuery({ expense: testExpense });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);
      const found = transactions.find(t => t.id === transaction.id);

      expect(found).toBeDefined();
      expect(found?.expense).toBe(testExpense);
    });

    it('finds transaction by category', async () => {
      const testCategory = 'test-category-unique';
      const transaction = createTestTransaction({ category: testCategory });
      await insertTransaction(transaction);

      const query = buildFindQuery({ category: testCategory });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(transaction.id);
      expect(transactions[0].category).toBe(testCategory);
    });

    it('finds transaction by note', async () => {
      const testNote = 'test-note-unique';
      const transaction = createTestTransaction({ note: testNote });
      await insertTransaction(transaction);

      const query = buildFindQuery({ note: testNote });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(transaction.id);
      expect(transactions[0].note).toBe(testNote);
    });

    it('finds transactions with multiple filters', async () => {
      const testDate = '2026-02-03';
      const testExpense = 88888;
      const testCategory = 'multi-filter-category';
      const transaction = createTestTransaction({
        date: testDate,
        expense: testExpense,
        category: testCategory,
      });
      await insertTransaction(transaction);

      const query = buildFindQuery({
        date: testDate,
        expense: testExpense,
        category: testCategory,
      });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(transaction.id);
    });

    it('returns empty array when no matches found', async () => {
      const query = buildFindQuery({ category: 'non-existent-category-xyz' });
      const result = await withConnection(async (sql) => {
        const [rows] = await sql<[ITransactionYDB]>(query);
        info('DB result: \n', rows);
        return rows;
      });

      const transactions = readFindResult(result);

      expect(transactions).toHaveLength(0);
    });
  });
});
