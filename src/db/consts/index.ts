import { config } from '@config/environment';

export const TABLES = {
	transactions: config.NODE_ENV === 'production' ? 'transactions' : 'transactions_dev',
};
