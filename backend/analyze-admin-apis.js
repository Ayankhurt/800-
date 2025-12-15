// Script to extract all unique API endpoints from Admin Panel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, '..', 'admin-panel', 'src', 'lib', 'api');

// Read all API service files
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

const endpoints = new Set();

files.forEach(file => {
    const content = fs.readFileSync(path.join(apiDir, file), 'utf8');

    // Match apiClient.get/post/put/delete/patch calls
    const regex = /apiClient\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const method = match[1];
        let endpoint = match[2];

        // Normalize endpoint (remove template literals)
        endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':id');

        endpoints.add(`${method.toUpperCase()} ${endpoint}`);
    }
});

// Sort and display
const sorted = Array.from(endpoints).sort();
console.log('\n=== ADMIN PANEL API ENDPOINTS ===\n');
sorted.forEach(ep => console.log(ep));
console.log(`\nTotal: ${sorted.length} unique endpoints\n`);

// Group by route file
const routeGroups = {};
sorted.forEach(ep => {
    const path = ep.split(' ')[1];
    const prefix = path.split('/')[1] || 'root';
    if (!routeGroups[prefix]) routeGroups[prefix] = [];
    routeGroups[prefix].push(ep);
});

console.log('\n=== GROUPED BY ROUTE ===\n');
Object.keys(routeGroups).sort().forEach(group => {
    console.log(`\n${group.toUpperCase()} (${routeGroups[group].length} endpoints):`);
    routeGroups[group].forEach(ep => console.log(`  ${ep}`));
});
