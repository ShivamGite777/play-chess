const logger = require('../utils/logger');

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security (HTTPS only)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Remove potentially dangerous characters from query parameters
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Remove script tags and other potentially dangerous content
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    next();
};

// IP whitelist middleware (optional)
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        if (allowedIPs.length === 0) {
            return next(); // No whitelist configured
        }

        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (allowedIPs.includes(clientIP)) {
            next();
        } else {
            logger.warn('IP not in whitelist', { ip: clientIP, path: req.path });
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    };
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseInt(maxSize.replace('mb', '')) * 1024 * 1024;
        
        if (contentLength > maxSizeBytes) {
            logger.warn('Request too large', { 
                contentLength, 
                maxSize: maxSizeBytes, 
                ip: req.ip 
            });
            return res.status(413).json({
                success: false,
                message: 'Request too large'
            });
        }
        
        next();
    };
};

// SQL injection prevention helper
const preventSQLInjection = (req, res, next) => {
    const checkForSQLInjection = (obj) => {
        if (typeof obj !== 'object' || obj === null) return false;
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Check for common SQL injection patterns
                const sqlPatterns = [
                    /('|(\\')|(;)|(--)|(\|\|)|(\*)|(%)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute))/i
                ];
                
                if (sqlPatterns.some(pattern => pattern.test(value))) {
                    logger.warn('Potential SQL injection attempt', { 
                        key, 
                        value: value.substring(0, 100), 
                        ip: req.ip 
                    });
                    return true;
                }
            } else if (typeof value === 'object') {
                if (checkForSQLInjection(value)) return true;
            }
        }
        return false;
    };

    if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
        });
    }

    next();
};

// CSRF protection (for state-changing operations)
const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Check for CSRF token in header
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        logger.warn('CSRF token mismatch', { 
            ip: req.ip, 
            method: req.method, 
            path: req.path 
        });
        return res.status(403).json({
            success: false,
            message: 'CSRF token mismatch'
        });
    }

    next();
};

// Content Security Policy
const contentSecurityPolicy = (req, res, next) => {
    const cspHeader = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspHeader);
    next();
};

// Security event logging
const securityLogger = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Log security-relevant responses
        if (res.statusCode >= 400) {
            logger.warn('Security event', {
                status: res.statusCode,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    securityHeaders,
    sanitizeRequest,
    ipWhitelist,
    requestSizeLimiter,
    preventSQLInjection,
    csrfProtection,
    contentSecurityPolicy,
    securityLogger
};