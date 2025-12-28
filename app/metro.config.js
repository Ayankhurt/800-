const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname);

// @rork/toolkit-sdk is now resolved via node_modules structure
// No custom resolver needed

config = withNativeWind(config, { input: "./global.css" });

module.exports = config;

