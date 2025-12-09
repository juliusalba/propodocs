/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing potentially dangerous HTML/script content
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Limit length to prevent DoS
        .slice(0, 10000);
}

/**
 * Sanitize HTML content while preserving safe formatting
 * @param html The HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
    if (typeof html !== 'string') return '';

    // Allow basic formatting tags but remove dangerous content
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'];

    let sanitized = html
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol (can be used for XSS)
        .replace(/data:text\/html/gi, '')
        // Limit length
        .slice(0, 100000);

    return sanitized;
}

/**
 * Sanitize an email address
 * @param email The email to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';

    const sanitized = email.trim().toLowerCase().slice(0, 254);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize a URL
 * @param url The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';

    const sanitized = url.trim().slice(0, 2048);

    // Only allow http and https protocols
    try {
        const parsed = new URL(sanitized);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return sanitized;
        }
    } catch {
        // Invalid URL
    }

    return '';
}

/**
 * Sanitize a number
 * @param input The input to sanitize
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns Sanitized number or 0 if invalid
 */
export function sanitizeNumber(input: any, min: number = -Infinity, max: number = Infinity): number {
    const num = Number(input);

    if (isNaN(num) || !isFinite(num)) return 0;

    return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize an object by applying sanitization to all string values
 * @param obj The object to sanitize
 * @param deep Whether to recursively sanitize nested objects
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, deep: boolean = false): T {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (deep && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value, true);
        } else if (deep && Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item) :
                    typeof item === 'object' && item !== null ? sanitizeObject(item, true) :
                        item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Sanitize contract/invoice data
 * @param data The data to sanitize
 * @returns Sanitized data
 */
export function sanitizeContractData(data: any): any {
    return {
        ...data,
        title: sanitizeString(data.title || ''),
        content: sanitizeHtml(data.content || ''),
        client_name: sanitizeString(data.client_name || ''),
        client_company: data.client_company ? sanitizeString(data.client_company) : undefined,
        client_email: data.client_email ? sanitizeEmail(data.client_email) : undefined,
        client_address: data.client_address ? sanitizeString(data.client_address) : undefined,
        contract_term: data.contract_term ? sanitizeString(data.contract_term) : undefined,
        total_value: data.total_value ? sanitizeNumber(data.total_value, 0, 10000000) : undefined,
        deliverables: Array.isArray(data.deliverables) ? data.deliverables.map((d: any) => ({
            name: sanitizeString(d.name || ''),
            description: d.description ? sanitizeString(d.description) : undefined,
            price: d.price ? sanitizeNumber(d.price, 0, 10000000) : undefined,
            priceType: d.priceType ? sanitizeString(d.priceType) : undefined,
        })) : undefined,
    };
}

/**
 * Sanitize invoice data
 * @param data The data to sanitize
 * @returns Sanitized data
 */
export function sanitizeInvoiceData(data: any): any {
    return {
        ...data,
        title: sanitizeString(data.title || ''),
        client_name: sanitizeString(data.client_name || ''),
        client_company: data.client_company ? sanitizeString(data.client_company) : undefined,
        client_email: data.client_email ? sanitizeEmail(data.client_email) : undefined,
        client_address: data.client_address ? sanitizeString(data.client_address) : undefined,
        notes: data.notes ? sanitizeString(data.notes) : undefined,
        tax_rate: data.tax_rate ? sanitizeNumber(data.tax_rate, 0, 100) : undefined,
        subtotal: data.subtotal ? sanitizeNumber(data.subtotal, 0, 10000000) : undefined,
        total: data.total ? sanitizeNumber(data.total, 0, 10000000) : undefined,
        line_items: Array.isArray(data.line_items) ? data.line_items.map((item: any) => ({
            description: sanitizeString(item.description || ''),
            quantity: sanitizeNumber(item.quantity, 1, 10000),
            unitPrice: sanitizeNumber(item.unitPrice, 0, 10000000),
            amount: sanitizeNumber(item.amount, 0, 10000000),
        })) : [],
    };
}
