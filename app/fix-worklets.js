const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, 'node_modules/react-native-worklets/package.json');
const indexPath = path.resolve(__dirname, 'node_modules/react-native-worklets/index.js');
const pluginPath = path.resolve(__dirname, 'node_modules/react-native-worklets/plugin/index.js');

if (!fs.existsSync(path.dirname(pluginPath))) {
    fs.mkdirSync(path.dirname(pluginPath), { recursive: true });
}

fs.writeFileSync(pkgPath, JSON.stringify({
    name: "react-native-worklets",
    version: "1.0.0",
    main: "index.js"
}, null, 2));

fs.writeFileSync(indexPath, "module.exports = require('react-native-worklets-core');");
fs.writeFileSync(pluginPath, "module.exports = require('react-native-worklets-core/plugin');");

console.log('Worklets proxy created successfully.');
