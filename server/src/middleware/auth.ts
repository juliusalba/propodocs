import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface JWTPayload {
    userId: number;
    email: string;
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
    body: any;
    params: any; // Allow explicit param access
    query: any;  // Allow explicit query access
    headers: any;
    file?: any;  // Use specific type or any to avoid namespace issues
    ip: string;  // Explicitly include ip from Request
}

export function generateToken(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    return jwt.verify(token, secret) as JWTPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyToken(token);
            req.user = payload;
        }
        next();
    } catch (error) {
        // Token invalid but continue anyway
        next();
    }
}
