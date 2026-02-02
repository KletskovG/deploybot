import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ServiceAccountCredentialsProvider } from '@ydbjs/auth-yandex-cloud';
import { Driver } from '@ydbjs/core';
import { YDBError } from '@ydbjs/error';
import { query } from '@ydbjs/query';
import { Bot } from 'grammy';

import { config } from '@config/environment';
import { info, error as logError } from '@logger/index';

export async function connect(bot?: Bot | null): Promise<void> {
  const connectionString = config.YDB_CONNECTION_STRING;


  const keyPath = path.join(path.dirname(fileURLToPath(import.meta.url)), config.YDB_KEY_PATH);
  const credentialsProvider = ServiceAccountCredentialsProvider.fromFile(keyPath);
  const driver = new Driver(connectionString, { credentialsProvider });

  try {
    await driver.ready();
    const sql = query(driver);
    const [[result]] = await sql`SELECT 1 as test_value`;
    info('DB RESULT');
    info(result);
    if (bot) {
      bot.api.sendMessage(config.CHAT_ID, `DB RESULT: ${result}`);
    }
  } catch (error) {
    if (error instanceof YDBError) {
      logError('❌ Error:', error.message);
      if (error.issues) {
        logError('🔍 Issues:', JSON.stringify(error.issues, null, 2));
      }
      if (error.cause) {
        logError('🔍 Cause:', error.cause);
      }
    } else {
      logError('❌ Error:', error);
    }
    throw error;
  } finally {
    driver.close();
    info('DB CONNECTION CLOSED');
  }
}
