
// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @rork/toolkit-sdk is now resolved via node_modules structure
// No custom resolver needed - Metro will find it in node_modules/@rork/toolkit-sdk

module.exports = config;

