type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as LogLevel;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(component: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${component.toUpperCase()}] ${message}`;
    
    if (data) {
      try {
        formatted += `\n${JSON.stringify(data, null, 2)}`;
      } catch (e) {
        // If we can't stringify the data, just append it directly
        formatted += ` ${data}`;
      }
    }
    
    return formatted;
  }

  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(component, message, data));
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage(component, message, data));
    }
  }

  warn(component: string, message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(component, message, data));
    }
  }

  error(component: string, message: string, error?: Error, data?: any): void {
    if (this.shouldLog('error')) {
      const errorInfo = error ? `\nError: ${error.message}\n${error.stack || 'No stack trace'}` : '';
      const fullMessage = `${this.formatMessage(component, message, data)}${errorInfo}`;
      console.error(fullMessage);
    }
  }
}

export const logger = Logger.getInstance();
