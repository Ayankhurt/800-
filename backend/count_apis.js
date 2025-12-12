
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const openapiPath = path.join(__dirname, 'openapi.yaml');
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');

    // Simple regex to count paths (lines starting with / under paths:)
    // This is a rough estimation but should be accurate for this file structure
    // We count lines that start with 2 spaces and a /
    const pathRegex = /^  \/[a-zA-Z0-9_{}\/-]+:/gm;
    const paths = openapiContent.match(pathRegex);

    console.log(`Total APIs found in openapi.yaml: ${paths ? paths.length : 0}`);

    if (paths) {
        console.log('--- Breakdown ---');
        const tags = {};

        // Basic manual parsing for tags
        const lines = openapiContent.split('\n');
        let currentTag = 'Uncategorized';

        // Just showing a general count for now
        console.log('Sample paths:');
        paths.slice(0, 5).forEach(p => console.log(p.trim().replace(':', '')));
        console.log('...');
        paths.slice(-5).forEach(p => console.log(p.trim().replace(':', '')));
    }

} catch (err) {
    console.error('Error reading file:', err);
}
