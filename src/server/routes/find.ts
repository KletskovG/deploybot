import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ROUTE } from '@server/consts';
import { handleFind } from '@server/handlers/find';
import { IFindQueryParams } from '@typings/server/find';

export async function findRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(ROUTE.FIND, async (
    request: FastifyRequest<{ Querystring: IFindQueryParams }>,
    reply: FastifyReply,
  ) => {
    return handleFind(request, reply);
  });
}
