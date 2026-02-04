import { Context } from 'grammy';

export async function handleTextMessage(ctx: Context): Promise<void> {
	const text = ctx.message?.text;

	if (!text) {
		return;
	}

	if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
		await ctx.reply('Hello! 👋 Use /help to see available commands.');
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
