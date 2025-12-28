const fs = require('fs');
const path = require('path');

const cssInteropBabelPath = path.resolve(__dirname, 'node_modules/react-native-css-interop/babel.js');

const content = `module.exports = function () {
  return {
    plugins: [
      require("./dist/babel-plugin").default,
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],
    ],
  };
};`;

fs.writeFileSync(cssInteropBabelPath, content);
console.log('CSS Interop Babel patched successfully.');
