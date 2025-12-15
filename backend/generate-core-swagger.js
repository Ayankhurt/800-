/**
 * FINAL PRECISE Swagger Generator
 * Generates Swagger for EXACT 105 endpoints used in Core Admin Panel Components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, 'src', 'routes');
const outputFile = path.join(__dirname, 'src', 'swagger.json');

// Read the exact list from core-endpoints.txt
const coreEndpointsFile = path.join(__dirname, 'core-endpoints.txt');
const CORE_ENDPOINTS = fs.readFileSync(coreEndpointsFile, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

const allowedEndpoints = new Set(CORE_ENDPOINTS);

console.log(`📋 Loaded ${CORE_ENDPOINTS.length} core endpoints from file`);

// Minimal schemas
const schemas = {
    GenericRequest: {
        type: "object",
        properties: {
            data: { type: "object" }
        }
    },
    AuthLogin: {
        type: "object",
        required: ["email", "password"],
        properties: {
            email: { type: "string", format: "email", example: "admin@example.com" },
            password: { type: "string", format: "password", example: "password123" }
        }
    }
};

const swaggerBase = {
    "openapi": "3.0.0",
    "info": {
        "title": "BidRoom Admin Panel API",
        "description": `Core API endpoints used in Admin Panel (${CORE_ENDPOINTS.length} endpoints)`,
        "version": "1.0.0"
    },
    "servers": [
        { "url": "https://800-phi.vercel.app/api/v1", "description": "Production (Vercel)" },
        { "url": "http://192.168.2.10:5000/api/v1", "description": "Local Development" }
    ],
    "tags": [],
    "paths": {},
    "components": {
        "securitySchemes": {
            "bearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" }
        },
        "schemas": schemas
    }
};

const routePrefixMap = {
    'authRoutes.js': '/auth',
    'userRoutes.js': '/users',
    'adminRoutes.js': '/admin',
    'extendedAdminRoutes.js': '/admin',
    'jobRoutes.js': '/jobs',
    'projectRoutes.js': '/projects',
    'bidRoutes.js': '/bids',
    'disputeRoutes.js': '/disputes',
    'notificationRoutes.js': '/notifications',
    'messageRoutes.js': '/messages',
    'paymentRoutes.js': '/payments',
    'statsRoutes.js': '/stats',
    'verificationRoutes.js': '/verification',
    'moderationRoutes.js': '/admin/moderation',
    'financeRoutes.js': '/finance',
    'transactionRoutes.js': '/transactions',
};

console.log('🚀 Generating FINAL PRECISE Swagger...\n');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js'));
let totalScanned = 0;
let includedCount = 0;

routeFiles.forEach(file => {
    const prefix = routePrefixMap[file];
    if (!prefix) return;

    const tagName = file.replace('Routes.js', '').replace('extended', '');
    const cleanTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);

    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const regex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let routePath = match[2];
        if (routePath === '/') routePath = '';

        let fullPath = `${prefix}${routePath}`.replace('//', '/');
        if (fullPath === '') fullPath = '/';

        totalScanned++;
        const endpointKey = `${method} ${fullPath}`;

        if (!allowedEndpoints.has(endpointKey)) {
            continue; // Skip - not in core list
        }

        includedCount++;
        const swaggerPath = fullPath.replace(/:(\w+)/g, '{$1}');

        if (!swaggerBase.paths[swaggerPath]) {
            swaggerBase.paths[swaggerPath] = {};
        }

        if (!swaggerBase.tags.find(t => t.name === cleanTag)) {
            swaggerBase.tags.push({ name: cleanTag });
        }

        const operation = {
            "tags": [cleanTag],
            "summary": `${method} ${fullPath}`,
            "security": [{ "bearerAuth": [] }],
            "responses": {
                "200": { "description": "Success" },
                "400": { "description": "Bad Request" },
                "401": { "description": "Unauthorized" },
                "403": { "description": "Forbidden" },
                "404": { "description": "Not Found" },
                "500": { "description": "Internal Server Error" }
            }
        };

        // Add path parameters
        const paramMatches = fullPath.match(/:(\w+)/g);
        if (paramMatches) {
            operation.parameters = paramMatches.map(p => ({
                name: p.substring(1),
                in: "path",
                required: true,
                schema: { type: "string" },
                description: `${p.substring(1)} identifier`
            }));
        }

        // Add request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const schema = fullPath.includes('/login')
                ? { $ref: '#/components/schemas/AuthLogin' }
                : { $ref: '#/components/schemas/GenericRequest' };

            operation.requestBody = {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": schema
                    }
                }
            };
        }

        swaggerBase.paths[swaggerPath][method.toLowerCase()] = operation;
    }
});

fs.writeFileSync(outputFile, JSON.stringify(swaggerBase, null, 2));

console.log(`✅ SUCCESS!`);
console.log(`   Scanned: ${totalScanned} total endpoints`);
console.log(`   Included: ${includedCount} core endpoints`);
console.log(`   Excluded: ${totalScanned - includedCount} non-core endpoints`);
console.log(`📂 Output: ${outputFile}\n`);
