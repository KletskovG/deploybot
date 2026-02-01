import { Bot } from 'grammy';

import { handleStart, handleStatus } from '@bot/handlers/commands';
import { handleTextMessage, handleUnknownCommand } from '@bot/handlers/messages';
import { loggingMiddleware, errorHandler } from '@bot/middleware/logging';
import { config } from '@config/environment';
import { info } from '@logger/index';
import { updateBotStatus } from '@server/routes/bot';


export async function startBot(): Promise<Bot> {
  if (!config.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
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

  await bot.api.sendMessage(`${config.CHAT_ID}`, 'Hello, world!');
  info('Bot started successfully');

  bot.start();

  return bot;
}
