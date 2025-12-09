import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    windowMs?: number; // Time window in milliseconds
    max?: number; // Max requests per window
    message?: string;
    keyGenerator?: (req: Request) => string;
}

/**
 * Rate limiting middleware to prevent abuse
 * @param options Configuration options
 */
export function rateLimiter(options: RateLimitOptions = {}) {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 10, // 10 requests per minute default
        message = 'Too many requests, please try again later',
        keyGenerator = (req: Request) => {
            // Use user ID if authenticated, otherwise IP
            const userId = (req as any).user?.userId;
            return userId ? `user:${userId}` : `ip:${req.ip}`;
        }
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();

        // Initialize or get existing record
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 0,
                resetTime: now + windowMs
            };
        }

        // Increment count
        store[key].count++;

        // Check if limit exceeded
        if (store[key].count > max) {
            const log = logger.child({
                action: 'rate-limit-exceeded',
                key,
                count: store[key].count,
                max
            });
            log.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                method: req.method
            });

            res.status(429).json({
                error: message,
                retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
            });
            return;
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', (max - store[key].count).toString());
        res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

        next();
    };
}

/**
 * Stricter rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many requests for this operation, please slow down'
});

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests, please try again later'
});
