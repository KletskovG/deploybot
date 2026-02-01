export interface Environment {
  BOT_TOKEN: string;
  NODE_ENV: string;
  SERVER_PORT: number;
  LOG_LEVEL: string;
  CHAT_ID: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || String(defaultValue);
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
  BOT_TOKEN: getEnvVar('BOT_TOKEN'),
  NODE_ENV: getEnvVar('NODE_ENV'),
  SERVER_PORT: getEnvNumber('SERVER_PORT'),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  CHAT_ID: getEnvNumber('CHAT_ID'),
};
