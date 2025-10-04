// Netlify Function wrapper for the Chess API
// This allows the Node.js API to run as a serverless function

const { createServer } = require('http');
const { parse } = require('url');

// Import our Express app
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import our routes
const routes = require('../../src/routes');

// Mount API routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Chess API is running on Netlify Functions',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'netlify-functions'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// Netlify Function handler
exports.handler = async (event, context) => {
    // Parse the request
    const { httpMethod, path, headers, body, queryStringParameters } = event;
    
    // Convert Netlify event to Express request format
    const url = `https://${headers.host}${path}`;
    const parsedUrl = parse(url, true);
    
    // Create a mock request object
    const req = {
        method: httpMethod,
        url: path,
        path: path,
        headers: headers,
        body: body ? JSON.parse(body) : {},
        query: queryStringParameters || {},
        ip: headers['x-forwarded-for'] || headers['client-ip'] || '127.0.0.1',
        get: (name) => headers[name.toLowerCase()],
        originalUrl: path,
        protocol: 'https',
        secure: true
    };
    
    // Create a mock response object
    let responseBody = '';
    let statusCode = 200;
    let responseHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    };
    
    const res = {
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            responseBody = JSON.stringify(data);
            return res;
        },
        send: (data) => {
            responseBody = data;
            return res;
        },
        setHeader: (name, value) => {
            responseHeaders[name] = value;
            return res;
        },
        end: () => {
            // Response is complete
        }
    };
    
    // Handle the request
    try {
        // Simple routing based on path
        if (path === '/api/health') {
            res.json({
                success: true,
                message: 'Chess API is running on Netlify Functions',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: 'netlify-functions'
            });
        } else if (path.startsWith('/api/')) {
            // For other API routes, return a message about serverless limitations
            res.status(501).json({
                success: false,
                message: 'This API endpoint requires a full Node.js server. Please deploy using Docker or a VPS.',
                note: 'Netlify Functions have limitations for complex applications with WebSocket support and persistent connections.',
                suggestedDeployment: [
                    'Docker container on a VPS',
                    'Railway.app',
                    'Render.com',
                    'Heroku',
                    'DigitalOcean App Platform'
                ]
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found'
            });
        }
    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
    
    return {
        statusCode,
        headers: responseHeaders,
        body: responseBody
    };
};