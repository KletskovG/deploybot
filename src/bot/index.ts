import { Bot } from 'grammy';

import { handleStart, handleStatus } from '@bot/handlers/commands';
import { handleTextMessage, handleUnknownCommand } from '@bot/handlers/messages';
import { loggingMiddleware, errorHandler } from '@bot/middleware/logging';
import { config } from '@config/environment';
import { info } from '@logger/index';
import { updateBotStatus } from '@server/routes/bot';

import { LOGS, MESSAGES } from './consts';


export async function startBot(): Promise<Bot | null> {
  if (!config.BOT_TOKEN) {
    if (config.NODE_ENV === 'production') {
      throw new Error('BOT_TOKEN is required');
    } else if (config.NODE_ENV === 'development') {
      return null;
    }
  }

  const bot = new Bot(config.BOT_TOKEN);

  bot.use(loggingMiddleware);

  // TODO: Move into separate module
  bot.command('start', handleStart);
  bot.command('status', handleStatus);

  // TODO: Move to separate command - handle expense handling or smth
  bot.on('message', async (ctx, next) => {
    if (ctx.message?.text?.startsWith('/')) {
      await handleUnknownCommand(ctx);
    } else {
      await next();
    }
  });

  bot.on('message:text', handleTextMessage);

  bot.catch(errorHandler);

  updateBotStatus({
    isRunning: true,
    startTime: new Date(),
    lastUpdate: new Date(),
    messageCount: 0,
    errorCount: 0,
  });

  await bot.api.sendMessage(`${config.CHAT_ID}`, MESSAGES.START);
  info(LOGS.BOT_STARTED);

  bot.start();

  return bot;
}
