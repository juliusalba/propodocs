/**
 * Structured logging utility for the Propodocs Server
 * Provides consistent, searchable log output for debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    service?: string;
    action?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
}

class Logger {
    private serviceName: string;

    constructor(serviceName = 'vmg-server') {
        this.serviceName = serviceName;
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            service: this.serviceName,
            message,
            ...context,
        };
        return JSON.stringify(logEntry);
    }

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(this.formatMessage('debug', message, context));
        }
    }

    info(message: string, context?: LogContext) {
        console.log(this.formatMessage('info', message, context));
    }

    warn(message: string, context?: LogContext) {
        console.warn(this.formatMessage('warn', message, context));
    }

    error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorDetails = error instanceof Error
            ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
            : { errorDetails: String(error) };

        console.error(this.formatMessage('error', message, { ...context, ...errorDetails }));
    }

    /**
     * Create a child logger with preset context
     */
    child(context: LogContext) {
        const childLogger = new Logger(this.serviceName);
        const originalInfo = childLogger.info.bind(childLogger);
        const originalError = childLogger.error.bind(childLogger);
        const originalWarn = childLogger.warn.bind(childLogger);
        const originalDebug = childLogger.debug.bind(childLogger);

        childLogger.info = (msg, ctx) => originalInfo(msg, { ...context, ...ctx });
        childLogger.error = (msg, err, ctx) => originalError(msg, err, { ...context, ...ctx });
        childLogger.warn = (msg, ctx) => originalWarn(msg, { ...context, ...ctx });
        childLogger.debug = (msg, ctx) => originalDebug(msg, { ...context, ...ctx });

        return childLogger;
    }
}

export const logger = new Logger('vmg-server');
export type { LogContext };
