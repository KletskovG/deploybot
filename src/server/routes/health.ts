import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Bot } from 'grammy';

import { config } from '@config/environment';
import { MESSAGES, ROUTE } from '@server/consts';

export function configureHealthRoutes(bot?: Bot | null) {
  return async (fastify: FastifyInstance) => {
    fastify.get(ROUTE.HEALTH, async (_request: FastifyRequest, _reply: FastifyReply) => {

      if (bot) {
        bot.api.sendMessage(config.CHAT_ID, MESSAGES.BOT_HEALTH_OK);
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });
  };
}
