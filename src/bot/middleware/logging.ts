import { Context, NextFunction } from 'grammy';

import { info, error as logError } from '@logger/index';
import { getBotStatus, updateBotStatus } from '@server/routes/bot';

export async function loggingMiddleware(ctx: Context, next: NextFunction): Promise<void> {
	const start = Date.now();
	const user = ctx.from;
	const { chat } = ctx;
	info(
		// eslint-disable-next-line max-len
		`[Bot] Incoming update from user ${user?.id} (${user?.username || user?.first_name}) in chat ${chat?.id}`,
	);

	try {
		await next();

		// Update bot statistics
		updateBotStatus({
			lastUpdate: new Date(),
			messageCount: (await getBotStatus()).messageCount + 1,
		});

		const duration = Date.now() - start;
		info(`[Bot] Request processed in ${duration}ms`);
	} catch (error) {
		const duration = Date.now() - start;
		logError(`[Bot] Error processing request (${duration}ms):`, error);

		// Update error count
		updateBotStatus({
			errorCount: (await getBotStatus()).errorCount + 1,
		});

		throw error;
	}
}

export async function errorHandler(error: Error & { ctx?: Context }): Promise<void> {
	logError('[Bot] Unhandled error in bot:', error);

	if (error.ctx) {
		try {
			await error.ctx.reply('Sorry, something went wrong. Please try again later.');
		} catch (replyError) {
			logError('[Bot] Failed to send error message:', replyError);
		}
	}
}
