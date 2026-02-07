type QueryFn = (...args: string[]) => string;

const PLACEHOLDER_REGEX = /\$\{(\w+)\}/g;

const parseQuery = (template: string): QueryFn => {
	const params: string[] = [];
	const seen = new Set<string>();

	for (const match of template.matchAll(PLACEHOLDER_REGEX)) {
		const [, paramName] = match;

		if (!seen.has(paramName)) {
			seen.add(paramName);
			params.push(paramName);
		}
	}

	return (...args: string[]): string => {
		let result = template;

		params.forEach((param, index) => {
			result = result.replaceAll(`\${${param}}`, args[index] ?? '');
		});

		return result;
	};
};

const init = (): Record<string, QueryFn> => {
	const yqlFiles = import.meta.glob('./*.yql', {
		eager: true,
		query: '?raw',
		import: 'default',
	}) as Record<string, string>;

	const queries: Record<string, QueryFn> = {};

	for (const [filePath, content] of Object.entries(yqlFiles)) {
		const name = filePath.replace('./', '').replace('.yql', '');
		queries[name] = parseQuery(content);
	}

	return queries;
};

export const queries = init();
