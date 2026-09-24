import { randomUUID } from 'node:crypto';

import { getRandomDate, getRandomItem } from '@lib/utils/random';
import type { ITransaction } from '@typings/core/transaction';

export const expenses: number[] = [
	150,
	250,
	500,
	1200,
	75,
	3500,
	450,
	890,
	2100,
	320,
];

export const notes: string[] = [
	'groceries',
	'transport',
	'restaurant',
	'utilities',
	'entertainment',
	'healthcare',
	'clothing',
	'education',
	'subscription',
	'maintenance',
];

export const categories: string[] = [
	'food',
	'travel',
	'housing',
	'bills',
	'leisure',
	'medical',
	'shopping',
	'learning',
	'services',
	'repairs',
];

export const createTestTransaction = (prefix: string, overrides: Partial<ITransaction> = {}): ITransaction => ({
	id: `${prefix}${randomUUID()}`,
	date: getRandomDate('2026-02-03', '2026-02-04'),
	expense: getRandomItem(expenses),
	income: 0,
	category: getRandomItem(categories),
	note: getRandomItem(notes),
	timestamp: Date.now().toString(),
	...overrides,
});
