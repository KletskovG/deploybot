import { withConnection } from '@db';
import { readCategoriesFromYDB } from '@db/read';
import { buildCategoriesQuery } from '@db/yql/categories';
import { error } from '@logger';
import { ICategoryYDB } from '@typings/core/category';

export async function getCategories(userId: number): Promise<string[]> {
	const query = buildCategoriesQuery(userId);

	try {
		return await withConnection(async (sql) => {
			const [data] = await sql<ICategoryYDB[]>(query);
			return readCategoriesFromYDB(data);
		});
	} catch (err) {
		error('Error getting categories: ', err);
	}
	return [];
}
