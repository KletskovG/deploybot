import { describe, it, expect } from 'vitest';

import { formatDate } from '../formatDate';

describe('formatDate', () => {
	it('formats date to YYYY-MM-DD string', () => {
		const date = new Date('2024-05-15');
		expect(formatDate(date)).toBe('2024-05-15');
	});

	it('pads single-digit day with leading zero', () => {
		const date = new Date('2024-12-05');
		expect(formatDate(date)).toBe('2024-12-05');
	});

	it('handles year boundaries correctly', () => {
		const date = new Date('2023-12-31');
		expect(formatDate(date)).toBe('2023-12-31');
	});

	it('handles leap year date', () => {
		const date = new Date('2024-02-29');
		expect(formatDate(date)).toBe('2024-02-29');
	});

	describe('from ISO date strings', () => {
		it('formats from ISO 8601 datetime with Z timezone', () => {
			const date = new Date('2024-07-20T14:30:00Z');
			expect(formatDate(date)).toBe('2024-07-20');
		});

		it('formats from ISO 8601 datetime with offset', () => {
			const date = new Date('2024-03-15T10:00:00+05:00');
			expect(formatDate(date)).toBe('2024-03-15');
		});

		it('formats from ISO 8601 datetime with milliseconds', () => {
			const date = new Date('2024-11-08T23:59:59.999Z');
			expect(formatDate(date)).toBe('2024-11-08');
		});

		it('formats from ISO 8601 date only', () => {
			const date = new Date('2024-06-01');
			expect(formatDate(date)).toBe('2024-06-01');
		});
	});

	describe('from various date inputs', () => {
		it('formats from timestamp number', () => {
			const date = new Date(1704067200000); // 2024-01-01T00:00:00Z
			expect(formatDate(date)).toBe('2024-01-01');
		});

		it('formats from Date constructor with year, month, day', () => {
			const date = new Date(2024, 8, 25); // month is 0-indexed, so 8 = September
			expect(formatDate(date)).toBe('2024-09-25');
		});

		it('formats midnight correctly', () => {
			const date = new Date('2024-04-10T00:00:00Z');
			expect(formatDate(date)).toBe('2024-04-10');
		});

		it('formats end of day correctly', () => {
			const date = new Date('2024-04-10T23:59:59Z');
			expect(formatDate(date)).toBe('2024-04-10');
		});
	});
});
