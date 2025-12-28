const fs = require('fs');
const path = require('path');

console.log('Running fix-worklets-proxy.js...');

try {
    const nodeModulesDir = path.resolve(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesDir)) {
        console.log('node_modules not found, skipping.');
        process.exit(0);
    }

    const workletsDir = path.join(nodeModulesDir, 'react-native-worklets');
    if (fs.existsSync(workletsDir)) {
        // Wipe it to ensure clean state and remove any native files
        fs.rmSync(workletsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(workletsDir, { recursive: true });

    // 1. package.json
    const pkgJson = JSON.stringify({
        name: "react-native-worklets",
        version: "1.0.0",
        main: "index.js",
        types: "index.d.ts" // Optional
    }, null, 2);
    fs.writeFileSync(path.join(workletsDir, 'package.json'), pkgJson);

    // 2. index.js
    fs.writeFileSync(path.join(workletsDir, 'index.js'), "module.exports = require('react-native-worklets-core');");

    // 3. plugin/index.js
    const pluginDir = path.join(workletsDir, 'plugin');
    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
    }
    fs.writeFileSync(path.join(pluginDir, 'index.js'), "module.exports = require('react-native-worklets-core/plugin');");

    console.log('Created react-native-worklets proxy successfully.');
} catch (e) {
    console.error('Error in fix-worklets-proxy.js:', e);
    process.exit(1);
}
