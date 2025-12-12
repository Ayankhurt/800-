import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, 'src', 'routes');
const outputFile = path.join(__dirname, 'openapi_full.yaml');

// Basic OpenAPI structure
const openApiDoc = {
    openapi: '3.0.0',
    info: {
        title: 'BidRoom API',
        version: '1.0.0',
        description: 'Complete API documentation for BidRoom backend.'
    },
    servers: [
        {
            url: 'http://localhost:5000/api/v1',
            description: 'Local Development Server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ],
    paths: {}
};

// Helper to convert Express route path to Swagger path
const toSwaggerPath = (expressPath) => {
    return expressPath.replace(/:(\w+)/g, '{$1}');
};

// Helper to guess method from route definition line
const guessMethod = (line) => {
    if (line.includes('router.get')) return 'get';
    if (line.includes('router.post')) return 'post';
    if (line.includes('router.put')) return 'put';
    if (line.includes('router.delete')) return 'delete';
    if (line.includes('router.patch')) return 'patch';
    return null;
};

// Helper to extract path from route definition line
const extractPath = (line) => {
    const match = line.match(/router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/);
    return match ? match[2] : null;
};

// Scan all route files
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

console.log(`Found ${routeFiles.length} route files.`);

routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const lines = content.split('\n');
    const tag = file.replace('Routes.js', ''); // e.g., userRoutes.js -> user

    lines.forEach(line => {
        const method = guessMethod(line);
        const routePath = extractPath(line);

        if (method && routePath) {
            // Determine full path prefix based on file name (heuristic)
            let prefix = '';
            if (file === 'authRoutes.js') prefix = '/auth';
            else if (file === 'userRoutes.js') prefix = '/users';
            else if (file === 'jobRoutes.js') prefix = '/jobs';
            else if (file === 'bidRoutes.js') prefix = '/bids';
            else if (file === 'projectRoutes.js') prefix = '/projects';
            else if (file === 'financeRoutes.js') prefix = '/finance';
            else if (file === 'communicationRoutes.js') prefix = '/communication';
            else if (file === 'adminRoutes.js') prefix = '/admin';
            else if (file === 'extendedAdminRoutes.js') prefix = '/admin'; // Same prefix
            // Add other mappings as needed, or default to file name base
            else prefix = `/${tag}s`; // Default plural

            // Special cases for specific files if needed
            if (file === 'contractorRoutes.js') prefix = '/contractors';
            if (file === 'reviewRoutes.js') prefix = '/reviews';
            if (file === 'notificationRoutes.js') prefix = '/notifications';
            if (file === 'appointmentRoutes.js') prefix = '/appointments';
            if (file === 'statsRoutes.js') prefix = '/stats';
            if (file === 'disputeRoutes.js') prefix = '/disputes';
            if (file === 'verificationRoutes.js') prefix = '/verification';
            if (file === 'applicationRoutes.js') prefix = '/applications';
            if (file === 'savedRoutes.js') prefix = '/saved';
            if (file === 'settingsRoutes.js') prefix = '/settings';
            if (file === 'endorsementRoutes.js') prefix = '/endorsements';
            if (file === 'inviteRoutes.js') prefix = '/invites';
            if (file === 'reportRoutes.js') prefix = '/reports';
            if (file === 'analyticsRoutes.js') prefix = '/analytics';
            if (file === 'referralRoutes.js') prefix = '/referrals';
            if (file === 'videoConsultationRoutes.js') prefix = '/video-consultations';
            if (file === 'templateRoutes.js') prefix = '/templates';
            if (file === 'quoteRoutes.js') prefix = '/quotes';
            if (file === 'badgeRoutes.js') prefix = '/badges';


            const fullPath = toSwaggerPath(prefix + routePath).replace('//', '/');

            if (!openApiDoc.paths[fullPath]) {
                openApiDoc.paths[fullPath] = {};
            }

            openApiDoc.paths[fullPath][method] = {
                tags: [tag],
                summary: `Auto-generated summary for ${method.toUpperCase()} ${fullPath}`,
                responses: {
                    '200': {
                        description: 'Successful response'
                    },
                    '401': {
                        description: 'Unauthorized'
                    },
                    '500': {
                        description: 'Server Error'
                    }
                }
            };

            // Add parameters for path variables
            const pathParams = fullPath.match(/\{(\w+)\}/g);
            if (pathParams) {
                openApiDoc.paths[fullPath][method].parameters = pathParams.map(p => ({
                    name: p.replace(/[{}]/g, ''),
                    in: 'path',
                    required: true,
                    schema: { type: 'string' }
                }));
            }

            // Add request body placeholder for POST/PUT
            if (['post', 'put', 'patch'].includes(method)) {
                openApiDoc.paths[fullPath][method].requestBody = {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    // Placeholder properties
                                    exampleField: { type: 'string' }
                                }
                            }
                        }
                    }
                };
            }
        }
    });
});

// Write to YAML file
import yaml from 'js-yaml';
fs.writeFileSync(outputFile, yaml.dump(openApiDoc));

console.log(`Successfully generated Swagger documentation at ${outputFile}`);
