class DeployBotError extends Error {
  public name: string;
  constructor(text: string) {
    super(text);
    this.name = '[DEPLOYBOT]';
  }

  public text(message: string): string {
    return `${this.name}: ${message}`;
  }
}

export class ValidationError extends DeployBotError {
  constructor(text: string) {
    super(text);
    this.name = '[VALIDATION]';
  }
}
