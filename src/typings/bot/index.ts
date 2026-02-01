export interface BotStatus {
  isRunning: boolean;
  startTime: Date | null;
  lastUpdate: Date | null;
  messageCount: number;
  errorCount: number;
}
