import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ROUTE } from '@server/consts';
import openapiSpec from '@server/openapi.yaml?raw';

export async function openapiRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get(ROUTE.OPENAPI, async (_request: FastifyRequest, reply: FastifyReply) => {
		return reply.type('text/yaml').send(openapiSpec);
	});
}
