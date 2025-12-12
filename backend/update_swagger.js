import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, 'openapi.yaml');
const adminPathsPath = path.join(__dirname, 'admin_paths.yaml');

try {
    let openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const adminPathsContent = fs.readFileSync(adminPathsPath, 'utf8');

    // Find where 'components:' starts
    const componentsIndex = openapiContent.indexOf('components:');

    if (componentsIndex === -1) {
        console.error('Could not find "components:" section in openapi.yaml');
        process.exit(1);
    }

    // Insert admin paths before 'components:'
    const newContent = openapiContent.slice(0, componentsIndex) +
        adminPathsContent + '\n' +
        openapiContent.slice(componentsIndex);

    fs.writeFileSync(openapiPath, newContent);
    console.log('Successfully added admin paths to openapi.yaml');

} catch (err) {
    console.error('Error updating openapi.yaml:', err);
    process.exit(1);
}
