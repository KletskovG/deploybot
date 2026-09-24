import { config } from '@config/environment';

export const TABLES = {
	transactions: config.NODE_ENV === 'production' ? 'transactions' : 'transactions_dev',
};

export const TEST_TABLE_ID = 1;
