import { Context } from 'grammy';

export async function handleStart(ctx: Context): Promise<void> {
	const userName = ctx.from?.first_name || 'there';
	const id = ctx.chat?.id;
	await ctx.reply(
		`Hello ${userName}!. Your ID: ${id} 👋\n\n`,
	);
}

export async function handleStatus(ctx: Context): Promise<void> {
	const uptime = process.uptime();
	const uptimeHours = Math.floor(uptime / 3600);
	const uptimeMinutes = Math.floor((uptime % 3600) / 60);

	await ctx.reply(
		'Bot is OK\n\n' +
    `Uptime: ${uptimeHours}h ${uptimeMinutes}m\n` +
    `Current Time: ${new Date().toLocaleString()}`,
		{ parse_mode: 'Markdown' },
	);
}

// export async function handlePing(ctx: Context): Promise<void> {
//   const start = Date.now();
//   const message = await ctx.reply('🏓 Pinging...');
//   const latency = Date.now() - start;

//   await ctx.api.editMessageText(
//     ctx.chat!.id,
//     message.message_id,
//     `🏓 Pong! Response time: ${latency}ms`,
//   );
// }
