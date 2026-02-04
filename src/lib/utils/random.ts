import { formatDate } from '../date/formatDate';

export function getRandomNumber(min: number, max: number): number {
	if (min > max) {
		throw new Error('min must be less than or equal to max');
	}

	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new Error('min and max must be integers');
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDate(minDate: Date | string, maxDate: Date | string): string {
	const min = typeof minDate === 'string' ? new Date(minDate) : minDate;
	const max = typeof maxDate === 'string' ? new Date(maxDate) : maxDate;

	if (isNaN(min.getTime())) {
		throw new Error('minDate is not a valid date');
	}

	if (isNaN(max.getTime())) {
		throw new Error('maxDate is not a valid date');
	}

	if (min.getTime() > max.getTime()) {
		throw new Error('minDate must be less than or equal to maxDate');
	}

	const minTime = min.getTime();
	const maxTime = max.getTime();
	const randomTime = minTime + Math.random() * (maxTime - minTime);

	return formatDate(new Date(randomTime));
}

export function getRandomItem<T>(array: T[]): T {
	if (!Array.isArray(array)) {
		throw new Error('Input must be an array');
	}

	if (array.length === 0) {
		throw new Error('Array must not be empty');
	}

	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}
