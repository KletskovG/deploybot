import { TABLES } from '@db/consts';
import { ITransaction } from '@typings/core/transaction';

import { queries } from './queries';

type UpdatableFields = Partial<Pick<ITransaction, 'date' | 'expense' | 'category' | 'note'>>;

const buildSetFields = (fields: UpdatableFields): string => {
	const parts: string[] = [];

	if (fields.date !== undefined) {
		parts.push(`date = Date('${fields.date}')`);
	}

	if (fields.expense !== undefined) {
		parts.push(`expense = ${fields.expense}`);
	}

	if (fields.category !== undefined) {
		parts.push(`category = ${fields.category ? `'${fields.category}'` : 'NULL'}`);
	}

	if (fields.note !== undefined) {
		parts.push(`note = ${fields.note ? `'${fields.note}'` : 'NULL'}`);
	}

	return parts.join(', ');
};

export const buildUpdateQuery = (id: string, fields: UpdatableFields): string => {
	const setClause = buildSetFields(fields);
	return queries.update(TABLES.transactions, setClause, id);
};
