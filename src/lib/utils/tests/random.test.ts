import { describe, it, expect } from 'vitest';

import { getRandomNumber, getRandomDate, getRandomItem } from '../random';

describe('getRandomNumber', () => {
  it('should generate a number within the specified range', () => {
    const min = 1;
    const max = 10;
    const result = getRandomNumber(min, max);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should return the same number when min equals max', () => {
    const value = 5;
    const result = getRandomNumber(value, value);

    expect(result).toBe(value);
  });

  it('should handle negative numbers', () => {
    const min = -10;
    const max = -5;
    const result = getRandomNumber(min, max);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should handle range spanning negative and positive numbers', () => {
    const min = -5;
    const max = 5;
    const result = getRandomNumber(min, max);

    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should throw error when min is greater than max', () => {
    expect(() => getRandomNumber(10, 5)).toThrow('min must be less than or equal to max');
  });

  it('should throw error when min is not an integer', () => {
    expect(() => getRandomNumber(1.5, 10)).toThrow('min and max must be integers');
  });

  it('should handle zero as min or max', () => {
    const result1 = getRandomNumber(0, 10);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(10);

    const result2 = getRandomNumber(-10, 0);
    expect(result2).toBeGreaterThanOrEqual(-10);
    expect(result2).toBeLessThanOrEqual(0);
  });
});

describe('getRandomDate', () => {
  it('should generate a date within the specified range using Date objects', () => {
    const minDate = new Date('2024-01-01');
    const maxDate = new Date('2024-12-31');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('should generate a date within the specified range using date strings', () => {
    const minDate = '2024-01-01';
    const maxDate = '2024-12-31';
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(new Date(minDate).getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(new Date(maxDate).getTime());
  });

  it('should handle mixed Date object and string inputs', () => {
    const minDate = new Date('2024-01-01');
    const maxDate = '2024-12-31';
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(new Date(maxDate).getTime());
  });

  it('should return a date equal to min/max when they are the same', () => {
    const date = new Date('2024-06-15');
    const result = getRandomDate(date, date);

    expect(typeof result).toBe('string');
    expect(result).toBe('2024-06-15');
  });

  it('should handle dates with time components', () => {
    const minDate = new Date('2024-01-01T10:30:00');
    const maxDate = new Date('2024-01-01T18:45:00');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2024-01-01');
  });

  it('should handle dates spanning multiple years', () => {
    const minDate = new Date('2020-01-01');
    const maxDate = new Date('2025-12-31');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('should throw error when minDate is greater than maxDate', () => {
    const minDate = new Date('2024-12-31');
    const maxDate = new Date('2024-01-01');

    expect(() => getRandomDate(
      minDate,
      maxDate,
    )).toThrow('minDate must be less than or equal to maxDate');
  });

  it('should throw error when minDate is invalid', () => {
    expect(() => getRandomDate(
      'invalid-date',
      '2024-12-31'),
    ).toThrow('minDate is not a valid date');
  });

  it('should throw error when maxDate is invalid', () => {
    expect(() => getRandomDate(
      '2024-01-01',
      'invalid-date',
    )).toThrow('maxDate is not a valid date');
  });

  it('should handle ISO date strings with timezone', () => {
    const minDate = '2024-01-01T00:00:00Z';
    const maxDate = '2024-12-31T23:59:59Z';
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(new Date(minDate).getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(new Date(maxDate).getTime());
  });

  it('should handle dates in the past', () => {
    const minDate = new Date('1990-01-01');
    const maxDate = new Date('2000-12-31');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('should handle dates in the future', () => {
    const minDate = new Date('2030-01-01');
    const maxDate = new Date('2040-12-31');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
    expect(resultDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
  });

  it('should handle very close dates', () => {
    const minDate = new Date('2024-01-01T12:00:00');
    const maxDate = new Date('2024-01-01T12:00:01');
    const result = getRandomDate(minDate, maxDate);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2024-01-01');
  });
});

describe('getRandomItem', () => {
  it('should return an item from the array', () => {
    const array = [1, 2, 3, 4, 5];
    const result = getRandomItem(array);

    expect(array).toContain(result);
  });

  it('should work with string arrays', () => {
    const array = ['apple', 'banana', 'cherry'];
    const result = getRandomItem(array);

    expect(array).toContain(result);
    expect(typeof result).toBe('string');
  });

  it('should return the only item from single-item array', () => {
    const array = [42];
    const result = getRandomItem(array);

    expect(result).toBe(42);
  });

  it('should handle arrays with different types', () => {
    const array = [1, 'two', true, null, { value: 5 }];
    const result = getRandomItem(array);

    expect(array).toContain(result);
  });

  it('should work with boolean arrays', () => {
    const array = [true, false];
    const result = getRandomItem(array);

    expect(typeof result).toBe('boolean');
    expect([true, false]).toContain(result);
  });

  it('should work with arrays containing undefined and null', () => {
    const array = [undefined, null, 0, ''];
    const result = getRandomItem(array);

    expect(array).toContain(result);
  });

  it('should throw error when array is empty', () => {
    expect(() => getRandomItem([])).toThrow('Array must not be empty');
  });

  it('should maintain type safety with typed arrays', () => {
    interface User {
      id: number;
      name: string;
    }

    const users: User[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    const result = getRandomItem(users);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(typeof result.id).toBe('number');
    expect(typeof result.name).toBe('string');
  });
});
