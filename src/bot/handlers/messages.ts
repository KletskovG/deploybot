import { Context } from 'grammy';

import { getReport } from '@core';

export async function handleTextMessage(ctx: Context): Promise<void> {
	const text = ctx.message?.text;
	const id = ctx.chat?.id;

	if (!text || !id) {
		return;
	}

	if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
		await ctx.reply('Hello! 👋 Use /help to see available commands.');
		return;
	}

	if (text.toLowerCase().includes('report')) {
		const report = await getReport(id, { dateFrom: '2026-02-01', dateTo: '2026-02-28' });
		await ctx.reply(report);
		return;
	}

	// Default response for unrecognized messages
	await ctx.reply(
		'I received your message! Use /help to see what I can do for you.',
	);
}

export async function handleUnknownCommand(ctx: Context): Promise<void> {
	await ctx.reply(
		'❓ Unknown command. Use /help to see available commands.',
	);
}
