import { FastifyRequest } from 'fastify';

import { ICtx } from '@typings/core/ctx';

export function createCtx(request: FastifyRequest): ICtx {
	if (typeof request.query !== 'object' || request.query === null) {
		throw new Error('Query is wrong');
	}

	if (!('user' in request.query)) {
		throw new Error('no user in query');
	}

	return {
		userId: Number(request.query.user),
	};
}
