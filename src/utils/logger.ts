/**
 * Centralized logger utility for consistent logging across the application.
 * Provides structured logging with timestamps, levels, component names, and contextual data.
 * Automatically disables debug logs in production environment.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  itemId?: string;
  sessionId?: string;
  tradeOfferId?: string;
  conversationId?: string;
  [key: string]: string | number | boolean | undefined;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: LogContext;
}

/**
 * Determines if the application is running in production mode
 */
function isProduction(): boolean {
  return import.meta.env.PROD || import.meta.env.MODE === 'production';
}

/**
 * Formats a log entry into a consistent string format
 * Format: [timestamp] [level] [component] message {context}
 */
function formatLogEntry(entry: LogEntry): string {
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${contextStr}`;
}

/**
 * Gets the current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Core logging function that handles all log levels
 */
function log(level: LogLevel, component: string, message: string, context?: LogContext): void {
  // Skip debug logs in production
  if (level === 'debug' && isProduction()) {
    return;
  }

  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    component,
    message,
    context,
  };

  const formattedMessage = formatLogEntry(entry);

  // Use appropriate console method based on log level
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
}

/**
 * Creates a logger instance for a specific component
 * This allows for consistent component naming across all logs from that component
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, context?: LogContext) => log('debug', component, message, context),
    info: (message: string, context?: LogContext) => log('info', component, message, context),
    warn: (message: string, context?: LogContext) => log('warn', component, message, context),
    error: (message: string, context?: LogContext) => log('error', component, message, context),
  };
}

/**
 * Default logger instance for general use
 * For component-specific logging, use createLogger() instead
 */
export const logger = {
  debug: (component: string, message: string, context?: LogContext) => log('debug', component, message, context),
  info: (component: string, message: string, context?: LogContext) => log('info', component, message, context),
  warn: (component: string, message: string, context?: LogContext) => log('warn', component, message, context),
  error: (component: string, message: string, context?: LogContext) => log('error', component, message, context),
};
