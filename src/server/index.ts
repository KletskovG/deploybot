import cors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import { Bot } from 'grammy';

import { config } from '@config/environment';
import { error } from '@logger/index';
import { botRoutes } from '@server/routes/bot';
import { expenseRoutes } from '@server/routes/expense';
import { findRoutes } from '@server/routes/find';
import { configureHealthRoutes } from '@server/routes/health';

export async function createServer(bot?: Bot | null): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  await fastify.register(cors, {
    origin: true,
  });

  const healthRoutesWrapped = configureHealthRoutes(bot);

  await fastify.register(healthRoutesWrapped);
  await fastify.register(botRoutes);
  await fastify.register(expenseRoutes);
  await fastify.register(findRoutes);

  return fastify;
}

export async function startServer(bot?: Bot | null): Promise<FastifyInstance> {
  const fastify = await createServer(bot);

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
