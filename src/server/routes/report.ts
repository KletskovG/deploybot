import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { getReport } from '@core';
import { ROUTE } from '@server/consts';

export interface IReportQueryParams {
  dateFrom: string;
  dateTo: string;
}

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(ROUTE.REPORT, async (
    request: FastifyRequest<{ Querystring: IReportQueryParams }>,
    reply: FastifyReply,
  ) => {
    const { dateFrom, dateTo } = request.query;

    try {
      const csvPath = await getReport({ dateFrom, dateTo });

      if (csvPath) {
        return reply.status(200).send({
          status: 'ok',
          data: { csvPath },
        });
      }

      return reply.status(500).send({
        status: 'error',
        message: 'Failed to generate report',
      });
    } catch (err) {
      return reply.status(500).send({
        status: 'error',
        message: `Internal server error: ${err}`,
      });
    }
  });
}
