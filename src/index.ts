import 'dotenv/config';

import { startBot } from '@bot/index';
import { config } from '@config/environment';
import { info, error } from '@logger/index';
import { startServer } from '@server/index';

async function main(): Promise<void> {
  info('🚀 Starting DeployBot application...');
  info(`Server PORT: ${config.SERVER_PORT}`);

  try {
    info('Starting bot...');
    const bot = await startBot();

    info('Starting server...');
    const server = await startServer(bot);

    info('✅ Application started successfully!');

    const gracefullShotdown = async (signal: string): Promise<void> => {
      info(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        info('📡 Stopping server...');
        await server.close();

        info('✅ Application stopped successfully');
        process.exit(0);
      } catch (shutdownError) {
        error('❌ Error during shutdown:', shutdownError);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefullShotdown('SIGINT'));
    process.on('SIGTERM', () => gracefullShotdown('SIGTERM'));

  } catch (startupError) {
    error('❌ Failed to start application:', startupError);
    process.exit(1);
  }
}

main();
