export interface Environment {
  BOT_TOKEN: string;
  NODE_ENV: string;
  SERVER_PORT: number;
  SERVER_HOST: string;
  LOG_LEVEL: string;
  CHAT_ID: number;
  YDB_CONNECTION_STRING: string;
  YDB_KEY_PATH: string;
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || '';
}

function getEnvNumber(key: string): number {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not provided`);
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

// function getEnvBoolean(key: string, defaultValue: boolean): boolean {
//   const value = process.env[key];
//   if (!value) return defaultValue;
//   return value.toLowerCase() === 'true';
// }

export const config: Environment = {
  BOT_TOKEN: getEnvVar('BOT_TOKEN', false),
  NODE_ENV: getEnvVar('NODE_ENV'),
  SERVER_PORT: getEnvNumber('SERVER_PORT'),
  SERVER_HOST: getEnvVar('SERVER_HOST'),
  LOG_LEVEL: getEnvVar('LOG_LEVEL'),
  CHAT_ID: getEnvNumber('CHAT_ID'),
  YDB_CONNECTION_STRING: getEnvVar('YDB_CONNECTION_STRING'),
  YDB_KEY_PATH: getEnvVar('YDB_KEY_PATH'),
};
