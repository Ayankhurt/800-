const fs = require('fs');

const filePath = './services/api.ts';

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing template literals...');
// Remove spaces inside template literal expressions
content = content.replace(/\$\{ /g, '${');
content = content.replace(/ \}/g, '}');

console.log('Writing fixed file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed! Template literals no longer have spaces.');
console.log('The bundler should reload automatically.');
