// import cors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';

import { config } from '@config/environment';
import { error } from '@logger/index';
import { botRoutes } from '@server/routes/bot';
import { healthRoutes } from '@server/routes/health';

export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // await fastify.register(cors, {
  //   origin: true,
  // });

  await fastify.register(healthRoutes);
  await fastify.register(botRoutes);

  return fastify;
}

export async function startServer(): Promise<FastifyInstance> {
  const fastify = await createServer();

  try {
    await fastify.listen({
      port: config.SERVER_PORT,
      host: config.SERVER_HOST,
    });

    fastify.log.info(`Server listening on ${config.SERVER_PORT}`);
    return fastify;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Legacy export for backward compatibility
export function server(): void {
  startServer().catch((err) => {
    error('Failed to start server:', err);
    process.exit(1);
  });
}
