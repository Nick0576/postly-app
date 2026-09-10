const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Lightweight output
  isCSSEnabled: true,
});

// Fix for "Unknown error" / Metro crashes on large React 19 projects
config.transformer.maxWorkers = 2;
config.transformer.minifierConfig = {
  mangle: { keep_fnames: true },
  compress: { keep_fnames: true },
};

module.exports = withNativeWind(config, { input: "./global.css" });
