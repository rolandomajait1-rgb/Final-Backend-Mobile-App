module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated's plugin delegates to react-native-worklets; keep it last (one worklets transform only).
    plugins: ['react-native-reanimated/plugin'],
  };
};
