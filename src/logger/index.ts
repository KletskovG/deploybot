export function log(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...messages);
}

export function info(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log('[INFO]', ...messages);
}

export function error(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', ...messages);
}

export function warn(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.warn('[WARN]', ...messages);
}

export function debug(...messages: unknown[]): void {
  // eslint-disable-next-line no-console
  console.debug('[DEBUG]', ...messages);
}
