import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { BotStatus } from '@typings/bot';

// TODO: Delete this handler

// This will be populated by the bot module
export const botStatus: BotStatus = {
  isRunning: false,
  startTime: null as Date | null,
  lastUpdate: null as Date | null,
  messageCount: 0,
  errorCount: 0,
};

export function updateBotStatus(status: Partial<typeof botStatus>): void {
  Object.assign(botStatus, status);
}

export async function botRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/bot/status', async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      ...botStatus,
      uptime: botStatus.startTime ? Date.now() - botStatus.startTime.getTime() : 0,
    };
  });
}

export function getBotStatus(): BotStatus {
  return botStatus;
}
