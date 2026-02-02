import { ServiceAccountCredentialsProvider } from '@ydbjs/auth-yandex-cloud';
import { Driver } from '@ydbjs/core';
import { YDBError } from '@ydbjs/error';
import { query, QueryClient } from '@ydbjs/query';

import { config } from '@config/environment';
import { info, error as logError } from '@logger/index';

type QueryFn<T> = (sql: QueryClient) => Promise<T>;

async function withConnection<T>(queryFn: QueryFn<T>): Promise<T> {
  info('DB operation');
  const connectionString = config.YDB_CONNECTION_STRING;
  const keyPath = config.YDB_KEY_PATH;
  const credentialsProvider = ServiceAccountCredentialsProvider.fromFile(keyPath);
  const driver = new Driver(connectionString, { credentialsProvider });

  try {
    await driver.ready();
    const sql = query(driver);
    return await queryFn(sql);
  } catch (error) {
    if (error instanceof YDBError) {
      logError('YDB Error:', error.message);
      if (error.issues) {
        logError('Issues:', JSON.stringify(error.issues, null, 2));
      }
      if (error.cause) {
        logError('Cause:', error.cause);
      }
    } else {
      logError('Error:', error);
    }
    throw error;
  } finally {
    driver.close();
  }
}

export { withConnection };
