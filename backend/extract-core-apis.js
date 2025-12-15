/**
 * Extract APIs from CORE Admin Panel Components Only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORE COMPONENTS (as per user's list)
const CORE_COMPONENTS = [
    'dashboard/Dashboard.tsx',
    'admin/UsersManagement.tsx',
    'admin/ManageAdmins.tsx',
    'projects/ProjectsAndBids.tsx',
    'projects/ProjectDetails.tsx',
    'admin/JobsManagement.tsx',
    'finance/FinanceEscrow.tsx',
    'finance/PayoutsManagement.tsx',
    'finance/TransactionsView.tsx',
    'disputes/DisputesCenter.tsx',
    'admin/SupportTicketQueue.tsx',
    'admin/TicketDetailView.tsx',
    'admin/VerificationQueue.tsx',
    'admin/ModerationQueue.tsx',
    'admin/AuditLogs.tsx',
    'admin/SystemAdministration.tsx',
];

const componentsDir = path.join(__dirname, '..', 'admin-panel', 'src', 'components');
const endpoints = new Set();

CORE_COMPONENTS.forEach(componentPath => {
    const fullPath = path.join(componentsDir, componentPath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Not found: ${componentPath}`);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Match apiClient calls
    const apiRegex = /apiClient\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = apiRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2];
        endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':id');
        endpoints.add(`${method} ${endpoint}`);
    }

    // Match service calls (adminService, statsService, etc.)
    const serviceRegex = /(adminService|statsService|paymentsService|payoutsService|disputesService|projectsService|authService)\.\w+/g;
    const serviceCalls = content.match(serviceRegex) || [];

    console.log(`✓ ${componentPath}: ${serviceCalls.length} service calls`);
});

// Also check API service files for actual implementations
const apiFiles = [
    'adminService.ts',
    'statsService.ts',
    'paymentsService.ts',
    'payoutsService.ts',
    'disputesService.ts',
    'projectsService.ts',
    'authService.ts',
];

const apiDir = path.join(__dirname, '..', 'admin-panel', 'src', 'lib', 'api');

apiFiles.forEach(file => {
    const fullPath = path.join(apiDir, file);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf8');
    const regex = /apiClient\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2];
        endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':id');
        endpoints.add(`${method} ${endpoint}`);
    }
});

const sorted = Array.from(endpoints).sort();
console.log('\n=== CORE ADMIN PANEL ENDPOINTS ===\n');
sorted.forEach(ep => console.log(ep));
console.log(`\nTotal: ${sorted.length} endpoints\n`);

// Save to file
fs.writeFileSync(
    path.join(__dirname, 'core-endpoints.txt'),
    sorted.join('\n')
);
console.log('✅ Saved to core-endpoints.txt');
